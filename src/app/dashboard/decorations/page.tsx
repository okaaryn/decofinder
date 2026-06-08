import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DecorationsClient from "./DecorationsClient";

export default async function DecorationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any).id) {
    redirect("/auth/signin?callbackUrl=/dashboard/decorations");
  }

  const user = await prisma.user.findUnique({
    where: { discordId: (session.user as any).id },
  });

  if (!user?.discordToken) {
    return (
      <div className="glass-card">
        <h2 className="info-title">No Token Linked</h2>
        <p className="info-text">Please go to the Home dashboard to securely link your Discord Authorization Token before viewing the decorations gallery.</p>
      </div>
    );
  }

  // Fetch from Discord
  const res = await fetch("https://discord.com/api/v10/collectibles-categories", {
    headers: {
      Authorization: user.discordToken,
    },
    // We can't cache this perfectly since the token could change, but it's okay for now
    cache: "no-store", 
  });

  if (!res.ok) {
    return (
      <div className="glass-card status-error">
        Error fetching decorations from Discord. Your token might be invalid or expired.
      </div>
    );
  }

  const data = await res.json();
  const allCollectibles: any[] = [];
  
  let parsedCategories = [];
  if (Array.isArray(data)) {
    parsedCategories = data;
  } else if (data && typeof data === 'object' && data.categories) {
    parsedCategories = data.categories;
  } else if (data && typeof data === 'object') {
    parsedCategories = [data];
  }

  for (const category of parsedCategories) {
    if (!category.products) continue;
    for (const product of category.products) {
      const items = product.items || [product];
      for (const item of items) {
        const typeId = item.type !== undefined ? item.type : product.type;
        
        // Type 0 = Avatar Decoration
        if (typeId === 0 || (item.asset && item.asset.startsWith("a_"))) {
          if (item.asset) {
            allCollectibles.push({
              id: item.id || product.id,
              name: product.name || "Unknown",
              type: "decorations",
              asset: `https://cdn.discordapp.com/avatar-decoration-presets/${item.asset}.png?size=256&passthrough=true`
            });
          }
        } 
        // Type 1 = Profile Effect
        else if (typeId === 1) {
          const effectId = item.sku_id || product.sku_id;
          if (effectId) {
            allCollectibles.push({
              id: `${effectId}-intro`,
              name: `${product.name || "Unknown"} (Intro)`,
              type: "profile_effects",
              asset: `https://cdn.discordapp.com/profile-effects/${effectId}/intro.png`
            });
            allCollectibles.push({
              id: `${effectId}-loop`,
              name: `${product.name || "Unknown"} (Loop)`,
              type: "profile_effects",
              asset: `https://cdn.discordapp.com/profile-effects/${effectId}/loop.png`
            });
          }
        }
        // Type 2 = Nameplate
        else if (typeId === 2) {
          const assets = item.assets || {};
          const url = assets.animated_image_url || assets.static_image_url;
          if (url) {
            allCollectibles.push({
              id: item.id || product.id,
              name: product.name || "Unknown",
              type: "nameplates",
              asset: url
            });
          }
        }
      }
    }
  }

  return <DecorationsClient collectibles={allCollectibles} />;
}
