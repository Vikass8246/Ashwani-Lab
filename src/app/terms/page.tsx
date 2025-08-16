
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1 bg-background">
        <div className="container mx-auto py-12 md:py-16 px-4 md:px-6 relative">
           <Button variant="outline" asChild className="absolute top-8 left-8 hidden md:inline-flex">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          <article className="prose prose-gray max-w-4xl mx-auto dark:prose-invert">
            <h1 className="text-4xl font-bold tracking-tight text-primary">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">Last updated: July 29, 2024</p>
            
            <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Ashwani Diagnostic Center website and services (the "Service") operated by Ashwani Diagnostic Center ("us", "we", or "our").</p>

            <h2 className="text-2xl font-semibold mt-8">1. Conditions of Use</h2>
            <p>We will provide their services to you, which are subject to the conditions stated below in this document. Every time you visit this website or use its services, you accept the following conditions. This is why we urge you to read them carefully.</p>

            <h2 className="text-2xl font-semibold mt-8">2. Privacy Policy</h2>
            <p>Before you continue using our website, we advise you to read our privacy policy regarding our user data collection. It will help you better understand our practices.</p>

            <h2 className="text-2xl font-semibold mt-8">3. Medical Disclaimer</h2>
            <p>The information provided on this Service is for informational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>

            <h2 className="text-2xl font-semibold mt-8">4. Service Availability</h2>
            <p>Our services, including home sample collection, are available only in designated service areas. We reserve the right to refuse service to anyone for any reason at any time.</p>
            
            <h2 className="text-2xl font-semibold mt-8">5. User Account</h2>
            <p>If you are an owner of an account on this website, you are solely responsible for maintaining the confidentiality of your private user details (username and password). You are responsible for all activities that occur under your account or password.</p>

            <h2 className="text-2xl font-semibold mt-8">6. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>

            <h2 className="text-2xl font-semibold mt-8">7. Changes to Service</h2>
            <p>We reserve the right to withdraw or amend our Service, and any service or material we provide via the Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of the Service is unavailable at any time or for any period.</p>
            
            <h2 className="text-2xl font-semibold mt-8">Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us.</p>
          </article>
        </div>
      </main>
       <footer className="border-t py-6">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            &copy; 2025 Ashwani Diagnostic Center. All rights reserved.
          </div>
        </footer>
    </div>
  );
}
