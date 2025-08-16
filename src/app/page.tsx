
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestTube, HeartPulse, Droplet, Check } from "lucide-react";
import { HeroIllustration } from "@/components/illustrations/hero-illustration";
import { Testimonials } from "@/components/layout/testimonials";
import Image from "next/image";
import { InstallButton } from "@/components/pwa/install-button";


const features = [
    {
        icon: <TestTube className="h-8 w-8 text-primary" />,
        title: "Comprehensive Test Menu",
        description: "From routine blood work to specialized diagnostic tests, we offer a wide range of services."
    },
    {
        icon: <HeartPulse className="h-8 w-8 text-primary" />,
        title: "Accurate & Fast Results",
        description: "Our state-of-the-art lab ensures you get reliable results, delivered quickly."
    },
    {
        icon: <Droplet className="h-8 w-8 text-primary" />,
        title: "Convenient Home Collection",
        description: "Our certified phlebotomists collect samples from the comfort of your home."
    }
];

const benefits = [
  "Certified & Experienced Phlebotomists",
  "NABL Accredited Laboratory",
  "Online Report Access",
  "Affordable Pricing",
  "Hygienic & Safe Procedures",
  "Patient-Centric Approach"
];


export default function HomePage() {
  
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
               <HeroIllustration className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last" />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Reliable Diagnostics, Right at Your Doorstep
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Ashwani Diagnostic Center offers precise and timely medical testing with the convenience of home sample collection.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                     <Link href="/login">Book a Test</Link>
                  </Button>
                  <InstallButton />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="learn-more" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Services</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose Us?</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        We are committed to providing the highest quality diagnostic services with a focus on patient comfort and convenience.
                    </p>
                </div>
                <div className="mx-auto grid max-w-sm items-stretch gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
                    {features.map((feature) => (
                       <Card key={feature.title} className="shadow-md hover:shadow-lg transition-shadow text-center flex flex-col">
                          <CardHeader className="items-center">
                            {feature.icon}
                            <CardTitle>{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-muted-foreground">{feature.description}</p>
                          </CardContent>
                       </Card>
                    ))}
                </div>
            </div>
        </section>

        <Testimonials />

        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                        Ready to Take Control of Your Health?
                    </h2>
                    <p className="mx-auto max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Booking your test is simple and quick. Get started now.
                    </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-x-2">
                     <Button asChild size="lg" variant="secondary">
                        <Link href="/login">Book an Appointment</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2025 Ashwani Diagnostic Center. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
