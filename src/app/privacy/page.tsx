
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl font-bold tracking-tight text-primary">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">Last updated: July 29, 2024</p>

            <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>

            <h2 className="text-2xl font-semibold mt-8">Interpretation and Definitions</h2>
            <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>

            <h2 className="text-2xl font-semibold mt-8">Collecting and Using Your Personal Data</h2>
            <h3 className="text-xl font-semibold mt-4">Types of Data Collected</h3>
            <h4 className="text-lg font-semibold mt-2">Personal Data</h4>
            <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:</p>
            <ul>
              <li>Email address</li>
              <li>First name and last name</li>
              <li>Phone number</li>
              <li>Address, State, Province, ZIP/Postal code, City</li>
              <li>Age and Sex</li>
              <li>Health information related to diagnostic tests</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Use of Your Personal Data</h3>
            <p>The Company may use Personal Data for the following purposes:</p>
            <ul>
              <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
              <li>To manage Your Account: to manage Your registration as a user of the Service.</li>
              <li>For the performance of a contract: the development, compliance and undertaking of the purchase contract for the services You have purchased.</li>
              <li>To contact You: To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8">Security of Your Personal Data</h2>
            <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>

            <h2 className="text-2xl font-semibold mt-8">Changes to this Privacy Policy</h2>
            <p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.</p>

            <h2 className="text-2xl font-semibold mt-8">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, You can contact us.</p>
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
