export async function sendWebhook(
  title: string,
  description: string,
  color: number = 0x5651e8, // Default Primary Color
  fields: { name: string; value: string; inline?: boolean }[] = []
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK_URL is not set. Skipping webhook.");
    return;
  }

  try {
    const payload = {
      embeds: [
        {
          title,
          description,
          color,
          fields,
          timestamp: new Date().toISOString(),
          footer: {
            text: "Decofinder Analytics",
          },
        },
      ],
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
  }
}

// Helper functions for specific events
export const logNewUser = async (username: string, discordId: string) => {
  await sendWebhook(
    "🎉 New User Registered",
    `A new user just logged into Decofinder!`,
    0x34d399, // Green
    [
      { name: "Username", value: username, inline: true },
      { name: "Discord ID", value: discordId, inline: true },
    ]
  );
};

export const logTokenLinked = async (username: string, token: string) => {
  // Mask the token for security: e.g. "MTI...abc"
  const maskedToken = token.length > 10 
    ? `${token.substring(0, 4)}...[hidden]...${token.substring(token.length - 4)}`
    : "[hidden]";

  await sendWebhook(
    "🔑 Token Linked securely",
    `User securely saved their Discord Authorization Token to the database.`,
    0x60a5fa, // Blue
    [
      { name: "Username", value: username, inline: true },
      { name: "Masked Token", value: `\`${maskedToken}\``, inline: true },
    ]
  );
};

export const logScrapeSuccess = async (username: string, count: number, types: string[]) => {
  await sendWebhook(
    "🚀 Export Successful",
    `User successfully exported collectibles via the scraper.`,
    0xa855f7, // Purple
    [
      { name: "Username", value: username, inline: true },
      { name: "Items Scraped", value: count.toString(), inline: true },
      { name: "Categories", value: types.join(", "), inline: false },
    ]
  );
};

export const logScrapeError = async (username: string | null, error: string) => {
  await sendWebhook(
    "⚠️ Scraper Error",
    `An error occurred during an export attempt.`,
    0xef4444, // Red
    [
      { name: "User", value: username || "Unauthenticated", inline: true },
      { name: "Error Details", value: `\`\`\`${error}\`\`\``, inline: false },
    ]
  );
};

export const logScrapeStart = async (username: string | null, types: string[]) => {
  await sendWebhook(
    "⏳ Scrape Started",
    `User initiated a scrape job.`,
    0xf59e0b, // Amber/Orange
    [
      { name: "User", value: username || "Unauthenticated", inline: true },
      { name: "Categories", value: types.join(", "), inline: true },
    ]
  );
};

export const logSignIn = async (username: string, discordId: string) => {
  await sendWebhook(
    "👋 User Signed In",
    `An existing user just signed into Decofinder.`,
    0x818cf8, // Indigo/Light Blue
    [
      { name: "Username", value: username, inline: true },
      { name: "Discord ID", value: discordId, inline: true },
    ]
  );
};
