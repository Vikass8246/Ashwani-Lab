
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { Chatbot } from './chatbot';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

type ChatbotLauncherProps = {
  patientId: string;
};

export function ChatbotLauncher({ patientId }: ChatbotLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={cn(
        "fixed bottom-24 right-6 z-40 w-full max-w-md h-[60vh] rounded-lg shadow-xl transition-transform duration-300 ease-in-out",
        "origin-bottom-right",
        isOpen ? "scale-100" : "scale-0"
      )}>
        <Card className="h-full w-full overflow-hidden">
             <Chatbot patientId={patientId} />
        </Card>
      </div>

       <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50",
            "flex items-center justify-center transition-transform duration-300 ease-in-out",
            "hover:scale-110",
            isOpen && "bg-destructive hover:bg-destructive/90"
          )}
          size="icon"
        >
          {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
          <span className="sr-only">{isOpen ? 'Close Chatbot' : 'Open Chatbot'}</span>
        </Button>
    </>
  );
}
