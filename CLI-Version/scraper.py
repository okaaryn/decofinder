import requests
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

def sanitize_filename(name):
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '')
    return name.strip()

def download_file(url, filepath):
    if os.path.exists(filepath):
        return
        
    try:
        r = requests.get(url, stream=True)
        if r.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(1024):
                    f.write(chunk)
        else:
            tqdm.write(f"Failed to download {url}: Status {r.status_code}")
    except Exception as e:
        tqdm.write(f"Error downloading {url}: {e}")

def extract_products(data):
    products = []
    
    if isinstance(data, list):
        categories = data
    elif isinstance(data, dict) and "categories" in data:
        categories = data["categories"]
    elif isinstance(data, dict):
        categories = [data]
    else:
        categories = []
        
    for category in categories:
        if isinstance(category, dict) and "products" in category:
            for product in category["products"]:
                if isinstance(product, dict):
                    products.append(product)
                    
    return products

def main():
    token = input("Enter your Discord Token: ").strip()
    if not token:
        print("Token is required!")
        return

    headers = {
        "Authorization": token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }

    url = "https://discord.com/api/v10/collectibles-categories"
    
    tqdm.write(f"Fetching categories from {url}...")
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        tqdm.write(f"Failed to fetch data! Status code: {response.status_code}")
        tqdm.write(response.text)
        return
            
    data = response.json()
    
    with open("categories_dump.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
        
    tqdm.write("Saved JSON response to categories_dump.json")
    
    os.makedirs("decorations", exist_ok=True)
    os.makedirs("profile_effects", exist_ok=True)
    os.makedirs("nameplates", exist_ok=True)
    
    products = extract_products(data)
    tqdm.write(f"Found {len(products)} products to process.")
    
    tasks = []
    
    for product in products:
        name = product.get("name", "Unknown")
        safe_name = sanitize_filename(name)
        
        items = product.get("items", [])
        if not items:
            items = [product]
            
        for item in items:
            asset = item.get("asset")
            type_id = item.get("type")
            
            if type_id is None:
                type_id = product.get("type")
            
            # Setup filename base
            base_name = safe_name
            if len(items) > 1:
                # It's a bundle, differentiate the items
                if type_id == 0:
                    base_name = f"{safe_name}_avatar_decor"
                elif type_id == 1:
                    base_name = f"{safe_name}_profile_effect"
                elif type_id == 2:
                    base_name = f"{safe_name}_nameplate"
                else:
                    base_name = f"{safe_name}_{asset[:6] if asset else 'item'}"

            # Type 0 = Avatar Decoration
            if type_id == 0 or (asset and asset.startswith("a_")):
                if asset:
                    url = f"https://cdn.discordapp.com/avatar-decoration-presets/{asset}.png?size=256&passthrough=true"
                    filepath = os.path.join("decorations", f"{base_name}.png")
                    tasks.append((url, filepath))
            
            # Type 1 = Profile Effect
            elif type_id == 1:
                effect_id = item.get("sku_id", product.get("sku_id"))
                if effect_id:
                    intro_url = f"https://cdn.discordapp.com/profile-effects/{effect_id}/intro.png"
                    loop_url = f"https://cdn.discordapp.com/profile-effects/{effect_id}/loop.png"
                    tasks.append((intro_url, os.path.join("profile_effects", f"{base_name}_intro.png")))
                    tasks.append((loop_url, os.path.join("profile_effects", f"{base_name}_loop.png")))
            
            # Type 2 = Nameplate
            elif type_id == 2:
                assets = item.get("assets", {})
                url = assets.get("animated_image_url") or assets.get("static_image_url")
                if url:
                    filepath = os.path.join("nameplates", f"{base_name}.png")
                    tasks.append((url, filepath))
            
            else:
                # Fallback
                if asset:
                    url = f"https://cdn.discordapp.com/avatar-decoration-presets/{asset}.png?size=256&passthrough=true"
                    filepath = os.path.join("decorations", f"unknown_{base_name}.png")
                    tasks.append((url, filepath))

    tasks = list(set(tasks))

    tqdm.write(f"Queueing {len(tasks)} downloads...")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(download_file, url, filepath) for url, filepath in tasks]
        
        for _ in tqdm(as_completed(futures), total=len(futures), desc="Downloading", unit="file"):
            pass

    tqdm.write("Done! Check the 'decorations', 'profile_effects', and 'nameplates' folders.")

if __name__ == "__main__":
    main()
