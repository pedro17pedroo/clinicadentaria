import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardMetrics } from "@/components/dashboard/metrics";
import { TodaysSchedule } from "@/components/dashboard/schedule";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FinancialOverview } from "@/components/dashboard/financial-overview";

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Dashboard" 
          subtitle="Welcome back to your dental clinic management system"
        />
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <DashboardMetrics metrics={metrics} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <TodaysSchedule />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        <FinancialOverview />
      </main>
    </div>
  );
}
