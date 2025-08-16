
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from "next/image";

const templates = [
  {
    id: 'default_bill',
    name: 'Standard Invoice',
    description: 'A clean, standard invoice format suitable for all transactions.',
  },
  {
    id: 'detailed_bill',
    name: 'Detailed Receipt',
    description: 'Includes a line-item breakdown and payment summary.',
  },
];

const BillPreview = ({ templateId }: { templateId: string }) => {
    const baseClasses = "w-full h-full p-2 text-[5px] leading-tight flex flex-col bg-white text-black shadow-inner";
    const headerClasses = cn("p-1.5 mb-1", {
        "border-b-2 border-gray-700": templateId === 'default_bill',
        "bg-blue-600 text-white rounded-t-sm": templateId === 'detailed_bill',
    });
    const headerTextClasses = cn("font-bold text-lg", {
        "text-gray-800": templateId === 'default_bill',
        "text-white": templateId === 'detailed_bill',
    });
    const totalSectionClasses = cn("mt-auto pt-2 border-t-2", {
        "border-gray-700": templateId === 'default_bill',
        "border-blue-600": templateId === 'detailed_bill',
    });

    return (
        <div className={baseClasses}>
            {/* Header */}
            <div className={headerClasses}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <AppLogo className="h-4 w-4" />
                        <h2 className={headerTextClasses}>Ashwani Diagnostics</h2>
                    </div>
                     <h3 className="font-bold">INVOICE</h3>
                </div>
            </div>
             {/* Bill Info */}
            <div className="grid grid-cols-2 gap-x-2 text-[4px] py-2">
                <span><span className="font-bold">Bill To:</span> John Doe</span>
                <span><span className="font-bold">Invoice #:</span> INV-00123</span>
                <span><span className="font-bold">Address:</span> 123 Health St.</span>
                <span><span className="font-bold">Date:</span> 01/01/2024</span>
            </div>
            {/* Items Table */}
            <div className="border text-[4px] flex-grow">
                <div className="grid grid-cols-3 font-bold bg-gray-100 p-0.5 border-b">
                    <span className="col-span-2">Description</span>
                    <span className="text-right">Amount</span>
                </div>
                 <div className="grid grid-cols-3 p-0.5 border-b">
                    <span className="col-span-2">Complete Blood Count</span>
                    <span className="text-right">₹350.00</span>
                </div>
                 <div className="grid grid-cols-3 p-0.5 border-b">
                    <span className="col-span-2">Lipid Profile</span>
                    <span className="text-right">₹500.00</span>
                </div>
            </div>
             {/* Footer */}
            <div className={totalSectionClasses}>
                <div className="grid grid-cols-2 text-[5px]">
                    <div className="space-y-1">
                        <p>Thank you for your business!</p>
                        <Image data-ai-hint="qr code" src="https://placehold.co/20x20.png" width="20" height="20" alt="QR Code" />
                        <p className="font-bold text-[4px]">Scan to Pay</p>
                    </div>
                    <div className="text-right space-y-0.5">
                        <p><span className="font-bold">Subtotal:</span> ₹850.00</p>
                        <p><span className="font-bold">Tax (0%):</span> ₹0.00</p>
                        <p className="font-bold text-[6px]"><span className="font-bold">Total:</span> ₹850.00</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function BillTemplateManagement() {
  const [activeTemplate, setActiveTemplate] = useState('default_bill');
  const { toast } = useToast();

  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    toast({
      title: "Bill Template Selected",
      description: `The "${templates.find(t => t.id === templateId)?.name}" is now the active bill template.`,
    });
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Bill Formats</h1>
            <p className="text-muted-foreground">Choose the default template for all generated bills and invoices.</p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Dialog key={template.id}>
            <Card className={cn("flex flex-col transition-all", activeTemplate === template.id && "ring-2 ring-primary")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{template.name}</span>
                  {activeTemplate === template.id && (
                    <span className="flex items-center text-xs text-primary font-medium flex-shrink-0">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Active
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="h-10">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="relative group aspect-[1/1.414] bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    <BillPreview templateId={template.id} />
                     <DialogTrigger asChild>
                         <Button variant="ghost" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Eye className="h-8 w-8 text-white"/>
                         </Button>
                    </DialogTrigger>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <Button
                  onClick={() => handleSelectTemplate(template.id)}
                  disabled={activeTemplate === template.id}
                  className="w-full"
                >
                  {activeTemplate === template.id ? 'Currently Active' : 'Use this Template'}
                </Button>
              </CardFooter>
            </Card>
             <DialogContent className="max-w-4xl p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle>{template.name} - Preview</DialogTitle>
                </DialogHeader>
                <div className="my-4 overflow-hidden rounded-md border">
                    <div className="bg-white h-full w-full shadow-lg aspect-[1/1.414]">
                        <BillPreview templateId={template.id} />
                    </div>
                </div>
            </DialogContent>
           </Dialog>
        ))}
      </div>
    </div>
  );
}
