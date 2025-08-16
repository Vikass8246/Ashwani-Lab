
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDb, firebaseConfig } from '@/lib/firebase/config';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Staff } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { createNotification } from '@/app/actions/log-history';


export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Partial<Staff>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getDb();
      const staffCollection = collection(db, "ashwani", "data", "staff");
      const staffSnapshot = await getDocs(staffCollection);
      const staffList = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Staff[];
      setStaff(staffList);
    } catch (err: any) {
      console.error("Firestore Error: ", err);
      const errorMessage = `Failed to fetch staff members. This is likely a Firestore security rule issue. Please ensure your rules allow read access for the current user to the path 'ashwani/data/staff'. Original error: ${err.message}`;
      setError(errorMessage);
      toast({ title: 'Error Fetching Staff', description: errorMessage, variant: 'destructive', duration: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSave = async () => {
    const { email, name, password, id, role, contact } = currentStaff;
    if (!name || !email || !role || !contact) {
      toast({ title: 'Error', description: 'Please fill in all fields including role and mobile number.', variant: 'destructive' });
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
        // When editing, the 'id' is the document ID which should be the UID.
        const staffDoc = doc(db, "ashwani", "data", "staff", id);
        await updateDoc(staffDoc, { name, email, role, contact });
        toast({ title: 'Success', description: 'Staff member updated successfully.' });
      } else {
        tempApp = initializeApp(firebaseConfig, `temp-staff-create-${Date.now()}`);
        const tempAuth = getAuth(tempApp);
        const userCredential = await createUserWithEmailAndPassword(tempAuth, email!, password!);
        const newStaffUID = userCredential.user.uid;

        // Use the UID from Auth as the document ID in Firestore
        const staffDocRef = doc(db, "ashwani", "data", "staff", newStaffUID);
        await setDoc(staffDocRef, { 
          uid: newStaffUID,
          name, 
          email,
          role,
          contact,
          hasTemporaryPassword: true // Set flag for new users
        });
        
        await sendEmailVerification(userCredential.user);
        
        await createNotification({
            title: "New Staff Added",
            message: `A new ${role}, ${name}, has been added to the system.`,
            target: "allAdmins"
        });

        toast({ 
          title: 'Staff Added Successfully!', 
          description: `An email with verification instructions and a temporary password has been sent to ${email}.`,
          duration: 10000,
        });
      }
      await fetchStaff();
      setIsDialogOpen(false);
      setCurrentStaff({});
    } catch (error: any) {
        console.error("Save Staff Error: ", error);
        let errorMessage = 'Failed to save staff member.';
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
    // The document ID should be the UID. If a separate UID field exists, prioritize that.
    const docIdToDelete = uid || id;
    if (!docIdToDelete) {
        toast({ title: 'Error', description: 'Cannot delete staff member without a valid ID.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);
    const db = getDb();
    try {
      await deleteDoc(doc(db, "ashwani", "data", "staff", docIdToDelete));
      toast({ title: 'Success', description: 'Staff record deleted successfully. Auth user must be manually deleted from Firebase Console.' });
      await fetchStaff();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete staff record.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const openDialog = (staffMember?: Staff) => {
    if (staffMember) {
      setIsEditMode(true);
      setCurrentStaff(staffMember);
    } else {
      setIsEditMode(false);
      setCurrentStaff({role: "staff"});
    }
    setIsDialogOpen(true);
  };

  return (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Add, edit, or delete staff members.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
             <Dialog open={isDialogOpen} onOpenChange={(open) => {if (!open) setCurrentStaff({}); setIsDialogOpen(open)}}>
                <DialogTrigger asChild>
                    <Button onClick={() => openDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={currentStaff.name || ''} onChange={(e) => setCurrentStaff({ ...currentStaff, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={currentStaff.email || ''} onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })} disabled={isEditMode} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="contact">Mobile Number</Label>
                            <Input id="contact" type="tel" value={currentStaff.contact || ''} onChange={(e) => setCurrentStaff({ ...currentStaff, contact: e.target.value })} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                             <Select onValueChange={(value) => setCurrentStaff({ ...currentStaff, role: value as 'admin' | 'staff' })} value={currentStaff.role}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {!isEditMode && (
                            <div className="space-y-2">
                            <Label htmlFor="password">Temporary Password</Label>
                            <Input id="password" type="password" placeholder="Min. 6 characters" onChange={(e) => setCurrentStaff({ ...currentStaff, password: e.target.value })} />
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
            <Button variant="outline" size="icon" onClick={fetchStaff} disabled={isLoading}>
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
              <TableHead>Mobile No.</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : !error && staff.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No staff found. Click "Add Staff" to begin.
                    </TableCell>
                </TableRow>
            ) : (
                staff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                    <TableCell className="font-medium">{staffMember.name}</TableCell>
                    <TableCell>{staffMember.email}</TableCell>
                    <TableCell>{staffMember.contact || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant={staffMember.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{staffMember.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(staffMember)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the staff member's record. This action does not delete their login credentials and must be done manually. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(staffMember.id, staffMember.uid)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
