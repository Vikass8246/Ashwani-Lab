

"use client"

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TestTube, User, MapPin, Phone, Calendar, IndianRupee, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { type Appointment, type Patient } from "@/lib/data";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { logHistory, createNotification } from "@/app/actions/log-history";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type AssignedAppointmentsProps = {
  appointments: Appointment[];
  onAppointmentUpdate: () => void;
};

const timeSlotMap: { [key: string]: string } = {
  "08:00": "8:00 AM - 9:00 AM",
  "09:00": "9:00 AM - 10:00 AM",
  "10:00": "10:00 AM - 11:00 AM",
  "11:00": "11:00 AM - 12:00 PM",
  "14:00": "2:00 PM - 3:00 PM",
  "15:00": "3:00 PM - 4:00 PM",
};

export function AssignedAppointments({ appointments, onAppointmentUpdate }: AssignedAppointmentsProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleCardClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDetailsOpen(false);
    // Delay clearing to allow for exit animation
    setTimeout(() => {
        setSelectedAppointment(null);
    }, 300);
  }

  const sortedAppointments = appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Assigned Collections</h2>
      </div>
      {appointments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedAppointments.map(app => {
              const appDate = new Date(app.date);
              const timeKey = format(appDate, "HH:mm");
              const timeRange = timeSlotMap[timeKey] || format(appDate, "h:mm a");

            return (
                <Card key={app.id} className="shadow-md flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick(app)}>
                <CardHeader>
                    <CardDescription>Appointment #{app.id.substring(0, 7).toUpperCase()}</CardDescription>
                    <div className="flex items-baseline gap-2 pt-1">
                        <p className="text-muted-foreground">Patient:</p>
                        <CardTitle className="truncate text-2xl font-semibold">
                            {app.patientName}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    {/* This space is intentionally left blank for a cleaner summary card */}
                </CardContent>
                <CardFooter className="pt-4 mt-auto border-t">
                    <div className="flex items-start text-sm w-full">
                        <Calendar className="mr-3 h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                        <div className="flex flex-col">
                           <div className="text-sm"><span className="text-muted-foreground">Date: </span><span className="font-medium text-foreground">{format(appDate, "dd MMM yyyy")}</span></div>
                           <div className="text-sm"><span className="text-muted-foreground">Time: </span><span className="font-medium text-foreground">{timeRange}</span></div>
                        </div>
                    </div>
                </CardFooter>
                </Card>
            )
          })}
        </div>
      ) : (
        <Card className="flex items-center justify-center h-64">
            <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Pending Collections</h3>
                <p className="mt-1 text-sm text-muted-foreground">You have no appointments to attend to right now.</p>
            </div>
        </Card>
      )}
      {selectedAppointment && (
        <AppointmentDetailsDialog 
            appointment={selectedAppointment}
            isOpen={isDetailsOpen}
            onOpenChange={handleDialogClose}
            onAppointmentUpdate={onAppointmentUpdate}
        />
      )}
    </div>
  );
}

function AppointmentDetailsDialog({ appointment, isOpen, onOpenChange, onAppointmentUpdate }: { appointment: Appointment; isOpen: boolean; onOpenChange: (isOpen: boolean) => void; onAppointmentUpdate: () => void; }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isFetchingPatient, setIsFetchingPatient] = useState(false);
    const isMobile = useIsMobile();
    
    const appDate = new Date(appointment.date);
    const timeKey = format(appDate, "HH:mm");
    const timeRange = timeSlotMap[timeKey] || format(appDate, "h:mm a");
    
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

    const handleCollectSample = async () => {
        setIsUpdating(true);
        const db = getDb();
        try {
          const appointmentDoc = doc(db, "ashwani", "data", "appointments", appointment.id);
          await updateDoc(appointmentDoc, { status: "Sample Collected" });
          
          const actor = user?.displayName || user?.email || 'Phlebo';
          await logHistory({
              user: `${actor} (Phlebo)`,
              action: `Marked sample collected for appointment #${appointment.id.substring(0, 5)}... for patient ${appointment.patientName}.`
          });

          await createNotification({
              title: "Sample Collected",
              message: `Sample for appointment #${appointment.id.substring(0,5)} has been collected by ${actor}.`,
              target: 'allStaff',
          });
    
          toast({
            title: "Sample Collected",
            description: `Status for appointment #${appointment.id.substring(0,5)} updated successfully.`,
            variant: 'default',
          });
          onAppointmentUpdate();
          onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to update appointment status.', variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
      };

    const DialogComponent = isMobile ? Sheet : Dialog;
    const DialogContentComponent = isMobile ? SheetContent : DialogContent;

    const InfoItem = ({ icon: Icon, label, value, isLink, linkHref }: { icon: React.ElementType, label: string, value?: string | React.ReactNode, isLink?: boolean, linkHref?: string }) => (
        <div className="text-sm">
            <p className="text-muted-foreground flex items-center gap-1.5"><Icon className="h-4 w-4"/> {label}</p>
            {isLink && value ? (
                <a href={linkHref} target="_blank" rel="noopener noreferrer" className="block mt-1 text-primary hover:underline font-medium break-words">{value}</a>
            ) : (
                <div className="mt-1 font-medium text-foreground break-words">{value || 'N/A'}</div>
            )}
        </div>
    );

    const googleMapsUrl = appointment.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(appointment.address)}` : '#';

    const Content = () => (
        <div className="flex flex-col h-full">
            <DialogHeader className="p-4 sm:p-6 border-b flex-shrink-0">
                <DialogTitle className="text-left">Appointment #{appointment.id.substring(0, 7)}</DialogTitle>
                <DialogDescription className="text-left pt-1">
                    Scheduled for {format(appDate, "dd MMM yyyy")} at {timeRange}
                </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-grow">
                 <div className="p-4 sm:p-6 grid grid-cols-1 gap-y-6">
                    <div>
                        <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Patient Details</h3>
                        {isFetchingPatient ? <Loader2 className="animate-spin" /> : (
                            <div className="space-y-4">
                                <InfoItem icon={User} label="Name" value={appointment.patientName} />
                                <InfoItem icon={Phone} label="Contact" value={patientDetails?.contact} />
                                <InfoItem icon={MapPin} label="Address" value={appointment.address} />
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Test Details</h3>
                        <div className="space-y-4">
                            <InfoItem icon={TestTube} label="Tests" value={appointment.testName} />
                            {appointment.totalCost !== undefined && (
                                <InfoItem icon={IndianRupee} label="Total MRP" value={`₹${appointment.totalCost.toFixed(2)}`} />
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>
             <div className="p-4 border-t grid gap-2 bg-background flex-shrink-0">
                <Button className="w-full" onClick={handleCollectSample} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mark Sample as Collected
                </Button>
                <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="w-full" disabled={!patientDetails?.contact}>
                        <a href={`tel:${patientDetails?.contact}`} className="flex items-center"><Phone className="mr-2 h-4 w-4"/> Call Patient</a>
                    </Button>
                    <Button asChild variant="outline" className="w-full" disabled={!appointment.address}>
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"><MapPin className="mr-2 h-4 w-4"/> Get Directions</a>
                    </Button>
                </div>
                 <ReleaseAppointmentDialog 
                    appointment={appointment}
                    onAppointmentUpdate={onAppointmentUpdate}
                    onClose={() => onOpenChange(false)}
                 />
            </div>
        </div>
    )

    return (
        <DialogComponent open={isOpen} onOpenChange={onOpenChange}>
            <DialogContentComponent className={cn("p-0 flex flex-col", isMobile ? "w-full h-full max-h-[90svh]" : "sm:max-w-md")}>
                <Content />
            </DialogContentComponent>
        </DialogComponent>
    )
}

function ReleaseAppointmentDialog({ appointment, onAppointmentUpdate, onClose }: { appointment: Appointment, onAppointmentUpdate: () => void, onClose: () => void }) {
    const [isReleasing, setIsReleasing] = useState(false);
    const [reason, setReason] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleRelease = async () => {
        if (!reason.trim()) {
            toast({ title: "Reason required", description: "Please provide a reason for releasing the appointment.", variant: "destructive" });
            return;
        }
        setIsReleasing(true);
        const db = getDb();
        try {
            const appointmentDoc = doc(db, "ashwani", "data", "appointments", appointment.id);
            const updateData = {
                status: "Pending",
                phleboId: null,
                phleboName: null,
                notes: `Released by ${user?.displayName || 'Phlebo'} on ${format(new Date(), 'dd MMM yyyy')}. Reason: ${reason}`
            };

            await updateDoc(appointmentDoc, updateData);
            
            await createNotification({
                title: "Appointment Released",
                message: `Appointment #${appointment.id.substring(0, 5)} for ${appointment.patientName} was released by the phlebo.`,
                target: "allStaff",
                link: "/staff/dashboard"
            });
            
            toast({ title: "Success", description: "Appointment has been released and returned to the pending queue." });
            onAppointmentUpdate();
            setIsDialogOpen(false);
            onClose(); // Close the parent dialog
        } catch (error) {
            console.error("Failed to release appointment:", error);
            toast({ title: "Error", description: "Could not release the appointment.", variant: "destructive" });
        } finally {
            setIsReleasing(false);
        }
    };
    
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">Release Appointment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Release Appointment?</DialogTitle>
                    <DialogDescription>
                        This will un-assign the appointment from you and return it to the staff's pending list. Please provide a reason.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="e.g., Patient not available at location, incorrect address..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRelease} disabled={isReleasing} variant="destructive">
                        {isReleasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Release
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
