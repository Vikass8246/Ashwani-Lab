
"use client";

import { useMemo } from 'react';
import { AppLogo } from '@/components/icons';
import { type Appointment, type Patient } from '@/lib/data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper function to check if a value is outside its normal range
const isValueOutOfRange = (value: string, range: string) => {
    if (!value || !range) return false;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    if (range.includes('-')) {
        const [min, max] = range.split('-').map(parseFloat);
        if (!isNaN(min) && !isNaN(max)) {
            return numValue < min || numValue > max;
        }
    }
    if (range.startsWith('>')) {
        const limit = parseFloat(range.substring(1));
        return numValue <= limit;
    }
    if (range.startsWith('<')) {
        const limit = parseFloat(range.substring(1));
        return numValue >= limit;
    }
    return false;
};

// Report Template Component
export const ReportPage = ({ appointment, patient, reportData }: { appointment: Appointment, patient: Patient | null, reportData: Appointment['reportData'] }) => {
    
    return (
        <div className="report-page bg-white text-black font-sans" style={{ width: '210mm', minHeight: '297mm', padding: '10mm', fontFamily: 'Arial, sans-serif' }}>
            <div className="flex flex-col h-full text-[10pt]" style={{minHeight: '277mm'}}>
                <header className="flex justify-between items-center pb-2 border-b-2 border-black">
                    <div className="flex items-center gap-3">
                        <img src="https://placehold.co/64x64.png" width={64} height={64} alt="App Logo" className="unoptimized" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Ashwani Diagnostic Center</h1>
                            <p className="text-xs">123 Health St, Wellness City, 12345</p>
                        </div>
                    </div>
                    <div className="text-right text-xs">
                        <p className="font-bold">Dr. S.K. Singh (M.B.B.S, MD)</p>
                        <p>Senior Consultant Pathologist</p>
                    </div>
                </header>

                <section className="mt-4 border-t border-b border-gray-300 py-2">
                    <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
                        <strong>Name:</strong><span>{appointment.patientName}</span>
                        <strong>Patient ID:</strong><span>{patient?.id?.substring(0, 8).toUpperCase()}</span>
                        <strong>Age/Gender:</strong><span>{patient?.age} Years / {patient?.sex}</span>
                        <strong>Report ID:</strong><span>{appointment?.id?.substring(0, 6).toUpperCase()}</span>
                        <strong>Referred By:</strong><span>Self</span>
                        <strong>Collection Date:</strong><span>{format(new Date(appointment.date), "dd/MM/yyyy hh:mm a")}</span>
                        <strong>Phone No:</strong><span>{patient?.contact}</span>
                        <strong>Report Date:</strong><span>{format(new Date(), "dd/MM/yyyy hh:mm a")}</span>
                    </div>
                </section>

                <section className="flex-grow mt-4">
                    {reportData?.map((testReport, testIndex) => (
                        <div key={testIndex} className="mb-4 break-inside-avoid">
                             <div className="text-center font-bold my-2 bg-gray-200 p-1">
                                <h3 className="uppercase underline text-sm">{testReport.testName}</h3>
                             </div>
                            <div className="border-2 border-gray-400">
                                <div className="grid grid-cols-12 gap-x-2 font-bold border-b-2 border-gray-400 p-1 bg-gray-100 text-xs">
                                    <div className="col-span-5">Test Description</div>
                                    <div className="col-span-2 text-center">Result</div>
                                    <div className="col-span-1 text-center">Flag</div>
                                    <div className="col-span-2 text-center">Ref. Range</div>
                                    <div className="col-span-2 text-center">Unit</div>
                                </div>
                                <div className="divide-y divide-gray-300 text-xs">
                                {testReport.parameters.map((param, index) => {
                                    const outOfRange = isValueOutOfRange(param.value, param.range);
                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-x-2 p-1 items-center">
                                            <div className="col-span-5 font-semibold text-gray-800">{param.name}</div>
                                            <div className={cn("col-span-2 text-center font-bold", outOfRange && "text-red-600")}>{param.value}</div>
                                            <div className={cn("col-span-1 text-center font-bold text-red-600")}>{outOfRange ? (parseFloat(param.value) > parseFloat(param.range.split('-')[1] || '0') ? 'H' : 'L') : ""}</div>
                                            <div className="col-span-2 text-center">{param.range}</div>
                                            <div className="col-span-2 text-center">{param.unit}</div>
                                        </div>
                                    )
                                })}
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
                
                <footer className="flex justify-between items-end pt-8 mt-auto border-t-2 border-black">
                    <div className="text-center">
                         <img src="https://placehold.co/60x60.png" width={60} height={60} alt="QR Code" className="unoptimized" />
                        <p className="text-xs">Scan for Online Report</p>
                    </div>
                    <div className="text-center">
                        <img src="https://placehold.co/120x50.png" width={120} height={50} alt="Signature" className="unoptimized"/>
                        <p className="font-bold text-sm border-t border-gray-400 mt-1">Dr. Vishal Arora</p>
                    </div>
                    <div className="text-center">
                        <img src="https://placehold.co/150x40.png" width="150" height="40" alt="Barcode" className="unoptimized"/>
                    </div>
                </footer>
            </div>
        </div>
    );
};


// Bill Template Component
export const BillPage = ({ appointment, patient }: { appointment: Appointment, patient: Patient | null }) => {
    return (
        <div className="bill-page bg-white text-black font-sans" style={{ width: '210mm', minHeight: '297mm', padding: '10mm', fontFamily: 'Arial, sans-serif' }}>
            <div className="border p-6 h-full flex flex-col" style={{minHeight: '277mm'}}>
                <header className="flex justify-between items-start pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Ashwani Diagnostic Center</h2>
                        <p className="text-xs text-gray-500">Your Health, Our Priority</p>
                        <p className="text-xs text-gray-500">123 Health St, Wellness City</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xl font-semibold">INVOICE</h3>
                        <p className="text-xs">ID: #{appointment.id.substring(0, 7)}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-4 py-4">
                    <div>
                        <p className="text-xs font-bold text-gray-500">BILLED TO</p>
                        <p className="font-semibold">{patient?.name}</p>
                        <p className="text-sm">{patient?.address}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-500">DATE OF ISSUE</p>
                        <p>{format(new Date(), "dd MMM, yyyy")}</p>
                    </div>
                </section>

                <section className="flex-grow">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left font-semibold">SERVICE</th>
                                <th className="p-2 text-right font-semibold">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2">{appointment.testName}</td>
                                <td className="p-2 text-right">₹{appointment.totalCost?.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="p-2 text-right font-bold">Total</td>
                                <td className="p-2 text-right font-bold">₹{appointment.totalCost?.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                
                <footer className="mt-auto pt-4 border-t text-center text-xs text-gray-500">
                    <p>Thank you for choosing Ashwani Diagnostic Center!</p>
                </footer>
            </div>
        </div>
    );
};
