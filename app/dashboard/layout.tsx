import { DashboardSidebar } from '@/src/components/layouts/dashboard-sidebar';
import { UserSynchronizer } from '@/src/components/auth/user-synchronizer';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <DashboardSidebar />
            <main className="flex-1 pl-72">
                <div className="max-w-7xl mx-auto p-8">
                    <UserSynchronizer />
                    {children}
                </div>
            </main>
        </div>
    );
}
