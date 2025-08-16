
"use client"

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Users, TestTube, ClipboardList } from "lucide-react"
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@/lib/data";

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    samplesCollected: 0,
    totalPatients: 0,
    pendingAppointments: 0
  });
  const [chartData, setChartData] = useState<{ month: string; bookings: number }[]>([]);

  const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const db = getDb();
        const appointmentsCollection = collection(db, "ashwani", "data", "appointments");
        const patientsCollection = collection(db, "ashwani", "data", "patients");

        const appointmentsSnapshot = await getDocs(appointmentsCollection);
        const patientsSnapshot = await getDocs(patientsCollection);

        const appointments = appointmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Appointment[];

        const totalBookings = appointments.length;
        const samplesCollected = appointments.filter(a => ['Sample Collected', 'Completed', 'Report Uploaded'].includes(a.status)).length;
        const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
        const totalPatients = patientsSnapshot.size;

        // Process chart data for the last 6 months
        const monthlyBookings: { [key: string]: number } = {};
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
          const date = subMonths(today, i);
          const monthKey = format(date, 'MMM');
          monthlyBookings[monthKey] = 0;
        }

        appointments.forEach(app => {
           const appDate = new Date(app.date);
           if (appDate >= subMonths(startOfMonth(today), 5)) {
              const monthKey = format(appDate, 'MMM');
              if (monthKey in monthlyBookings) {
                monthlyBookings[monthKey]++;
              }
           }
        });
        
        const formattedChartData = Object.entries(monthlyBookings).map(([month, bookings]) => ({ month, bookings }));
        
        setChartData(formattedChartData);
        setStats({
          totalBookings,
          samplesCollected,
          totalPatients,
          pendingAppointments
        });
        
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalBookings}</div>}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Samples Collected</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.samplesCollected}</div>}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalPatients}</div>}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pendingAppointments}</div>}
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Bookings Overview - Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="h-[250px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
             </div>
          ) : (
             <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
}
