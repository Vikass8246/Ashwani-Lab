
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/auth-context";

import { AssignedAppointments } from "@/components/dashboard/phlebo/assigned-appointments";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Appointment, Phlebo } from "@/lib/data";


export default function PhleboDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [phlebo, setPhlebo] = useState<Phlebo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (uid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getDb();
      const phleboDocRef = doc(db, "ashwani", "data", "phlebos", uid);
      const phleboDocSnap = await getDoc(phleboDocRef);

      if (phleboDocSnap.exists()) {
        const phleboData = { id: phleboDocSnap.id, ...phleboDocSnap.data() } as Phlebo;
        setPhlebo(phleboData);

        const appointmentsCollection = collection(db, "ashwani", "data", "appointments");
        const q = query(appointmentsCollection, where("phleboId", "==", uid), where("status", "==", "Confirmed"));
        const appointmentsSnapshot = await getDocs(q);
        const appointmentsList = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        setAppointments(appointmentsList);
      } else {
        setError("Your phlebotomist profile was not found. Please contact an administrator.");
      }
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      let message = "An error occurred while fetching dashboard data.";
       if (err.code === "permission-denied" || err.code === "PERMISSION_DENIED") {
            message = "Firestore Security Rules Error: You don't have permission to access appointment data. Please ask your administrator to deploy the correct security rules.";
        }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData(user.uid);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);


  const handleAppointmentUpdate = async () => {
    if (user?.uid) {
      await fetchDashboardData(user.uid);
    }
  };

  const renderContent = () => {
      if (authLoading || (isLoading && !error)) {
        return (
            <div className="space-y-4">
                 <Skeleton className="h-8 w-1/4" />
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardContent className="p-6"><div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></CardContent></Card>
                 </div>
            </div>
        );
      }

      if (!user) {
        return <p>Please log in as a phlebotomist to view this page.</p>;
      }

      if (error) {
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )
      }

      return <AssignedAppointments appointments={appointments} onAppointmentUpdate={handleAppointmentUpdate}/>
  }

  return (
    <>
      {renderContent()}
    </>
  );
}
