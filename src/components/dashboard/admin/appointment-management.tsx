
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Loader2, Search, X, Calendar as CalendarIcon, Trash2, RotateCw } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { type Appointment } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  "Sample Collected": "bg-purple-100 text-purple-800 border-purple-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  "Report Uploaded": "bg-indigo-100 text-indigo-800 border-indigo-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

export function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    const db = getDb();
    try {
      const appointmentsCollection = collection(db, "ashwani", "data", "appointments");
      const q = query(appointmentsCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const allAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
      setAppointments(allAppointments);
    } catch (error) {
      console.error("Failed to fetch appointment history:", error);
      toast({ title: "Error", description: "Could not fetch appointments.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAppointments(); // Initial fetch
  }, [fetchAppointments]);


  const handleDelete = async (appointmentId: string) => {
    const db = getDb();
    try {
        await deleteDoc(doc(db, "ashwani", "data", "appointments", appointmentId));
        toast({ title: "Success", description: "Appointment deleted successfully." });
        fetchAppointments(); // Refresh the list
    } catch (error) {
        console.error("Failed to delete appointment:", error);
        toast({ title: "Error", description: "Could not delete the appointment.", variant: "destructive" });
    }
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      const inDateRange = dateRange?.from && dateRange?.to ? 
        (appDate >= dateRange.from && appDate <= dateRange.to) : true;
      
      const matchesSearch = searchTerm ? 
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      return inDateRange && matchesSearch;
    });
  }, [appointments, searchTerm, dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Appointments</CardTitle>
        <CardDescription>Search, filter, and manage all appointments in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by patient, test, or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-[240px] justify-start text-left font-normal sm:w-[300px]", !dateRange && "text-muted-foreground")}
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
             <Button variant="ghost" size="icon" onClick={() => { setDateRange(undefined); setSearchTerm(''); }}>
                <X className="h-4 w-4" />
                <span className="sr-only">Clear filters</span>
            </Button>
             <Button variant="outline" size="icon" onClick={() => fetchAppointments()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Test(s)</TableHead>
              <TableHead>Phlebo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-md float-right" /></TableCell>
                    </TableRow>
                ))
            ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map(app => (
                    <TableRow key={app.id}>
                        <TableCell>{format(new Date(app.date), "dd MMM yyyy, h:mm a")}</TableCell>
                        <TableCell className="font-medium">{app.patientName}</TableCell>
                        <TableCell>{app.testName}</TableCell>
                        <TableCell>{app.phleboName || 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("capitalize", statusColors[app.status])}>
                                {app.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete this appointment record. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(app.id)}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No appointments found for the selected criteria.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
