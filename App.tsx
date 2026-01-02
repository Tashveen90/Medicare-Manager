import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  UserPlus, 
  Activity, 
  LogOut, 
  LayoutDashboard, 
  Stethoscope, 
  Trash2, 
  Edit2, 
  Plus, 
  Search,
  X,
  Check,
  Clock,
  Calendar,
  Home,
  Bed as BedIcon,
  Pill,
  Mail,
  FileText,
  Lock,
  Bell,
  Menu,
  Construction,
  AlertCircle,
  Printer,
  CheckCircle,
  Filter,
  Moon,
  Sun,
  Sparkles,
  MessageSquare,
  DollarSign,
  Bot,
  Microscope,
  ClipboardList,
  Heart,
  Brain,
  Baby,
  Scissors,
  Star,
  Shield,
  Briefcase,
  Calculator,
  ChevronRight,
  MoreHorizontal,
  Save,
  Delete,
  RefreshCw,
  FilePlus,
  Receipt,
  History
} from 'lucide-react';
import { Doctor, Patient, ViewState, User, Bed, Medicine, Message, Invoice, ServiceItem } from './types';

// --- MOCK DATABASE ---
const STORAGE_KEYS = {
  DOCTORS: 'medicare_doctors',
  PATIENTS: 'medicare_patients',
  BEDS: 'medicare_beds',
  MEDICINES: 'medicare_medicines',
  MESSAGES: 'medicare_messages',
  INVOICES: 'medicare_invoices',
  USER: 'medicare_user',
  THEME: 'medicare_theme'
};

const INITIAL_DOCTORS: Doctor[] = [
  { id: 'CD001', name: 'Dr. Sarah Smith', specialization: 'Cardiology', workingHours: '09:00 - 17:00', rank: 'Senior Consultant' },
  { id: 'NL002', name: 'Dr. John Doe', specialization: 'Neurology', workingHours: '10:00 - 18:00', rank: 'Specialist' },
  { id: 'PD003', name: 'Dr. Emily Chen', specialization: 'Pediatrics', workingHours: '08:00 - 16:00', rank: 'Junior Resident' },
  { id: 'GP004', name: 'Dr. Alan Grant', specialization: 'General', workingHours: '09:00 - 21:00', rank: 'Senior Consultant' },
];

const INITIAL_PATIENTS: Patient[] = [
  { 
    id: 'P001', 
    name: 'James Wilson', 
    disease: 'Hypertension', 
    admitDate: '2023-10-24', 
    admitTime: '10:30',
    services: [
      { id: 'S1', type: 'Room', name: 'General Ward Charge', cost: 500, quantity: 2, date: '2023-10-24' },
      { id: 'S2', type: 'Consultation', name: 'Dr. Sarah Smith', cost: 1500, quantity: 1, date: '2023-10-24' }
    ]
  },
  { 
    id: 'P002', 
    name: 'Linda Taylor', 
    disease: 'Flu', 
    admitDate: '2023-10-25', 
    admitTime: '14:15',
    services: []
  },
];

const INITIAL_BEDS: Bed[] = [
  { id: 'B101', ward: 'General', number: '101', isOccupied: true, patientName: 'James Wilson', admitDate: '2023-10-24', doctorName: 'Dr. Sarah Smith' },
  { id: 'B102', ward: 'General', number: '102', isOccupied: false },
  { id: 'B103', ward: 'General', number: '103', isOccupied: false },
  { id: 'B104', ward: 'ICU', number: '201', isOccupied: false },
];

const INITIAL_MEDICINES: Medicine[] = [
  { id: 'M001', name: 'Paracetamol 500mg', stock: 150, price: 50.00, expiryDate: '2025-12-31', minStockThreshold: 20 },
  { id: 'M002', name: 'Amoxicillin 250mg', stock: 45, price: 125.50, expiryDate: '2024-06-20', minStockThreshold: 50 },
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'MSG1', sender: 'Dr. Sarah Smith', subject: 'Patient Consult Request', time: '10:30 AM', read: false },
];

const INITIAL_INVOICES: Invoice[] = [
  { id: 'INV001', patientName: 'James Wilson', amount: 2500.00, date: '2023-10-26', status: 'Pending', description: 'Partial Settlement' },
];

// --- COMPONENTS ---

// Enhanced Modal with better backdrop and animation
const Modal = ({ title, isOpen, onClose, children, size = 'md' }: { title: string, isOpen: boolean, onClose: () => void, children?: React.ReactNode, size?: 'md'|'lg'|'xl' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-10">
          <h3 className="text-slate-800 dark:text-white font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- GENERIC AI ASSISTANT ---
const AIAssistant = ({ type, data }: { type: 'Doctors' | 'Medicines', data: any[] }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
      const systemInstruction = `You are a helpful AI assistant for a hospital management system. Data: ${type}. Concise answers only.`;
      const prompt = `Data: ${JSON.stringify(data)}\nQuestion: ${query}`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction }
      });
      setResponse(result.text || 'No response.');
    } catch (error) {
      console.error(error);
      setResponse("AI Service Unavailable. Please check API Key.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="mb-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group font-medium">
      <Sparkles size={18} className="group-hover:animate-pulse" /><span>Ask AI about {type}</span>
    </button>
  );

  return (
    <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2"><Sparkles size={18} /> AI Assistant</h3>
        <button onClick={() => setIsOpen(false)}><X size={18} className="text-slate-400 hover:text-slate-600" /></button>
      </div>
      <form onSubmit={handleAsk} className="flex gap-2 mb-4">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Ask about ${type}...`} className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 transition-colors">{loading ? '...' : <MessageSquare size={20} />}</button>
      </form>
      {response && <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 text-sm dark:text-gray-200 text-slate-700 leading-relaxed">{response}</div>}
    </div>
  );
};

// --- LOGIN MODULE ---
const LoginScreen = ({ onLogin, darkMode, toggleTheme }: { onLogin: (u: User) => void, darkMode: boolean, toggleTheme: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password === 'admin') onLogin({ username: 'admin', role: 'admin' });
    else setError('Invalid credentials.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
      <button 
        onClick={toggleTheme} 
        className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-50"
        title="Toggle Dark Mode"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Activity className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">MediCare Enterprise</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Secure Hospital Management Portal</p>
          <div className="mt-4 px-3 py-1 bg-slate-100 dark:bg-slate-700 inline-block rounded-full text-xs text-slate-500 font-mono">Demo: admin / admin</div>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 text-sm text-center p-2 rounded-lg border border-red-100">{error}</div>}
          <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
             <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
             <input type="password" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95">Sign In</button>
        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const StatCard = ({ title, count, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
       <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
       <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{count}</h3>
       <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded w-fit">
          <Activity size={12} /> {trend || '+2.5%'} this week
       </div>
    </div>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
       <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
    </div>
  </div>
);

const Dashboard = ({ doctors, patients }: any) => (
  <div className="p-8 max-w-7xl mx-auto">
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
      <p className="text-slate-500 dark:text-slate-400">Welcome back, Administrator.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Total Patients" count={patients.length} icon={Users} colorClass="bg-blue-500 text-blue-600" />
      <StatCard title="Active Doctors" count={doctors.length} icon={Stethoscope} colorClass="bg-emerald-500 text-emerald-600" />
      <StatCard title="New Admissions" count={patients.filter((p: any) => p.admitDate === new Date().toLocaleDateString('en-CA')).length} icon={UserPlus} colorClass="bg-amber-500 text-amber-600" />
    </div>
  </div>
);

// --- DOCTOR MODULE ---
const DoctorModule = ({ doctors, beds, onAdd, onEdit, onDelete }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Doctor>({ 
    id: '', 
    name: '', 
    specialization: '', 
    workingHours: '09:00 - 17:00',
    rank: 'Specialist' 
  });
  const [formError, setFormError] = useState('');
  
  // AI Availability State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const SPECIALIZATIONS: any = { 
    'General': { code: 'GP', icon: Stethoscope }, 
    'Cardiology': { code: 'CD', icon: Heart }, 
    'Neurology': { code: 'NL', icon: Brain }, 
    'Pediatrics': { code: 'PD', icon: Baby }, 
    'Surgery': { code: 'SG', icon: Scissors } 
  };

  const RANKS = ['Senior Consultant', 'Specialist', 'Junior Resident', 'Trainee/Intern'];

  const getSpecIcon = (spec: string) => {
    const SpecIcon = SPECIALIZATIONS[spec]?.icon || Stethoscope;
    return <SpecIcon size={16} />;
  };

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case 'Senior Consultant': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'Specialist': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Junior Resident': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const handleSpecChange = (spec: string) => {
    const code = SPECIALIZATIONS[spec]?.code || 'DR';
    let uniqueId = '';
    let isUnique = false;
    let attempts = 0;

    // Try to find a unique ID
    while (!isUnique && attempts < 50) {
      const randomNum = Math.floor(100 + Math.random() * 900); // 100-999
      const candidate = `${code}${randomNum}`;
      if (!doctors.some((d: Doctor) => d.id === candidate)) {
        uniqueId = candidate;
        isUnique = true;
      }
      attempts++;
    }

    // Fallback if random generation fails after 50 attempts (unlikely for this scale)
    if (!uniqueId) {
       uniqueId = `${code}${Date.now().toString().slice(-3)}`;
    }

    setFormData({ 
      ...formData, 
      specialization: spec, 
      id: spec ? uniqueId : '' 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Client-side Validation
    if (!formData.name || !formData.specialization) {
      setFormError('Name and Specialization are required.');
      return;
    }

    // Validate ID format (Prefix + 3 Digits)
    const code = SPECIALIZATIONS[formData.specialization]?.code;
    const idRegex = new RegExp(`^${code}\\d{3}$`);
    if (!idRegex.test(formData.id)) {
        setFormError(`Invalid ID format. Must be ${code} followed by 3 digits (e.g., ${code}123).`);
        return;
    }

    // Check uniqueness (double check)
    if (doctors.some(d => d.id === formData.id)) {
        setFormError('ID collision detected. Please re-select specialization to generate a new ID.');
        return;
    }

    onAdd(formData);
    setIsModalOpen(false);
  };

  const checkAvailability = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const busyDoctors = beds
        .filter((b: Bed) => b.isOccupied && b.doctorName)
        .map((b: Bed) => ({ name: b.doctorName, location: `Ward ${b.ward} Bed ${b.number}` }));
      const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const systemInstruction = "You are a smart hospital receptionist. Concise answers only.";
      const prompt = `Current Time: ${currentTime}. Doctors: ${JSON.stringify(doctors)}. Busy: ${JSON.stringify(busyDoctors)}. User asked: "${aiQuery}". Check availability based on hours and active patients.`;
      
      const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { systemInstruction } });
      setAiResult(result.text || "No info.");
    } catch (e) {
      console.error(e);
      setAiResult("Service unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Staff</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage doctor profiles and schedules.</p>
        </div>
        <button onClick={() => { 
          setFormData({id:'',name:'',specialization:'', workingHours: '09:00 - 17:00', rank: 'Specialist'}); 
          setFormError('');
          setIsModalOpen(true); 
        }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center shadow-sm transition-all"><Plus size={18} /> Add Doctor</button>
      </div>

      {/* AI Availability Checker */}
      <div className="mb-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <input 
            type="text" 
            value={aiQuery} 
            onChange={(e) => setAiQuery(e.target.value)} 
            placeholder="Check doctor availability (e.g., Is Dr. Smith available now?)" 
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && checkAvailability()}
          />
          <button 
            onClick={checkAvailability} 
            disabled={aiLoading}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {aiLoading ? <span className="animate-spin">⌛</span> : <Search size={18} />} Check
          </button>
        </div>
        {aiResult && (
          <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <Bot size={16} className="mt-0.5 text-blue-600" />
            <p>{aiResult}</p>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {doctors.map((d: Doctor) => (
          <div key={d.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center group hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="flex items-center gap-5">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${
                   d.specialization === 'Cardiology' ? 'bg-red-50 text-red-600' :
                   d.specialization === 'Neurology' ? 'bg-purple-50 text-purple-600' :
                   'bg-blue-50 text-blue-600'
               }`}>
                   {getSpecIcon(d.specialization)}
               </div>
               <div>
                  <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">{d.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${getRankBadgeColor(d.rank)}`}>
                         {d.rank}
                      </span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3">
                     <span className="font-medium">{d.specialization}</span>
                     <span className="text-slate-300">•</span>
                     <span className="font-mono text-xs text-slate-400">ID: {d.id}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                     <Clock size={14} /> {d.workingHours}
                  </div>
               </div>
            </div>
            <button onClick={() => onDelete(d.id)} className="text-slate-400 hover:text-rose-600 p-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
      
      <Modal title="Add Physician" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && <div className="p-3 bg-rose-100 text-rose-700 text-sm rounded-lg border border-rose-200">{formError}</div>}
          
          <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <input className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dr. Sarah Smith" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Specialization</label>
                <select className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => handleSpecChange(e.target.value)} required>
                    <option value="">Select Spec</option>
                    {Object.keys(SPECIALIZATIONS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rank</label>
                <select className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} required>
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Working Hours</label>
             <input className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 09:00 - 17:00" value={formData.workingHours} onChange={e => setFormData({...formData, workingHours: e.target.value})} required />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Doctor ID (Auto-Generated)</label>
             <input disabled className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed" value={formData.id} placeholder="Select Specialization to generate ID" />
          </div>

          <div className="pt-2">
            <button className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">Save Physician Profile</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- PATIENT MODULE ---
const PatientModule = ({ patients, onAdmit, onEdit, onDischarge }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Patient>({ id: '', name: '', disease: '', admitDate: '', admitTime: '', services: [] });
  
  // Search and History State
  const [searchTerm, setSearchTerm] = useState('');
  const [historyView, setHistoryView] = useState<{open: boolean, patient: Patient | null}>({open: false, patient: null});

  // State for new service entry
  const [newService, setNewService] = useState<ServiceItem>({
    id: '', type: 'Medicine', name: '', cost: 0, quantity: 1, date: new Date().toLocaleDateString('en-CA')
  });

  const DISEASES = ['Fever', 'Flu', 'Hypertension', 'Diabetes', 'Injury', 'Malaria', 'Typhoid', 'Dengue', 'Covid-19', 'Other'];
  const SERVICE_TYPES = ['Medicine', 'Lab Test', 'Surgery', 'Room', 'Consultation', 'Other'];

  useEffect(() => {
    if (editingPatient) {
      setFormData(editingPatient);
      setIsModalOpen(true);
    } else {
      const now = new Date();
      setFormData({ 
        id: '', name: '', disease: '', 
        admitDate: now.toLocaleDateString('en-CA'), 
        admitTime: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        services: []
      });
    }
  }, [editingPatient, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) onEdit(formData);
    else onAdmit({ ...formData, id: `P${Date.now().toString().slice(-6)}` });
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleAddService = () => {
    if (!newService.name || newService.cost <= 0) return;
    const item: ServiceItem = { ...newService, id: `S${Date.now()}` };
    setFormData(prev => ({
      ...prev,
      services: [...(prev.services || []), item]
    }));
    setNewService({ id: '', type: 'Medicine', name: '', cost: 0, quantity: 1, date: new Date().toLocaleDateString('en-CA') });
  };

  const handleRemoveService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.filter(s => s.id !== serviceId) || []
    }));
  };

  const calculateTotal = () => {
    return formData.services?.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0) || 0;
  };

  const filteredPatients = patients.filter((p: Patient) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Patients</h2>
          <p className="text-slate-500 dark:text-slate-400">Current active admissions & treatments.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                  className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm" 
                  placeholder="Search patients..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
              />
          </div>
          <button onClick={() => { setEditingPatient(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center shadow-sm transition-all"><UserPlus size={18} /> New Admission</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="p-5 border-b border-slate-200 dark:border-slate-700">Patient</th>
                <th className="p-5 border-b border-slate-200 dark:border-slate-700">Diagnosis</th>
                <th className="p-5 border-b border-slate-200 dark:border-slate-700">Admitted</th>
                <th className="p-5 border-b border-slate-200 dark:border-slate-700">Current Bill</th>
                <th className="p-5 border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {filteredPatients.map((p: Patient) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                     <td className="p-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {p.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{p.id}</p>
                           </div>
                        </div>
                     </td>
                     <td className="p-5">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                           {p.disease}
                        </span>
                     </td>
                     <td className="p-5 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex flex-col">
                           <span>{p.admitDate}</span>
                           <span className="text-xs text-slate-400">{p.admitTime}</span>
                        </div>
                     </td>
                     <td className="p-5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        ₹{p.services?.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0).toFixed(2) || '0.00'}
                     </td>
                     <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setHistoryView({open: true, patient: p})} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View History"><History size={16} /></button>
                           <button onClick={() => setEditingPatient(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit & Add Services"><Edit2 size={16} /></button>
                           <button onClick={() => onDischarge(p.id)} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-rose-300 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-lg transition-colors shadow-sm">Discharge</button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         {filteredPatients.length === 0 && <div className="p-8 text-center text-slate-500">No active patients found.</div>}
      </div>

      <Modal title={editingPatient ? "Edit Patient & Clinical Services" : "Admit Patient"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Personal Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <input className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Diagnosis</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.disease} onChange={e => setFormData({...formData, disease: e.target.value})} required>
                        <option value="">Select Disease</option>
                        {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Admit Date</label>
                      <input type="date" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.admitDate} onChange={e => setFormData({...formData, admitDate: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Admit Time</label>
                      <input type="time" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.admitTime} onChange={e => setFormData({...formData, admitTime: e.target.value})} required />
                    </div>
                  </div>
              </div>

              {/* Service Addition */}
              <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Add Clinical Service</h4>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
                     <div className="grid grid-cols-2 gap-3">
                        <select className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm outline-none" value={newService.type} onChange={e => setNewService({...newService, type: e.target.value as any})}>
                            {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm outline-none" placeholder="Item Name / Description" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                     </div>
                     <div className="grid grid-cols-3 gap-3">
                        <div className="relative col-span-1">
                             <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                             <input type="number" className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm outline-none" placeholder="Cost" value={newService.cost || ''} onChange={e => setNewService({...newService, cost: Number(e.target.value)})} />
                        </div>
                        <input type="number" className="col-span-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm outline-none" placeholder="Qty" value={newService.quantity} onChange={e => setNewService({...newService, quantity: Number(e.target.value)})} />
                        <button type="button" onClick={handleAddService} className="col-span-1 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">Add</button>
                     </div>
                  </div>
              </div>
          </div>

          {/* Service List */}
          <div>
              <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex justify-between">
                <span>Services Used</span>
                <span className="text-blue-600">Total: ₹{calculateTotal().toFixed(2)}</span>
              </h4>
              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 text-xs uppercase text-slate-500">
                          <tr>
                              <th className="p-3">Type</th>
                              <th className="p-3">Description</th>
                              <th className="p-3 text-right">Cost</th>
                              <th className="p-3 text-right">Qty</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {formData.services?.map(s => (
                              <tr key={s.id}>
                                  <td className="p-3 text-slate-500">{s.type}</td>
                                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                                  <td className="p-3 text-right">₹{s.cost}</td>
                                  <td className="p-3 text-right">{s.quantity}</td>
                                  <td className="p-3 text-right font-semibold">₹{s.cost * s.quantity}</td>
                                  <td className="p-3 text-right">
                                      <button type="button" onClick={() => handleRemoveService(s.id)} className="text-rose-500 hover:text-rose-700"><Trash2 size={14}/></button>
                                  </td>
                              </tr>
                          ))}
                          {(!formData.services || formData.services.length === 0) && (
                              <tr><td colSpan={6} className="p-4 text-center text-slate-400">No services added yet.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition-all transform active:scale-[0.99]">
             {editingPatient ? 'Save Patient & Services' : 'Admit Patient'}
          </button>
        </form>
      </Modal>

      <Modal title="Patient History" isOpen={historyView.open} onClose={() => setHistoryView({open: false, patient: null})} size="lg">
        {historyView.patient && (
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{historyView.patient.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">ID: {historyView.patient.id}</p>
                    </div>
                    <div className="text-right">
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold inline-block mb-1">{historyView.patient.disease}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Admitted: {historyView.patient.admitDate}</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><ClipboardList size={18}/> Service History</h4>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                             <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Service</th>
                                    <th className="p-3 text-right">Cost</th>
                                    <th className="p-3 text-right">Qty</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {historyView.patient.services?.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 text-slate-500">{s.date}</td>
                                        <td className="p-3">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">{s.name}</div>
                                            <div className="text-xs text-slate-500">{s.type}</div>
                                        </td>
                                        <td className="p-3 text-right">₹{s.cost}</td>
                                        <td className="p-3 text-right">{s.quantity}</td>
                                        <td className="p-3 text-right font-semibold">₹{s.cost * s.quantity}</td>
                                    </tr>
                                ))}
                                {(!historyView.patient.services || historyView.patient.services.length === 0) && (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-400">No history available.</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-semibold border-t border-slate-200 dark:border-slate-700">
                                 <tr>
                                    <td colSpan={4} className="p-3 text-right text-slate-600 dark:text-slate-400">Grand Total</td>
                                    <td className="p-3 text-right text-blue-600 dark:text-blue-400">
                                        ₹{historyView.patient.services?.reduce((acc, s) => acc + (s.cost * s.quantity), 0).toFixed(2) || '0.00'}
                                    </td>
                                 </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                 <div className="flex justify-end">
                    <button onClick={() => setHistoryView({open: false, patient: null})} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Close</button>
                 </div>
            </div>
        )}
      </Modal>
    </div>
  )
}

// --- BED MODULE ---
const BedModule = ({ beds, patients, doctors, onUpdate }: any) => {
  const [selected, setSelected] = useState<Bed|null>(null);
  const [patName, setPatName] = useState('');
  const [docName, setDocName] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBedData, setNewBedData] = useState<{ward: 'General'|'ICU'|'Private', number: string}>({ ward: 'General', number: '' });
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Logic to filter and recommend doctors remains same...
  const DISEASE_TO_SPEC: Record<string, string> = { 'Hypertension': 'Cardiology', 'Heart Attack': 'Cardiology', 'Chest Pain': 'Cardiology', 'Stroke': 'Neurology', 'Migraine': 'Neurology', 'Seizure': 'Neurology', 'Flu': 'General', 'Fever': 'General', 'Diabetes': 'General', 'Malaria': 'General', 'Typhoid': 'General', 'Dengue': 'General', 'Covid-19': 'General', 'Injury': 'Surgery', 'Fracture': 'Surgery', 'Burn': 'Surgery', 'Skin Rash': 'General', 'Stomach Pain': 'General', 'Other': 'General' };

  useEffect(() => {
    if (!patName) { setRecommendedDoctors([]); setDocName(''); return; }
    const patient = patients.find((p: Patient) => p.name === patName);
    if (patient) {
        const requiredSpec = DISEASE_TO_SPEC[patient.disease] || 'General';
        const sorted = [...doctors].sort((a: Doctor, b: Doctor) => {
             const getScore = (doc: Doctor) => {
                 if (doc.specialization === requiredSpec) return 2;
                 if (requiredSpec === 'General' && ['General', 'GP', 'Pediatrics'].includes(doc.specialization)) return 1;
                 return 0;
             };
             return getScore(b) - getScore(a);
        });
        setRecommendedDoctors(sorted);
        if (sorted.length > 0) setDocName(sorted[0].name); else setDocName('');
    }
  }, [patName, patients, doctors]);

  const handleBook = () => {
    if (!selected || !patName) return;
    onUpdate(beds.map((b: Bed) => b.id === selected.id ? {
      ...b, isOccupied: true, patientName: patName, admitDate: new Date().toLocaleDateString('en-CA'), doctorName: docName || 'Unassigned'
    } : b));
    setSelected(null); setPatName(''); setDocName('');
  };

  const handleAddBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBedData.number) return;
    const newBed: Bed = { id: `B${Date.now()}`, ward: newBedData.ward, number: newBedData.number, isOccupied: false };
    onUpdate([...beds, newBed]); setIsAddModalOpen(false); setNewBedData({ ward: 'General', number: '' });
  };

  const filteredBeds = beds.filter((bed: Bed) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    if (bed.isOccupied && bed.patientName?.toLowerCase().includes(lowerTerm)) return true;
    return false;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ward Management</h2>
          <p className="text-slate-500 dark:text-slate-400">Track occupancy and assign beds.</p>
        </div>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm" placeholder="Search patient in bed..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700 shadow-sm transition-all"><Plus size={18} /> New Bed</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBeds.map((bed: Bed) => (
          <div key={bed.id} onClick={() => !bed.isOccupied && setSelected(bed)} className={`relative p-5 rounded-xl border transition-all duration-200 group ${bed.isOccupied ? 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-900/30' : 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900/30 cursor-pointer hover:shadow-md hover:-translate-y-1'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-2xl font-bold ${bed.isOccupied ? 'text-slate-700 dark:text-slate-200' : 'text-emerald-600 dark:text-emerald-400'}`}>{bed.number}</span>
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mt-1">{bed.ward}</p>
              </div>
              <div className={`p-2 rounded-full ${bed.isOccupied ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                <BedIcon size={20} />
              </div>
            </div>

            {bed.isOccupied ? (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">{bed.patientName?.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{bed.patientName}</p>
                    <p className="text-xs text-slate-500 truncate">Patient</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between"><span>Admitted:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{bed.admitDate}</span></div>
                  <div className="flex justify-between"><span>Doctor:</span> <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{bed.doctorName || '-'}</span></div>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 text-center">
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    <CheckCircle size={12} /> Available
                 </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal title="Allocate Bed" isOpen={!!selected} onClose={() => setSelected(null)}>
        <form onSubmit={(e) => { e.preventDefault(); handleBook(); }} className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-100 dark:border-blue-900/30">
               <BedIcon size={24} />
               <div>
                  <div className="font-bold text-base">Booking Bed {selected?.number}</div>
                  <div className="text-sm opacity-80">{selected?.ward} Ward</div>
               </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Patient</label>
                <div className="relative">
                  <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={patName} onChange={e => setPatName(e.target.value)} required>
                    <option value="">-- Choose from active patients --</option>
                    {patients.map((p: Patient) => <option key={p.id} value={p.name}>{p.name} ({p.disease})</option>)}
                  </select>
                  <Users className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assign Doctor {patName && <span className="text-emerald-600 text-xs ml-2 font-normal">✨ Smart Suggestion</span>}</label>
                <div className="relative">
                  <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={docName} onChange={e => setDocName(e.target.value)}>
                    <option value="">-- Select Doctor --</option>
                    {(recommendedDoctors.length > 0 ? recommendedDoctors : doctors).map((d: Doctor) => {
                         const patient = patients.find((p: Patient) => p.name === patName);
                         const requiredSpec = patient ? (DISEASE_TO_SPEC[patient.disease] || 'General') : 'General';
                         const isRecommended = d.specialization === requiredSpec;
                         return <option key={d.id} value={d.name}>{d.name} ({d.specialization}) {isRecommended ? '★' : ''}</option>;
                    })}
                  </select>
                  <Stethoscope className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            <div className="pt-2">
               <button type="submit" disabled={!patName} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold shadow-md transition-all">Confirm Allocation</button>
            </div>
        </form>
      </Modal>

      <Modal title="Create New Bed" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
         <form onSubmit={handleAddBed} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bed Number</label>
                <input type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={newBedData.number} onChange={e => setNewBedData({...newBedData, number: e.target.value})} placeholder="e.g. 105" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ward Type</label>
               <select className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={newBedData.ward} onChange={(e: any) => setNewBedData({...newBedData, ward: e.target.value})}>
                  <option value="General">General Ward</option>
                  <option value="ICU">ICU</option>
                  <option value="Private">Private Room</option>
               </select>
            </div>
            <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 shadow-sm transition-colors">Create Bed</button>
         </form>
      </Modal>
    </div>
  );
};

// --- PHARMACY MODULE ---
const PharmacyModule = ({ medicines }: { medicines: Medicine[] }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pharmacy Inventory</h2>
            <p className="text-slate-500 dark:text-slate-400">Manage medicine stock and expiry.</p>
            </div>
             <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center shadow-sm transition-all"><Plus size={18} /> Add Medicine</button>
        </div>
        <AIAssistant type="Medicines" data={medicines} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map(m => (
                <div key={m.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{m.name}</h4>
                            <span className="text-xs font-mono text-slate-400">{m.id}</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Exp: {m.expiryDate}
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <span className={`font-bold ${m.stock < m.minStockThreshold ? 'text-rose-600' : 'text-emerald-600'}`}>{m.stock} units</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{m.price.toFixed(2)}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

// --- INVOICE MODULE ---
const InvoiceModule = ({ invoices, patients, onAdd }: { invoices: Invoice[], patients: Patient[], onAdd: (i: Invoice) => void }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Invoice>>({
        patientName: '',
        amount: 0,
        status: 'Pending',
        description: 'General Hospital Services'
    });

    const handlePatientChange = (name: string) => {
        const patient = patients.find(p => p.name === name);
        if (patient) {
            const calculatedTotal = patient.services?.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0) || 0;
            setFormData({
                ...formData,
                patientName: name,
                amount: calculatedTotal
            });
        } else {
            setFormData({...formData, patientName: name, amount: 0});
        }
    };

    const handleCreateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientName || formData.amount === undefined) return;
        
        const newInvoice: Invoice = {
            id: `INV${Date.now().toString().slice(-4)}`,
            patientName: formData.patientName,
            amount: formData.amount,
            date: new Date().toLocaleDateString('en-CA'),
            status: formData.status as 'Paid' | 'Pending',
            description: formData.description
        };
        onAdd(newInvoice);
        setIsModalOpen(false);
        setFormData({ patientName: '', amount: 0, status: 'Pending', description: 'General Hospital Services' });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Billing & Invoices</h2>
                  <p className="text-slate-500 dark:text-slate-400">Generate and track patient bills.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center shadow-sm transition-all"><Receipt size={18} /> Create Invoice</button>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-5">Invoice ID</th>
                            <th className="p-5">Patient</th>
                            <th className="p-5">Description</th>
                            <th className="p-5">Date</th>
                            <th className="p-5">Amount</th>
                            <th className="p-5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {invoices.map(inv => (
                            <tr key={inv.id} className="text-sm text-slate-700 dark:text-slate-300">
                                <td className="p-5 font-mono">{inv.id}</td>
                                <td className="p-5 font-medium">{inv.patientName}</td>
                                <td className="p-5 text-slate-500">{inv.description}</td>
                                <td className="p-5">{inv.date}</td>
                                <td className="p-5 font-bold">₹{inv.amount.toFixed(2)}</td>
                                <td className="p-5">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title="Create New Invoice" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleCreateInvoice} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Patient</label>
                        <select className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.patientName} onChange={e => handlePatientChange(e.target.value)} required>
                            <option value="">-- Select Patient --</option>
                            {patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                         <input className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Total Amount (₹)</label>
                         <input type="number" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                         <p className="text-xs text-slate-500 mt-1">Automatically calculated from patient services. You can override this.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                        <select className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.status} onChange={(e:any) => setFormData({...formData, status: e.target.value})}>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-colors mt-2">Generate Invoice</button>
                </form>
            </Modal>
        </div>
    );
};

// --- CALCULATOR MODULE ---
const CalculatorModule = () => {
  // Medical Bill Estimator State only
  const [billData, setBillData] = useState({
    patientName: '',
    doctorRank: 'Specialist',
    roomType: 'General',
    consultation: 500,
    roomDays: 1,
    roomRate: 500,
    medicineCost: 0,
    labTests: 0,
    surgeryCost: 0,
    taxRate: 10
  });

  // Defaults for auto-fill
  const ROOM_RATES: Record<string, number> = { 'General': 500, 'Semi-Private': 2000, 'Private': 4000, 'ICU': 8000 };
  const DOC_RATES: Record<string, number> = { 'Junior Resident': 300, 'Specialist': 800, 'Senior Consultant': 1500, 'Trainee/Intern': 0 };

  const handleRoomChange = (type: string) => {
     setBillData(prev => ({ ...prev, roomType: type, roomRate: ROOM_RATES[type] || 0 }));
  };

  const handleRankChange = (rank: string) => {
     setBillData(prev => ({ ...prev, doctorRank: rank, consultation: DOC_RATES[rank] || 0 }));
  };

  const totalBill = 
    (Number(billData.consultation) + 
    (Number(billData.roomDays) * Number(billData.roomRate)) + 
    Number(billData.medicineCost) + 
    Number(billData.labTests) + 
    Number(billData.surgeryCost));
  
  const taxAmount = totalBill * (billData.taxRate / 100);
  const grandTotal = totalBill + taxAmount;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bill Estimator</h2>
          <p className="text-slate-500 dark:text-slate-400">Estimate patient costs based on room type and doctor rank.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h3 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4"><Edit2 size={18} /> Configuration & Costs</h3>
                 
                 {/* New Dropdowns */}
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Room Type</label>
                        <select 
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none"
                            value={billData.roomType}
                            onChange={(e) => handleRoomChange(e.target.value)}
                        >
                            {Object.keys(ROOM_RATES).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Doctor Rank</label>
                        <select 
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none"
                            value={billData.doctorRank}
                            onChange={(e) => handleRankChange(e.target.value)}
                        >
                            {Object.keys(DOC_RATES).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Room Days</label>
                      <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={billData.roomDays} onChange={e => setBillData({...billData, roomDays: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Room Rate / Day</label>
                      <div className="relative">
                         <span className="absolute left-3 top-2 text-slate-400">₹</span>
                         <input type="number" className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={billData.roomRate} onChange={e => setBillData({...billData, roomRate: Number(e.target.value)})} />
                      </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Consultation Fee ({billData.doctorRank})</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">₹</span>
                        <input type="number" className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={billData.consultation} onChange={e => setBillData({...billData, consultation: Number(e.target.value)})} />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pharmacy / Medicine</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">₹</span>
                        <input type="number" className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={billData.medicineCost} onChange={e => setBillData({...billData, medicineCost: Number(e.target.value)})} />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lab Tests & Diagnostics</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">₹</span>
                        <input type="number" className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={billData.labTests} onChange={e => setBillData({...billData, labTests: Number(e.target.value)})} />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Surgery / Procedures</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">₹</span>
                        <input type="number" className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={billData.surgeryCost} onChange={e => setBillData({...billData, surgeryCost: Number(e.target.value)})} />
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-fit">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-6"><ClipboardList size={18} /> Estimate Summary</h3>
                
                <div className="space-y-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Room ({billData.roomType})</span>
                      <span className="font-medium dark:text-slate-200">₹{(billData.roomDays * billData.roomRate).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Consultation ({billData.doctorRank})</span>
                      <span className="font-medium dark:text-slate-200">₹{billData.consultation.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Medicine & Lab</span>
                      <span className="font-medium dark:text-slate-200">₹{(Number(billData.medicineCost) + Number(billData.labTests)).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Surgery</span>
                      <span className="font-medium dark:text-slate-200">₹{billData.surgeryCost.toFixed(2)}</span>
                   </div>
                </div>

                <div className="space-y-3 mb-6">
                   <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Subtotal</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{totalBill.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm items-center">
                      <span className="text-slate-500">Tax / VAT (%)</span>
                      <input type="number" className="w-16 px-2 py-1 text-right rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white text-xs" value={billData.taxRate} onChange={e => setBillData({...billData, taxRate: Number(e.target.value)})} />
                   </div>
                   <div className="flex justify-between text-lg pt-4 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white">Total Estimated</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">₹{grandTotal.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  // Data
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [beds, setBeds] = useState<Bed[]>(INITIAL_BEDS);
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  if (!user) return <LoginScreen onLogin={setUser} darkMode={darkMode} toggleTheme={toggleTheme} />;

  const renderView = () => {
    switch(view) {
        case 'dashboard': return <Dashboard doctors={doctors} patients={patients} />;
        case 'doctors': return <DoctorModule doctors={doctors} beds={beds} onAdd={(d: Doctor) => setDoctors([...doctors, d])} onDelete={(id: string) => setDoctors(doctors.filter(doc => doc.id !== id))} />;
        case 'patients': return <PatientModule patients={patients} onAdmit={(p: Patient) => setPatients([...patients, p])} onEdit={(p: Patient) => setPatients(patients.map(pat => pat.id === p.id ? p : pat))} onDischarge={(id: string) => setPatients(patients.filter(p => p.id !== id))} />;
        case 'beds': return <BedModule beds={beds} patients={patients} doctors={doctors} onUpdate={setBeds} />;
        case 'pharmacy': return <PharmacyModule medicines={medicines} />;
        case 'invoice': return <InvoiceModule invoices={invoices} patients={patients} onAdd={(i: Invoice) => setInvoices([...invoices, i])} />;
        case 'calculator': return <CalculatorModule />;
        default: return <div className="p-10 text-center text-slate-500">Module Under Construction</div>;
    }
  };

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200`}>
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full flex flex-col z-20">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
                    <Activity className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">MediCare</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <LayoutDashboard size={18} /> Dashboard
                </button>
                <button onClick={() => setView('doctors')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'doctors' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <Stethoscope size={18} /> Doctors
                </button>
                <button onClick={() => setView('patients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'patients' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <Users size={18} /> Patients
                </button>
                <button onClick={() => setView('beds')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'beds' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <BedIcon size={18} /> Ward & Beds
                </button>
                <button onClick={() => setView('pharmacy')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'pharmacy' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <Pill size={18} /> Pharmacy
                </button>
                <button onClick={() => setView('invoice')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'invoice' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <FileText size={18} /> Invoices
                </button>
                <button onClick={() => setView('calculator')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === 'calculator' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <Calculator size={18} /> Bill Estimator
                </button>
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs">
                            <p className="font-semibold text-slate-900 dark:text-white">{user.username}</p>
                            <p className="text-slate-500 capitalize">{user.role}</p>
                        </div>
                    </div>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
                <button onClick={() => setUser(null)} className="w-full flex items-center justify-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 py-2 rounded-lg text-sm font-medium transition-colors">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-0">
            {renderView()}
        </main>
    </div>
  );
};

export default App;