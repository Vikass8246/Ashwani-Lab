

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertTriangle, Edit, RotateCw, PlusCircle, Trash2, Save, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Test, type ReportFormat } from '@/lib/data';
import { produce } from 'immer';
import Link from 'next/link';

export function ReportFormatManagement() {
    const [tests, setTests] = useState<Test[]>([]);
    const [reportFormats, setReportFormats] = useState<Record<string, ReportFormat>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const db = getDb();
            const testsPromise = getDocs(collection(db, "ashwani/data/tests"));
            const formatsPromise = getDocs(collection(db, "ashwani/data/report_formats"));
            
            const [testsSnapshot, formatsSnapshot] = await Promise.all([testsPromise, formatsPromise]);
            
            const testsList = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Test[];
            const formatsMap = formatsSnapshot.docs.reduce((acc, doc) => {
                const format = { id: doc.id, ...doc.data() } as ReportFormat;
                acc[format.testId] = format;
                return acc;
            }, {} as Record<string, ReportFormat>);
            
            setTests(testsList);
            setReportFormats(formatsMap);
        } catch (err: any) {
            console.error(err);
            setError("Failed to fetch data. Check Firestore rules and permissions.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTests = useMemo(() => {
        if (!searchTerm) return tests;
        return tests.filter(test =>
            test.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tests, searchTerm]);

    const handleEditFormat = (test: Test) => {
        const existingFormat = reportFormats[test.id] || {
            id: test.id,
            testId: test.id,
            testName: test.name,
            parameters: [{ name: '', unit: '', normalRange: '' }]
        };
        setSelectedTest({ ...test, format: existingFormat });
    };

    const handleSaveFormat = async (format: ReportFormat) => {
        setIsSaving(true);
        try {
            const db = getDb();
            const formatRef = doc(db, "ashwani/data/report_formats", format.testId);
            await setDoc(formatRef, format, { merge: true });
            toast({ title: "Success", description: "Report format saved successfully." });
            setReportFormats(prev => ({...prev, [format.testId]: format}));
            setSelectedTest(null);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save format.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <CardTitle>Report Formatting</CardTitle>
                        <CardDescription>Define the structure and normal ranges for test reports.</CardDescription>
                    </div>
                     <Button asChild>
                        <Link href="/admin/report-templates">Manage Templates</Link>
                    </Button>
                </div>
                 <div className="relative w-full sm:max-w-xs pt-4">
                    <Search className="absolute left-2.5 top-6 h-4 w-4 text-muted-foreground" />
                    <Input
                    type="search"
                    placeholder="Search by test name..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTests.map(test => (
                                <TableRow key={test.id}>
                                    <TableCell className="font-medium">{test.name}</TableCell>
                                    <TableCell>
                                        {reportFormats[test.id] ? (
                                            <span className="text-green-600">Formatted</span>
                                        ) : (
                                            <span className="text-yellow-600">Not Formatted</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleEditFormat(test)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            {reportFormats[test.id] ? 'Edit Format' : 'Create Format'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {selectedTest && (
                    <FormatEditorDialog 
                        test={selectedTest}
                        format={reportFormats[selectedTest.id]}
                        isOpen={!!selectedTest}
                        onClose={() => setSelectedTest(null)}
                        onSave={handleSaveFormat}
                        isSaving={isSaving}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function FormatEditorDialog({ test, format, isOpen, onClose, onSave, isSaving }: { test: Test, format: ReportFormat, isOpen: boolean, onClose: () => void, onSave: (format: ReportFormat) => void, isSaving: boolean }) {
    const [currentFormat, setCurrentFormat] = useState<ReportFormat>(
        format || { id: test.id, testId: test.id, testName: test.name, parameters: [{ name: '', unit: '', normalRange: '' }] }
    );

    const handleParamChange = (index: number, field: string, value: string) => {
        setCurrentFormat(
            produce(draft => {
                draft.parameters[index][field as keyof typeof draft.parameters[0]] = value;
            })
        );
    };

    const addParameter = () => {
        setCurrentFormat(
            produce(draft => {
                draft.parameters.push({ name: '', unit: '', normalRange: '' });
            })
        );
    };
    
    const removeParameter = (index: number) => {
        setCurrentFormat(
            produce(draft => {
                draft.parameters.splice(index, 1);
            })
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Format for: {test.name}</DialogTitle>
                    <DialogDescription>Define the parameters, units, and normal ranges for this test report.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {currentFormat.parameters.map((param, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center mb-4 p-2 border rounded-md">
                            <div className="col-span-4 space-y-1">
                                <Label htmlFor={`name-${index}`}>Parameter Name</Label>
                                <Input id={`name-${index}`} placeholder="e.g., Hemoglobin" value={param.name} onChange={e => handleParamChange(index, 'name', e.target.value)} />
                            </div>
                             <div className="col-span-3 space-y-1">
                                <Label htmlFor={`range-${index}`}>Normal Range</Label>
                                <Input id={`range-${index}`} placeholder="e.g., 13.5-17.5" value={param.normalRange} onChange={e => handleParamChange(index, 'normalRange', e.target.value)} />
                            </div>
                            <div className="col-span-3 space-y-1">
                                <Label htmlFor={`unit-${index}`}>Unit</Label>
                                <Input id={`unit-${index}`} placeholder="e.g., g/dL" value={param.unit} onChange={e => handleParamChange(index, 'unit', e.target.value)} />
                            </div>
                            <div className="col-span-2 flex items-end">
                                <Button variant="destructive" size="icon" onClick={() => removeParameter(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" onClick={addParameter}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Parameter
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(currentFormat)} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Format
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
