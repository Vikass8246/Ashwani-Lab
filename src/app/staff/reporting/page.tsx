
import { ReportingManagement } from "@/components/dashboard/shared/reporting-management";
import { Suspense } from "react";

export default function ReportingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportingManagement />
        </Suspense>
    );
}
