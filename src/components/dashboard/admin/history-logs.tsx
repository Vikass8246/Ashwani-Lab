
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Log {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
}

export function HistoryLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const db = getDb();
        const logsCollection = collection(db, "ashwani", "data", "history_logs");
        const q = query(logsCollection, orderBy("timestamp", "desc"), limit(10));
        const logsSnapshot = await getDocs(q);
        
        const logsList = logsSnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure timestamp exists and is a Firestore Timestamp before converting
          if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            return {
              id: doc.id,
              user: data.user,
              action: data.action,
              timestamp: data.timestamp.toDate()
            } as Log;
          }
          return null;
        }).filter((log): log is Log => log !== null); // Filter out any nulls from invalid data

        setLogs(logsList);

      } catch (err: any) {
        console.error("Error fetching history logs:", err);
        // This error often indicates that the collection doesn't exist or there's a rules issue.
        if (err.code === 'permission-denied') {
             setError("Could not fetch history logs. You do not have permission to view this data.");
        } else {
             // For other errors, we can assume the collection might not be ready, but we won't show an error.
             // The component will just show "No recent activity found."
             setLogs([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A log of recent important actions in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))
            ) : !error && logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                  </TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                </TableRow>
              ))
            ) : (
               <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    No recent activity found.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
