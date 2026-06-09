import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";
import { logNewUser, logSignIn } from "@/lib/webhook";

interface DiscordProfile {
  id: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "discord") {
        return true;
      }

      const discordProfile = profile as DiscordProfile;

      if (!discordProfile.id) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          discordId: discordProfile.id,
        },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            discordId: discordProfile.id,
            username: user.name || "",
            avatar: user.image || "",
          },
        });

        await logNewUser(
          user.name || "Unknown",
          discordProfile.id
        );
      } else {
        await prisma.user.update({
          where: {
            discordId: discordProfile.id,
          },
          data: {
            username: user.name || "",
            avatar: user.image || "",
          },
        });

        await logSignIn(
          user.name || "Unknown",
          discordProfile.id
        );
      }

      return true;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: {
            discordId: token.sub,
          },
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
