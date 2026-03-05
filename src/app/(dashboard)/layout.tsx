import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { DashboardMain } from "@/components/layout/DashboardMain";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen" style={{ background: "var(--background)" }}>
                <Sidebar />
                <DashboardMain>
                    {children}
                </DashboardMain>
            </div>
        </SidebarProvider>
    );
}
