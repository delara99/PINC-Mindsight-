import { DashboardSidebar } from '@/src/components/layouts/dashboard-sidebar';
import { UserSynchronizer } from '@/src/components/auth/user-synchronizer';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
            <div className="print:hidden">
                <DashboardSidebar />
            </div>
            <main className="flex-1 pl-0 md:pl-72 print:pl-0 transition-all duration-200">
                <div className="max-w-7xl mx-auto p-8 print:p-0 print:max-w-none">
                    <UserSynchronizer />
                    {children}
                </div>
            </main>
        </div>
    );
}
