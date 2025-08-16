

import { collection, addDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';

export type ReportParameter = {
    name: string;
    value: string;
    unit: string;
    range: string;
};

export type ReportFormat = {
    id: string;
    testId: string;
    testName: string;
    parameters: Array<{
        name: string;
        unit: string;
        normalRange: string;
    }>;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  testId: string;
  testName: string;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Sample Collected' | 'Received' | 'In Process' | 'Reporting' | 'Report Uploaded' | 'Completed' | 'Cancelled';
  phleboId?: string | null;
  phleboName?: string | null;
  description?: string;
  address: string;
  totalCost?: number;
  createdAt: Timestamp;
  reportGeneratedAt?: string | Timestamp;
  feedbackSubmitted?: boolean;
  billGenerated?: boolean;
  notes?: string;
  reportUrl?: string; // URL to the PDF report in Firebase Storage
  reportDescription?: string; // Optional description added by staff
  // DEPRECATED: Old report data structure
  report?: string; 
  reportData?: {
    testId: string;
    testName: string;
    parameters: ReportParameter[];
  }[];
};

export type Patient = {
  id: string;
  uid: string;
  name: string;
  contact: string;
  address: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  email: string;
};

export type Phlebo = {
  id: string;
  uid: string;
  name: string;
  email: string;
  contact: string;
  hasTemporaryPassword?: boolean;
};

export type Staff = {
  id: string;
  uid: string;
  name: string;
  email: string;
  contact?: string;
  role: 'staff' | 'admin';
  hasTemporaryPassword?: boolean;
};

export type Test = {
  id: string;
  name: string;
  cost: number;
};

export type Bill = {
    id: string;
    appointmentId: string;
    patientId: string;
    patientName: string;
    billDate: string;
    amount: number;
    items: { name: string; price: number }[];
    status: 'Issued' | 'Paid';
}
