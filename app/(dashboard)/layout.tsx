import { Sidebar, SIDEBAR_WIDTH } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ProtectiveModeBanner } from "@/components/layout/ProtectiveModeBanner";
import { BackgroundFx } from "@/components/layout/BackgroundFx";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { JudgeBanner } from "@/components/dashboard/JudgeBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-cinema">
        <BackgroundFx />
        <Sidebar />
        <div
          className="relative z-0 flex min-h-screen min-w-0 flex-col lg:ml-[236px]"
          style={{ ["--sidebar-width" as string]: `${SIDEBAR_WIDTH}px` }}
        >
          <TopBar />
          <JudgeBanner />
          <ProtectiveModeBanner />
          <main className="relative flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
