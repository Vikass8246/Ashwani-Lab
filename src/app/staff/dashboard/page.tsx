

"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/auth-context";

import { DashboardHeader } from "@/components/dashboard/header";
import { AppointmentTabs } from "@/components/dashboard/staff/appointment-tabs";
import type { Appointment, Staff } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StaffDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (uid: string, email: string | null) => {
    setIsDataLoading(true);
    setError(null);
    try {
      const db = getDb();
      const staffDocRef = doc(db, "ashwani", "data", "staff", uid);
      let staffDocSnap = await getDoc(staffDocRef);
      let foundStaff = null;

      if (staffDocSnap.exists()) {
        foundStaff = { id: staffDocSnap.id, ...staffDocSnap.data() } as Staff;
      } else if (email) {
        console.log(`Staff profile not found by UID ${uid}. Falling back to email query.`);
        const staffQuery = query(collection(db, "ashwani", "data", "staff"), where("email", "==", email));
        const staffQuerySnapshot = await getDocs(staffQuery);
        if (!staffQuerySnapshot.empty) {
          const staffDoc = staffQuerySnapshot.docs[0];
          foundStaff = { id: staffDoc.id, ...staffDoc.data() } as Staff;
        }
      }

      if (foundStaff) {
        setStaff(foundStaff);
      } else {
        const profileNotFoundError = "Your staff profile was not found. Please contact an administrator to ensure your account is correctly set up in the staff management portal.";
        setError(profileNotFoundError);
        setIsDataLoading(false);
        setIsLoading(false);
        return;
      }

      // Fetch appointments that are not yet fully completed or cancelled
      const appointmentsCollection = collection(db, "ashwani", "data", "appointments");
      const q = query(appointmentsCollection, where("status", "not-in", ["Completed", "Report Uploaded", "Cancelled"]));
      const appointmentsSnapshot = await getDocs(q);
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(appointmentsList);

    } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        let message = "An error occurred while fetching dashboard data.";
        if (err.code === "permission-denied" || err.code === "PERMISSION_DENIED") {
            message = "Firestore Security Rules Error: You don't have permission to access appointment data. Please ask your administrator to deploy the correct security rules.";
        }
        setError(message);
    } finally {
        setIsDataLoading(false);
        if (isLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData(user.uid, user.email);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);
  
  const handleAppointmentUpdate = async () => {
      if(user?.uid) {
          await fetchDashboardData(user.uid, user.email);
      }
  }


  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
           <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-10 w-1/3 mb-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <div className="flex justify-center items-center h-40 border rounded-md">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!user) {
    // This could be a redirect to login
    return <p>Please log in as staff to view this page.</p>;
  }


  return (
    <>
        {error ? (
           <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Dashboard</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
          <AppointmentTabs appointments={appointments} onAppointmentUpdate={handleAppointmentUpdate} isLoading={isDataLoading} />
        )}
    </>
  );
}
