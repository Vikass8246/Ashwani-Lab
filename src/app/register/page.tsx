
import { RegistrationForm } from "@/components/auth/registration-form";
import { AppLogo } from "@/components/icons";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background p-8 relative">
        <Button variant="outline" size="icon" asChild className="absolute top-4 left-4 sm:top-8 sm:left-8">
            <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Home</span>
            </Link>
        </Button>
        <div className="flex flex-col items-center space-y-4">
          <AppLogo className="h-16 w-16 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-center font-headline">
            Create a Patient Account
          </h1>
          <p className="text-muted-foreground text-center max-w-sm">
            Let's get you set up to book appointments.
          </p>
        </div>

        <div className="w-full max-w-sm mt-8">
          <RegistrationForm />
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/login">
              Login here
            </Link>
          </Button>
      </div>
      </main>
    </>
  );
}
