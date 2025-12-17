

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowRight, Shield, Wallet, Clock, Trophy, 
  AlertCircle, Eye, EyeOff, CheckCircle2, 
  Plus, Trash2, ArrowLeft, MoreHorizontal, Settings as SettingsIcon, Lightbulb,
  BarChart3, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Home, User, Bell, Search, Camera, X,
  ArrowUpRight, ArrowDownLeft, BadgeMinus, BadgePlus,
  RefreshCcw, AlertTriangle, Filter, Check, CheckSquare, Scan, FileBarChart
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppData, ViewState, Language, TrashItem, Notification as AppNotification } from './types';
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

// Generate an array of dates around a center date
const getDaysAround = (centerDateStr: string, daysBefore = 3, daysAfter = 14) => {
    const dates = [];
    const center = new Date(centerDateStr);
    for (let i = -daysBefore; i <= daysAfter; i++) {
        const d = new Date(center);
        d.setDate(center.getDate() + i);
        dates.push(d);
    }
    return dates;
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

const Button: React.FC<{ onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; children: React.ReactNode; className?: string; fullWidth?: boolean; disabled?: boolean }> = ({ 
  onClick, variant = 'primary', children, className = "", fullWidth = false, disabled = false 
}) => {
  const baseStyle = "py-3.5 px-6 rounded-full font-display font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-primary text-white hover:bg-primaryDark shadow-glow",
    secondary: "bg-[#2A2A2A] text-white hover:bg-[#333333]",
    danger: "bg-mistake/10 text-mistake border border-mistake/20",
    ghost: "bg-transparent text-text-muted hover:text-white"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
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

// --- Charts Components ---

const WaveShape = ({ color, opacity = 0.2 }: { color: string, opacity?: number }) => (
    <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden rounded-b-3xl pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-full preserve-3d">
            <path fill={color} fillOpacity={opacity} d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
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
            if (!parsed.notifications) parsed.notifications = [];
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
  }, []); 

  // Check language from browser
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('fr')) setLang('fr');
    else setLang('en');
  }, []);

  // Request Notification Permission on mount
  useEffect(() => {
    if (Notification && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
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

  const addInAppNotification = (title: string, message: string, type: AppNotification['type'] = 'info') => {
      const newNotif: AppNotification = {
          id: Date.now().toString() + Math.random(),
          title,
          message,
          date: new Date().toISOString(),
          read: false,
          type
      };
      updateData({ notifications: [newNotif, ...data.notifications] });
  };

  const scheduleNotification = (text: string, time: string) => {
      if (Notification.permission === 'granted') {
          const [hours, mins] = time.split(':').map(Number);
          const now = new Date();
          const target = new Date();
          target.setHours(hours, mins, 0, 0);
          
          if (target > now) {
              const diff = target.getTime() - now.getTime();
              
              if (diff < 21600000) { 
                  setTimeout(() => {
                      new Notification("Life Booster", { body: `It's time for: ${text}` });
                  }, diff);
              }

              const diffEarly = diff - (10 * 60 * 1000); 
              if (diffEarly > 0 && diffEarly < 21600000) {
                   setTimeout(() => {
                      new Notification("Life Booster", { body: `Upcoming in 10m: ${text}` });
                  }, diffEarly);
              }
          }
      }
      
      addInAppNotification("Reminder Set", `We'll remind you 10 mins before: "${text}"`, 'info');
  };

  // Trash Logic
  const moveToTrash = (item: any, type: TrashItem['type']) => {
    const trashItem: TrashItem = { type, data: item, deletedAt: new Date().toISOString() };
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

  const markAllNotificationsRead = () => {
      updateData({
          notifications: data.notifications.map(n => ({ ...n, read: true }))
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

  // ... OnboardingView & NotificationsView remain unchanged ...
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
        try {
            localStorage.setItem('lifebooster_data', JSON.stringify(newData));
        } catch(e) { console.error("Save failed", e); }
        setView('dashboard');
        addInAppNotification("Welcome to Life Booster!", "Your private journey starts now.", 'success');
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

  const NotificationsView = () => {
      const unreadCount = data.notifications.filter(n => !n.read).length;

      return (
          <div className="h-full flex flex-col pt-4 pb-24">
               <SectionHeader 
                  title={t('notifications_title')} 
                  onBack={() => setView('dashboard')} 
                  rightElement={
                      unreadCount > 0 && (
                          <button onClick={markAllNotificationsRead} className="text-xs text-primary font-bold">
                              {t('notifications_mark_read')}
                          </button>
                      )
                  }
               />
               
               <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                   {data.notifications.length === 0 && (
                       <div className="text-center text-text-muted mt-20 opacity-30">
                           <Bell size={48} className="mx-auto mb-4" />
                           <p className="text-sm">{t('notifications_empty')}</p>
                       </div>
                   )}

                   {data.notifications.map(notif => (
                       <div key={notif.id} className={`p-4 rounded-3xl border flex gap-3 ${notif.read ? 'bg-[#161616] border-white/5 opacity-70' : 'bg-[#1C1C1C] border-white/10'}`}>
                           <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.read ? 'bg-transparent' : 'bg-primary'}`}></div>
                           <div className="flex-1">
                               <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-white mb-1">{notif.title}</h4>
                                    <span className="text-[10px] text-text-muted">{new Date(notif.date).toLocaleDateString()}</span>
                               </div>
                               <p className="text-xs text-text-muted leading-relaxed">{notif.message}</p>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      );
  };

  const DashboardView = () => {
    // Generate dates for the scrollable pill selector
    // Center it roughly on the selected date to allow some backward scrolling
    const scrollableDates = useMemo(() => getDaysAround(selectedDate, 3, 7), [selectedDate]);

    const currentTasks = data.tasks.filter(t => t.date === selectedDate);
    const tasksDone = currentTasks.filter(t => t.completed).length;
    const tasksTotal = currentTasks.length;
    const tasksProgress = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;

    const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalBalance = totalIncome - totalExpenses;

    const mistakesCount = data.mistakes.filter(m => isSameDay(m.date, selectedDate)).length;
    const unreadNotifications = data.notifications.filter(n => !n.read).length;

    return (
      <div className="pb-32 animate-in fade-in duration-500">
        <div className="flex justify-between items-start mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-display font-bold">{t('hi')}, {data.name} 👋</h1>
            <p className="text-text-muted text-xs mt-1">{t('dashboard_subtitle')}</p>
          </div>
          <div className="flex gap-3">
             <IconButton icon={privateMode ? <EyeOff size={20} /> : <Eye size={20} />} onClick={() => setPrivateMode(!privateMode)} />
             <div className="relative">
                 <IconButton icon={<Bell size={20} />} onClick={() => setView('notifications')} />
                 {unreadNotifications > 0 && (
                     <div className="absolute top-0 right-0 w-3 h-3 bg-mistake rounded-full border-2 border-[#050505] flex items-center justify-center"></div>
                 )}
             </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#161616] to-[#0A0A0A] rounded-[32px] p-6 mb-6 border border-white/10 relative overflow-hidden shadow-2xl">
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
        
        {/* Horizontal Date Picker */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar px-1">
            {scrollableDates.map((d, idx) => {
                const dateStr = getISODate(d);
                const isSelected = dateStr === selectedDate;
                return (
                    <button 
                        key={idx}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`min-w-[56px] h-[72px] rounded-[24px] flex flex-col items-center justify-center gap-1 transition-all duration-300 border ${isSelected ? 'bg-white text-black border-white shadow-glow' : 'bg-[#161616] text-text-muted border-white/5 hover:bg-[#202020]'}`}
                    >
                        <span className={`text-[10px] font-medium ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                            {d.toLocaleDateString((lang === 'fr' || lang === 'dr') ? 'fr-FR' : 'en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-bold">
                            {d.getDate()}
                        </span>
                        {isSelected && <div className="w-1 h-1 rounded-full bg-black mt-1"></div>}
                        {!isSelected && data.tasks.some(t => t.date === dateStr) && <div className="w-1 h-1 rounded-full bg-white/30 mt-1"></div>}
                    </button>
                )
            })}
        </div>

        <h3 className="text-lg font-bold mb-4">{t('quick_overview')}</h3>
        <div className="grid grid-cols-2 gap-3">
            <div onClick={() => setView('time_manager')} className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3"><Clock size={20} /></div>
                <div><h4 className="font-bold text-sm text-white mb-1">{t('section_tasks')}</h4><p className="text-xs text-text-muted">{tasksTotal - tasksDone} {t('pending')}</p></div>
            </div>
            <div onClick={() => { setActiveTab('wallet'); setView('wallet'); }} className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3"><Wallet size={20} /></div>
                <div><h4 className="font-bold text-sm text-white mb-1">{t('section_wallet')}</h4><p className="text-xs text-text-muted">{formatCurrency(totalBalance)}</p></div>
            </div>
            <div onClick={() => setView('personal_challenges')} className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-3"><Trophy size={20} /></div>
                <div><h4 className="font-bold text-sm text-white mb-1">{t('section_challenges')}</h4><p className="text-xs text-text-muted">{t('push_yourself')}</p></div>
            </div>
             <div onClick={() => setView('daily_mistakes')} className="bg-[#161616] p-5 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex flex-col justify-between h-36">
                <div className="w-10 h-10 rounded-full bg-mistake/10 flex items-center justify-center text-mistake mb-3"><AlertCircle size={20} /></div>
                <div><h4 className="font-bold text-sm text-white mb-1">{t('section_mistakes')}</h4><p className="text-xs text-text-muted">{mistakesCount} {t('logged')}</p></div>
            </div>
            <div onClick={() => setView('loans')} className="col-span-2 bg-[#161616] p-4 rounded-3xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-[#1C1C1C] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500"><MoreHorizontal size={20} /></div>
                    <div><h4 className="font-bold text-sm text-white">{t('section_loans')}</h4><p className="text-xs text-text-muted">{t('track_debts')}</p></div>
                </div>
                <ChevronRight size={20} className="text-text-muted" />
            </div>
        </div>
      </div>
    );
  };

  const ReportView = () => {
      // Logic for reports
      const totalCompleted = data.tasks.filter(t => t.completed).length;
      const totalOngoing = data.tasks.filter(t => !t.completed).length;

      // Last 7 days data for charts
      const last7Days = useMemo(() => {
          const arr = [];
          for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const dateStr = getISODate(d);
              
              const dayTasks = data.tasks.filter(t => t.date === dateStr);
              const completed = dayTasks.filter(t => t.completed).length;
              const ongoing = dayTasks.length - completed;
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

              arr.push({ day: dayName, completed, ongoing, date: dateStr });
          }
          return arr;
      }, [data.tasks]);

      return (
        <div className="h-full flex flex-col pt-4 pb-24 animate-in fade-in slide-in-from-right-10 duration-500">
             <SectionHeader title="Report" onBack={() => setView('dashboard')} rightElement={<CalendarIcon size={20} className="text-text-muted"/>} />

             <h3 className="font-bold text-lg mb-4">Task Overview</h3>
             <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-gradient-to-br from-[#8E8B98] to-[#5D4E6D] rounded-3xl p-5 relative overflow-hidden h-36 flex flex-col justify-between shadow-lg">
                      <div className="relative z-10">
                          <h4 className="text-4xl font-bold text-white mb-1">{totalCompleted}</h4>
                          <p className="text-xs text-white/80 font-medium">Completed Task</p>
                      </div>
                      <WaveShape color="#FFFFFF" opacity={0.15} />
                 </div>
                 <div className="bg-gradient-to-br from-[#ECA376] to-[#D97D54] rounded-3xl p-5 relative overflow-hidden h-36 flex flex-col justify-between shadow-lg">
                      <div className="relative z-10">
                          <h4 className="text-4xl font-bold text-white mb-1">{totalOngoing}</h4>
                          <p className="text-xs text-white/80 font-medium">Ongoing Task</p>
                      </div>
                      <WaveShape color="#FFFFFF" opacity={0.15} />
                 </div>
             </div>

             <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 mb-6">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-sm">Daily tasks overview</h3>
                     <span className="text-[10px] text-text-muted">{getISODate(new Date())}</span>
                 </div>
                 
                 {/* CSS Bar Chart */}
                 <div className="flex items-end justify-between h-32 gap-2">
                     {last7Days.map((d, i) => {
                         const maxH = 100; // max height pixels roughly
                         // Determine max value for scaling (simple scaling)
                         const maxVal = Math.max(...last7Days.map(x => x.completed + x.ongoing), 5);
                         
                         const hCompleted = (d.completed / maxVal) * 100;
                         const hOngoing = (d.ongoing / maxVal) * 100;

                         return (
                             <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                 <div className="w-full flex gap-1 items-end justify-center h-full">
                                      {/* Completed Bar */}
                                     <div 
                                        className="w-1.5 bg-[#8E8B98] rounded-t-full transition-all duration-500"
                                        style={{ height: `${Math.max(hCompleted, 5)}%` }}
                                     ></div>
                                     {/* Ongoing Bar */}
                                     <div 
                                        className="w-1.5 bg-[#ECA376] rounded-t-full transition-all duration-500"
                                        style={{ height: `${Math.max(hOngoing, 5)}%` }}
                                     ></div>
                                 </div>
                                 <span className="text-[10px] text-text-muted">{d.day}</span>
                             </div>
                         )
                     })}
                 </div>
                 <div className="flex justify-center gap-4 mt-4">
                     <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-[#8E8B98]"></div>
                         <span className="text-[10px] text-text-muted">Complet</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-[#ECA376]"></div>
                         <span className="text-[10px] text-text-muted">Ongoing</span>
                     </div>
                 </div>
             </div>

             <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5">
                 <div className="flex justify-between items-center mb-2">
                     <div className="flex flex-col">
                        <h3 className="font-bold text-sm">Project overview</h3>
                        <span className="text-[10px] text-text-muted">Avg activity: {Math.round(totalCompleted/7)} tasks/day</span>
                     </div>
                     <span className="text-[10px] text-text-muted flex items-center gap-1">Weekly <ChevronLeft size={10} className="-rotate-90"/></span>
                 </div>
                 
                 {/* Simple SVG Line Chart */}
                 <div className="h-32 w-full relative pt-4">
                      <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          <defs>
                              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ECA376" stopOpacity="0.3"/>
                                  <stop offset="100%" stopColor="#ECA376" stopOpacity="0"/>
                              </linearGradient>
                          </defs>
                          {/* Generate path based on completed tasks */}
                          {(() => {
                              const points = last7Days.map((d, i) => {
                                  const x = (i / (last7Days.length - 1)) * 100;
                                  const maxVal = Math.max(...last7Days.map(x => x.completed), 1);
                                  const y = 50 - ((d.completed / maxVal) * 40); // 50 is height
                                  return `${x},${y}`;
                              }).join(" ");
                              
                              return (
                                  <>
                                    <path d={`M0,50 ${points} 100,50`} fill="url(#lineGradient)" />
                                    <polyline points={points} fill="none" stroke="#ECA376" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </>
                              )
                          })()}
                      </svg>
                      {/* X Axis Labels */}
                      <div className="flex justify-between mt-2 px-1">
                          {last7Days.map((d, i) => (
                              <span key={i} className="text-[8px] text-text-muted">{d.day}</span>
                          ))}
                      </div>
                 </div>
             </div>
        </div>
      );
  };
  
  // SettingsView, TrashView, LoansView, WalletView remain same...
  const SettingsView = () => {
      const [localName, setLocalName] = useState(data.name);
      const handleSave = () => { updateData({ name: localName }); setActiveTab('home'); setView('dashboard'); };
      const handleReset = () => { if (window.confirm(t('reset_confirm_msg'))) { localStorage.clear(); window.location.reload(); } };

      return (
          <div className="h-full flex flex-col pt-8 pb-20 overflow-y-auto no-scrollbar">
               <div className="flex items-center justify-between mb-8 px-2">
                  <h2 className="text-2xl font-bold font-display">{t('settings_title')}</h2>
                  <div className="w-10"></div> 
               </div>
               <div className="flex flex-col items-center mb-10">
                   <div className="w-28 h-28 rounded-full bg-[#161616] p-1.5 border border-white/5 shadow-2xl mb-4">
                       <div className="w-full h-full rounded-full bg-[#2A2A2A] flex items-center justify-center overflow-hidden relative shadow-inner"><span className="text-4xl font-display font-bold text-white">{data.name ? data.name.charAt(0).toUpperCase() : "U"}</span></div>
                   </div>
                   <h3 className="text-xl font-bold">{data.name}</h3>
                   <p className="text-xs text-text-muted uppercase tracking-widest mt-1">ID: LIFE-{Math.floor(Math.random() * 9000) + 1000}</p>
               </div>
               <div className="px-4 space-y-6">
                   <Input label="Display Name" value={localName} onChange={(e) => setLocalName(e.target.value)} />
                   <button onClick={() => setView('trash')} className="w-full p-4 rounded-2xl bg-input text-left flex items-center justify-between group active:scale-95 transition-all">
                       <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#161616] flex items-center justify-center text-text-muted group-hover:text-mistake transition-colors"><Trash2 size={20} /></div><span className="font-medium text-sm">{t('trash_title')}</span></div>
                       <div className="flex items-center gap-2 text-text-muted text-xs">{data.trash.length > 0 && <span className="bg-mistake/20 text-mistake px-2 py-0.5 rounded-full">{data.trash.length}</span>}<ChevronRight size={16} /></div>
                   </button>
                   <div>
                       <label className="block text-text-muted text-xs font-medium mb-2 ml-1">{t('settings_gender')}</label>
                       <div className="grid grid-cols-2 gap-3 p-1 bg-input rounded-2xl">
                            <button onClick={() => updateData({ gender: 'male' })} className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${data.gender === 'male' ? 'bg-[#333] text-white shadow-md' : 'text-text-muted hover:text-white'}`}>{t('settings_male')}</button>
                            <button onClick={() => updateData({ gender: 'female' })} className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${data.gender === 'female' ? 'bg-[#333] text-white shadow-md' : 'text-text-muted hover:text-white'}`}>{t('settings_female')}</button>
                       </div>
                   </div>
                   <div>
                       <label className="block text-text-muted text-xs font-medium mb-2 ml-1">{t('settings_currency')}</label>
                       <div className="relative">
                           <select value={data.currency} onChange={(e) => updateData({ currency: e.target.value })} className="w-full appearance-none bg-input border border-transparent rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 text-sm">{CURRENCIES.map(c => (<option key={c.code} value={c.code}>{c.code} - {c.name}</option>))}</select>
                           <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-muted`} size={16} />
                       </div>
                   </div>
                   <div>
                       <label className="block text-text-muted text-xs font-medium mb-2 ml-1">{t('settings_language')}</label>
                       <div className="grid grid-cols-3 gap-3">
                           <button onClick={() => setLang('en')} className={`p-4 rounded-2xl text-sm font-medium transition-all ${lang === 'en' ? 'bg-primary text-white' : 'bg-input text-text-muted'}`}>English</button>
                           <button onClick={() => setLang('fr')} className={`p-4 rounded-2xl text-sm font-medium transition-all ${lang === 'fr' ? 'bg-primary text-white' : 'bg-input text-text-muted'}`}>Français</button>
                           <button onClick={() => setLang('dr')} className={`p-4 rounded-2xl text-sm font-medium transition-all ${lang === 'dr' ? 'bg-primary text-white' : 'bg-input text-text-muted'}`}>Darija</button>
                       </div>
                   </div>
                   <div className="pt-4"><Button fullWidth onClick={handleSave}>Save Changes</Button></div>
                   <div className="pt-4"><Button variant="danger" fullWidth onClick={handleReset}>{t('settings_reset')}</Button></div>
               </div>
          </div>
      )
  };
  
  const TrashView = () => {
    return (
        <div className="h-full flex flex-col pt-4 pb-24">
            <SectionHeader title={t('trash_title')} onBack={() => setView('settings')} />
            {data.trash.length > 0 && (<div className="mb-4 px-1"><p className="text-xs text-text-muted flex items-center gap-2"><AlertTriangle size={12} />{t('trash_warning')}</p></div>)}
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {data.trash.length === 0 && (<div className="text-center text-text-muted mt-20 opacity-30"><Trash2 size={48} className="mx-auto mb-4" /><p className="text-sm">{t('trash_empty')}</p></div>)}
                {data.trash.map((item, idx) => {
                    const text = (item.data as any).text || (item.data as any).description || (item.data as any).person;
                    const amount = (item.data as any).amount;
                    return (
                        <div key={idx} className="bg-[#161616] p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div><div className="flex items-center gap-2 mb-1"><span className="text-[10px] uppercase bg-white/10 px-2 rounded text-text-muted font-bold">{item.type}</span><span className="text-xs text-text-muted">{new Date(item.deletedAt).toLocaleDateString()}</span></div><p className="font-bold text-sm line-clamp-1">{text}</p>{amount && <p className="text-xs font-mono">{formatCurrency(amount)}</p>}</div>
                            </div>
                            <div className="flex gap-2 mt-1"><button onClick={() => restoreFromTrash(item)} className="flex-1 bg-primary/10 text-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/20"><RefreshCcw size={14} />{t('trash_restore')}</button><button onClick={() => deletePermanently((item.data as any).id)} className="flex-1 bg-mistake/10 text-mistake py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-mistake/20"><Trash2 size={14} />{t('trash_delete')}</button></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const LoansView = () => {
    const totalLent = data.loans.filter(l => l.type === 'lent' && !l.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
    const totalBorrowed = data.loans.filter(l => l.type === 'borrowed' && !l.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
    return (
      <div className="h-full flex flex-col pt-4 pb-24">
        <SectionHeader title={t('section_loans')} onBack={() => setView('dashboard')} />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#161616] p-4 rounded-3xl border border-white/5"><p className="text-xs text-text-muted mb-1">{t('loans_lent')}</p><p className="text-xl font-bold text-green-500">{formatCurrency(totalLent)}</p></div>
          <div className="bg-[#161616] p-4 rounded-3xl border border-white/5"><p className="text-xs text-text-muted mb-1">{t('loans_borrowed')}</p><p className="text-xl font-bold text-red-500">{formatCurrency(totalBorrowed)}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
            {data.loans.length === 0 && <p className="text-text-muted text-center text-sm">No records yet</p>}
            {data.loans.map(loan => (
                <div key={loan.id} className={`flex justify-between items-center p-4 rounded-3xl bg-[#161616] border ${loan.isPaid ? 'border-transparent opacity-50' : 'border-white/5'}`}>
                    <div><p className={`font-bold ${loan.isPaid ? 'line-through text-text-muted' : ''}`}>{loan.person}</p><p className={`text-xs ${loan.type === 'lent' ? 'text-green-500' : 'text-red-500'}`}>{loan.isPaid ? t('loan_paid') : (loan.type === 'lent' ? 'Owes you' : 'You owe')}</p>{loan.dueDate && !loan.isPaid && (<p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5"><Clock size={10} />{new Date(loan.dueDate).toLocaleDateString()}</p>)}</div>
                    <div className="flex items-center gap-2"><span className="font-mono font-bold mr-2">{formatCurrency(loan.amount)}</span><button onClick={() => toggleLoanStatus(loan.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loan.isPaid ? 'bg-primary text-white' : 'bg-white/10 text-text-muted hover:text-white'}`}><Check size={16} /></button><button onClick={() => moveToTrash(loan, 'loan')} className="text-text-muted hover:text-mistake p-1"><Trash2 size={16} /></button></div>
                </div>
            ))}
        </div>
      </div>
    );
  };

  const CalendarView = () => {
      const today = new Date();
      const [currentMonth, setCurrentMonth] = useState(today.getMonth());
      const [currentYear, setCurrentYear] = useState(today.getFullYear());
      
      // Fix hydration mismatch by initializing with null/stable value and updating in effect
      const [now, setNow] = useState<Date | null>(null);

      useEffect(() => {
          setNow(new Date());
          const timer = setInterval(() => setNow(new Date()), 60000);
          return () => clearInterval(timer);
      }, []);
      
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay(); 

      const monthName = new Date(currentYear, currentMonth).toLocaleString((lang === 'fr' || lang === 'dr') ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(i);

      // Tasks for the selected day for the TIMELINE
      const selectedDayTasks = data.tasks.filter(t => t.date === selectedDate).sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
      });

      // Progress for timeline
      const total = selectedDayTasks.length;
      const done = selectedDayTasks.filter(t => t.completed).length;
      const progress = total > 0 ? (done / total) * 100 : 0;

      // Check if a day has events for dot indicator
      const hasEvents = (day: number) => {
          const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          return data.tasks.some(t => t.date === dStr);
      };

      const hasCompletedEvents = (day: number) => {
          const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          return data.tasks.some(t => t.date === dStr && t.completed);
      };

      // Helper to check if we should render the red "Current Time" line
      const isToday = isSameDay(new Date().toISOString(), selectedDate);
      let timeLineRendered = false;

      return (
          <div className="h-full flex flex-col pt-4 pb-24">
               {/* Calendar Header */}
               <div className="flex items-center justify-between mb-4 px-4">
                  <button onClick={() => setCurrentMonth(prev => prev - 1)} className="text-white hover:text-primary transition-colors"><ChevronLeft size={24}/></button>
                  <h3 className="font-display font-bold text-xl capitalize">{monthName}</h3>
                  <button onClick={() => setCurrentMonth(prev => prev + 1)} className="text-white hover:text-primary transition-colors"><ChevronRight size={24}/></button>
               </div>

               {/* Days of Week */}
               <div className="grid grid-cols-7 gap-0 px-2 text-center text-[10px] uppercase font-bold text-text-muted mb-4">
                   {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
               </div>

               {/* Calendar Grid */}
               <div className="grid grid-cols-7 gap-y-2 px-2 mb-4 border-b border-white/5 pb-6">
                   {days.map((day, i) => {
                       if (!day) return <div key={i} className="aspect-square"></div>;
                       
                       const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                       const isSelected = dateStr === selectedDate;
                       const isDateToday = isSameDay(new Date().toISOString(), dateStr);
                       const completed = hasCompletedEvents(day);
                       const hasItems = hasEvents(day);

                       return (
                           <div 
                               key={i} 
                               onClick={() => setSelectedDate(dateStr)}
                               className="flex flex-col items-center justify-center aspect-square cursor-pointer relative"
                           >
                               <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all 
                                   ${isSelected ? 'bg-primary text-white shadow-glow' : 
                                     (isDateToday ? 'border border-primary text-primary' : 'text-white hover:bg-white/5')}
                               `}>
                                   {day}
                               </div>
                               
                               <div className="flex gap-0.5 mt-1 absolute bottom-1">
                                    {completed && <div className="w-1 h-1 bg-primary rounded-full"></div>}
                                    {!completed && hasItems && <div className="w-1 h-1 bg-text-muted rounded-full"></div>}
                               </div>
                           </div>
                       );
                   })}
               </div>

               {/* iOS Style Timeline */}
               <div className="flex-1 px-4 overflow-y-auto no-scrollbar">
                  {/* Today Tasks Summary Card - Matching Design */}
                  <div className="bg-[#1C1C1E] p-5 rounded-3xl mb-8 relative overflow-hidden shadow-lg border border-white/5">
                      {/* Subtle Glow Effect */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full -ml-10 -mb-10 pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="flex flex-col">
                              <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                                  <CheckSquare size={20} className="text-white" strokeWidth={2.5} />
                                  {t('tasks_title')}
                              </h3>
                              <p className="text-xs text-text-muted mt-1 font-medium pl-0.5">
                                  {new Date(selectedDate).toLocaleDateString((lang === 'fr' || lang === 'dr') ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <span className="font-bold text-xs">{Math.round(progress)}%</span>
                          </div>
                      </div>

                      <div className="relative z-10">
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-xs font-bold text-text-muted">Progress</span>
                          </div>
                          <div className="h-2 bg-[#000000]/50 rounded-full overflow-hidden backdrop-blur-sm">
                              <div 
                                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                                style={{ width: `${progress}%` }}
                              ></div>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="font-bold text-lg">Daily tasks</h3>
                    <button className="text-xs text-text-muted hover:text-white font-medium">View all</button>
                  </div>
                  
                  <div className="relative pl-2 pb-10">
                     {/* Vertical dashed line */}
                     <div className="absolute left-[3.5rem] top-0 bottom-0 w-px border-l-2 border-dashed border-[#2A2A2A]"></div>

                     {selectedDayTasks.length === 0 ? (
                        <div className="text-center text-text-muted py-10 opacity-50 pl-12">
                            <p className="text-sm">{t('calendar_empty')}</p>
                        </div>
                     ) : (
                         selectedDayTasks.map((task, index) => {
                            const taskTime = task.time || "23:59";
                            // Ensure now is loaded
                            const currentHM = now ? `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}` : "00:00";
                            
                            // Determine if we should show the "Current Time" line
                            let showLine = false;
                            if (isToday && now && !timeLineRendered) {
                                // If current time is less than task time, show it here
                                if (currentHM < taskTime) {
                                    showLine = true;
                                    timeLineRendered = true;
                                } else if (index === selectedDayTasks.length - 1 && currentHM > taskTime) {
                                    // Could show at end, but sticking to logic of finding first slot
                                }
                            }

                            return (
                                <React.Fragment key={task.id}>
                                    {showLine && now && (
                                        <div className="flex items-center gap-3 mb-8 relative animate-in fade-in slide-in-from-left-4">
                                            <span className="text-xs font-bold text-red-500 w-10 text-right shrink-0">
                                                {now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}
                                            </span>
                                            <div className="w-3 h-3 rounded-full bg-red-500 z-10 -ml-[0.45rem] shadow-[0_0_8px_rgba(239,68,68,0.6)] border-2 border-[#050505]"></div>
                                            <div className="flex-1 h-px border-t-2 border-dashed border-red-500/50"></div>
                                        </div>
                                    )}
                                    
                                    <div className="relative flex gap-4 group mb-6">
                                        {/* Time Column */}
                                        <div className="w-10 text-right pt-1 text-xs text-text-muted font-semibold shrink-0">
                                            {task.time || "--:--"}
                                        </div>

                                        {/* Timeline Dot */}
                                        <div className={`absolute left-[3.2rem] top-1.5 w-3.5 h-3.5 rounded-full z-10 border-[3px] transition-colors
                                            ${task.completed ? 'bg-primary border-[#050505]' : 'bg-[#1C1C1E] border-text-muted'}
                                        `}></div>

                                        {/* Task Card */}
                                        <div 
                                            className={`flex-1 p-4 rounded-[20px] border transition-all duration-300 relative overflow-hidden
                                                ${task.completed ? 'bg-[#161616]/30 border-white/5 opacity-60' : 'bg-[#1C1C1E] border-white/5 hover:border-white/10 active:scale-[0.98]'}
                                            `}
                                            onClick={() => updateData({ tasks: data.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) })}
                                        >
                                            <div className="relative z-10">
                                                <h4 className={`font-bold text-sm mb-2 ${task.completed ? 'line-through text-text-muted' : 'text-white'}`}>
                                                    {task.text}
                                                </h4>
                                                
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-text-muted font-medium mb-3">
                                                    {task.time && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={12} className="text-text-muted" />
                                                            <span>Due {task.time}</span>
                                                        </div>
                                                    )}
                                                    {task.isPriority && (
                                                        <div className="flex items-center gap-1.5 text-secondary">
                                                            <div className="w-1.5 h-1.5 rotate-45 bg-secondary rounded-[1px]"></div>
                                                            <span>Priority: High</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tags Row */}
                                                <div className="flex gap-2">
                                                    <span className="px-2.5 py-1 rounded-lg bg-[#2C2C2E] text-purple-400 text-[10px] font-semibold border border-purple-500/10">
                                                        {task.isPriority ? 'Important' : 'Task'}
                                                    </span>
                                                    {task.completed && (
                                                         <span className="px-2.5 py-1 rounded-lg bg-[#2C2C2E] text-emerald-400 text-[10px] font-semibold border border-emerald-500/10">
                                                            Done
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                         })
                     )}
                     
                     {/* If current time is after all tasks, show line at bottom */}
                     {isToday && now && !timeLineRendered && selectedDayTasks.length > 0 && (
                        <div className="flex items-center gap-3 mt-2 relative animate-in fade-in">
                            <span className="text-xs font-bold text-red-500 w-10 text-right shrink-0">
                                {now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}
                            </span>
                            <div className="w-3 h-3 rounded-full bg-red-500 z-10 -ml-[0.45rem] shadow-[0_0_8px_rgba(239,68,68,0.6)] border-2 border-[#050505]"></div>
                            <div className="flex-1 h-px border-t-2 border-dashed border-red-500/50"></div>
                        </div>
                     )}
                  </div>
               </div>
          </div>
      )
  };

  const WalletView = () => {
    // ... WalletView remains unchanged ...
      const totalIncome = (data.incomes || []).reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpense = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
      const balance = totalIncome - totalExpense;

      const [newAmount, setNewAmount] = useState("");
      const [newDesc, setNewDesc] = useState("");
      const [txType, setTxType] = useState<'income' | 'expense' | 'lent' | 'borrowed'>('expense');
      const [dueDate, setDueDate] = useState(""); 
      const [showAdd, setShowAdd] = useState(false);
      const [isAnalyzing, setIsAnalyzing] = useState(false);
      const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'loans'>('all');
      const [showFilterMenu, setShowFilterMenu] = useState(false);
      
      const fileInputRef = useRef<HTMLInputElement>(null);

      const handleAddTx = () => {
          if (!newAmount) return;
          const amt = parseFloat(newAmount);
          const date = new Date(selectedDate);
          const now = new Date();
          date.setHours(now.getHours(), now.getMinutes());
          const dateStr = date.toISOString();

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
          
          addInAppNotification("Transaction Added", `Added ${formatCurrency(amt)} to ${txType}`, 'success');
      };

      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (!process.env.API_KEY) {
              alert("API Key missing");
              return;
          }

          setIsAnalyzing(true);
          try {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onloadend = async () => {
                  const base64Data = reader.result as string;
                  const base64Content = base64Data.split(',')[1];

                  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                  const prompt = `Analyze this image (receipt or statement). Extract transactions. Return ONLY a JSON array with objects: { "amount": number, "description": "string", "type": "income" or "expense" }. Ignore dates, assume today.`;
                  
                  const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                      parts: [
                        { text: prompt },
                        { 
                          inlineData: { 
                            data: base64Content, 
                            mimeType: file.type 
                          } 
                        }
                      ]
                    }
                  });
                  
                  const text = result.text || "";
                  const jsonStr = text.replace(/```json|```/g, '').trim();
                  const parsed = JSON.parse(jsonStr);

                  if (Array.isArray(parsed)) {
                      const newIncomes = [...data.incomes];
                      const newExpenses = [...data.expenses];
                      const nowStr = new Date().toISOString();

                      parsed.forEach((tx: any) => {
                          if (tx.type === 'income') {
                              newIncomes.push({ id: Date.now().toString() + Math.random(), amount: tx.amount, description: tx.description, date: nowStr });
                          } else {
                              newExpenses.push({ id: Date.now().toString() + Math.random(), amount: tx.amount, description: tx.description, date: nowStr });
                          }
                      });
                      updateData({ incomes: newIncomes, expenses: newExpenses });
                      addInAppNotification("Scan Complete", `Added ${parsed.length} transaction(s)`, 'success');
                  }
              };
          } catch (err) {
              console.error(err);
              alert(t('scan_error'));
          } finally {
              setIsAnalyzing(false);
          }
      };

      const transactions = useMemo(() => {
          let incomes = (data.incomes || []).map(i => ({ ...i, type: 'income', isPaid: false })); 
          let expenses = data.expenses.map(e => ({ ...e, type: 'expense', isPaid: false }));
          
           const loansAsTransactions = data.loans.map(l => ({
              id: l.id,
              amount: l.amount,
              description: l.person, 
              date: new Date().toISOString(), 
              type: l.type,
              isPaid: l.isPaid,
              isLoanObject: true 
          }));

          let all = [...incomes, ...expenses];
          
          if (filter === 'income') return all.filter(t => t.type === 'income').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (filter === 'expense') return all.filter(t => t.type === 'expense').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (filter === 'loans') {
             return [...data.loans].reverse().map(l => ({
                 ...l,
                 description: l.person,
                 date: new Date().toISOString(), 
                 isLoanObject: true
             }));
          }

          return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }, [data.incomes, data.expenses, data.loans, filter]);

      return (
          <div className="h-full flex flex-col pt-4 pb-24">
               <SectionHeader 
                  title={t('section_wallet')} 
                  rightElement={
                    <button onClick={() => setShowAdd(!showAdd)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10">
                        {showAdd ? <X size={20}/> : <Plus size={20}/>}
                    </button>
                  }
               />

               {/* Clean Balance Card */}
               <div className="bg-[#161616] p-6 rounded-3xl border border-white/5 mb-6 text-center">
                    <p className="text-text-muted text-sm mb-2 uppercase tracking-widest">{t('money_balance')}</p>
                    <h1 className="text-5xl font-display font-bold text-white mb-6">{formatCurrency(balance)}</h1>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                        <div>
                             <p className="text-xs text-text-muted mb-1 flex items-center justify-center gap-1"><ArrowDownLeft size={12} className="text-emerald-500"/> {t('money_income')}</p>
                             <p className="text-lg font-mono font-bold text-white">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div>
                             <p className="text-xs text-text-muted mb-1 flex items-center justify-center gap-1"><ArrowUpRight size={12} className="text-red-500"/> {t('money_spent')}</p>
                             <p className="text-lg font-mono font-bold text-white">{formatCurrency(totalExpense)}</p>
                        </div>
                    </div>
               </div>

               {/* AI Scan Mini Button */}
               <div className="flex justify-center mb-6">
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                   <button 
                       onClick={() => fileInputRef.current?.click()}
                       disabled={isAnalyzing}
                       className="flex items-center gap-2 text-xs text-text-muted bg-[#1A1A1A] px-4 py-2 rounded-full hover:text-white transition-colors"
                   >
                       {isAnalyzing ? <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div> : <Scan size={14} />}
                       {isAnalyzing ? t('analyzing') : t('scan_btn')}
                   </button>
               </div>

               {showAdd && (
                   <div className="bg-[#161616] p-5 rounded-3xl border border-white/5 mb-6 animate-in slide-in-from-top-4 fade-in">
                       <h3 className="font-bold mb-4 text-sm">{t('tx_add_btn')}</h3>
                       
                       <div className="flex flex-col gap-3 mb-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTxType('income')}
                                    className={`p-4 rounded-2xl text-sm font-bold border transition-all flex flex-col items-center justify-center gap-1 ${txType === 'income' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-[#262626] border-transparent text-text-muted'}`}
                                >
                                    <ArrowDownLeft size={20} />
                                    {t('tx_type_income')}
                                </button>
                                <button 
                                    onClick={() => setTxType('expense')}
                                    className={`p-4 rounded-2xl text-sm font-bold border transition-all flex flex-col items-center justify-center gap-1 ${txType === 'expense' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-[#262626] border-transparent text-text-muted'}`}
                                >
                                    <ArrowUpRight size={20} />
                                    {t('tx_type_expense')}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTxType('lent')}
                                    className={`p-3 rounded-xl text-xs font-semibold border transition-all ${txType === 'lent' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-[#262626] border-transparent text-text-muted'}`}
                                >
                                    {t('tx_type_lent')}
                                </button>
                                <button 
                                    onClick={() => setTxType('borrowed')}
                                    className={`p-3 rounded-xl text-xs font-semibold border transition-all ${txType === 'borrowed' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-[#262626] border-transparent text-text-muted'}`}
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

               <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-6">
                   {transactions.length === 0 && (
                       <p className="text-text-muted text-center text-sm py-10 opacity-50">{t('tx_empty')}</p>
                   )}
                   {transactions.map((t: any) => {
                       const isLoan = t.isLoanObject || t.type === 'lent' || t.type === 'borrowed';
                       const isPaid = t.isPaid;

                       return (
                       <div key={t.id} className={`flex justify-between items-center p-4 rounded-3xl bg-[#161616] border border-white/5`}>
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : (isLoan ? 'bg-purple-500/10 text-purple-500' : 'bg-red-500/10 text-red-500')}`}>
                                   {t.type === 'income' ? <ArrowDownLeft size={20} /> : (isLoan ? <MoreHorizontal size={20}/> : <ArrowUpRight size={20} />)}
                               </div>
                               <div>
                                   <p className={`font-bold text-sm ${isPaid ? 'line-through text-text-muted' : 'text-white'}`}>{t.description}</p>
                                   {!t.isLoanObject && <p className="text-xs text-text-muted">{new Date(t.date).toLocaleDateString()}</p>}
                                   {t.isLoanObject && <p className="text-xs text-text-muted">{t.type === 'lent' ? 'Lent' : 'Borrowed'}</p>}
                               </div>
                           </div>
                           <div className="flex items-center gap-3">
                               <span className={`font-mono font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                                   {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                               </span>
                               
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

  // GenericListView and Main Render Logic remain the same...
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
                   className="w-[54px] h-[54px] rounded-2xl bg-primary flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center text-text-muted mt-20 opacity-30">
                        <Trophy size={48} className="mx-auto mb-4" />
                        <p className="text-sm">Nothing here yet.</p>
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
        
        {view === 'notifications' && <NotificationsView />}
        
        {view === 'time_manager' && (
            <div className="h-full flex flex-col pt-4 pb-24">
                <SectionHeader title={t('tasks_title')} onBack={() => setView('dashboard')} />
                {(() => {
                    const [newItem, setNewItem] = useState("");
                    const [newTime, setNewTime] = useState(""); 
                    const [showTimeInput, setShowTimeInput] = useState(false);

                    const handleAddTask = () => {
                        if(!newItem.trim()) return;
                        
                        if(newTime) {
                            scheduleNotification(newItem, newTime);
                        }

                        updateData({ 
                            tasks: [...data.tasks, { id: Date.now().toString(), text: newItem, completed: false, isPriority: false, date: selectedDate, time: newTime }] 
                        });
                        
                        setNewItem("");
                        setNewTime("");
                        setShowTimeInput(false);
                    };

                    const items = data.tasks.filter(t => t.date === selectedDate);
                    
                    return (
                        <>
                            <div className="mb-6 space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-[#262626] rounded-2xl flex items-center pr-2">
                                        <input 
                                            value={newItem} 
                                            onChange={(e) => setNewItem(e.target.value)} 
                                            placeholder={t('tasks_placeholder')} 
                                            className="bg-transparent w-full p-4 text-white focus:outline-none placeholder-text-dark text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                        />
                                        <button 
                                            onClick={() => setShowTimeInput(!showTimeInput)} 
                                            className={`p-2 rounded-full transition-colors ${showTimeInput || newTime ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-white'}`}
                                        >
                                            <Clock size={20} />
                                        </button>
                                    </div>
                                    <button 
                                       onClick={handleAddTask} 
                                       className="w-[54px] h-[54px] rounded-2xl bg-primary flex items-center justify-center text-white active:scale-95 transition-transform"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>
                                
                                {showTimeInput && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <input 
                                            type="time"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                                {items.length === 0 ? (
                                    <div className="text-center text-text-muted mt-20 opacity-30">
                                        <Trophy size={48} className="mx-auto mb-4" />
                                        <p className="text-sm">{t('tasks_empty')}</p>
                                    </div>
                                ) : (
                                    items.map(task => (
                                        <div key={task.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 ${task.completed ? 'bg-[#161616]/50 border-transparent opacity-50' : 'bg-[#161616] border-white/5'}`}>
                                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => updateData({ tasks: data.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) })}>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary' : 'border-text-muted'}`}>
                                                    {task.completed && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={task.completed ? 'line-through text-text-muted' : 'text-white'}>{privateMode ? "----" : task.text}</span>
                                                    {task.time && <span className="text-[10px] text-primary flex items-center gap-1"><Clock size={10}/> {task.time}</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => moveToTrash(task, 'task')} className="text-text-muted hover:text-mistake p-2"><Trash2 size={16} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    );
                })()}
            </div>
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
        {view === 'daily_summary' && <ReportView />}

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
