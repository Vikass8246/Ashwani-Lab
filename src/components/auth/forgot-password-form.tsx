
"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from "firebase/auth";

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const auth = getFirebaseAuth();
      await firebaseSendPasswordResetEmail(auth, email);
      setIsSuccess(true);
      toast({
          title: "Check Your Email",
          description: `If an account exists for ${email}, a password reset link has been sent. Please check your spam folder if you don't see it.`,
          duration: 10000,
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      if (error.code === 'auth/too-many-requests') {
        setError("Too many requests have been sent from this device. Please wait a while before trying again.");
      } else {
        // For security reasons, don't reveal if the user does not exist.
        // The success case handles this by informing the user to check their email if an account exists.
        // We will show a success state even on auth/user-not-found to prevent user enumeration.
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
        <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
                 <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold">Check your email</h2>
                <p className="text-muted-foreground mt-2">A password reset link has been sent to <span className="font-medium text-foreground">{email}</span> if an account with that email exists.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
        <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
        )}

        <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        
        <Button onClick={handlePasswordReset} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="animate-spin mr-2" />}
            Send Reset Link
        </Button>
      </CardContent>
    </Card>
  );
}
