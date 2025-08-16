
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getDb } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, AlertTriangle, RotateCw, CalendarDays } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createNotification } from '@/app/actions/log-history';

const ALLOWED_RADIUS_METERS = 100;

interface CenterLocation {
  latitude: number;
  longitude: number;
}

export function AttendanceTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasMarkedToday, setHasMarkedToday] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<Date[]>([]);
  const [today, setToday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [centerLocation, setCenterLocation] = useState<CenterLocation | null>(null);

  const initialLoad = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setDistanceError(null);
      try {
        const db = getDb();
        const configDocRef = doc(db, 'ashwani/data/config/location');
        const configDocSnap = await getDoc(configDocRef);

        if (configDocSnap.exists()) {
          setCenterLocation(configDocSnap.data() as CenterLocation);

          const attendanceCollection = collection(db, 'ashwani', 'data', 'attendance');
          // Simplified query to avoid composite index
          const q = query(
            attendanceCollection, 
            where('staffId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(q);
          const history: Date[] = [];
          let markedToday = false;
          const todayDate = new Date();

          querySnapshot.forEach(doc => {
              const data = doc.data();
              if(data.timestamp){
                  const recordDate = data.timestamp.toDate();
                  history.push(recordDate);
                  if(isSameDay(recordDate, todayDate)){
                      markedToday = true;
                  }
              }
          });

          setAttendanceHistory(history);
          setHasMarkedToday(markedToday);

        } else {
          setError("Center location is not configured. Please contact an administrator.");
        }
      } catch (err: any) {
        console.error("Error during initial load:", err);
        if (err.code === 'permission-denied') {
             setError("You do not have permission to view attendance data. Please contact an admin.");
        } else {
             setError("An error occurred while checking attendance status.");
        }
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    setToday(format(new Date(), 'EEEE, dd MMMM yyyy'));
    initialLoad();
  }, [user]);

  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const handleMarkAttendance = async () => {
    if (!user) {
      setError('You must be logged in.');
      return;
    }
    if (!centerLocation) {
        setError("Center location is not configured. Please contact an administrator.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setDistanceError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromLatLonInMeters(latitude, longitude, centerLocation.latitude, centerLocation.longitude);

        if (distance > ALLOWED_RADIUS_METERS) {
          setDistanceError(`You must be within ${ALLOWED_RADIUS_METERS} meters of the center to mark attendance. You are currently ~${Math.round(distance)}m away.`);
          setIsLoading(false);
          return;
        }

        try {
          const db = getDb();
          await addDoc(collection(db, 'ashwani', 'data', 'attendance'), {
            staffId: user.uid,
            staffName: user.displayName,
            role: 'Staff',
            timestamp: serverTimestamp(),
          });

          await createNotification({
            title: "Attendance Marked",
            message: `${user.displayName} (Staff) has marked their attendance.`,
            target: 'allAdmins' // This can be refined to target specific admins
          });

          setHasMarkedToday(true);
          toast({ title: 'Success', description: 'Attendance marked for today!' });
          await initialLoad(); // Refresh history
        } catch (error) {
          console.error("Error marking attendance:", error);
          toast({ title: 'Error', description: 'Failed to mark attendance.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      },
      (geoError) => {
        let message = 'Could not get your location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
            message = 'Location permission denied. Please enable it in your browser settings to mark attendance.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = 'Location information is unavailable.';
        }
        setError(message);
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Check className="h-8 w-8"/>
          </div>
          <CardTitle>Mark Your Attendance</CardTitle>
          <CardDescription>{today}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          {isLoading && !error && (
              <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          )}

          {!isLoading && error && (
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Attendance Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}
          
          {!isLoading && distanceError && (
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Out of Range</AlertTitle>
                  <AlertDescription className="mb-4">{distanceError}</AlertDescription>
                   <Button variant="secondary" className="w-full mt-2" onClick={handleMarkAttendance}>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Try Again
                  </Button>
              </Alert>
          )}

          {!isLoading && !error && !distanceError && hasMarkedToday && (
            <div className="text-center text-green-600 flex flex-col items-center gap-4">
              <Check className="h-16 w-16" />
              <p className="font-semibold text-lg">You have marked your attendance for today.</p>
            </div>
          )}

          {!isLoading && !error && !distanceError && !hasMarkedToday && (
            <Button 
              size="lg" 
              onClick={handleMarkAttendance} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Mark Present
            </Button>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
           <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary"/>
              <div>
                <CardTitle>Your Attendance History</CardTitle>
                <CardDescription>Days you were marked present.</CardDescription>
              </div>
           </div>
        </CardHeader>
        <CardContent className="flex justify-center">
           {isLoading ? (
               <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
           ) : (
             <Calendar
                mode="multiple"
                selected={attendanceHistory}
                className="p-0"
                modifiersClassNames={{
                    selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
                }}
             />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
