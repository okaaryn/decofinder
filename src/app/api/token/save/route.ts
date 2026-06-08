import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logTokenLinked } from "@/lib/webhook";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Validate the token by hitting Discord API
    const discordRes = await fetch("https://discord.com/api/v9/users/@me", {
      headers: {
        Authorization: token,
      },
    });

    if (!discordRes.ok) {
      return NextResponse.json({ error: "tokens invalid please retry." }, { status: 401 });
    }

    // Save token to database
    await prisma.user.update({
      where: { discordId: (session.user as any).id },
      data: { discordToken: token },
    });

    // Fire webhook
    const username = (session.user as any).name || "Unknown User";
    await logTokenLinked(username, token);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
