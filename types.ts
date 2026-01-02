
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  workingHours: string;
  rank: string;
}

export interface ServiceItem {
  id: string;
  type: 'Medicine' | 'Lab Test' | 'Surgery' | 'Room' | 'Consultation' | 'Other';
  name: string;
  cost: number;
  quantity: number; // or days
  date: string;
}

export interface Patient {
  id: string;
  name: string;
  disease: string;
  admitTime: string;
  admitDate: string;
  services?: ServiceItem[]; // Track all services taken
}

export interface Bed {
  id: string;
  ward: 'General' | 'ICU' | 'Private';
  number: string;
  isOccupied: boolean;
  patientName?: string;
  admitDate?: string;
  doctorName?: string;
}

export interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
  expiryDate: string;
  minStockThreshold: number;
}

export interface Message {
  id: string;
  sender: string;
  subject: string;
  time: string;
  read: boolean;
}

export interface Invoice {
  id: string;
  patientName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
  description?: string;
}

export type ViewState = 'dashboard' | 'doctors' | 'patients' | 'beds' | 'pharmacy' | 'inbox' | 'invoice' | 'calculator';

export interface User {
  username: string;
  role: 'admin' | 'staff';
}