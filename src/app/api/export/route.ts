import { NextResponse } from "next/server";
export const maxDuration = 60; // Allow up to 60 seconds to process
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logScrapeSuccess, logScrapeError, logScrapeStart } from "@/lib/webhook";
import JSZip from 'jszip';

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { token, options } = body;

    const session = await getServerSession(authOptions);

    // Analytics tracking moved to end of function

    if (session && (session.user as any).id) {
      // User is logged in, try to use their saved token
      const user = await prisma.user.findUnique({
        where: { discordId: (session.user as any).id },
      });
      if (user?.discordToken) {
        token = user.discordToken;
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required." },
        { status: 400 }
      );
    }

    const headers = {
      "Authorization": token,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    };

    const url = "https://discord.com/api/v10/collectibles-categories";
    
    // Log Scrape Start
    const typesToScrape = [];
    if (options.decorations) typesToScrape.push("Decorations");
    if (options.profileEffects) typesToScrape.push("Profile Effects");
    if (options.nameplates) typesToScrape.push("Nameplates");
    const initUsername = session && session.user ? (session.user as any).name : null;
    await logScrapeStart(initUsername, typesToScrape);

    const res = await fetch(url, { headers, cache: "no-store" });

    const username = session && session.user ? (session.user as any).name : null;

    if (!res.ok) {
      await logScrapeError(username, `Failed to fetch data! Status: ${res.status}`);
      return NextResponse.json({ error: `Failed to fetch data! Status: ${res.status}` }, { status: 400 });
    }

    const data = await res.json();
    
    let categories = [];
    if (Array.isArray(data)) {
      categories = data;
    } else if (data && typeof data === 'object' && "categories" in data) {
      categories = data.categories;
    } else if (data && typeof data === 'object') {
      categories = [data];
    }

    const products: any[] = [];
    for (const category of categories) {
      if (category && typeof category === 'object' && "products" in category) {
        for (const product of category.products) {
          if (product && typeof product === 'object') {
            products.push(product);
          }
        }
      }
    }

    const tasks: { url: string; filepath: string; id: string }[] = [];

    for (const product of products) {
      const name = product.name || "Unknown";
      const safeName = sanitizeFilename(name);

      let items = product.items || [];
      if (items.length === 0) {
        items = [product];
      }

      for (const item of items) {
        const asset = item.asset;
        let typeId = item.type;
        
        if (typeId === undefined || typeId === null) {
          typeId = product.type;
        }

        let baseName = safeName;
        if (items.length > 1) {
          if (typeId === 0) baseName = `${safeName}_avatar_decor`;
          else if (typeId === 1) baseName = `${safeName}_profile_effect`;
          else if (typeId === 2) baseName = `${safeName}_nameplate`;
          else baseName = `${safeName}_${asset ? asset.substring(0, 6) : 'item'}`;
        }

        // Type 0 = Avatar Decoration
        if ((typeId === 0 || (asset && asset.startsWith("a_"))) && options.decorations) {
          if (asset) {
            const dlUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=256&passthrough=true`;
            tasks.push({ url: dlUrl, filepath: `decorations/${baseName}.gif`, id: item.id || product.id });
          }
        }
        
        // Type 1 = Profile Effect
        else if (typeId === 1 && options.profileEffects) {
          const effectId = item.sku_id || product.sku_id;
          if (effectId) {
            tasks.push({ url: `https://cdn.discordapp.com/profile-effects/${effectId}/intro.png`, filepath: `profile_effects/${baseName}_intro.gif`, id: `${effectId}-intro` });
            tasks.push({ url: `https://cdn.discordapp.com/profile-effects/${effectId}/loop.png`, filepath: `profile_effects/${baseName}_loop.gif`, id: `${effectId}-loop` });
          }
        }
        
        // Type 2 = Nameplate
        else if (typeId === 2 && options.nameplates) {
          const assets = item.assets || {};
          const dlUrl = assets.animated_image_url || assets.static_image_url;
          if (dlUrl) {
            tasks.push({ url: dlUrl, filepath: `nameplates/${baseName}.gif`, id: item.id || product.id });
          }
        }
      }
    }

    // Deduplicate tasks based on URL
    const uniqueTasksMap = new Map<string, { filepath: string, id: string }>();
    for (const t of tasks) {
      if (!uniqueTasksMap.has(t.url)) {
        uniqueTasksMap.set(t.url, { filepath: t.filepath, id: t.id });
      }
    }

    const uniqueTasks = Array.from(uniqueTasksMap.entries()).map(([url, data]) => ({ url, filepath: data.filepath, id: data.id }));

    if (uniqueTasks.length === 0) {
      return NextResponse.json({ error: "No items found for the selected categories." }, { status: 404 });
    }

    // Track analytics
    let analytics = await prisma.analytics.findFirst();
    if (!analytics) {
      await prisma.analytics.create({ data: { totalRequests: uniqueTasks.length } });
    } else {
      await prisma.analytics.update({
        where: { id: analytics.id },
        data: { totalRequests: analytics.totalRequests + uniqueTasks.length },
      });
    }

    const typesExported = [];
    if (options.decorations) typesExported.push("Decorations");
    if (options.profileEffects) typesExported.push("Profile Effects");
    if (options.nameplates) typesExported.push("Nameplates");

    await logScrapeSuccess(username || "Unauthenticated", uniqueTasks.length, typesExported);

    return NextResponse.json({ tasks: uniqueTasks, typesExported });

  } catch (err: any) {
    console.error(err);
    const session = await getServerSession(authOptions).catch(() => null);
    const username = session && session.user ? (session.user as any).name : null;
    await logScrapeError(username, err.message || "Internal Server Error");
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
