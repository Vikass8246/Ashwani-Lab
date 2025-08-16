
import { LoginForm } from "@/components/auth/login-form";
import { AppLogo } from "@/components/icons";
import { PublicHeader } from "@/components/layout/public-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
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
          Access Your Account
        </h1>
        <p className="text-muted-foreground text-center max-w-sm">
          Please select your role and login to continue.
        </p>
      </div>

      <div className="w-full max-w-sm mt-8">
        <LoginForm />
      </div>
       <div className="mt-4 text-center text-sm">
        New patient?{" "}
        <Button variant="link" asChild className="p-0 h-auto">
           <Link href="/register">
            Create an account
          </Link>
        </Button>
      </div>
    </main>
    </>
  );
}
