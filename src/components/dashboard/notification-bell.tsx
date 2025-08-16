

"use client";

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, writeBatch, getDocs, doc, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: { seconds: number; nanoseconds: number };
  isRead: boolean;
  link?: string;
}

type NotificationBellProps = {
  userId: string;
  role: 'admin' | 'staff' | 'phlebo' | 'patient';
};

export function NotificationBell({ userId, role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  let collectionName: 'staff' | 'phlebos' | 'patients';

  switch (role) {
      case 'admin':
      case 'staff':
          collectionName = 'staff';
          break;
      case 'phlebo':
          collectionName = 'phlebos';
          break;
      case 'patient':
          collectionName = 'patients';
          break;
      default:
          // Should not happen, but provides a safe fallback
          setIsLoading(false);
          return null; 
  }


  useEffect(() => {
    if (!userId) { 
        setIsLoading(false);
        return;
    };
    
    const db = getDb();
    const notifCollectionRef = collection(db, `ashwani/data/${collectionName}/${userId}/notifications`);
    const q = query(notifCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(notifs);
      const unread = notifs.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      setIsLoading(false);
    }, (error) => {
      console.error(`Error fetching notifications for ${role} ${userId}:`, error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, collectionName, role]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const db = getDb();
    const notifCollectionRef = collection(db, `ashwani/data/${collectionName}/${userId}/notifications`);
    const q = query(notifCollectionRef, where('isRead', '==', false));
    
    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach(docSnapshot => {
            const docRef = doc(notifCollectionRef, docSnapshot.id);
            batch.update(docRef, { isRead: true });
        });
        await batch.commit();
    } catch(error) {
        console.error("Error marking notifications as read: ", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4"/>
                Mark all read
            </Button>
        </div>
        <ScrollArea className="h-96">
            {isLoading ? (
                <div className="flex justify-center items-center h-full p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : notifications.length > 0 ? (
                 <div className="p-4 space-y-4">
                    {notifications.map(notif => (
                        <div key={notif.id} className={`relative space-y-1 ${!notif.isRead ? 'font-semibold' : ''}`}>
                             {!notif.isRead && <span className="absolute -left-4 top-1 h-2 w-2 rounded-full bg-primary" />}
                            <p className="text-sm">{notif.title}</p>
                            <p className={`text-xs ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notif.message}
                            </p>
                             <p className="text-xs text-muted-foreground">
                                {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true }) : ''}
                            </p>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                    You have no notifications.
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
