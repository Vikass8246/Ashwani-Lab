
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

const templates = [
  {
    id: 'default',
    name: 'Default Template',
    description: 'A classic and professional report layout, easy to read.',
  },
  {
    id: 'modern',
    name: 'Modern Template',
    description: 'A clean, contemporary design with a focus on data visualization.',
  },
  {
    id: 'classic_blue',
    name: 'Classic Blue',
    description: 'A timeless design with a blue header, conveying trust.',
  },
];

const ReportPreview = ({ templateId }: { templateId: string }) => {
    const baseClasses = "w-full h-full p-2 text-[5px] leading-tight flex flex-col bg-white text-black shadow-inner";
    const headerClasses = cn("p-1.5 border-b-2 mb-1", {
        "border-gray-700": templateId === 'default',
        "border-cyan-600": templateId === 'modern',
        "border-blue-700": templateId === 'classic_blue',
    });
    const headerTextClasses = cn("font-bold text-lg", {
        "text-gray-800": templateId === 'default',
        "text-cyan-700": templateId === 'modern',
        "text-blue-800": templateId === 'classic_blue',
    });
     const sectionTitleClasses = cn("font-bold text-center text-white p-1 text-[6px] my-1", {
        "bg-gray-700": templateId === 'default',
        "bg-cyan-600": templateId === 'modern',
        "bg-blue-700": templateId === 'classic_blue',
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
                    <div className="text-right">
                        <p className="font-bold">Dr. Vishal Arora</p>
                        <p className="text-gray-600 text-[4px]">MBBS, MD (Pathology)</p>
                    </div>
                </div>
            </div>
            {/* Patient Info */}
            <div className="grid grid-cols-2 gap-x-2 text-[4px] border-b pb-1 mb-1">
                <span><span className="font-bold">Patient:</span> John Doe</span>
                <span><span className="font-bold">Collected:</span> 01/01/24</span>
                <span><span className="font-bold">Age/Sex:</span> 35/M</span>
                 <span><span className="font-bold">Reported:</span> 01/01/24</span>
            </div>
            {/* Report Title */}
            <div className={sectionTitleClasses}>COMPLETE BLOOD COUNT</div>
            {/* Results Table */}
            <div className="border text-[4px] flex-grow">
                <div className="grid grid-cols-4 font-bold bg-gray-100 p-0.5 border-b">
                    <span>Test</span><span>Result</span><span>Unit</span><span>Range</span>
                </div>
                 <div className="grid grid-cols-4 p-0.5 border-b">
                    <span>Hemoglobin</span><span>14.5</span><span>g/dL</span><span>13.5-17.5</span>
                </div>
                 <div className="grid grid-cols-4 p-0.5 border-b">
                    <span>WBC</span><span className="font-bold">12.2</span><span>x10^3/uL</span><span>4.0-11.0</span>
                </div>
                 <div className="grid grid-cols-4 p-0.5">
                    <span>Platelets</span><span>250</span><span>x10^3/uL</span><span>150-450</span>
                </div>
            </div>
             {/* Footer */}
            <div className="flex justify-between items-end text-[4px] mt-auto pt-1">
                 <Image data-ai-hint="qr code" src="https://placehold.co/20x20.png" width="20" height="20" alt="QR Code" />
                <div className="text-center">
                    <p className="italic font-serif text-[6px]">[Signature]</p>
                    <p className="font-bold">Dr. Vishal Arora</p>
                    <p>MBBS, MD (Pathology)</p>
                </div>
                 <Image data-ai-hint="barcode" src="https://placehold.co/40x10.png" width="40" height="10" alt="Barcode" />
            </div>
        </div>
    );
};

export function ReportTemplateManagement() {
  const [activeTemplate, setActiveTemplate] = useState('default');
  const { toast } = useToast();

  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    toast({
      title: "Template Selected",
      description: `The "${templates.find(t => t.id === templateId)?.name}" is now the active report template.`,
    });
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Report Templates</h1>
            <p className="text-muted-foreground">Choose the default template for all generated test reports.</p>
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
                    <ReportPreview templateId={template.id} />
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
                        <ReportPreview templateId={template.id} />
                    </div>
                </div>
            </DialogContent>
           </Dialog>
        ))}
      </div>
    </div>
  );
}
