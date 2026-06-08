import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";
import { logNewUser, logSignIn } from "@/lib/webhook";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && profile?.id) {
        const existingUser = await prisma.user.findUnique({
          where: { discordId: profile.id as string },
        });

        if (!existingUser) {
          // It's a new user!
          await prisma.user.create({
            data: {
              discordId: profile.id as string,
              username: user.name || "",
              avatar: user.image || "",
            },
          });
          // Fire Webhook
          await logNewUser(user.name || "Unknown", profile.id as string);
        } else {
          // Update existing user details
          await prisma.user.update({
            where: { discordId: profile.id as string },
            data: {
              username: user.name || "",
              avatar: user.image || "",
            },
          });
          // Fire Webhook
          await logSignIn(user.name || "Unknown", profile.id as string);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: token.sub as string },
        });
        (session.user as any).id = token.sub;
        (session.user as any).hasToken = !!dbUser?.discordToken;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
