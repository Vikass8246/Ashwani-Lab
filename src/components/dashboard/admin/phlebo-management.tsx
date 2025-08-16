
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDb, getFirebaseAuth, firebaseConfig } from '@/lib/firebase/config';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, AlertTriangle, RotateCw } from 'lucide-react';
import { Alert, AlertDescription as UiAlertDescription, AlertTitle } from '@/components/ui/alert';
import { type Phlebo } from '@/lib/data';
import { createNotification } from '@/app/actions/log-history';

export function PhleboManagement() {
  const [phlebos, setPhlebos] = useState<Phlebo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPhlebo, setCurrentPhlebo] = useState<Partial<Phlebo>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPhlebos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getDb();
      const phlebosCollection = collection(db, "ashwani", "data", "phlebos");
      const phlebosSnapshot = await getDocs(phlebosCollection);
      const phlebosList = phlebosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Phlebo[];
      setPhlebos(phlebosList);
    } catch (err: any) {
      console.error("Firestore Error: ", err);
      const errorMessage = `Failed to fetch phlebotomists. This is likely a Firestore security rule issue. Please ensure your rules allow read access for the currently authenticated user to the path 'ashwani/data/phlebos'. Original error: ${err.message}`;
      setError(errorMessage);
      toast({ 
        title: 'Error Fetching Data', 
        description: errorMessage, 
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhlebos();
  }, []);

  const handleSave = async () => {
    const { name, email, password, id, contact } = currentPhlebo;
    if (!name || !email || !contact) {
      toast({ title: 'Error', description: 'Please fill in name, email and contact.', variant: 'destructive' });
      return;
    }
    if (!isEditMode && (!password || password.length < 6)) {
        toast({ title: 'Error', description: 'Password is required and must be at least 6 characters.', variant: 'destructive' });
        return;
    }

    setIsSaving(true);
    let tempApp: FirebaseApp | null = null;
    const db = getDb();
    try {
      if (isEditMode && id) {
        const phleboDoc = doc(db, "ashwani", "data", "phlebos", id);
        await updateDoc(phleboDoc, { name, email, contact });
        toast({ title: 'Success', description: 'Phlebotomist updated successfully.' });
      } else {
        tempApp = initializeApp(firebaseConfig, `temp-phlebo-create-${Date.now()}`);
        const tempAuth = getAuth(tempApp);
        const userCredential = await createUserWithEmailAndPassword(tempAuth, email!, password!);
        const newPhleboUID = userCredential.user.uid;

        const phleboDocRef = doc(db, "ashwani", "data", "phlebos", newPhleboUID);
        await setDoc(phleboDocRef, { 
          uid: newPhleboUID,
          name, 
          email,
          contact,
          hasTemporaryPassword: true // Set flag for new users
        });
        
        await sendEmailVerification(userCredential.user);
        
        await createNotification({
            title: "New Phlebo Added",
            message: `A new phlebotomist, ${name}, has been added to the system.`,
            target: "allAdmins"
        });

        toast({ 
          title: 'Phlebotomist Added Successfully!', 
          description: `An email with verification instructions and a temporary password has been sent to ${email}.`,
          duration: 10000,
        });
      }
      await fetchPhlebos();
      setIsDialogOpen(false);
      setCurrentPhlebo({});
    } catch (error: any) {
        console.error("Save Phlebo Error: ", error);
        let errorMessage = 'Failed to save phlebo.';
         if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use by another account.';
        } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
            errorMessage = 'Permission Denied. Please check your Firestore security rules.'
        }
        toast({ title: 'Error', description: error.message || errorMessage, variant: 'destructive', duration: 10000 });
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
      }
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, uid?: string) => {
    const docIdToDelete = uid || id;
    if (!docIdToDelete) {
        toast({ title: 'Error', description: 'Cannot delete phlebo without a valid ID.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);
    const db = getDb();
    try {
      await deleteDoc(doc(db, "ashwani", "data", "phlebos", docIdToDelete));
      toast({ title: 'Success', description: 'Phlebo record deleted successfully. Auth user must be manually deleted from Firebase Console.' });
      await fetchPhlebos();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete phlebo record.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const openDialog = (phlebo?: Phlebo) => {
    if (phlebo) {
      setIsEditMode(true);
      setCurrentPhlebo(phlebo);
    } else {
      setIsEditMode(false);
      setCurrentPhlebo({});
    }
    setIsDialogOpen(true);
  };

  return (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Phlebotomist Management</CardTitle>
            <CardDescription>Add, edit, or delete phlebotomists.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) { setIsDialogOpen(false); setCurrentPhlebo({})}}}>
                <DialogTrigger asChild>
                    <Button onClick={() => openDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Phlebo
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Phlebo' : 'Add New Phlebo'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={currentPhlebo.name || ''} onChange={(e) => setCurrentPhlebo({ ...currentPhlebo, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={currentPhlebo.email || ''} onChange={(e) => setCurrentPhlebo({ ...currentPhlebo, email: e.target.value })} disabled={isEditMode}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact">Contact Number</Label>
                            <Input id="contact" type="tel" value={currentPhlebo.contact || ''} onChange={(e) => setCurrentPhlebo({ ...currentPhlebo, contact: e.target.value })} />
                        </div>
                        {!isEditMode && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input id="password" type="password" placeholder="Min. 6 characters" onChange={(e) => setCurrentPhlebo({ ...currentPhlebo, password: e.target.value })} />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
                    </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={fetchPhlebos} disabled={isLoading}>
                <RotateCw className="h-4 w-4" />
                <span className="sr-only">Refresh</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Could not load data</AlertTitle>
                <UiAlertDescription>{error}</UiAlertDescription>
            </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : phlebos.map((phlebo) => (
              <TableRow key={phlebo.id}>
                <TableCell className="font-medium">{phlebo.name}</TableCell>
                <TableCell>{phlebo.email}</TableCell>
                <TableCell>{phlebo.contact}</TableCell>
                <TableCell className="text-right space-x-2">
                   <Button variant="ghost" size="icon" onClick={() => openDialog(phlebo)}><Edit className="h-4 w-4" /></Button>
                   <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete the phlebo record. This action does not delete their login credentials and must be done manually. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(phlebo.id, phlebo.uid)}>Delete</AlertDialogAction>
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
