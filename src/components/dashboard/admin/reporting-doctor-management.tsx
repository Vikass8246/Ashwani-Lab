
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

export function ReportingDoctorManagement() {
    const [name, setName] = useState('Dr. Vishal Arora');
    const [designation, setDesignation] = useState('MBBS, MD (Pathology)');
    const [signature, setSignature] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignature(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        // In a real app, you would save this to Firestore or other storage.
        // For this demo, we'll just simulate a save.
        setTimeout(() => {
            toast({
                title: "Details Saved",
                description: "The reporting doctor's details have been updated.",
            });
            setIsSaving(false);
        }, 1000);
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Reporting Doctor Details</CardTitle>
                <CardDescription>
                    Manage the details of the doctor whose name and signature will appear on all reports.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="doctor-name">Doctor's Name</Label>
                    <Input id="doctor-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Signature</Label>
                    <div className="flex items-center gap-4">
                        <div className="w-48 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted">
                            {signature ? (
                                <Image src={signature} alt="Signature preview" width={180} height={60} style={{ objectFit: 'contain' }} />
                            ) : (
                                <span className="text-xs text-muted-foreground">No signature</span>
                            )}
                        </div>
                        <Button asChild variant="outline">
                            <label htmlFor="signature-upload" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Signature
                                <input id="signature-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleSignatureUpload} />
                            </label>
                        </Button>
                    </div>
                     <p className="text-xs text-muted-foreground">Upload a transparent PNG for the best results.</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Details
                </Button>
            </CardFooter>
        </Card>
    );
}
