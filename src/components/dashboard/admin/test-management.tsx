
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as RadixAlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, AlertTriangle, RotateCw, Upload, Search } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Test {
  id: string;
  name: string;
  cost: number;
}

export function TestManagement() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState<Partial<Test>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchTests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getDb();
      const testsCollection = collection(db, "ashwani", "data", "tests");
      const testsSnapshot = await getDocs(testsCollection);
      const testsList = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Test[];
      
      // Sort tests alphabetically by name
      testsList.sort((a, b) => a.name.localeCompare(b.name));
      
      setTests(testsList);
    } catch (err: any) {
      console.error("Firestore Error: ", err);
      const errorMessage = `Failed to fetch tests. This is likely a Firestore security rule issue. Please ensure your rules allow read access for the current user to the path 'ashwani/data/tests'. Original error: ${err.message}`;
      setError(errorMessage);
      toast({ title: 'Error Fetching Tests', description: errorMessage, variant: 'destructive', duration: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);
  
  const filteredTests = useMemo(() => {
    if (!searchTerm) return tests;
    return tests.filter(test => 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tests, searchTerm]);

  const handleSave = async () => {
    if (!currentTest.name || !currentTest.cost) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    const testNameLower = currentTest.name.trim().toLowerCase();
    const isDuplicate = tests.some(test => 
        test.name.toLowerCase() === testNameLower && test.id !== currentTest.id
    );

    if (isDuplicate) {
        toast({
            title: 'Duplicate Test Name',
            description: 'A test with this name already exists. Please use a different name.',
            variant: 'destructive',
        });
        return;
    }

    setIsSaving(true);
    const db = getDb();
    try {
      if (isEditMode && currentTest.id) {
        const testDoc = doc(db, "ashwani", "data", "tests", currentTest.id);
        await updateDoc(testDoc, { name: currentTest.name, cost: Number(currentTest.cost) });
        toast({ title: 'Success', description: 'Test updated successfully.' });
      } else {
        await addDoc(collection(db, "ashwani", "data", "tests"), { name: currentTest.name.trim(), cost: Number(currentTest.cost) });
        toast({ title: 'Success', description: 'Test added successfully.' });
      }
      await fetchTests();
      setIsDialogOpen(false);
      setCurrentTest({});
    } catch (error: any) {
      toast({ 
        title: 'Save Failed', 
        description: error.code === 'permission-denied' 
          ? 'Permission Denied. Please check your Firestore security rules.' 
          : 'Failed to save test.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const db = getDb();
    try {
      await deleteDoc(doc(db, "ashwani", "data", "tests", id));
      toast({ title: 'Success', description: 'Test deleted successfully.' });
      await fetchTests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete test.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const openDialog = (test?: Test) => {
    if (test) {
      setIsEditMode(true);
      setCurrentTest(test);
    } else {
      setIsEditMode(false);
      setCurrentTest({ name: '', cost: 0 });
    }
    setIsDialogOpen(true);
  };
  
   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const db = getDb();
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const batch = writeBatch(db);
        let count = 0;
        json.forEach(row => {
          // Normalize column headers
          const testId = row['Test ID'] || row['id'];
          const testName = row['Test Name'] || row['name'];
          const testCost = row['MRP'] || row['cost'];

          if (testId && testName && testCost) {
            const testDocRef = doc(db, "ashwani", "data", "tests", testId);
            batch.set(testDocRef, { name: testName, cost: Number(testCost) });
            count++;
          }
        });
        
        if (count === 0) {
            toast({ title: 'No Data Found', description: 'The file might be empty or have incorrect column headers. Expected: "Test ID", "Test Name", "MRP".', variant: 'destructive' });
            return;
        }

        await batch.commit();
        toast({ title: 'Success', description: `${count} tests uploaded successfully.` });
        await fetchTests();
        setIsUploadOpen(false);
      } catch (err) {
        console.error("Bulk upload error: ", err);
        toast({ title: 'Upload Failed', description: 'There was an error processing your file.', variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Test Management</CardTitle>
                <CardDescription>Add, edit, or delete diagnostic tests.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Bulk Upload Tests</DialogTitle>
                            <DialogDescription>
                                Upload an Excel file (.xlsx) with columns: "Test ID", "Test Name", and "MRP".
                                The first row should be the header. Each test will be added or overwritten based on its ID.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isSaving} />
                            {isSaving && <div className="flex items-center justify-center mt-4"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing file...</div>}
                        </div>
                    </DialogContent>
                </Dialog>

                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Test
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Test' : 'Add New Test'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                        {isEditMode && (
                            <div className="space-y-2">
                                <Label htmlFor="id">Test ID</Label>
                                <Input
                                id="id"
                                value={currentTest.id || ''}
                                readOnly
                                className="bg-muted"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Test Name</Label>
                            <Input
                            id="name"
                            value={currentTest.name || ''}
                            onChange={(e) => setCurrentTest({ ...currentTest, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">MRP (Cost)</Label>
                            <Input
                            id="cost"
                            type="number"
                            value={currentTest.cost || ''}
                            onChange={(e) => setCurrentTest({ ...currentTest, cost: Number(e.target.value) })}
                            />
                        </div>
                        </div>
                        <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" size="icon" onClick={fetchTests} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                    <span className="sr-only">Refresh</span>
                </Button>
            </div>
        </div>
        <div className="relative w-full max-w-sm mt-4 sm:mt-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
              type="search"
              placeholder="Search by Test ID or Name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permission Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Test ID</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : !error && filteredTests.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                      No tests found. Click "Add Test" to begin or adjust your search.
                      </TableCell>
                  </TableRow>
              ) : (
                  filteredTests.map((test) => (
                  <TableRow key={test.id}>
                      <TableCell className="font-mono text-xs">{test.id}</TableCell>
                      <TableCell className="font-medium">{test.name}</TableCell>
                      <TableCell>₹{test.cost}</TableCell>
                      <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(test)}>
                              <Edit className="h-4 w-4" />
                          </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <RadixAlertDialogDescription>
                                      This action will permanently delete the test record. This cannot be undone.
                                  </RadixAlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(test.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                  </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
