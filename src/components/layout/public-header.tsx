
"use client";

import Link from "next/link";
import { AppLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function PublicHeader() {

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
        <AppLogo className="h-8 w-8 text-primary" />
        <span className="font-bold">Ashwani Diagnostic Center</span>
      </Link>
      <div className="flex flex-1 items-center justify-end gap-4">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
      </div>
    </header>
  );
}
