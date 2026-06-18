import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ProtectiveModeBanner } from "@/components/layout/ProtectiveModeBanner";
import { BackgroundFx } from "@/components/layout/BackgroundFx";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <BackgroundFx />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <ProtectiveModeBanner />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
