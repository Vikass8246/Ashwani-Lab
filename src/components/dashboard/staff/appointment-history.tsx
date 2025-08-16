
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, query, orderBy, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Loader2, Search, X, Calendar as CalendarIcon, FileText, Printer, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { Appointment, Patient, ReportParameter } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ReportPage } from './report-and-bill-templates';


const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  "Sample Collected": "bg-purple-100 text-purple-800 border-purple-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  "Report Uploaded": "bg-indigo-100 text-indigo-800 border-indigo-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

const historyStatuses: Appointment['status'][] = ["Completed", "Report Uploaded", "Cancelled"];

export function AppointmentHistory() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    const fetchAppointments = async () => {
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      const inDateRange = dateRange?.from && dateRange?.to ? 
        (appDate >= dateRange.from && appDate <= dateRange.to) : true;
      
      const matchesSearch = searchTerm ? 
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) : true;

      return inDateRange && matchesSearch;
    });
  }, [appointments, searchTerm, dateRange]);
  
  const handleEditReport = (appointmentId: string) => {
    router.push(`/staff/reporting?appointmentId=${appointmentId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment History</CardTitle>
        <CardDescription>Search and filter through all past and present appointments.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by patient name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
             <Button variant="ghost" size="icon" onClick={() => { setDateRange(undefined); setSearchTerm(''); }}>
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
                        <TableCell><Skeleton className="h-8 w-24 float-right" /></TableCell>
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
                            <Badge variant="outline" className={cn("capitalize", statusColors[app.status as keyof typeof statusColors] || '')}>
                                {app.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                           {app.reportData && app.reportData.length > 0 && (
                            <>
                                <ViewReportDialog appointment={app} />
                                <Button variant="outline" size="sm" onClick={() => handleEditReport(app.id)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Report
                                </Button>
                            </>
                           )}
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


function ViewReportDialog({ appointment }: { appointment: Appointment; }) {
    const [isOpen, setIsOpen] = useState(false);
    const [patient, setPatient] = useState<Patient | null>(null);
    const reportPreviewRef = useRef(null);
    
    useEffect(() => {
        if (isOpen && appointment.patientId && !patient) {
            const fetchPatient = async () => {
                const db = getDb();
                const patientDoc = await getDoc(doc(db, "ashwani/data/patients", appointment.patientId));
                if (patientDoc.exists()) {
                    setPatient({ id: patientDoc.id, ...patientDoc.data() } as Patient);
                }
            };
            fetchPatient();
        }
    }, [isOpen, appointment, patient]);

     const handlePrint = () => {
        const printContent = reportPreviewRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow?.document.write('<html><head><title>Print Report</title>');
        // You might need to link your stylesheet here if it's not inline
        printWindow?.document.write('</head><body>');
        printWindow?.document.write((printContent as HTMLDivElement).innerHTML);
        printWindow?.document.write('</body></html>');
        printWindow?.document.close();
        printWindow?.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                    <FileText className="mr-2 h-4 w-4" /> View Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Test Report</DialogTitle>
                </DialogHeader>
                 <div id="print-area" className="p-4 border rounded-md my-4 max-h-[70vh] overflow-y-auto" ref={reportPreviewRef}>
                    {patient && appointment.reportData && <ReportPage appointment={appointment} patient={patient} reportData={appointment.reportData}/>}
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
