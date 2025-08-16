
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SessionExpirationDialog() {
  const { isSessionExpired, clearSessionExpired } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    if (isSessionExpired) {
      setCountdown(10); // Reset countdown on dialog open

      countdownInterval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      timer = setTimeout(() => {
        handleRedirect();
      }, 10000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [isSessionExpired]);

  const handleRedirect = () => {
    clearSessionExpired();
    router.push("/login");
  };

  return (
    <AlertDialog open={isSessionExpired} onOpenChange={handleRedirect}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Session Expired
          </AlertDialogTitle>
          <AlertDialogDescription>
            For your security, your session has expired due to inactivity. You will be redirected to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={handleRedirect}>
            Login Now ({countdown}s)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
