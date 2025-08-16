
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { getDb } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, KeyRound } from 'lucide-react';
import { AppLogo } from '@/components/icons';

export default function ForceResetPasswordPage() {
  const { user, userRole, resetPassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(newPassword);

      if (user && userRole) {
        const db = getDb();
        const collectionName = userRole === 'phlebo' ? 'phlebos' : 'staff';
        const userDocRef = doc(db, 'ashwani/data', collectionName, user.uid);
        await updateDoc(userDocRef, { hasTemporaryPassword: false });
      }

      toast({
        title: 'Password Updated!',
        description: 'Your password has been changed successfully. Redirecting you to the dashboard.',
      });
      
      const dashboardPath = userRole === 'phlebo' ? '/phlebo/dashboard' : '/staff/dashboard';
      router.push(dashboardPath);

    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <AppLogo className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Create a New Password</CardTitle>
            <CardDescription>For security, you must change the temporary password provided by your administrator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter your new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handlePasswordReset} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set New Password
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
