
"use client";

import { useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth, getDb } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Staff } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";

type Role = "patient" | "staff" | "admin" | "phlebo";

const roleDashboards: Record<Role, string> = {
    patient: "/patient/dashboard",
    staff: "/staff/dashboard",
    admin: "/admin/dashboard",
    phlebo: "/phlebo/dashboard",
}

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 173.5 56.6l-67.2 64.4C324.7 97.4 286.5 80 248 80c-82.6 0-150.2 67.5-150.2 150.2S165.4 406.2 248 406.2c44.6 0 82.2-16.7 110.2-43.9l67.2 64.4C412.5 470.6 335.2 504 248 504z"></path>
    </svg>
);

// Instantiate the provider once
const provider = new GoogleAuthProvider();

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<Role | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);
     try {
        const auth = getFirebaseAuth();
        if(auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
            toast({
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your email address.",
            });
        }
     } catch (e: any) {
         console.error("Resend Verification Error:", e);
         setError("Failed to resend verification email. Please try again shortly.");
     } finally {
        setIsLoading(false);
     }
  }

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    if (!role || !email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        setError("Your email is not verified. Please check your inbox for the verification link.");
        setIsLoading(false);
        return;
      }
      
      router.push(roleDashboards[role]);
      
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/user-not-found') {
          setError("This user is not registered. Please register first, verify your account, and then log in.");
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        setError("An unexpected error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!role) {
      setError("Please select a role before signing in with Google.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    const auth = getFirebaseAuth();
    const db = getDb();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (role === 'patient') {
            const patientDocRef = doc(db, "ashwani", "data", "patients", user.uid);
            const docSnap = await getDoc(patientDocRef);

            if (!docSnap.exists()) {
                await setDoc(patientDocRef, {
                    name: user.displayName || "Google User",
                    email: user.email,
                    contact: user.phoneNumber || "",
                    age: 0,
                    sex: "Other",
                    address: "",
                });
                toast({ title: "Welcome!", description: "Your patient profile has been created." });
            }
             router.push(roleDashboards.patient);
        } else { // Staff, Admin, or Phlebo
            if (!user.email) {
                throw new Error("Could not retrieve email from Google account.");
            }

            const collectionName = role === 'phlebo' ? 'phlebos' : 'staff';
            const q = query(collection(db, `ashwani/data/${collectionName}`), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await auth.signOut(); // Sign out the user if they are not in the database
                throw new Error("Access Denied. This Google account is not registered as an authorized user for this role.");
            }

            const staffData = querySnapshot.docs[0].data() as Staff;
            const actualRole = role === 'phlebo' ? 'phlebo' : staffData.role;
             router.push(roleDashboards[actualRole]);
        }

    } catch (error: any) {
        console.error("Google Sign-In Error: ", error);
        let message = "An error occurred during Google Sign-In.";
        if (error.code === 'auth/popup-closed-by-user') {
            message = "Sign-in popup closed. Please try again.";
        } else {
            message = error.message;
        }
        setError(message);
    } finally {
        setIsLoading(false);
    }
  };


  const renderPatientLogin = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="email-patient">Email</Label>
            <Input id="email-patient" type="email" placeholder="your-email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password-patient">Password</Label>
            <Input id="password-patient" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
         <div className="flex justify-end">
          <Button variant="link" asChild className="p-0 h-auto text-sm">
            <Link href="/forgot-password">Forgot Password?</Link>
          </Button>
        </div>
        <Button onClick={handleLogin} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="animate-spin mr-2" />}
            Sign In
        </Button>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
        </div>
        <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon />}
            Sign in with Google
        </Button>
    </div>
  );

  const renderStaffLogin = () => (
     <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="email-staff">Email</Label>
            <Input id="email-staff" type="email" placeholder="your-email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password-staff">Password</Label>
            <Input id="password-staff" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="flex justify-end">
            <Button variant="link" asChild className="p-0 h-auto text-sm">
              <Link href="/forgot-password">Forgot Password?</Link>
            </Button>
        </div>
        <Button onClick={handleLogin} disabled={isLoading || !role || !email || !password} className="w-full">
            {isLoading && <Loader2 className="animate-spin" />}
            Sign In
        </Button>
         <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
        </div>
        <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || !role} className="w-full">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon />}
            Sign in with Google
        </Button>
    </div>
  );

  const onRoleChange = (newRole: Role) => {
    setRole(newRole);
    setEmail("");
    setPassword("");
    setError(null);
  }

  return (
    <>
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Please select your role to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("not verified") && (
                    <Button variant="link" onClick={handleResendVerification} className="p-0 h-auto ml-1">
                        Resend verification email.
                    </Button>
                )}
                </AlertDescription>
            </Alert>
          )}

            <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <Select onValueChange={(value) => onRoleChange(value as Role)} value={role}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="phlebo">Phlebotomist</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {role && <div className="pt-4 border-t" />}
            
            {role === 'patient' && renderPatientLogin()}
            {['staff', 'admin', 'phlebo'].includes(role) && renderStaffLogin()}
            
        </CardContent>
      </Card>
    </>
  );
}
