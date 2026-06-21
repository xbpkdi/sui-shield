import { Sidebar, SIDEBAR_WIDTH } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ProtectiveModeBanner } from "@/components/layout/ProtectiveModeBanner";
import { BackgroundFx } from "@/components/layout/BackgroundFx";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-cinema">
        <BackgroundFx />
        <Sidebar />
        <div
          className="flex min-h-screen min-w-0 flex-col lg:pl-[236px]"
          style={{ ["--sidebar-width" as string]: `${SIDEBAR_WIDTH}px` }}
        >
          <TopBar />
          <ProtectiveModeBanner />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
