
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "@/lib/firebase/config";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createNotification } from "@/app/actions/log-history";


export function RegistrationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"Male" | "Female" | "Other" | "">("");
  const [address, setAddress] = useState("");
  
  const allDetailsFilled = name && email && mobile && password && age && sex && address && password.length >= 6;


  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!allDetailsFilled) {
        setError("Please fill all details correctly. Password must be at least 6 characters.");
        setIsLoading(false);
        return;
    }

    try {
      const auth = getFirebaseAuth();
      const db = getDb();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      const userDocRef = doc(db, "ashwani", "data", "patients", user.uid);
      await setDoc(userDocRef, {
        name,
        email,
        contact: mobile,
        age: parseInt(age),
        sex,
        address,
      });

      await sendEmailVerification(user);
      
      await createNotification({
          title: 'New Patient Registered',
          message: `${name} has registered as a new patient.`,
          target: 'allStaff'
      })

      toast({
        title: "Account Created!",
        description: "A verification link has been sent to your email. Please verify to log in.",
        duration: 8000
      });

      router.push(`/login`);

    } catch (error: any) {
      console.error("Registration Error:", error);
      let errorMessage = "An unexpected error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use by another account.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. It must be at least 6 characters.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>
          Enter your details below to register.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 34" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <Select onValueChange={(value) => setSex(value as any)} value={sex}>
                      <SelectTrigger id="sex">
                          <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="e.g., 9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your-email@example.com" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your full address for sample collection" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password (min. 6 characters)" />
            </div>
             <Button onClick={handleRegister} disabled={isLoading || !allDetailsFilled} className="w-full">
              {isLoading && <Loader2 className="animate-spin" />}
              Create Account & Verify
            </Button>
          </div>
      </CardContent>
    </Card>
    </>
  );
}
