
"use client"

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { format, isSameDay } from 'date-fns';
import { Loader2, User, Calendar, CheckCircle, XCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Staff, type Phlebo } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarView } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type UserWithAttendance = (Staff | Phlebo) & { role: 'Staff' | 'Phlebo' };

interface AttendanceRecord {
    id: string;
    staffId: string;
    timestamp: Timestamp;
}

export function AttendanceManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [phlebos, setPhlebos] = useState<Phlebo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithAttendance | null>(null);
  const [userAttendance, setUserAttendance] = useState<Date[]>([]);
  const [hasMarkedToday, setHasMarkedToday] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const db = getDb();
        const staffPromise = getDocs(collection(db, "ashwani", "data", "staff"));
        const phlebosPromise = getDocs(collection(db, "ashwani", "data", "phlebos"));
        
        const [staffSnapshot, phlebosSnapshot] = await Promise.all([staffPromise, phlebosPromise]);
        
        const staffList = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Staff[];
        const phlebosList = phlebosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Phlebo[];
        
        setStaff(staffList);
        setPhlebos(phlebosList);
      } catch (err: any) {
        console.error("Failed to fetch staff/phlebos list:", err);
        setError("Could not fetch employee lists. Please check permissions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUserClick = async (user: UserWithAttendance) => {
    setSelectedUser(user);
    setIsDialogLoading(true);

    try {
        const db = getDb();
        const attendanceCollection = collection(db, 'ashwani', 'data', 'attendance');
        const q = query(attendanceCollection, where('staffId', '==', user.id));
        const snapshot = await getDocs(q);

        const history: Date[] = [];
        let markedToday = false;
        const todayDate = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            if(data.timestamp){
                const recordDate = data.timestamp.toDate();
                history.push(recordDate);
                if(isSameDay(recordDate, todayDate)){
                    markedToday = true;
                }
            }
        });

        setUserAttendance(history);
        setHasMarkedToday(markedToday);

    } catch (error) {
        console.error("Error fetching user attendance: ", error);
        setUserAttendance([]);
        setHasMarkedToday(false);
    } finally {
        setIsDialogLoading(false);
    }
  };

  const UserTable = ({ users, role }: { users: (Staff | Phlebo)[], role: 'Staff' | 'Phlebo' }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {isLoading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                    </TableRow>
                ))
            ) : users.length > 0 ? (
                users.map(user => (
                    <TableRow key={user.id} onClick={() => handleUserClick({...user, role})} className="cursor-pointer">
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">No {role.toLowerCase()} members found.</TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
  );

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Attendance Management</CardTitle>
        <CardDescription>Select a role to view the list of members and their attendance records.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <Tabs defaultValue="staff">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="phlebo">Phlebotomists</TabsTrigger>
            </TabsList>
            <TabsContent value="staff">
                <UserTable users={staff} role="Staff" />
            </TabsContent>
            <TabsContent value="phlebo">
                <UserTable users={phlebos} role="Phlebo" />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Attendance for {selectedUser?.name}</DialogTitle>
                <DialogDescription>Role: {selectedUser?.role}</DialogDescription>
            </DialogHeader>
            {isDialogLoading ? (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
            ) : (
                <div className="space-y-4 py-4">
                    <div>
                        <h3 className="text-sm font-medium mb-2">Today's Status ({format(new Date(), 'dd MMM yyyy')})</h3>
                        <div className={cn(
                            "flex items-center gap-2 rounded-md p-3 text-sm",
                            hasMarkedToday ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        )}>
                           {hasMarkedToday ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                           <span>{hasMarkedToday ? 'Attendance marked for today' : 'Not marked for today'}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium mb-2">Attendance History</h3>
                        <div className="flex justify-center rounded-md border">
                             <CalendarView
                                mode="multiple"
                                selected={userAttendance}
                                className="p-0"
                                modifiersClassNames={{
                                    selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
                                }}
                             />
                        </div>
                    </div>
                </div>
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}
