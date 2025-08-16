
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertTriangle, Save, FileText, Receipt, Download, MessageSquare, Send, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type Appointment, type Patient, type ReportFormat } from '@/lib/data';
import { produce } from 'immer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportPage, BillPage } from '../staff/report-and-bill-templates';
import { logHistory, createNotification } from '@/app/actions/log-history';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';


export function ReportingManagement() {
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');
    const { toast } = useToast();
    const { user } = useAuth();

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [reportFormats, setReportFormats] = useState<ReportFormat[]>([]);
    const [reportData, setReportData] = useState<Appointment['reportData']>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isGeneratingBill, setIsGeneratingBill] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const reportRef = useRef(null);
    const billRef = useRef(null);

    const fetchData = useCallback(async () => {
        if (!appointmentId) {
            setError("No appointment ID provided.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const db = getDb();
            const appDocRef = doc(db, "ashwani/data/appointments", appointmentId);
            const appSnap = await getDoc(appDocRef);

            if (!appSnap.exists()) {
                throw new Error("Appointment not found.");
            }
            const appData = { id: appSnap.id, ...appSnap.data() } as Appointment;
            setAppointment(appData);

            if (!appData.patientId) {
                throw new Error("Patient ID is missing from this appointment record. Cannot fetch patient details.");
            }

            if (appData.reportData && appData.reportData.length > 0) {
                setReportData(appData.reportData);
            }

            const patientDocRef = doc(db, "ashwani/data/patients", appData.patientId);
            const patientSnap = await getDoc(patientDocRef);
            if (!patientSnap.exists()) {
                throw new Error("Patient record not found for this appointment.");
            }
            setPatient({ id: patientSnap.id, ...patientSnap.data() } as Patient);


            const testIds = appData.testId.split(',').map(id => id.trim());
            const formats: ReportFormat[] = [];
            let initialReportData: Appointment['reportData'] = appData.reportData && appData.reportData.length > 0 ? [...appData.reportData] : [];

            for (const testId of testIds) {
                const formatDocRef = doc(db, "ashwani/data/report_formats", testId);
                const formatSnap = await getDoc(formatDocRef);
                if (formatSnap.exists()) {
                    const formatData = { id: formatSnap.id, ...formatSnap.data() } as ReportFormat;
                    formats.push(formatData);
                    
                    const existingTestReport = initialReportData.find(rd => rd.testId === testId);
                    if (!existingTestReport) {
                        initialReportData.push({
                            testId: testId,
                            testName: formatData.testName,
                            parameters: formatData.parameters.map(p => ({
                                name: p.name,
                                value: '',
                                unit: p.unit,
                                range: p.normalRange
                            }))
                        });
                    }
                }
            }
            setReportFormats(formats);
             if (!appData.reportData || appData.reportData.length === 0) {
                setReportData(initialReportData);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to fetch required data.");
        } finally {
            setIsLoading(false);
        }
    }, [appointmentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleValueChange = (testIndex: number, paramIndex: number, value: string) => {
        setReportData(produce(draft => {
            if(draft && draft[testIndex]) {
               draft[testIndex].parameters[paramIndex].value = value;
            }
        }));
    };

    const handleSaveProgress = async () => {
        if (!appointmentId) return;
        setIsSaving(true);
        try {
            const db = getDb();
            const appDocRef = doc(db, "ashwani/data/appointments", appointmentId);
            await updateDoc(appDocRef, { reportData: reportData });
            toast({ title: "Progress Saved", description: "Your changes have been saved successfully." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to save progress.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendToPatient = async () => {
        if (!appointmentId || !appointment) return;
        setIsSending(true);
        try {
            const db = getDb();
            const appDocRef = doc(db, "ashwani/data/appointments", appointmentId);
            const isFirstCompletion = appointment?.status !== 'Completed' && appointment?.status !== 'Report Uploaded';

            await updateDoc(appDocRef, { reportData: reportData, status: 'Completed' });

            if(isFirstCompletion) {
                 await createNotification({
                    title: "Your Report is Ready!",
                    message: `Your report for ${appointment.testName} is now available to view.`,
                    target: { role: 'patient', id: appointment.patientId },
                    link: '/patient/dashboard'
                });
                const actor = user?.displayName || user?.email || 'Staff';
                await logHistory({
                    user: actor,
                    action: `Finalized report for appointment #${appointmentId.substring(0, 5)}.`
                });
            }

            setAppointment(prev => prev ? {...prev, reportData, status: 'Completed'} : null);
            toast({ title: "Success", description: "Report finalized and sent to patient's dashboard." });
        } catch (err) {
            console.error("Finalize report error:", err);
            toast({ title: "Error", description: "Failed to finalize report.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };
    
    const handlePdfDownload = async (elementRef: React.RefObject<HTMLDivElement>, fileName: string, setLoading: (loading: boolean) => void) => {
        if (!elementRef.current) {
            toast({ title: 'Error', description: 'Could not find element to print.', variant: 'destructive' });
            return;
        }

        setLoading(true);

        // A short delay to ensure the content is fully rendered before capturing
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const allImages = Array.from(elementRef.current.getElementsByTagName('img'));
            const promises = allImages.map(img => {
                return new Promise((resolve) => {
                    if (img.complete) {
                        resolve(true);
                        return;
                    }
                    img.onload = img.onerror = () => resolve(true);
                });
            });
            await Promise.all(promises);

            const canvas = await html2canvas(elementRef.current, {
                scale: 3, // Higher scale for better quality
                useCORS: true,
                allowTaint: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            let imgProps;
            try {
                imgProps = pdf.getImageProperties(imgData);
            } catch (e) {
                console.error("jsPDF getImageProperties error:", e);
                toast({ title: "PDF Error", description: "Could not process the report image. Please check console for details.", variant: "destructive"});
                setLoading(false);
                return;
            }

            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = -heightLeft;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(fileName);
        } catch(e) {
            console.error("PDF Generation Error:", e);
            toast({ title: "PDF Error", description: "Could not generate PDF. Please try again.", variant: "destructive"});
        } finally {
            setLoading(false);
        }
    };
    
    const openWhatsApp = () => {
        if (patient?.contact) {
            const message = `Hello ${appointment?.patientName},\n\nPlease find your report and bill for the ${appointment?.testName} test attached.\n\nThank you for choosing Ashwani Diagnostic Center.`;
            const url = `https://wa.me/91${patient.contact}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        } else {
            toast({ title: "Contact Missing", description: "Patient's contact number is not available to open WhatsApp.", variant: "destructive" });
        }
    };


    if (isLoading) {
        return <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>;
    }

    if (error) {
        return (
             <Card>
                <CardHeader><CardTitle>Error</CardTitle></CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Could not load reporting data</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Enter Report Values</CardTitle>
                    <CardDescription>
                        For appointment #{appointment?.id.substring(0, 7)} for patient <span className="font-medium text-primary">{appointment?.patientName}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {reportData?.map((test, testIndex) => (
                        <div key={test.testId}>
                            <h3 className="text-lg font-semibold mb-2 border-b pb-1">{test.testName}</h3>
                            <div className="space-y-4">
                                {test.parameters.map((param, paramIndex) => (
                                     <div key={paramIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div className="space-y-1">
                                            <Label>{param.name}</Label>
                                            <p className="text-xs text-muted-foreground">{param.range} {param.unit}</p>
                                        </div>
                                         <div className="md:col-span-2">
                                             <Input 
                                                placeholder={`Enter value for ${param.name}`}
                                                value={param.value}
                                                onChange={(e) => handleValueChange(testIndex, paramIndex, e.target.value)}
                                            />
                                         </div>
                                     </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                     <Button onClick={handleSaveProgress} disabled={isSaving || isSending}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Report'}
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Preview, generate and send documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <Eye className="mr-2 h-4 w-4" /> Preview Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Report Preview</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[70vh]">
                                <div ref={reportRef}>
                                    {appointment && patient && reportData && <ReportPage appointment={appointment} patient={patient} reportData={reportData} />}
                                </div>
                            </ScrollArea>
                            <DialogFooter>
                                <Button onClick={() => setIsGeneratingReport(false)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button 
                        onClick={() => handlePdfDownload(reportRef, `Report-${patient?.name.replace(' ', '_')}.pdf`, setIsGeneratingReport)} 
                        className="w-full"
                        variant="outline"
                        disabled={isGeneratingReport}
                    >
                        {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                        Generate Report
                    </Button>
                    <Button 
                        onClick={() => handlePdfDownload(billRef, `Bill-${patient?.name.replace(' ', '_')}.pdf`, setIsGeneratingBill)} 
                        className="w-full"
                        variant="outline"
                        disabled={isGeneratingBill}
                    >
                        {isGeneratingBill ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Receipt className="mr-2 h-4 w-4" />}
                        Generate Bill
                    </Button>
                     <Button 
                        onClick={openWhatsApp} 
                        disabled={!patient?.contact}
                        className="w-full bg-green-500 hover:bg-green-600"
                    >
                        <MessageSquare className="mr-2 h-4 w-4" /> Send via WhatsApp
                    </Button>
                    <Button onClick={handleSendToPatient} disabled={isSending || isSaving} className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        {isSending ? 'Sending...' : 'Send to Patient Dashboard'}
                    </Button>
                </CardContent>
                {/* Hidden components for PDF generation */}
                <div className="fixed -left-[9999px] -top-[9999px]">
                    <div ref={billRef}>
                        {appointment && patient && <BillPage appointment={appointment} patient={patient} />}
                    </div>
                </div>
            </Card>
        </div>
    );
}

    