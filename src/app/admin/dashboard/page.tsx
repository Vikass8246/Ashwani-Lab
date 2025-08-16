
"use client";

import { AdminControl } from "@/components/dashboard/admin/admin-control";
import { AnalyticsDashboard } from "@/components/dashboard/admin/analytics-dashboard";
import { HistoryLogs } from "@/components/dashboard/admin/history-logs";

export default function AdminDashboardPage() {
  return (
    <>
        <AnalyticsDashboard />
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
                <HistoryLogs />
            </div>
            <div>
                <AdminControl />
            </div>
        </div>
    </>
  );
}
