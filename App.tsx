import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, Shield, Wallet, Clock, Trophy, 
  AlertCircle, Eye, EyeOff, CheckCircle2, 
  Plus, Trash2, ArrowLeft, MoreHorizontal, Settings as SettingsIcon, Lightbulb,
  BarChart3, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Home, User, Bell, Search, Camera, X,
  ArrowUpRight, ArrowDownLeft, BadgeMinus, BadgePlus,
  RefreshCcw, AlertTriangle, Filter, Check, CheckSquare
} from 'lucide-react';
import { AppData, ViewState, Language, TrashItem } from './types';
import { TEXT, INITIAL_DATA, CURRENCIES } from './constants';

// --- Utility Functions ---

const getISODate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (isoDate: string, localDateStr: string) => {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const local = getISODate(d);
  return local === localDateStr;
};

// --- UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-card rounded-3xl p-5 border border-white/5 ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all duration-200 hover:bg-cardHover' : ''}`}
  >
    {children}
  </div>
);

const Button: React.FC<{ onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; children: React.ReactNode; className?: string; fullWidth?: boolean }> = ({ 
  onClick, variant = 'primary', children, className = "", fullWidth = false 
}) => {
  const baseStyle = "py-3.5 px-6 rounded-full font-display font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-primary text-white hover:bg-primaryDark shadow-glow",
    secondary: "bg-[#2A2A2A] text-white hover:bg-[#333333]",
    danger: "bg-mistake/10 text-mistake border border-mistake/20",
    ghost: "bg-transparent text-text-muted hover:text-white"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
  <div className="w-full mb-4">
    {label && <label className="block text-text-muted text-xs font-medium mb-2 ml-1">{label}</label>}
    <input 
      {...props}
      className={`w-full bg-input border border-transparent rounded-2xl p-4 text-white placeholder-text-dark focus:outline-none focus:border-primary/50 transition-colors text-sm ${props.className}`}
    />
  </div>
);

const IconButton: React.FC<{ icon: React.ReactNode; onClick?: () => void; className?: string }> = ({ icon, onClick, className = "" }) => (
  <button 
    onClick={onClick}
    className={`w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:bg-[#252525] transition-colors active:scale-90 ${className}`}
  >
    {icon}
  </button>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string; onBack?: () => void; rightElement?: React.ReactNode }> = ({ title, subtitle, onBack, rightElement }) => (
  <div className="flex items-center justify-between mb-6 pt-2">
    <div className="flex items-center gap-4">
      {onBack && (
        <IconButton icon={<ArrowLeft size={20} />} onClick={onBack} />
      )}
      <div>
        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
        {subtitle && <p className="text-text-muted text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {rightElement}
  </div>
);

// --- App Component ---

const App: React.FC = () => {
  // State
  const [data, setData] = useState<AppData>(() => {
    try {
        const saved = localStorage.getItem('lifebooster_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (!parsed.currency) parsed.currency = 'AED'; 
            if (!parsed.incomes) parsed.incomes = [];
            if (!parsed.gender) parsed.gender = 'male';
            if (!parsed.joinDate) parsed.joinDate = new Date().toISOString(); 
            if (!parsed.trash) parsed.trash = []; 
            return parsed;
        }
    } catch (e) {
        console.error("Failed to load data", e);
    }
    return INITIAL_DATA;
  });
  
  const [view, setView] = useState<ViewState>('onboarding');
  const [lang, setLang] = useState<Language>('en');
  const [privateMode, setPrivateMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getISODate(new Date()));
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'wallet' | 'profile'>('home');

  // Persist Data
  useEffect(() => {
    localStorage.setItem('lifebooster_data', JSON.stringify(data));
  }, [data]);

  // Determine View on Load
  useEffect(() => {
    if (data.hasOnboarded) {
      setView('dashboard');
    } else {
      setView('onboarding');
    }
  }, []); // Only run on mount

  // Check language from browser
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('fr')) setLang('fr');
    else setLang('en');
  }, []);

  // --- Helper Functions ---

  const t = (key: string) => TEXT[key]?.[lang] || key;

  const isRTL = false; 

  const formatCurrency = (amount: number) => {
    if (privateMode) return "***";
    const currency = data.currency || 'AED';
    try {
        let locale = 'en-US';
        if (lang === 'fr' || lang === 'dr') locale = 'fr-FR';
        
        return new Intl.NumberFormat(locale, { 
            style: 'currency', 
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    } catch (e) {
        return `${amount} ${currency}`;
    }
  };

  const updateData = (updates: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  // Trash Logic
  const moveToTrash = (item: any, type: TrashItem['type']) => {
    const trashItem: TrashItem = { type, data: item, deletedAt: new Date().toISOString() };
    
    // Remove from specific list
    const updates: Partial<AppData> = { trash: [trashItem, ...data.trash] };
    
    if (type === 'task') updates.tasks = data.tasks.filter(t => t.id !== item.id);
    else if (type === 'expense') updates.expenses = data.expenses.filter(e => e.id !== item.id);
    else if (type === 'income') updates.incomes = data.incomes.filter(i => i.id !== item.id);
    else if (type === 'loan') updates.loans = data.loans.filter(l => l.id !== item.id);
    else if (type === 'challenge') updates.challenges = data.challenges.filter(c => c.id !== item.id);
    else if (type === 'mistake') updates.mistakes = data.mistakes.filter(m => m.id !== item.id);

    updateData(updates);
  };

  const restoreFromTrash = (item: TrashItem) => {
      const updates: Partial<AppData> = { trash: data.trash.filter(t => t.data.id !== item.data.id) };
      
      if (item.type === 'task') updates.tasks = [...data.tasks, item.data as any];
      else if (item.type === 'expense') updates.expenses = [...data.expenses, item.data as any];
      else if (item.type === 'income') updates.incomes = [...data.incomes, item.data as any];
      else if (item.type === 'loan') updates.loans = [...data.loans, item.data as any];
      else if (item.type === 'challenge') updates.challenges = [...data.challenges, item.data as any];
      else if (item.type === 'mistake') updates.mistakes = [...data.mistakes, item.data as any];

      updateData(updates);
  };

  const deletePermanently = (id: string) => {
      updateData({ trash: data.trash.filter(t => t.data.id !== id) });
  };

  const toggleLoanStatus = (id: string) => {
      updateData({
          loans: data.loans.map(l => l.id === id ? { ...l, isPaid: !l.isPaid } : l)
      });
  };

  // --- Layout Components ---

  const BottomNav = () => {
    if (view === 'onboarding') return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#050505]/90 backdrop-blur-xl border-t border-white/5 pb-6 pt-3 px-6 z-50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button 
            onClick={() => { setActiveTab('home'); setView('dashboard'); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>
          
          <button 
            onClick={() => { setActiveTab('calendar'); setView('calendar'); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'calendar' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
          >
            <CalendarIcon size={24} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
          </button>

          {/* Central Button triggers Quick Menu Modal */}
          <button 
            onClick={() => setShowQuickMenu(true)}
            className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-glow -mt-8 border-[4px] border-[#050505] active:scale-95 transition-transform"
          >
            <Plus size={28} strokeWidth={3} />
          </button>

          <button 
            onClick={() => { setActiveTab('wallet'); setView('wallet'); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'wallet' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
          >
            <Wallet size={24} strokeWidth={activeTab === 'wallet' ? 2.5 : 2} />
          </button>

          <button 
            onClick={() => { setActiveTab('profile'); setView('settings'); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
          >
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          </button>
        </div>
      </div>
    );
  };

  // --- Views ---

  const OnboardingView = () => {
    const [step, setStep] = useState(0);

    const steps = [
      { title: t('onboarding_1_title'), desc: t('onboarding_1_desc'), icon: Shield },
      { title: t('onboarding_2_title'), desc: t('onboarding_2_desc'), icon: Trophy },
      { title: t('onboarding_3_title'), desc: t('onboarding_3_desc'), icon: Wallet },
    ];

    const handleNext = () => {
      if (step < steps.length - 1) setStep(step + 1);
      else {
        finishOnboarding();
      }
    };

    const finishOnboarding = () => {
        const newData = { 
            ...data,
            hasOnboarded: true,
            joinDate: new Date().toISOString()
        };
        setData(newData);
        // Force save to localStorage immediately to prevent race conditions
        try {
            localStorage.setItem('lifebooster_data', JSON.stringify(newData));
        } catch(e) { console.error("Save failed", e); }
        setView('dashboard');
    }

    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto animate-in fade-in duration-700 bg-bg relative">
        <button 
            onClick={finishOnboarding}
            className="absolute top-6 right-6 text-text-muted hover:text-white text-sm font-semibold"
        >
            {t('btn_skip')}
        </button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-10 border border-white/5 relative">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            {React.createElement(steps[step].icon, { size: 40, className: "text-primary relative z-10" })}
          </div>
          <h1 className="text-3xl font-display font-bold mb-4">{steps[step].title}</h1>
          <p className="text-text-muted leading-relaxed text-sm max-w-[280px] mx-auto">{steps[step].desc}</p>
        </div>
        <div className="w-full pb-10">
          <div className="flex justify-center gap-2 mb-10">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-[#2A2A2A]'}`} />
            ))}
          </div>
          <Button fullWidth onClick={handleNext}>
            {step === steps.length - 1 ? t('btn_get_started') : t('btn_continue')}
          </Button>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    // Tasks use 'YYYY-MM-DD' so direct comparison is fine
    const currentTasks = data.tasks.filter(t => t.date === selectedDate);
    const tasksDone = currentTasks.filter(t => t.completed).length;
    const tasksTotal = currentTasks.length;
    const tasksProgress = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;

    // Financial Calculation for Dashboard - SHOW EVERYTHING (TOTAL BALANCE)
    const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalBalance = totalIncome - totalExpenses;

    const mistakesCount = data.mistakes.filter(m => isSameDay(m.date, selectedDate)).length;

    return (
      <div className="pb-32 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pt-4">
          <div>
            <h1 className="text-2xl font-display font-bold">{t('hi')}, {data.name} 👋</h1>
            <p className="text-text-muted text-xs mt-1">{t('dashboard_subtitle')}</p>
          </div>
          <div className="flex gap-3">
             <IconButton icon={privateMode ? <EyeOff size={20} /> : <Eye size={20} />} onClick={() => setPrivateMode(!privateMode)} />
             <IconButton icon={<Bell size={20} />} className="relative" />
             <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#050505]"></div>
          </div>
        </div>

        {/* Hero Card - Daily Status */}
        <div className="bg-gradient-to-br from-[#161616] to-[#0A0A0A] rounded-[32px] p-6 mb-8 border border-white/10 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -mr-10 -mt-10"></div>
             
             <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-glow">
                    <Trophy size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg text-white">{t('daily_goal')}</h3>
                    <p className="text-text-muted text-xs">{new Date(selectedDate).toLocaleDateString((lang === 'fr' || lang === 'dr') ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long'})}</p>
                 </div>
             </div>

             <div className="mb-2 flex justify-between items-end">
                <span className="text-sm font-medium text-gray-200">{t('your_progress')}</span>
                <span className="text-xs text-text-muted">#{tasksDone} of {tasksTotal} {t('section_tasks').toLowerCase()}</span>
             </div>
             <div className="w-full h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-6">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${tasksProgress}%` }}></div>
             </div>

             <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                    {/* Updated to show Wallet Balance (Solde Net) instead of Daily Spent */}
                    <span className="text-text-muted">{t('money_balance')}:</span>
                    <span className="font-bold text-white">{formatCurrency(totalBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{t('mistakes_logged')}:</span>
                    <span className="font-bold text-white">{mistakesCount}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => setView('time_manager')}>{t('btn_start_day')}</Button>
                <Button variant="secondary" onClick={() => setView('daily_summary')}>{t('summary_title')}</Button>
             </div>
        </div>

        {/* Sections Grid */}
        <h3 className="text-lg font-bold mb-4">{t('quick_overview')}</h3>
        <div className="grid grid-cols-2 gap-3">
            <div 
                onClick={() => setView('time_manager')}
                className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36"
            >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                    <Clock size={20} />
                </div>
                <div>
                     <h4 className="font-bold text-sm text-white mb-1">{t('section_tasks')}</h4>
                     <p className="text-xs text-text-muted">{tasksTotal - tasksDone} {t('pending')}</p>
                </div>
            </div>

            <div 
                onClick={() => { setActiveTab('wallet'); setView('wallet'); }}
                className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36"
            >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Wallet size={20} />
                </div>
                <div>
                     {/* Updated to show Wallet Balance instead of Daily Expenses */}
                     <h4 className="font-bold text-sm text-white mb-1">{t('section_wallet')}</h4>
                     <p className="text-xs text-text-muted">{formatCurrency(totalBalance)}</p>
                </div>
            </div>

            <div 
                onClick={() => setView('personal_challenges')}
                className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36"
            >
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-3">
                    <Trophy size={20} />
                </div>
                <div>
                     <h4 className="font-bold text-sm text-white mb-1">{t('section_challenges')}</h4>
                     <p className="text-xs text-text-muted">{t('push_yourself')}</p>
                </div>
            </div>

             <div 
                onClick={() => setView('daily_mistakes')}
                className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36"
            >
                <div className="w-10 h-10 rounded-full bg-mistake/10 flex items-center justify-center text-mistake mb-3">
                    <AlertCircle size={20} />
                </div>
                <div>
                     <h4 className="font-bold text-sm text-white mb-1">{t('section_mistakes')}</h4>
                     <p className="text-xs text-text-muted">{mistakesCount} {t('logged')}</p>
                </div>
            </div>

            <div 
                onClick={() => setView('loans')}
                className="col-span-2 bg-[#161616] p-4 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex items-center justify-between"
            >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <MoreHorizontal size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-white">{t('section_loans')}</h4>
                        <p className="text-xs text-text-muted">{t('track_debts')}</p>
                    </div>
                </div>
                <ChevronRight size={20} className="text-text-muted" />
            </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
      const [localName, setLocalName] = useState(data.name);

      const handleSave = () => {
          updateData({ name: localName });
          setActiveTab('home');
          setView('dashboard');
      };

      const handleReset = () => {
          if (window.confirm(t('reset_confirm_msg'))) {
              localStorage.clear();
              window.location.reload();
          }
      };

      return (
          <div className="h-full flex flex-col pt-8 pb-20 overflow-y-auto no-scrollbar">
               <div className="flex items-center justify-between mb-8 px-2">
                  <h2 className="text-2xl font-bold font-display">{t('settings_title')}</h2>
                  <div className="w-10"></div> 
               </div>
               
               <div className="flex flex-col items-center mb-10">
                   <div className="w-28 h-28 rounded-full bg-[#161616] p-1.5 border border-white/5 shadow-2xl mb-4">
                       <div className="w-full h-full rounded-full bg-[#2A2A2A] flex items-center justify-center overflow-hidden relative shadow-inner">
                            <span className="text-4xl font-display font-bold text-white">
                                {data.name ? data.name.charAt(0).toUpperCase() : "U"}
                            </span>
                       </div>
                   </div>
                   <h3 className="text-xl font-bold">{data.name}</h3>
                   <p className="text-xs text-text-muted uppercase tracking-widest mt-1">ID: LIFE-{Math.floor(Math.random() * 9000) + 1000}</p>
               </div>

               <div className="px-4 space-y-6">
                   <Input label="Display Name" value={localName} onChange={(e) => setLocalName(e.target.value)} />
                   
                   {/* Link to Trash */}
                   <button 
                       onClick={() => setView('trash')}
                       className="w-full p-4 rounded-2xl bg-input text-left flex items-center justify-between group active:scale-95 transition-all"
                   >
                       <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-[#161616] flex items-center justify-center text-text-muted group-hover:text-mistake transition-colors">
                               <Trash2 size={20} />
                           </div>
                           <span className="font-medium text-sm">{t('trash_title')}</span>
                       </div>
                       <div className="flex items-center gap-2 text-text-muted text-xs">
                            {data.trash.length > 0 && <span className="bg-mistake/20 text-mistake px-2 py-0.5 rounded-full">{data.trash.length}</span>}
                            <ChevronRight size={16} />
                       </div>
                   </button>

                   <div>
                       <label className="block text-text-muted text-xs font-medium mb-2 ml-1">{t('settings_gender')}</label>
                       <div className="grid grid-cols-2 gap-3 p-1 bg-input rounded-2xl">
                            <button 
                                onClick={() => updateData({ gender: 'male' })}
                                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${data.gender === 'male' ? 'bg-[#333] text-white shadow-md' : 'text-text-muted hover:text-white'}`}
                            >
                                {t('settings_male')}
                            </button>
                            <button 
                                onClick={() => updateData({ gender: 'female' })}
                                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${data.gender === 'female' ? 'bg-[#333] text-white shadow-md' : 'text-text-muted hover:text-white'}`}
                            >
                                {t('settings_female')}
                            </button>
                       </div>
                   </div>

                   <div>
                       <label className="block text-text-muted text-xs font-medium mb-2 ml-1">{t('settings_currency')}</label>
                       <div className="relative">
                           <select 
                               value={data.currency} 
                               onChange={(e) => updateData({ currency: e.target.value })}
                               className="w-full appearance-none bg-input border border-transparent rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                           >
                               {CURRENCIES.map(c => (
                                   <option key={c.code} value={c.code}>
                                       {c.code} - {c.name}
                                   </option>
                               ))}
                           </select>
                           <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-muted`} size={16} />
                       </div>
                   </div>

                   <div>
                       <label className="block text-text-muted text-xs font-medium mb-2 ml-1">{t('settings_language')}</label>
                       <div className="grid grid-cols-3 gap-3">
                           <button 
                             onClick={() => setLang('en')} 
                             className={`p-4 rounded-2xl text-sm font-medium transition-all ${lang === 'en' ? 'bg-primary text-white' : 'bg-input text-text-muted'}`}
                           >
                             English
                           </button>
                           <button 
                             onClick={() => setLang('fr')} 
                             className={`p-4 rounded-2xl text-sm font-medium transition-all ${lang === 'fr' ? 'bg-primary text-white' : 'bg-input text-text-muted'}`}
                           >
                             Français
                           </button>
                           <button 
                             onClick={() => setLang('dr')} 
                             className={`p-4 rounded-2xl text-sm font-medium transition-all ${lang === 'dr' ? 'bg-primary text-white' : 'bg-input text-text-muted'}`}
                           >
                             Darija
                           </button>
                       </div>
                   </div>

                   <div className="pt-4">
                        <Button fullWidth onClick={handleSave}>Save Changes</Button>
                   </div>
                   
                   <div className="pt-4">
                        <Button variant="danger" fullWidth onClick={handleReset}>{t('settings_reset')}</Button>
                   </div>
               </div>
          </div>
      )
  }

  const TrashView = () => {
    return (
        <div className="h-full flex flex-col pt-4 pb-24">
            <SectionHeader title={t('trash_title')} onBack={() => setView('settings')} />
            
            {data.trash.length > 0 && (
                <div className="mb-4 px-1">
                    <p className="text-xs text-text-muted flex items-center gap-2">
                        <AlertTriangle size={12} />
                        {t('trash_warning')}
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {data.trash.length === 0 && (
                     <div className="text-center text-text-muted mt-20 opacity-30">
                        <Trash2 size={48} className="mx-auto mb-4" />
                        <p className="text-sm">{t('trash_empty')}</p>
                    </div>
                )}
                
                {data.trash.map((item, idx) => {
                    const text = (item.data as any).text || (item.data as any).description || (item.data as any).person;
                    const amount = (item.data as any).amount;
                    
                    return (
                        <div key={idx} className="bg-[#161616] p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] uppercase bg-white/10 px-2 rounded text-text-muted font-bold">{item.type}</span>
                                        <span className="text-xs text-text-muted">{new Date(item.deletedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="font-bold text-sm line-clamp-1">{text}</p>
                                    {amount && <p className="text-xs font-mono">{formatCurrency(amount)}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <button 
                                    onClick={() => restoreFromTrash(item)}
                                    className="flex-1 bg-primary/10 text-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/20"
                                >
                                    <RefreshCcw size={14} />
                                    {t('trash_restore')}
                                </button>
                                <button 
                                    onClick={() => deletePermanently((item.data as any).id)}
                                    className="flex-1 bg-mistake/10 text-mistake py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-mistake/20"
                                >
                                    <Trash2 size={14} />
                                    {t('trash_delete')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const LoansView = () => {
    // Calculate total lent (excluding paid)
    const totalLent = data.loans.filter(l => l.type === 'lent' && !l.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
    const totalBorrowed = data.loans.filter(l => l.type === 'borrowed' && !l.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

    return (
      <div className="h-full flex flex-col pt-4 pb-24">
        <SectionHeader title={t('section_loans')} onBack={() => setView('dashboard')} />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#161616] p-4 rounded-3xl border border-white/5">
            <p className="text-xs text-text-muted mb-1">{t('loans_lent')}</p>
            <p className="text-xl font-bold text-green-500">{formatCurrency(totalLent)}</p>
          </div>
          <div className="bg-[#161616] p-4 rounded-3xl border border-white/5">
            <p className="text-xs text-text-muted mb-1">{t('loans_borrowed')}</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalBorrowed)}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
            {data.loans.length === 0 && <p className="text-text-muted text-center text-sm">No records yet</p>}
            {data.loans.map(loan => (
                <div key={loan.id} className={`flex justify-between items-center p-4 rounded-3xl bg-[#161616] border ${loan.isPaid ? 'border-transparent opacity-50' : 'border-white/5'}`}>
                    <div>
                        <p className={`font-bold ${loan.isPaid ? 'line-through text-text-muted' : ''}`}>{loan.person}</p>
                        <p className={`text-xs ${loan.type === 'lent' ? 'text-green-500' : 'text-red-500'}`}>
                            {loan.isPaid ? t('loan_paid') : (loan.type === 'lent' ? 'Owes you' : 'You owe')}
                        </p>
                        {/* Show Due Date if exists */}
                        {loan.dueDate && !loan.isPaid && (
                            <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                {new Date(loan.dueDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="font-mono font-bold mr-2">{formatCurrency(loan.amount)}</span>
                         
                         {/* Toggle Paid Status Button */}
                         <button 
                            onClick={() => toggleLoanStatus(loan.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loan.isPaid ? 'bg-primary text-white' : 'bg-white/10 text-text-muted hover:text-white'}`}
                         >
                             <Check size={16} />
                         </button>

                         <button 
                            onClick={() => moveToTrash(loan, 'loan')}
                            className="text-text-muted hover:text-mistake p-1"
                         >
                             <Trash2 size={16} />
                         </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  };

  const CalendarView = () => {
      // "Traidzella" style calendar: Grid month view with activity indicators
      const today = new Date();
      const [currentMonth, setCurrentMonth] = useState(today.getMonth());
      const [currentYear, setCurrentYear] = useState(today.getFullYear());
      
      // Weekly Stats State
      const [weekOffset, setWeekOffset] = useState(0);

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

      const monthName = new Date(currentYear, currentMonth).toLocaleString((lang === 'fr' || lang === 'dr') ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

      // Generate days array with padding for grid
      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(i);

      // --- Stats Calculation (Monthly) ---
      // Fix: Strictly use the displayed month/year for the monthly report
      let respectedDays = 0;
      let missedDays = 0;
      const joinDate = new Date(data.joinDate);
      joinDate.setHours(0,0,0,0);

      for(let i=1; i<=daysInMonth; i++) {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
          const currentDayDate = new Date(dateStr);
          currentDayDate.setHours(0,0,0,0);

          const isFuture = currentDayDate > new Date();
          const isBeforeJoin = currentDayDate < joinDate;

          // Only count stats for days that have passed/today AND are after the user joined
          if(!isFuture && !isBeforeJoin) {
             const hasTasks = data.tasks.some(t => t.date === dateStr);
             const tasksCompleted = data.tasks.filter(t => t.date === dateStr && t.completed).length;
             const hasMistakes = data.mistakes.some(m => isSameDay(m.date, dateStr));

             if (tasksCompleted > 0 && !hasMistakes) respectedDays++;
             else if ((!hasTasks || tasksCompleted === 0) || hasMistakes) missedDays++;
          }
      }
      
      const totalDaysPassed = respectedDays + missedDays;
      const completionRate = totalDaysPassed > 0 ? Math.round((respectedDays / totalDaysPassed) * 100) : 0;

      // --- Stats Calculation (Weekly) ---
      const getWeeklyStats = () => {
          // Calculate start of week based on today/selected date PLUS offset
          // Defaulting to today as anchor
          const anchorDate = new Date();
          const day = anchorDate.getDay();
          // Monday start adjustment
          const diff = anchorDate.getDate() - day + (day === 0 ? -6 : 1); 
          
          const weekStart = new Date(anchorDate);
          weekStart.setDate(diff + (weekOffset * 7)); // Apply offset
          weekStart.setHours(0,0,0,0);
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // Sunday
          weekEnd.setHours(23,59,59,999);

          let tasksCompletedWeek = 0;
          let tasksTotalWeek = 0;
          let moneySpentWeek = 0;
          let mistakesWeek = 0;

          // Simple filtering logic
          data.tasks.forEach(t => {
              const d = new Date(t.date);
              if (d >= weekStart && d <= weekEnd) {
                  tasksTotalWeek++;
                  if (t.completed) tasksCompletedWeek++;
              }
          });
          
          data.expenses.forEach(e => {
              const d = new Date(e.date);
              if (d >= weekStart && d <= weekEnd) {
                  moneySpentWeek += e.amount;
              }
          });

          data.mistakes.forEach(m => {
              const d = new Date(m.date);
              if (d >= weekStart && d <= weekEnd) {
                  mistakesWeek++;
              }
          });

          const weekCompletion = tasksTotalWeek > 0 ? Math.round((tasksCompletedWeek / tasksTotalWeek) * 100) : 0;
          
          return {
              start: weekStart,
              end: weekEnd,
              tasksPct: weekCompletion,
              spent: moneySpentWeek,
              mistakes: mistakesWeek
          };
      };

      const weekly = getWeeklyStats();

      return (
          <div className="h-full flex flex-col pt-4 pb-24">
               <SectionHeader title={t('calendar_title')} />
               
               {/* Month Navigation for Calendar View & Monthly Report */}
               <div className="flex items-center justify-between mb-6 px-4">
                  <button onClick={() => setCurrentMonth(prev => prev - 1)}><ChevronLeft /></button>
                  <h3 className="font-bold text-lg capitalize">{monthName}</h3>
                  <button onClick={() => setCurrentMonth(prev => prev + 1)}><ChevronRight /></button>
               </div>

               <div className="grid grid-cols-7 gap-2 px-2 text-center text-xs font-medium text-text-muted mb-2">
                   {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
               </div>

               <div className="grid grid-cols-7 gap-2 px-2 overflow-y-auto no-scrollbar max-h-[350px]">
                   {days.map((day, i) => {
                       if (!day) return <div key={i} className="aspect-square"></div>;
                       
                       const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                       const dayTasks = data.tasks.filter(t => t.date === dateStr && t.completed);
                       const dayMistakes = data.mistakes.filter(m => isSameDay(m.date, dateStr));
                       
                       let bgClass = "bg-[#161616] border-white/5";
                       if (dayTasks.length > 0 && dayMistakes.length === 0) bgClass = "bg-primary/20 border-primary/50 text-primary";
                       else if (dayMistakes.length > 0) bgClass = "bg-mistake/20 border-mistake/50 text-mistake";
                       else if (dateStr === selectedDate) bgClass = "bg-white/10 border-white/20";

                       return (
                           <div 
                               key={i} 
                               onClick={() => { setSelectedDate(dateStr); setView('dashboard'); setActiveTab('home'); }}
                               className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${bgClass}`}
                           >
                               <span className="font-bold">{day}</span>
                               <div className="flex gap-0.5 mt-1">
                                   {dayTasks.length > 0 && <div className="w-1 h-1 bg-current rounded-full"></div>}
                                   {dayMistakes.length > 0 && <div className="w-1 h-1 bg-mistake rounded-full"></div>}
                               </div>
                           </div>
                       );
                   })}
               </div>
               
               <div className="space-y-4 mt-6 px-2">
                   {/* Monthly Stats Card - Driven by the Calendar Month Navigation */}
                   <div className="p-5 bg-[#161616] border border-white/5 rounded-3xl">
                       <div className="flex justify-between items-center mb-4">
                           <h4 className="font-bold text-sm">{t('stats_month')}</h4>
                           <span className="text-[10px] text-text-muted bg-white/5 px-2 py-1 rounded-full uppercase">{monthName}</span>
                       </div>
                       <div className="grid grid-cols-3 gap-2 text-center">
                           <div>
                               <p className="text-2xl font-bold text-primary">{respectedDays}</p>
                               <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('stats_respected')}</p>
                           </div>
                           <div>
                               <p className="text-2xl font-bold text-mistake">{missedDays}</p>
                               <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('stats_missed')}</p>
                           </div>
                            <div>
                               <p className="text-2xl font-bold text-white">{completionRate}%</p>
                               <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('stats_completion')}</p>
                           </div>
                       </div>
                   </div>

                   {/* Weekly Report Card - With specific week navigation */}
                   <div className="p-5 bg-[#161616] border border-white/5 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="font-bold text-sm">{t('stats_weekly')}</h4>
                           <div className="flex items-center gap-2 bg-white/5 rounded-full px-2 py-1">
                                <button onClick={() => setWeekOffset(prev => prev - 1)} className="text-text-muted hover:text-white"><ChevronLeft size={14} /></button>
                                <span className="text-[10px] text-text-muted min-w-[80px] text-center">{weekly.start.getDate()} - {weekly.end.getDate()} {weekly.end.toLocaleString('default', { month: 'short' })}</span>
                                <button onClick={() => setWeekOffset(prev => prev + 1)} className="text-text-muted hover:text-white"><ChevronRight size={14} /></button>
                           </div>
                       </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                           <div className="flex flex-col items-center justify-center">
                               <div className="w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center mb-1">
                                   <span className="text-xs font-bold text-primary">{weekly.tasksPct}%</span>
                               </div>
                               <p className="text-[10px] text-text-muted uppercase tracking-wider">Tasks</p>
                           </div>
                           <div>
                               <p className="text-xl font-bold text-white mt-1">{formatCurrency(weekly.spent)}</p>
                               <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('money_spent')}</p>
                           </div>
                            <div>
                               <p className="text-xl font-bold text-mistake mt-1">{weekly.mistakes}</p>
                               <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('mistakes_logged')}</p>
                           </div>
                       </div>
                   </div>
               </div>
          </div>
      )
  };

  const WalletView = () => {
      // Integrated Wallet + Transaction Adding Logic
      const totalIncome = (data.incomes || []).reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpense = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
      const balance = totalIncome - totalExpense;

      const [newAmount, setNewAmount] = useState("");
      const [newDesc, setNewDesc] = useState("");
      const [txType, setTxType] = useState<'income' | 'expense' | 'lent' | 'borrowed'>('expense');
      const [dueDate, setDueDate] = useState(""); // State for Loan Due Date
      const [showAdd, setShowAdd] = useState(false);
      
      // Filter State
      const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'loans'>('all');
      const [showFilterMenu, setShowFilterMenu] = useState(false);

      const handleAddTx = () => {
          if (!newAmount) return;
          const amt = parseFloat(newAmount);
          const date = new Date(selectedDate);
          // Set time to now
          const now = new Date();
          date.setHours(now.getHours(), now.getMinutes());
          const dateStr = date.toISOString();

          // Create copies to ensure React detects change
          const newIncomes = [...(data.incomes || [])];
          const newExpenses = [...data.expenses];
          const newLoans = [...data.loans];

          if (txType === 'income') {
              newIncomes.push({ id: Date.now().toString(), amount: amt, description: newDesc || "Income", date: dateStr });
          } else if (txType === 'expense') {
              newExpenses.push({ id: Date.now().toString(), amount: amt, description: newDesc || "Expense", date: dateStr });
          } else if (txType === 'lent') {
              newExpenses.push({ id: Date.now().toString(), amount: amt, description: `Lent to: ${newDesc}`, date: dateStr });
              newLoans.push({ id: Date.now().toString(), person: newDesc || "Unknown", amount: amt, type: 'lent', dueDate: dueDate || undefined, isPaid: false });
          } else if (txType === 'borrowed') {
               newIncomes.push({ id: Date.now().toString(), amount: amt, description: `Borrowed from: ${newDesc}`, date: dateStr });
               newLoans.push({ id: Date.now().toString(), person: newDesc || "Unknown", amount: amt, type: 'borrowed', dueDate: dueDate || undefined, isPaid: false });
          }

          updateData({ incomes: newIncomes, expenses: newExpenses, loans: newLoans });

          setNewAmount("");
          setNewDesc("");
          setDueDate("");
          setShowAdd(false);
      };

      const transactions = useMemo(() => {
          let incomes = (data.incomes || []).map(i => ({ ...i, type: 'income', isPaid: false })); // isPaid false dummy for type compatibility
          let expenses = data.expenses.map(e => ({ ...e, type: 'expense', isPaid: false }));
          
          // Identify loans in the income/expense stream for proper "Check" button functionality or filtering?
          // Actually, loans are stored in separate `loans` array but also added as expense/income for balance tracking.
          // To enable proper filtering of "Loans" in history, we should look at the loan array or inferred types.
          // However, the current logic adds loans as plain expenses/incomes too. 
          // For the "Historique", we will stick to the incomes/expenses array but maybe we can merge actual loan objects for better interaction?
          // To keep it simple and consistent with existing structure: 
          // We will render the *Loan Objects* in the history list if filter is "Loans", otherwise normal income/expense.
          // Or better: We merge everything and sort.
          
          // Let's create a unified list that includes actual Loan objects for interaction
          const loansAsTransactions = data.loans.map(l => ({
              id: l.id,
              amount: l.amount,
              description: l.person, // Use person name as description
              date: new Date().toISOString(), // Loans might not have date field in original type, check definition. They don't have date. We can't sort them properly without date.
              // Wait, the prompt implies managing loans in "Kridi". The "Historique" usually shows money flow.
              // Let's keep Historique for money flow.
              // But add a specific filter view.
              type: l.type,
              isPaid: l.isPaid,
              isLoanObject: true 
          }));

          let all = [...incomes, ...expenses];
          
          // Apply Filter
          if (filter === 'income') return all.filter(t => t.type === 'income').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (filter === 'expense') return all.filter(t => t.type === 'expense').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (filter === 'loans') {
             // Return actual loan objects
             // We need to fetch loans. But loans don't have a creation date property in the Interface defined earlier.
             // We will assume they are sorted by array order (newest last usually, so reverse)
             return [...data.loans].reverse().map(l => ({
                 ...l,
                 description: l.person,
                 date: new Date().toISOString(), // Placeholder
                 isLoanObject: true
             }));
          }

          return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }, [data.incomes, data.expenses, data.loans, filter]);

      return (
          <div className="h-full flex flex-col pt-4 pb-24">
               <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-white">{t('section_wallet')}</h2>
                    <Button variant="ghost" className="!p-2" onClick={() => setShowAdd(!showAdd)}>
                        {showAdd ? <X size={20} /> : <Plus size={20} />}
                    </Button>
               </div>

               <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 p-6 rounded-[32px] border border-white/10 relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full -mr-10 -mt-10"></div>
                    <p className="text-emerald-200 text-sm mb-1">{t('money_balance')}</p>
                    <h1 className="text-4xl font-display font-bold text-white mb-6">{formatCurrency(balance)}</h1>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1 text-emerald-300">
                                <ArrowDownLeft size={16} />
                                <span className="text-xs font-bold">{t('money_income')}</span>
                            </div>
                            <p className="text-lg font-mono text-white">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm">
                             <div className="flex items-center gap-2 mb-1 text-red-300">
                                <ArrowUpRight size={16} />
                                <span className="text-xs font-bold">{t('money_spent')}</span>
                            </div>
                            <p className="text-lg font-mono text-white">{formatCurrency(totalExpense)}</p>
                        </div>
                    </div>
               </div>

               {showAdd && (
                   <div className="bg-[#161616] p-5 rounded-3xl border border-white/5 mb-6 animate-in slide-in-from-top-4 fade-in">
                       <h3 className="font-bold mb-4 text-sm">{t('tx_add_btn')}</h3>
                       
                       <div className="flex flex-col gap-3 mb-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTxType('income')}
                                    className={`p-4 rounded-2xl text-sm font-bold border transition-all flex flex-col items-center justify-center gap-1 ${txType === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-input border-transparent text-text-muted'}`}
                                >
                                    <ArrowDownLeft size={20} />
                                    {t('tx_type_income')}
                                </button>
                                <button 
                                    onClick={() => setTxType('expense')}
                                    className={`p-4 rounded-2xl text-sm font-bold border transition-all flex flex-col items-center justify-center gap-1 ${txType === 'expense' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-input border-transparent text-text-muted'}`}
                                >
                                    <ArrowUpRight size={20} />
                                    {t('tx_type_expense')}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTxType('lent')}
                                    className={`p-3 rounded-xl text-xs font-semibold border transition-all ${txType === 'lent' ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-input border-transparent text-text-muted'}`}
                                >
                                    {t('tx_type_lent')}
                                </button>
                                <button 
                                    onClick={() => setTxType('borrowed')}
                                    className={`p-3 rounded-xl text-xs font-semibold border transition-all ${txType === 'borrowed' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-input border-transparent text-text-muted'}`}
                                >
                                    {t('tx_type_borrowed')}
                                </button>
                            </div>
                       </div>

                       <Input 
                            type="number" 
                            placeholder={t('money_placeholder')}
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTx()}
                        />
                        <Input 
                            placeholder={txType === 'lent' || txType === 'borrowed' ? t('person_name') : t('money_desc_placeholder')}
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTx()}
                        />
                        
                        {(txType === 'lent' || txType === 'borrowed') && (
                            <Input 
                                type="date"
                                label={t('due_date')}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        )}

                        <Button fullWidth onClick={handleAddTx}>{t('tx_add_btn')}</Button>
                   </div>
               )}

               <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold">{t('tx_history')}</h3>
                   <div className="relative">
                       <button 
                           onClick={() => setShowFilterMenu(!showFilterMenu)}
                           className={`p-2 rounded-full transition-colors ${showFilterMenu || filter !== 'all' ? 'bg-primary text-white' : 'bg-input text-text-muted'}`}
                       >
                           <Filter size={18} />
                       </button>
                   </div>
               </div>

               {showFilterMenu && (
                   <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar animate-in slide-in-from-top-2 fade-in">
                       <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${filter === 'all' ? 'bg-white text-black' : 'bg-[#161616] border border-white/10'}`}>{t('filter_all')}</button>
                       <button onClick={() => setFilter('income')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${filter === 'income' ? 'bg-emerald-500 text-white' : 'bg-[#161616] border border-white/10'}`}>{t('tx_type_income')}</button>
                       <button onClick={() => setFilter('expense')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${filter === 'expense' ? 'bg-red-500 text-white' : 'bg-[#161616] border border-white/10'}`}>{t('tx_type_expense')}</button>
                       <button onClick={() => setFilter('loans')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${filter === 'loans' ? 'bg-purple-500 text-white' : 'bg-[#161616] border border-white/10'}`}>{t('section_loans')}</button>
                   </div>
               )}

               <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                   {transactions.length === 0 && (
                       <p className="text-text-muted text-center text-sm py-10">{t('tx_empty')}</p>
                   )}
                   {transactions.map((t: any) => {
                       const isLoan = t.isLoanObject || t.type === 'lent' || t.type === 'borrowed';
                       const isPaid = t.isPaid;

                       return (
                       <div key={t.id} className={`flex justify-between items-center p-4 rounded-3xl bg-[#161616] border ${isPaid ? 'border-transparent opacity-50' : 'border-white/5'}`}>
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : (isLoan ? 'bg-purple-500/10 text-purple-500' : 'bg-red-500/10 text-red-500')}`}>
                                   {t.type === 'income' ? <ArrowDownLeft size={20} /> : (isLoan ? <MoreHorizontal size={20}/> : <ArrowUpRight size={20} />)}
                               </div>
                               <div>
                                   <p className={`font-bold text-sm ${isPaid ? 'line-through' : ''}`}>{t.description}</p>
                                   {!t.isLoanObject && <p className="text-xs text-text-muted">{new Date(t.date).toLocaleDateString()}</p>}
                                   {t.isLoanObject && <p className="text-xs text-text-muted">{t.type === 'lent' ? 'Lent' : 'Borrowed'}</p>}
                               </div>
                           </div>
                           <div className="flex items-center gap-3">
                               <span className={`font-mono font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                                   {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                               </span>
                               
                               {/* Check button for loans in filter view */}
                               {filter === 'loans' && (
                                   <button 
                                        onClick={() => toggleLoanStatus(t.id)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isPaid ? 'bg-primary text-white' : 'bg-white/10 text-text-muted hover:text-white'}`}
                                   >
                                        <Check size={16} />
                                   </button>
                               )}

                               <button onClick={() => moveToTrash(t, t.type)} className="text-text-muted hover:text-mistake p-1">
                                    <Trash2 size={16} />
                               </button>
                           </div>
                       </div>
                   )})}
               </div>
          </div>
      )
  };

  // Generic List Views (Time Manager, etc.) wrapped in standard layout
  const GenericListView = ({ title, onAdd, items, renderItem, placeholder }: any) => {
    const [newItem, setNewItem] = useState("");
    return (
        <div className="h-full flex flex-col pt-4 pb-24">
            <SectionHeader title={title} onBack={() => setView('dashboard')} />
            
            <div className="flex gap-2 mb-6">
                <Input 
                   value={newItem} 
                   onChange={(e) => setNewItem(e.target.value)} 
                   placeholder={placeholder} 
                   onKeyDown={(e) => e.key === 'Enter' && onAdd(newItem, setNewItem)}
                   className="!mb-0"
                />
                <button 
                   onClick={() => onAdd(newItem, setNewItem)} 
                   className="w-[54px] h-[54px] rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center text-text-muted mt-20 opacity-30">
                        <Trophy size={48} className="mx-auto mb-4" />
                        <p className="text-sm">{t('tasks_empty')}</p>
                    </div>
                ) : (
                    items.map(renderItem)
                )}
            </div>
        </div>
    )
  }

  // --- Main Render Logic ---

  return (
    <div className={`min-h-screen bg-bg text-text-main font-sans selection:bg-primary/30 pb-safe`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto min-h-screen relative p-6">
        
        {view === 'onboarding' && <OnboardingView />}
        
        {view === 'dashboard' && <DashboardView />}
        
        {view === 'time_manager' && (
            <GenericListView 
                title={t('tasks_title')}
                placeholder={t('tasks_placeholder')}
                items={data.tasks.filter(t => t.date === selectedDate)}
                onAdd={(text: string, reset: any) => {
                    if(!text.trim()) return;
                    updateData({ 
                        tasks: [...data.tasks, { id: Date.now().toString(), text, completed: false, isPriority: false, date: selectedDate }] 
                    });
                    reset("");
                }}
                renderItem={(task: any) => (
                    <div key={task.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 ${task.completed ? 'bg-[#161616]/50 border-transparent opacity-50' : 'bg-[#161616] border-white/5'}`}>
                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => updateData({ tasks: data.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) })}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary' : 'border-text-muted'}`}>
                                {task.completed && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <span className={task.completed ? 'line-through text-text-muted' : ''}>{privateMode ? "----" : task.text}</span>
                        </div>
                        <button onClick={() => moveToTrash(task, 'task')} className="text-text-muted hover:text-mistake p-2"><Trash2 size={16} /></button>
                    </div>
                )}
            />
        )}

        {view === 'personal_challenges' && (
             <GenericListView 
                title={t('challenges_title')}
                placeholder={t('challenges_placeholder')}
                items={data.challenges.filter(c => c.date === selectedDate)}
                onAdd={(text: string, reset: any) => {
                    if(!text.trim()) return;
                    updateData({ challenges: [...data.challenges, { id: Date.now().toString(), text, completed: false, date: selectedDate }] });
                    reset("");
                }}
                renderItem={(c: any) => (
                    <Card key={c.id} onClick={() => updateData({ challenges: data.challenges.map(x => x.id === c.id ? { ...x, completed: !x.completed } : x) })} className={`flex items-center gap-4 ${c.completed ? 'border-primary/30 bg-primary/5' : ''}`}>
                         <div className={c.completed ? 'text-primary' : 'text-text-muted'}><Trophy size={20} /></div>
                         <span className={`flex-1 ${c.completed ? 'text-primary' : ''}`}>{privateMode ? "----" : c.text}</span>
                         {c.completed && <CheckCircle2 size={18} className="text-primary" />}
                         <button onClick={(e) => { e.stopPropagation(); moveToTrash(c, 'challenge'); }} className="text-text-muted hover:text-mistake p-1"><Trash2 size={16} /></button>
                    </Card>
                )}
            />
        )}

        {/* Money Saver View replaced by new unified Wallet View logic usually, but kept for direct access */}
        {view === 'money_saver' && (
            <div className="h-full flex flex-col pt-4">
                <SectionHeader title={t('section_money')} onBack={() => setView('dashboard')} />
                <div className="text-center py-12">
                   <h1 className="text-5xl font-display font-bold text-primary tracking-tight">{formatCurrency(data.expenses.filter(e => isSameDay(e.date, selectedDate)).reduce((a,c) => a+c.amount,0))}</h1>
                   <p className="text-text-muted text-sm mt-2">{t('total_spent')}</p>
                </div>
                {/* Redirect to main wallet for adding */}
                <div className="text-center">
                    <Button onClick={() => setView('wallet')}>Go to Wallet to Add</Button>
                </div>
            </div>
        )}

        {view === 'daily_mistakes' && (
             <GenericListView 
                title={t('mistakes_title')}
                placeholder={t('mistakes_placeholder')}
                items={data.mistakes.filter(m => isSameDay(m.date, selectedDate))}
                onAdd={(text: string, reset: any) => {
                     if(!text.trim()) return;
                     updateData({ mistakes: [...data.mistakes, { id: Date.now().toString(), text, date: new Date(selectedDate).toISOString() }] });
                     reset("");
                }}
                renderItem={(m: any) => (
                    <div key={m.id} className="p-4 rounded-3xl bg-mistake/5 border border-mistake/10 text-mistake/90 flex gap-3 justify-between items-center">
                        <div className="flex gap-3">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{privateMode ? "----" : m.text}</p>
                        </div>
                        <button onClick={() => moveToTrash(m, 'mistake')} className="text-text-muted hover:text-mistake p-1"><Trash2 size={16} /></button>
                    </div>
                )}
            />
        )}
        
        {view === 'loans' && <LoansView />}
        {view === 'daily_summary' && (
            <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-8 animate-pulse text-primary">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-display font-bold mb-2">{t('summary_title')}</h2>
                <p className="text-text-muted mb-10">{t('summary_footer')}</p>
                <div className="grid grid-cols-2 gap-4 w-full mb-10">
                     <div className="bg-[#161616] p-5 rounded-3xl border border-white/5">
                        <p className="text-2xl font-bold">{data.tasks.filter(t => t.date === selectedDate && t.completed).length}</p>
                        <p className="text-xs text-text-muted">{t('section_tasks')}</p>
                     </div>
                     <div className="bg-[#161616] p-5 rounded-3xl border border-white/5">
                        <p className="text-2xl font-bold">{formatCurrency(data.expenses.filter(e => isSameDay(e.date, selectedDate)).reduce((a,c) => a+c.amount,0))}</p>
                        <p className="text-xs text-text-muted">{t('money_spent')}</p>
                     </div>
                </div>
                <Button fullWidth onClick={() => setView('dashboard')}>Back Home</Button>
            </div>
        )}

        {view === 'calendar' && <CalendarView />}
        {view === 'wallet' && <WalletView />}
        {view === 'settings' && <SettingsView />}
        {view === 'trash' && <TrashView />}

        <BottomNav />

        {/* Quick Add Modal */}
        {showQuickMenu && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuickMenu(false)}></div>
                
                {/* Modal Content */}
                <div className="bg-[#161616] w-full max-w-sm m-4 rounded-[32px] p-6 relative z-10 animate-in slide-in-from-bottom-10 zoom-in-95 duration-200 border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-display font-bold text-lg">{t('quick_menu_title')}</h3>
                        <button onClick={() => setShowQuickMenu(false)} className="p-2 bg-input rounded-full text-text-muted">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => { setView('time_manager'); setShowQuickMenu(false); setActiveTab('home'); }}
                            className="bg-input p-4 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-[#333]"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <span className="font-semibold text-sm">{t('quick_task')}</span>
                        </button>

                        <button 
                             onClick={() => { setView('wallet'); setShowQuickMenu(false); setActiveTab('wallet'); }}
                            className="bg-input p-4 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-[#333]"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Wallet size={24} />
                            </div>
                            <span className="font-semibold text-sm">{t('quick_wallet')}</span>
                        </button>

                        <button 
                            onClick={() => { setView('personal_challenges'); setShowQuickMenu(false); setActiveTab('home'); }}
                            className="bg-input p-4 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-[#333]"
                        >
                             <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                                <Trophy size={24} />
                            </div>
                            <span className="font-semibold text-sm">{t('quick_challenge')}</span>
                        </button>

                         <button 
                            onClick={() => { setView('daily_mistakes'); setShowQuickMenu(false); setActiveTab('home'); }}
                            className="bg-input p-4 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-[#333]"
                        >
                             <div className="w-12 h-12 rounded-full bg-mistake/10 text-mistake flex items-center justify-center">
                                <AlertCircle size={24} />
                            </div>
                            <span className="font-semibold text-sm">{t('quick_mistake')}</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;