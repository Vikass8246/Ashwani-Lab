
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Appointment, Phlebo, Patient, Bill } from "@/lib/data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, MessageSquare, RotateCw, Star, Phone, User, MapPin, TestTube, IndianRupee, Calendar, FileText, Printer, Download, Receipt } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, getDoc, doc, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportPage, BillPage } from "../staff/report-and-bill-templates";


type AppointmentHistoryProps = {
  appointments: Appointment[];
  onRefresh: () => void;
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

const statusProgress: { [key in Appointment['status']]?: { value: number, label: string } } = {
  Pending: { value: 0, label: "Pending Confirmation" },
  Confirmed: { value: 20, label: "Confirmed" },
  "Sample Collected": { value: 40, label: "Sample Collected" },
  "Received": { value: 60, label: "Sample Received at Lab" },
  "In Process": { value: 80, label: "Testing in Process" },
  "Report Uploaded": { value: 100, label: "Report Ready" },
  Completed: { value: 100, label: "Report Ready" },
  Cancelled: { value: 0, label: "Cancelled" },
};


const timeSlotMap: { [key: string]: string } = {
  "08:00": "8:00 AM - 9:00 AM",
  "09:00": "9:00 AM - 10:00 AM",
  "10:00": "10:00 AM - 11:00 AM",
  "11:00": "11:00 AM - 12:00 PM",
  "14:00": "2:00 PM - 3:00 PM",
  "15:00": "3:00 PM - 4:00 PM",
};

export function AppointmentHistory({ appointments, onRefresh, isLoading }: AppointmentHistoryProps) {
  const [phleboDetails, setPhleboDetails] = useState<Record<string, Phlebo>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (user) {
        const fetchPatient = async () => {
            const db = getDb();
            const patientDocRef = doc(db, "ashwani", "data", "patients", user.uid);
            const patientDocSnap = await getDoc(patientDocRef);
            if (patientDocSnap.exists()) {
                setPatient({ id: patientDocSnap.id, ...patientDocSnap.data() } as Patient);
            }
        };
        fetchPatient();
    }
  }, [user]);

  useEffect(() => {
    const fetchPhleboDetails = async () => {
      const allPhleboIds = appointments
        .map(app => app.phleboId)
        .filter((id): id is string => !!id);
      const uniquePhleboIds = [...new Set(allPhleboIds)];
      const idsToFetch = uniquePhleboIds.filter(id => !phleboDetails[id]);

      if (idsToFetch.length > 0) {
        const db = getDb();
        const detailsToUpdate: Record<string, Phlebo> = {};
        for (const id of idsToFetch) {
          try {
            const phleboDocRef = doc(db, "ashwani", "data", "phlebos", id);
            const phleboDocSnap = await getDoc(phleboDocRef);
            if (phleboDocSnap.exists()) {
              detailsToUpdate[id] = { id: phleboDocSnap.id, ...phleboDocSnap.data() } as Phlebo;
            }
          } catch (error) {
            console.error(`Failed to fetch phlebo details for ID ${id}:`, error);
          }
        }
        setPhleboDetails(prevDetails => ({ ...prevDetails, ...detailsToUpdate }));
      }
    };
    
    if (appointments.length > 0) {
      fetchPhleboDetails();
    }
  }, [appointments, phleboDetails]);

  const handleRowClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleDialogClose = () => {
    setIsDetailsOpen(false);
    setTimeout(() => {
        setSelectedAppointment(null);
    }, 300);
  }

  return (
    <>
    <Card className="h-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appointment History</CardTitle>
          <CardDescription>View your past and upcoming appointments.</CardDescription>
        </div>
         <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : sortedAppointments.length > 0 ? (
                sortedAppointments.map((app) => {
                  const appDate = new Date(app.date);
                  const timeKey = format(appDate, "HH:mm");
                  const timeRange = timeSlotMap[timeKey] || format(appDate, "h:mm a");

                  const progress = statusProgress[app.status] || { value: 0, label: app.status };
                  const isUpcoming = !['Completed', 'Report Uploaded', 'Cancelled'].includes(app.status);


                  return (
                    <TableRow key={app.id} onClick={() => handleRowClick(app)} className="cursor-pointer">
                      <TableCell>
                        <p className="font-medium">{app.testName}</p>
                        <div className="text-sm text-muted-foreground">
                            {format(appDate, "dd MMM yyyy")} at {timeRange}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isUpcoming ? (
                             <div className="w-full max-w-xs">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-primary">{progress.label}</span>
                                    <span className="text-sm text-muted-foreground">{progress.value}%</span>
                                </div>
                                <Progress value={progress.value} className="h-2" />
                            </div>
                        ) : (
                             <Badge variant="outline" className={cn("capitalize", statusColors[app.status])}>
                                {app.status === 'Completed' || app.status === 'Report Uploaded' ? 'Report Ready' : app.status}
                             </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           {(app.status === 'Completed' || app.status === 'Report Uploaded') && (
                                <>
                                    <ViewReportDialog appointment={app} patient={patient} />
                                    <ViewBillDialog appointment={app} patient={patient} />
                                </>
                           )}
                           {(app.status === 'Completed' || app.status === 'Report Uploaded') && !app.feedbackSubmitted && (
                              <LeaveFeedbackDialog appointment={app} onFeedbackSubmitted={onRefresh} />
                           )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    No appointments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </CardContent>
    </Card>
    {selectedAppointment && (
        <AppointmentDetailsDialog
            appointment={selectedAppointment}
            phlebo={selectedAppointment.phleboId ? phleboDetails[selectedAppointment.phleboId] : null}
            isOpen={isDetailsOpen}
            onOpenChange={handleDialogClose}
        />
    )}
    </>
  );
}


function LeaveFeedbackDialog({ appointment, onFeedbackSubmitted }: { appointment: Appointment, onFeedbackSubmitted: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when submitting
    if (rating === 0) {
      toast({ title: "Please select a rating.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const db = getDb();
    try {
      await addDoc(collection(db, "ashwani", "data", "reviews"), {
        patientId: user?.uid,
        patientName: user?.displayName,
        appointmentId: appointment.id,
        testName: appointment.testName,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      
      const appDoc = doc(db, "ashwani", "data", "appointments", appointment.id);
      await updateDoc(appDoc, { feedbackSubmitted: true });

      toast({ title: "Feedback Submitted!", description: "Thank you for your valuable feedback." });
      setIsOpen(false);
      onFeedbackSubmitted();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ title: "Error", description: "Could not submit feedback.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (open && isSubmitting) return;
        setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Leave Feedback</DialogTitle>
          <DialogDescription>
            Share your experience for the appointment on {format(new Date(appointment.date), "dd MMM yyyy")}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Your Rating</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHover(starValue)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 cursor-pointer transition-colors",
                        starValue <= (hover || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">Your Comments</label>
            <Textarea 
              id="comment" 
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AppointmentDetailsDialog({ appointment, phlebo, isOpen, onOpenChange }: { appointment: Appointment; phlebo: Phlebo | null; isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }) {
    const isMobile = useIsMobile();
    
    const appDate = new Date(appointment.date);
    const timeKey = format(appDate, "HH:mm");
    const timeRange = timeSlotMap[timeKey] || format(appDate, "h:mm a");
    
    const DialogComponent = isMobile ? Sheet : Dialog;
    const DialogContentComponent = isMobile ? SheetContent : DialogContent;

    const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | React.ReactNode }) => (
        <div className="text-sm">
            <p className="text-muted-foreground flex items-center gap-1.5"><Icon className="h-4 w-4"/> {label}</p>
            <div className="mt-1 font-medium text-foreground break-words">{value || 'N/A'}</div>
        </div>
    );
    
    const Content = () => (
        <div className="flex flex-col h-full">
            <SheetHeader className="p-4 sm:p-6 border-b flex-shrink-0 text-left">
                <SheetTitle>Appointment #{appointment.id.substring(0, 7)}</SheetTitle>
                 <div className="text-sm text-muted-foreground pt-1 flex items-center gap-2">
                    <Badge variant="outline" className={cn("capitalize", statusColors[appointment.status])}>
                        {appointment.status}
                    </Badge>
                </div>
            </SheetHeader>

            <ScrollArea className="flex-grow">
                 <div className="p-4 sm:p-6 grid grid-cols-1 gap-y-6">
                    <div>
                        <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Patient Details (at time of booking)</h3>
                        <div className="space-y-4">
                            <InfoItem icon={User} label="Name" value={appointment.patientName} />
                            <InfoItem icon={MapPin} label="Address" value={appointment.address} />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Test & Phlebo Details</h3>
                        <div className="space-y-4">
                            <InfoItem icon={TestTube} label="Tests" value={appointment.testName} />
                             {appointment.totalCost !== undefined && (
                                <InfoItem icon={IndianRupee} label="Total MRP" value={`₹${appointment.totalCost.toFixed(2)}`} />
                            )}
                            <InfoItem icon={User} label="Phlebotomist" value={
                                phlebo ? (
                                    <div>
                                        <p>{phlebo.name}</p>
                                        <a href={`tel:${phlebo.contact}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                            <Phone className="h-3 w-3"/> {phlebo.contact}
                                        </a>
                                    </div>
                                ) : 'Not Assigned Yet'
                            } />
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <DialogComponent open={isOpen} onOpenChange={onOpenChange}>
            <DialogContentComponent className={cn("p-0 flex flex-col", isMobile ? "w-full h-full max-h-[90svh]" : "sm:max-w-md")} onClick={(e) => e.stopPropagation()}>
                <Content />
            </DialogContentComponent>
        </DialogComponent>
    );
}

function ViewReportDialog({ appointment, patient }: { appointment: Appointment; patient: Patient | null; }) {
    const [isOpen, setIsOpen] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!reportRef.current) {
            toast({ title: "Error", description: "Report preview is not available.", variant: "destructive" });
            return;
        }
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps= pdf.getImageProperties(canvas);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
        
        pdf.save(`Report-${appointment.patientName.replace(' ', '_')}.pdf`);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (open) e.stopPropagation();
            setIsOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
                    <FileText className="mr-2 h-4 w-4" /> View Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0" onClick={(e) => e.stopPropagation()}>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Test Report</DialogTitle>
                </DialogHeader>
                 <ScrollArea className="max-h-[70vh]">
                    <div ref={reportRef}>
                        {patient && appointment.reportData && <ReportPage appointment={appointment} patient={patient} reportData={appointment.reportData} />}
                    </div>
                 </ScrollArea>
                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function ViewBillDialog({ appointment, patient }: { appointment: Appointment, patient: Patient | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const billRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!billRef.current) {
            toast({ title: "Error", description: "Bill preview not available.", variant: "destructive" });
            return;
        }
        const canvas = await html2canvas(billRef.current, { scale: 2 });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(canvas, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save(`Bill-${appointment.patientName.replace(' ', '_')}.pdf`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
             if (open) e.stopPropagation();
            setIsOpen(open);
        }}>
            <DialogTrigger asChild>
                 <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                    <Receipt className="mr-2 h-4 w-4" /> View Bill
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0" onClick={(e) => e.stopPropagation()}>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Invoice</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div ref={billRef}>
                        {patient && <BillPage appointment={appointment} patient={patient} />}
                    </div>
                </ScrollArea>
                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
