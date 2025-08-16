
"use client";

import Link from "next/link";
import { AppLogo } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { ResetPasswordDialog } from "../auth/reset-password-dialog";
import type { ReactNode } from "react";

type DashboardHeaderProps = {
  title: string;
  user: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  children?: ReactNode; // For mobile nav trigger
};

export function DashboardHeader({ title, user, children }: DashboardHeaderProps) {
  const { logout } = useAuth();
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <div className="flex-1 md:grow-0">
          <h1 className="text-xl font-semibold text-center font-headline whitespace-nowrap">{title}</h1>
       </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        {/* Children contains Notification Bell and mobile sheet trigger */}
        {children}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>{user.role}</DropdownMenuItem>
             <ResetPasswordDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Reset Password
                </DropdownMenuItem>
            </ResetPasswordDialog>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
