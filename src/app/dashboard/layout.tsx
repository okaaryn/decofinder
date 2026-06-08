import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import "@/app/globals.css";

export const metadata = {
  title: "Dashboard | DecoFinder",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="dashboard-layout">
      <div className="bg-glows">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>
      <DashboardSidebar />
      <main className="dashboard-content">
        <DashboardHeader user={session?.user} />
        {children}
      </main>
    </div>
  );
}
