
export type Language = 'en' | 'fr' | 'dr';

export type ViewState = 
  | 'onboarding' 
  | 'dashboard' 
  | 'time_manager' 
  | 'personal_challenges' 
  | 'money_saver' 
  | 'loans' 
  | 'daily_mistakes' 
  | 'daily_summary' 
  | 'settings'
  | 'calendar'
  | 'wallet'
  | 'trash'; // Added trash view

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  isPriority: boolean;
  date: string; // YYYY-MM-DD
}

export interface Challenge {
  id: string;
  text: string;
  completed: boolean;
  notes?: string;
  date: string; // YYYY-MM-DD
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category?: string;
  date: string; // ISO Date string
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  source?: string;
  date: string; // ISO Date string
}

export interface Loan {
  id: string;
  person: string;
  amount: number; 
  type: 'lent' | 'borrowed';
  dueDate?: string; 
  isPaid?: boolean; // Added status to track if loan is paid back
}

export interface Mistake {
  id: string;
  text: string;
  tag?: string;
  date: string; // ISO Date string
}

// Union type for items in trash
export type TrashItem = 
  | { type: 'task'; data: Task; deletedAt: string }
  | { type: 'expense'; data: Expense; deletedAt: string }
  | { type: 'income'; data: Income; deletedAt: string }
  | { type: 'loan'; data: Loan; deletedAt: string }
  | { type: 'challenge'; data: Challenge; deletedAt: string }
  | { type: 'mistake'; data: Mistake; deletedAt: string };

export interface AppData {
  hasOnboarded: boolean;
  joinDate: string; 
  name: string;
  gender: 'male' | 'female'; 
  currency: string; 
  tasks: Task[];
  challenges: Challenge[];
  expenses: Expense[];
  incomes: Income[];
  loans: Loan[];
  mistakes: Mistake[];
  trash: TrashItem[]; // Added trash array
  dailyGoodThing: string; 
  lastActiveDate: string;
}

export interface Translations {
  [key: string]: {
    en: string;
    fr: string;
    dr: string;
  }
}
