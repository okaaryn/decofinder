import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DashboardHome from "@/components/DashboardHome";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any).id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { discordId: (session.user as any).id },
  });

  const analytics = await prisma.analytics.findFirst();

  return (
    <DashboardHome 
      hasToken={!!user?.discordToken} 
      totalRequests={analytics?.totalRequests || 0}
      user={user}
    />
  );
}
