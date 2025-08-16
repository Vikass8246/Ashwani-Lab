
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Trash2, AlertTriangle, RotateCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Patient } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Partial<Patient>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const db = getDb();
        const patientsCollection = collection(db, "ashwani", "data", "patients");
        const patientsSnapshot = await getDocs(patientsCollection);
        const patientsList = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];
        setPatients(patientsList);
    } catch (err: any) {
        console.error("Firestore Error: ", err);
        const errorMessage = `Failed to fetch patients. This is likely a Firestore security rule issue. Please ensure your rules allow read access for the current user to the path 'ashwani/data/patients'. Original error: ${err.message}`;
        setError(errorMessage);
        toast({ title: 'Error Fetching Data', description: errorMessage, variant: 'destructive', duration: 10000 });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSave = async () => {
    if (!currentPatient.id || !currentPatient.name || !currentPatient.contact || !currentPatient.address || !currentPatient.age || !currentPatient.sex) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const db = getDb();
    try {
      const patientDoc = doc(db, "ashwani", "data", "patients", currentPatient.id);
      await updateDoc(patientDoc, { 
          name: currentPatient.name, 
          contact: currentPatient.contact, 
          address: currentPatient.address,
          age: Number(currentPatient.age),
          sex: currentPatient.sex
      });
      toast({ title: 'Success', description: 'Patient details updated successfully.' });
      await fetchPatients();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update patient.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const db = getDb();
    try {
      await deleteDoc(doc(db, "ashwani", "data", "patients", id));
      toast({ title: 'Success', description: 'Patient deleted successfully.' });
      await fetchPatients();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete patient.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (patient: Patient) => {
    setCurrentPatient(patient);
    setIsDialogOpen(true);
  };

  return (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patient Management</CardTitle>
          <CardDescription>Edit or delete patient records.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchPatients} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
       {error && (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Could not load data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">{patient.name}</TableCell>
                <TableCell>{patient.contact}</TableCell>
                <TableCell className="max-w-xs truncate">{patient.address}</TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell>{patient.sex}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Dialog open={isDialogOpen && currentPatient.id === patient.id} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openDialog(patient)}><Edit className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Patient</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" value={currentPatient.name || ''} onChange={(e) => setCurrentPatient({ ...currentPatient, name: e.target.value })} />
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor="contact">Contact Number</Label>
                          <Input id="contact" value={currentPatient.contact || ''} onChange={(e) => setCurrentPatient({ ...currentPatient, contact: e.target.value })} />
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" value={currentPatient.address || ''} onChange={(e) => setCurrentPatient({ ...currentPatient, address: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" type="number" value={currentPatient.age || ''} onChange={(e) => setCurrentPatient({ ...currentPatient, age: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="sex">Sex</Label>
                             <Select onValueChange={(value) => setCurrentPatient({ ...currentPatient, sex: value as Patient['sex'] })} value={currentPatient.sex}>
                                <SelectTrigger id="sex">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will permanently delete the patient record. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(patient.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
