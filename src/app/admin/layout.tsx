
"use client";

import { type ReactNode } from 'react';
import Link from 'next/link';
import {
  Bell,
  Home,
  Users2,
  FlaskConical,
  FileText,
  User,
  TestTube,
  HeartPulse,
  MessageSquare,
  BrainCircuit,
  Cog,
  PanelLeft,
  CalendarCheck,
  ClipboardList,
  FileJson,
  LayoutTemplate,
  Receipt,
  FileDigit,
  PenSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/header';
import { useAuth } from '@/contexts/auth-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/dashboard/notification-bell';

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

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const currentUser = { 
    name: user?.displayName || user?.email || 'Admin', 
    role: 'Admin' 
  };
  
  const navLinks = (
    <>
      <NavLink href="/admin/dashboard"><Home className="h-4 w-4" />Dashboard</NavLink>
      <NavLink href="/admin/appointments"><ClipboardList className="h-4 w-4" />Appointment Mgmt</NavLink>
      <NavLink href="/admin/reporting"><FileText className="h-4 w-4" />Reporting</NavLink>
      <NavLink href="/admin/billing"><Receipt className="h-4 w-4" />Bill Management</NavLink>
      <NavLink href="/admin/tests"><FlaskConical className="h-4 w-4" />Test Management</NavLink>
      <NavLink href="/admin/report-formats"><FileJson className="h-4 w-4" />Report Formatting</NavLink>
      <NavLink href="/admin/report-templates"><LayoutTemplate className="h-4 w-4" />Report Templates</NavLink>
      <NavLink href="/admin/reporting-doctors"><PenSquare className="h-4 w-4" />Reporting Doctors</NavLink>
      <NavLink href="/admin/bill-format"><FileDigit className="h-4 w-4" />Bill Format</NavLink>
      <NavLink href="/admin/phlebos"><User className="h-4 w-4" />Phlebo Management</NavLink>
      <NavLink href="/admin/staff"><Users2 className="h-4 w-4" />Staff Management</NavLink>
      <NavLink href="/admin/patients"><Users2 className="h-4 w-4" />Patient Management</NavLink>
      <NavLink href="/admin/attendance"><CalendarCheck className="h-4 w-4" />Attendance</NavLink>
      <NavLink href="/admin/reviews"><MessageSquare className="h-4 w-4" />Reviews</NavLink>
      <NavLink href="/admin/training"><BrainCircuit className="h-4 w-4" />Chatbot Training</NavLink>
      <NavLink href="/admin/settings"><Cog className="h-4 w-4" />Settings</NavLink>
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
        <DashboardHeader title="Admin Dashboard" user={currentUser}>
          {user && <NotificationBell userId={user.uid} role="admin" />}
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
