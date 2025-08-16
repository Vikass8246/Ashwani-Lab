
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
  Loader2,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/header';
import { useAuth } from '@/contexts/auth-context';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { getDb } from '@/lib/firebase/config';
import { type Phlebo } from '@/lib/data';

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

export default function PhleboLayout({ children }: { children: ReactNode }) {
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
      const phleboDocRef = doc(db, "ashwani/data/phlebos", user.uid);
      const docSnap = await getDoc(phleboDocRef);

      if (docSnap.exists()) {
        const phleboData = docSnap.data() as Phlebo;
        if (phleboData.hasTemporaryPassword) {
          router.push('/force-reset-password');
        } else {
          setIsVerifying(false);
        }
      } else {
        // Phlebo doc not found, maybe they are still being created
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
    name: user?.displayName || user?.email || 'Phlebo', 
    role: 'Phlebo' 
  };
  
  const navLinks = (
     <>
        <NavLink href="/phlebo/dashboard"><Home className="h-4 w-4" />Dashboard</NavLink>
        <NavLink href="/phlebo/history"><ClipboardList className="h-4 w-4" />History</NavLink>
        <NavLink href="/phlebo/attendance"><CalendarCheck className="h-4 w-4" />Attendance</NavLink>
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
        <DashboardHeader title="Phlebo Dashboard" user={currentUser}>
          {user && <NotificationBell userId={user.uid} role="phlebo" />}
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
