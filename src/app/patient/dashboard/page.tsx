
"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/auth-context";

import { AppointmentForm } from "@/components/dashboard/patient/appointment-form";
import { AppointmentHistory } from "@/components/dashboard/patient/appointment-history";
import type { Appointment, Patient } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CalendarPlus, CalendarCheck, Beaker } from "lucide-react";
import { ChatbotLauncher } from "@/components/dashboard/patient/chatbot-launcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const fetchPatientData = async (userId: string) => {
    const db = getDb();
    // Fetch patient details
    const patientDocRef = doc(db, "ashwani", "data", "patients", userId);
    const patientDocSnap = await getDoc(patientDocRef);
    if (patientDocSnap.exists()) {
      setPatient({ id: patientDocSnap.id, ...patientDocSnap.data() } as Patient);
    }
  }

  const fetchAppointments = async (userId: string) => {
    const db = getDb();
    setIsDataLoading(true);
    const appointmentsCollection = collection(db, "ashwani", "data", "appointments");
    const q = query(appointmentsCollection, where("patientId", "==", userId));
    const appointmentsSnapshot = await getDocs(q);
    const appointmentsList = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    setAppointments(appointmentsList);
    setIsDataLoading(false);
  };
  
  const handleAppointmentBooked = (newAppointment: Appointment) => {
    setAppointments(prev => [newAppointment, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsFormSheetOpen(false); // Close the sheet after booking
    if(user?.uid) {
        fetchAppointments(user.uid);
    }
  }

  const upcomingAppointmentsCount = useMemo(() => {
    return appointments.filter(app => new Date(app.date) >= new Date() && app.status !== 'Cancelled' && app.status !== 'Completed').length;
  }, [appointments]);

  const completedTestsCount = useMemo(() => {
     return appointments.filter(app => app.status === 'Completed' || app.status === 'Report Uploaded').length;
  }, [appointments]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchPatientData(user.uid),
            fetchAppointments(user.uid)
        ]);
        setIsLoading(false);
      };
      fetchData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);
  
  const handleRefresh = () => {
    if (user?.uid) {
        fetchAppointments(user.uid);
    }
  }

  if (authLoading || isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!user || !patient) {
    return <p>Please log in to view your dashboard.</p>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {patient.name.split(' ')[0]}!
            </h1>
             <Sheet open={isFormSheetOpen} onOpenChange={setIsFormSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg">
                        <CalendarPlus className="mr-2 h-5 w-5" />
                        Book New Appointment
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-xl p-0 h-full sm:h-auto" side={isMobile ? 'bottom' : 'right'}>
                     <AppointmentForm 
                        patientId={user.uid} 
                        patient={patient} 
                        onAppointmentBooked={handleAppointmentBooked} 
                      />
                </SheetContent>
            </Sheet>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{upcomingAppointmentsCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
                    <Beaker className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedTestsCount}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{appointments.length}</div>
                </CardContent>
            </Card>
        </div>

        <AppointmentHistory 
            appointments={appointments} 
            onRefresh={handleRefresh} 
            isLoading={isDataLoading} 
        />
    </div>
    {user && <ChatbotLauncher patientId={user.uid} />}
    </>
  );
}
