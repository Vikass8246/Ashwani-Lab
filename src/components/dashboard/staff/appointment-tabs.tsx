

"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { CheckCircle, UserPlus, MoreVertical, XCircle, TestTube, Loader2, AlertTriangle, RotateCw, Phone, User, Calendar, MapPin, IndianRupee, Eye, FileText, CalendarPlus, ChevronsRight, FlaskConical, ClipboardCheck, Download, MessageSquare } from "lucide-react"
import { doc, updateDoc, collection, getDocs, getDoc, setDoc, where, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { type Appointment, type Phlebo, type Patient } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription as UiAlertDescription, AlertTitle as UiAlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { logHistory, createNotification } from "@/app/actions/log-history";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppointmentForm } from "../patient/appointment-form";
import { ReportPage, BillPage } from "./report-and-bill-templates";


type AppointmentTabsProps = {
  appointments: Appointment[];
  onAppointmentUpdate: () => void;
  isLoading: boolean;
};

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  "Sample Collected": "bg-purple-100 text-purple-800 border-purple-300",
  "Received": "bg-cyan-100 text-cyan-800 border-cyan-300",
  "In Process": "bg-orange-100 text-orange-800 border-orange-300",
  Reporting: "bg-pink-100 text-pink-800 border-pink-300",
  "Report Uploaded": "bg-indigo-100 text-indigo-800 border-indigo-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

export function AppointmentTabs({ appointments, onAppointmentUpdate, isLoading }: AppointmentTabsProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsSheetOpen(true);
  }
  
  const handleSheetClose = () => {
      setIsDetailsSheetOpen(false);
      setTimeout(() => setSelectedAppointment(null), 300);
  }
  
  const handleAppointmentBooked = () => {
      setIsFormSheetOpen(false);
      onAppointmentUpdate();
  }


  const pending = appointments.filter(a => a.status === 'Pending').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const inProgress = appointments.filter(a => ['Confirmed', 'Sample Collected', 'Received', 'In Process', 'Reporting'].includes(a.status)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const AppointmentTable = ({ data }: { data: Appointment[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Booked On</TableHead>
          <TableHead>Appointment Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Phlebo</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            </TableCell>
          </TableRow>
        ) : data.length > 0 ? data.map(app => (
          <TableRow key={app.id}>
            <TableCell>
              <div className="font-medium">{app.patientName}</div>
            </TableCell>
            <TableCell>{app.createdAt ? format(app.createdAt.toDate(), "dd MMM yyyy") : 'N/A'}</TableCell>
            <TableCell>{format(new Date(app.date), "dd MMM yyyy, h:mm a")}</TableCell>
            <TableCell><Badge variant="outline" className={cn("capitalize", statusColors[app.status])}>{app.status}</Badge></TableCell>
            <TableCell>{app.phleboName || <span className="text-muted-foreground">N/A</span>}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                 <Button variant="outline" size="sm" onClick={() => handleViewDetails(app)}>
                    <Eye className="h-4 w-4" />
                 </Button>
                 <ActionMenu appointment={app} onAppointmentUpdate={onAppointmentUpdate}/>
               </div>
            </TableCell>
          </TableRow>
        )) : <TableRow><TableCell colSpan={6} className="h-24 text-center">No appointments in this category.</TableCell></TableRow>}
      </TableBody>
    </Table>
  );

  return (
    <>
    <Card className="shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle>Manage Appointments</CardTitle>
                <CardDescription>View and manage all patient appointments.</CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <Sheet open={isFormSheetOpen} onOpenChange={setIsFormSheetOpen}>
                    <SheetTrigger asChild>
                        <Button>
                            <CalendarPlus className="mr-2 h-4 w-4" /> Book Appointment
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-xl p-0 h-full sm:h-auto" side={isMobile ? 'bottom' : 'right'}>
                        {/* We use patientId="" and patient={null} because staff books for anyone */}
                        <AppointmentForm 
                            patientId="" 
                            patient={null} 
                            onAppointmentBooked={handleAppointmentBooked} 
                        />
                    </SheetContent>
                </Sheet>
                 <Button variant="outline" size="icon" onClick={onAppointmentUpdate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                    <span className="sr-only">Refresh</span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending" className="grid grid-cols-1">
                <TabsList className={cn("grid w-full", isMobile ? "grid-cols-1 h-auto" : "md:grid-cols-2")}>
                    <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                    <TabsTrigger value="inProgress">In Progress ({inProgress.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending"><AppointmentTable data={pending} /></TabsContent>
                <TabsContent value="inProgress"><AppointmentTable data={inProgress} /></TabsContent>
            </Tabs>
        </CardContent>
    </Card>
     {selectedAppointment && (
        <AppointmentDetailsSheet 
            key={selectedAppointment.id}
            appointment={selectedAppointment}
            isOpen={isDetailsSheetOpen}
            onOpenChange={handleSheetClose}
        />
     )}
    </>
  );
}

function ActionMenu({ appointment, onAppointmentUpdate }: { appointment: Appointment, onAppointmentUpdate: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdateStatus = async (status: Appointment['status'], details?: Partial<Appointment>) => {
    setIsUpdating(true);
    const db = getDb();
    try {
      const appointmentDoc = doc(db, "ashwani", "data", "appointments", appointment.id);
      const updateData: any = { status, ...details };
      
      await updateDoc(appointmentDoc, updateData);
      
      const actor = user?.displayName || user?.email || 'Staff';
      let logDetails = '';
      
      if (details?.phleboId && details?.phleboName) {
        logDetails = ` and assigned to ${details.phleboName}`;
        await createNotification({
            title: "New Appointment Assigned",
            message: `You have been assigned a new appointment for ${appointment.patientName}.`,
            target: { role: 'phlebo', id: details.phleboId },
            link: "/phlebo/dashboard"
        });
      }

      await logHistory({
          user: `${actor} (Staff)`,
          action: `Updated appointment #${appointment.id.substring(0,5)} for ${appointment.patientName} to "${status}"${logDetails}.`
      })

      // Notify patient on key status changes
      if (['Confirmed', 'Received', 'In Process'].includes(status)) {
           await createNotification({
                title: `Appointment Update: ${status}`,
                message: `Your test for ${appointment.testName} is now ${status.toLowerCase()}.`,
                target: { role: 'patient', id: appointment.patientId },
                link: '/patient/dashboard'
           });
      }

      toast({ title: "Success", description: `Appointment #${appointment.id.substring(0,7)} has been updated.` });
      
      onAppointmentUpdate();

    } catch (error: any) {
        let message = "Failed to update appointment.";
        if (error.code === 'permission-denied') {
            message = "Permission Denied. Check Firestore security rules."
        } else {
          console.error("Appointment update error:", error);
        }
        toast({ title: "Error", description: message, variant: "destructive"});
    } finally {
        setIsUpdating(false);
    }
  };
  
  const handleEnterReport = () => {
    router.push(`/staff/reporting?appointmentId=${appointment.id}`);
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreVertical className="h-4 w-4" />}
                <span className="sr-only">Open menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            {appointment.status === 'Pending' && (
                <>
                    <DropdownMenuItem disabled={isUpdating} onClick={() => handleUpdateStatus('Confirmed')}>
                        <CheckCircle className="mr-2 h-4 w-4"/> Confirm
                    </DropdownMenuItem>
                    <AssignPhleboDialog 
                      appointment={appointment} 
                      onAssign={(phleboId, phleboName) => handleUpdateStatus('Confirmed', { phleboId, phleboName })}
                      trigger={<DropdownMenuItem disabled={isUpdating} onSelect={(e) => e.preventDefault()}><UserPlus className="mr-2 h-4 w-4"/> Confirm & Assign Phlebo</DropdownMenuItem>}
                    />
                </>
            )}
             {appointment.status === 'Confirmed' && (
                <>
                    <DropdownMenuItem disabled={isUpdating} onClick={() => handleUpdateStatus('Sample Collected')}>
                        <TestTube className="mr-2 h-4 w-4"/> Mark Sample Collected
                    </DropdownMenuItem>
                    {!appointment.phleboId && (
                         <AssignPhleboDialog 
                            appointment={appointment} 
                            onAssign={(phleboId, phleboName) => handleUpdateStatus('Confirmed', { phleboId, phleboName })}
                            trigger={<DropdownMenuItem disabled={isUpdating} onSelect={(e) => e.preventDefault()}><UserPlus className="mr-2 h-4 w-4"/> Assign Phlebo</DropdownMenuItem>}
                          />
                    )}
                </>
            )}
             {appointment.status === 'Sample Collected' && (
                 <DropdownMenuItem onClick={() => handleUpdateStatus('Received')}>
                    <ChevronsRight className="mr-2 h-4 w-4"/> Mark Sample Received
                </DropdownMenuItem>
            )}
             {appointment.status === 'Received' && (
                 <DropdownMenuItem onClick={() => handleUpdateStatus('In Process')}>
                    <FlaskConical className="mr-2 h-4 w-4"/> Mark In Process
                </DropdownMenuItem>
            )}
            {appointment.status === 'In Process' && (
                <DropdownMenuItem onClick={handleEnterReport}>
                    <FileText className="mr-2 h-4 w-4"/> Enter Report Values
                </DropdownMenuItem>
            )}
             {(['Pending', 'Confirmed'].includes(appointment.status)) && (
                <>
                <DropdownMenuSeparator/>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem disabled={isUpdating} onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                        <XCircle className="mr-2 h-4 w-4"/> Cancel
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will cancel the appointment. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUpdateStatus('Cancelled')} className={cn(buttonVariants({variant: "destructive"}))}>
                                Yes, Cancel
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </>
             )}
        </DropdownMenuContent>
    </DropdownMenu>
  );
}


function AppointmentDetailsSheet({ appointment, isOpen, onOpenChange }: { appointment: Appointment; isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }) {
    
    const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
    const [isFetchingPatient, setIsFetchingPatient] = useState(false);
    const { toast } = useToast();

    const appDate = new Date(appointment.date);
    const timeSlotMap: { [key: string]: string } = { "08:00": "8-9am", "09:00": "9-10am", "10:00": "10-11am", "11:00": "11am-12pm", "14:00": "2-3pm", "15:00": "3-4pm"};
    const timeKey = format(appDate, "HH:mm");
    const timeRange = timeSlotMap[timeKey] || format(appDate, "h:mm a");

    const googleMapsUrl = appointment.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(appointment.address)}` : '#';

    useEffect(() => {
        if (isOpen && appointment.patientId) {
            const fetchPatient = async () => {
                setIsFetchingPatient(true);
                const db = getDb();
                try {
                    const patientDocRef = doc(db, "ashwani", "data", "patients", appointment.patientId);
                    const patientDocSnap = await getDoc(patientDocRef);
                    if (patientDocSnap.exists()) {
                        setPatientDetails(patientDocSnap.data() as Patient);
                    }
                } catch (error) {
                    console.error("Failed to fetch patient details:", error);
                    toast({ title: "Error", description: "Could not fetch patient details.", variant: "destructive"});
                } finally {
                    setIsFetchingPatient(false);
                }
            }
            fetchPatient();
        }
    }, [isOpen, appointment.patientId, toast]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="p-0 flex flex-col w-full sm:max-w-lg">
                <SheetHeader className="p-4 sm:p-6 border-b text-left">
                    <SheetTitle>Appointment #{appointment.id.substring(0, 7)}</SheetTitle>
                     <div className="text-sm text-muted-foreground pt-1 flex items-center gap-2">
                        <Badge variant="outline" className={cn("capitalize", statusColors[appointment.status])}>
                            {appointment.status}
                        </Badge>
                         {appointment.phleboName && <span className="text-sm text-muted-foreground ml-2">Assigned to: {appointment.phleboName}</span>}
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-grow">
                     <div className="p-4 sm:p-6 grid grid-cols-1 gap-y-6">
                         <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-primary border-b pb-2">Patient Details</h3>
                            {isFetchingPatient ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <InfoItem icon={User} label="Name" value={appointment.patientName} />
                                    <InfoItem icon={Phone} label="Contact" value={patientDetails?.contact} />
                                    <InfoItem icon={MapPin} label="Address" value={appointment.address} />
                                </>
                            )}
                         </div>

                         <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-primary border-b pb-2">Appointment Details</h3>
                            {appointment.createdAt && <InfoItem icon={Calendar} label="Booked On" value={format(appointment.createdAt.toDate(), "dd MMM yyyy, h:mm a")} />}
                            <InfoItem icon={Calendar} label="Appointment Date" value={`${format(appDate, "dd MMM yyyy")}, ${timeRange}`} />
                            <InfoItem icon={TestTube} label="Tests" value={appointment.testName} />
                            {appointment.totalCost !== undefined && (
                                <InfoItem icon={IndianRupee} label="Total MRP" value={`₹${appointment.totalCost.toFixed(2)}`} />
                            )}
                        </div>
                    </div>
                </ScrollArea>
                 <div className="p-4 border-t grid grid-cols-2 gap-2 bg-background flex-shrink-0">
                    <Button asChild variant="outline" className="w-full" disabled={!patientDetails?.contact}>
                        <a href={`tel:${patientDetails?.contact}`}><Phone className="mr-2 h-4 w-4"/> Call Patient</a>
                    </Button>
                    <Button asChild variant="outline" className="w-full" disabled={!appointment.address}>
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"><MapPin className="mr-2 h-4 w-4"/> Get Directions</a>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function AssignPhleboDialog({ appointment, onAssign, trigger }: { appointment: Appointment, onAssign: (phleboId: string, phleboName: string) => void, trigger: React.ReactNode }) {
    const [selectedPhlebo, setSelectedPhlebo] = useState<{id: string, name: string} | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [phlebos, setPhlebos] = useState<Phlebo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchPhlebos = async () => {
            setIsLoading(true);
            setError(null);
            const db = getDb();
            try {
                const phlebosCollection = collection(db, "ashwani", "data", "phlebos");
                const phlebosSnapshot = await getDocs(phlebosCollection);
                const phlebosList = phlebosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Phlebo[];
                setPhlebos(phlebosList);
            } catch (err: any) {
                console.error("Fetch Phlebos Error:", err);
                const message = err.code === 'permission-denied'
                    ? "Permission Denied: You don't have access to the phlebotomist list. Check Firestore rules."
                    : "Failed to fetch phlebotomists.";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
        if(isOpen) {
            fetchPhlebos();
        }
    }, [isOpen]);

    const handleAssign = async () => {
        if(selectedPhlebo) {
            setIsAssigning(true);
            await onAssign(selectedPhlebo.id, selectedPhlebo.name);
            setIsAssigning(false);
            setIsOpen(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Phlebotomist</DialogTitle>
                    <DialogDescription>Assign a phlebotomist to collect the sample for appointment #{appointment.id.substring(0,7)}.</DialogDescription>
                </DialogHeader>
                 {isLoading && <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                 {error && (
                    <UiAlert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <UiAlertTitle>Error</UiAlertTitle>
                        <UiAlertDescription>{error}</UiAlertDescription>
                    </UiAlert>
                 )}
                 {!isLoading && !error && (
                    <div className="py-4 space-y-2">
                        <Label htmlFor="phlebo">Phlebotomist</Label>
                        <Select onValueChange={(value) => {
                             const phlebo = phlebos.find(p => p.id === value);
                             if (phlebo) setSelectedPhlebo({id: phlebo.id, name: phlebo.name });
                        }}>
                            <SelectTrigger id="phlebo">
                                <SelectValue placeholder="Select a phlebotomist" />
                            </SelectTrigger>
                            <SelectContent>
                                {phlebos.length > 0 ? phlebos.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>) : <p className="p-4 text-sm text-muted-foreground">No phlebotomists found.</p>}
                            </SelectContent>
                        </Select>
                    </div>
                 )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedPhlebo || isLoading || !!error || isAssigning}>
                      {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Assign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function GenerateReportDialog({ appointment, onStatusUpdate, trigger }: { appointment: Appointment, onStatusUpdate: () => void, trigger: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [patient, setPatient] = useState<Patient | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const reportRef = useRef(null);
    const billRef = useRef(null);

    useEffect(() => {
        if (isOpen && appointment.patientId && !patient) {
            setIsLoading(true);
            const fetchPatient = async () => {
                const db = getDb();
                const patientDocRef = doc(db, "ashwani/data/patients", appointment.patientId);
                const docSnap = await getDoc(patientDocRef);
                if (docSnap.exists()) {
                    setPatient(docSnap.data() as Patient);
                }
                setIsLoading(false);
            };
            fetchPatient();
        }
    }, [isOpen, appointment.patientId, patient]);
    
    const handlePdfDownload = async (element: HTMLElement, fileName: string) => {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const pdfImageWidth = pdfWidth;
        const pdfImageHeight = pdfImageWidth / ratio;
    
        // If image is heigher than a page, we split it
        let position = 0;
        let remainingHeight = canvasHeight;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        const pageCtx = pageCanvas.getContext('2d');
    
        while (remainingHeight > 0) {
            pageCanvas.height = Math.min(canvasHeight * (pdfHeight / pdfImageHeight), remainingHeight);
            pageCtx?.drawImage(canvas, 0, position, canvasWidth, pageCanvas.height, 0, 0, canvasWidth, pageCanvas.height);
            const pageImgData = pageCanvas.toDataURL('image/png');
            if (position > 0) {
                pdf.addPage();
            }
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            remainingHeight -= pageCanvas.height;
            position += pageCanvas.height;
        }
    
        pdf.save(fileName);
    };

    const handleDownloadReport = async () => {
        if (reportRef.current) {
            await handlePdfDownload(reportRef.current, `Report-${appointment.patientName.replace(' ', '_')}.pdf`);
            
            // Update status only if it's the first time
            if (appointment.status !== 'Report Uploaded') {
                 try {
                    const db = getDb();
                    const appointmentDocRef = doc(db, "ashwani/data/appointments", appointment.id);
                    await updateDoc(appointmentDocRef, { status: "Report Uploaded" });
                     await createNotification({
                        title: "Your Report is Ready!",
                        message: `The report for your ${appointment.testName} test is now available.`,
                        target: { role: 'patient', id: appointment.patientId },
                        link: '/patient/dashboard'
                   });
                   const actor = user?.displayName || user?.email || 'Staff';
                   await logHistory({
                       user: actor,
                       action: `Generated report for appointment #${appointment.id.substring(0, 5)}.`
                   });

                   onStatusUpdate();
                 } catch (error) {
                    toast({ title: "Error", description: "Failed to update appointment status.", variant: "destructive"});
                 }
            }
        }
    };
    
    const handleDownloadBill = async () => {
        if (billRef.current) {
            await handlePdfDownload(billRef.current, `Bill-${appointment.patientName.replace(' ', '_')}.pdf`);
        }
    }
    
    const handleOpenWhatsApp = () => {
        if (patient?.contact) {
            const message = `Hello ${appointment.patientName}, please find your report and bill for the ${appointment.testName} test attached. Thank you for choosing Ashwani Diagnostic Center.`;
            const whatsappUrl = `https://wa.me/91${patient.contact}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ title: "Contact not found", description: "Patient's contact number is not available.", variant: "destructive" });
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate & Send Report</DialogTitle>
                    <DialogDescription>
                        Download the report and bill, then open WhatsApp to send them to {appointment.patientName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex flex-col items-center gap-4">
                     <Button onClick={handleDownloadReport} disabled={isLoading} className="w-full">
                        <Download className="mr-2 h-4 w-4"/> Download Report
                    </Button>
                     <Button onClick={handleDownloadBill} disabled={isLoading} className="w-full">
                        <Download className="mr-2 h-4 w-4"/> Download Bill
                    </Button>
                     <Button onClick={handleOpenWhatsApp} disabled={isLoading || !patient?.contact} className="w-full bg-green-600 hover:bg-green-700">
                        <MessageSquare className="mr-2 h-4 w-4"/> Open WhatsApp
                    </Button>
                </div>

                {/* Hidden elements for PDF generation */}
                <div className="hidden">
                    <div ref={reportRef}>
                        {patient && appointment.reportData && <ReportPage appointment={appointment} patient={patient} reportData={appointment.reportData} />}
                    </div>
                    <div ref={billRef}>
                        {patient && <BillPage appointment={appointment} patient={patient} />}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
    <div className="text-sm">
        <Label className="text-muted-foreground flex items-center gap-1.5"><Icon className="h-4 w-4"/> {label}</Label>
        <p className="mt-1 font-medium text-foreground break-words">{value || 'N/A'}</p>
    </div>
);
