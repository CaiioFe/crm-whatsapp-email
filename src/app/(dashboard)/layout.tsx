import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            <Sidebar />
            <main className="md:ml-64 min-h-screen">
                <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
