
"use client";

import { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HeartPulse,
  Home,
  ClipboardList,
  CalendarCheck,
  PanelLeft,
  FileText,
  Loader2,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/header';
import { useAuth } from '@/contexts/auth-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { getDb } from '@/lib/firebase/config';
import { type Staff } from '@/lib/data';

function NavLink({ href, children }: { href: string, children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
    >
      {children}
    </Link>
  );
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const checkPasswordStatus = async () => {
      const db = getDb();
      const staffDocRef = doc(db, "ashwani/data/staff", user.uid);
      const docSnap = await getDoc(staffDocRef);

      if (docSnap.exists()) {
        const staffData = docSnap.data() as Staff;
        if (staffData.hasTemporaryPassword) {
          router.push('/force-reset-password');
        } else {
          setIsVerifying(false);
        }
      } else {
        // Staff doc not found, maybe they are still being created
        // or there's an issue. For now, let them pass.
        setIsVerifying(false);
      }
    };

    checkPasswordStatus();

  }, [user, authLoading, router]);

  if (authLoading || isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentUser = { 
    name: user?.displayName || user?.email || 'Staff', 
    role: 'Staff' 
  };
  
  const navLinks = (
     <>
        <NavLink href="/staff/dashboard"><Home className="h-4 w-4" />Dashboard</NavLink>
        <NavLink href="/staff/reporting"><FileText className="h-4 w-4" />Reporting</NavLink>
        <NavLink href="/staff/history"><ClipboardList className="h-4 w-4" />Appointment History</NavLink>
        <NavLink href="/staff/attendance"><CalendarCheck className="h-4 w-4" />Attendance</NavLink>
     </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <HeartPulse className="h-6 w-6 text-primary" />
              <span className="">Ashwani Diagnostics</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <DashboardHeader title="Staff Dashboard" user={currentUser}>
          {user && <NotificationBell userId={user.uid} role="staff" />}
           <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
               <SheetHeader className="mb-4">
                 <SheetTitle asChild>
                   <Link href="/" className="flex items-center gap-2 font-semibold">
                    <HeartPulse className="h-6 w-6 text-primary" />
                    <span className="">Ashwani Diagnostics</span>
                  </Link>
                 </SheetTitle>
               </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium">
                {navLinks}
              </nav>
            </SheetContent>
          </Sheet>
        </DashboardHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
