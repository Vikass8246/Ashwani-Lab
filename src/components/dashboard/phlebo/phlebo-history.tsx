
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/auth-context';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Loader2, Calendar as CalendarIcon, X } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { Appointment } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  "Sample Collected": "bg-purple-100 text-purple-800 border-purple-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  "Report Uploaded": "bg-indigo-100 text-indigo-800 border-indigo-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

export function PhleboHistory() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setIsLoading(true);
      const db = getDb();
      try {
        const appointmentsCollection = collection(db, "ashwani", "data", "appointments");
        const q = query(
            appointmentsCollection, 
            where("phleboId", "==", user.uid),
            orderBy("date", "desc")
        );
        const snapshot = await getDocs(q);
        const allAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
        setAppointments(allAppointments);
      } catch (error) {
        console.error("Failed to fetch appointment history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [user]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      const inDateRange = dateRange?.from && dateRange?.to ? 
        (appDate >= dateRange.from && appDate <= dateRange.to) : true;

      return inDateRange;
    });
  }, [appointments, dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Collection History</CardTitle>
        <CardDescription>View your past sample collections.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
             <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Clear filters</span>
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Test(s)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    </TableRow>
                ))
            ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map(app => (
                    <TableRow key={app.id}>
                        <TableCell>{format(new Date(app.date), "dd MMM yyyy, h:mm a")}</TableCell>
                        <TableCell className="font-medium">{app.patientName}</TableCell>
                        <TableCell>{app.testName}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("capitalize", statusColors[app.status])}>
                                {app.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No appointments found for the selected criteria.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
