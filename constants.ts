import { Translations, AppData } from './types';

export const TEXT: Translations = {
  app_name: { en: "Life Booster", fr: "Life Booster", dr: "Life Booster" },
  app_subtitle: { 
    en: "Your private daily system", 
    fr: "Votre système personnel",
    dr: "System dyalek l'khas"
  },
  
  // Onboarding
  onboarding_1_title: { 
    en: "Your Private Space", 
    fr: "Votre Espace Privé",
    dr: "Espace Privé Dyalek"
  },
  onboarding_1_desc: { 
    en: "No one sees this. No one judges you. A system to organize your life.", 
    fr: "Personne ne voit ça. Personne ne vous juge. Un système pour organiser votre vie.",
    dr: "Ta wahed ma kaychouf hadchi. 7ed ma ghadi y7kem 3lik. Hada system bach tretb hyatek."
  },
  onboarding_2_title: { 
    en: "Be Real", 
    fr: "Soyez Vrai",
    dr: "Koun Real"
  },
  onboarding_2_desc: { 
    en: "Track what you actually do. Admit mistakes to learn from them.", 
    fr: "Suivez ce que vous faites vraiment. Admettez vos erreurs pour apprendre.",
    dr: "Sejjel dakchi li katdir bseh. I3taref b l'aghlat bach t3ellem mnhoum."
  },
  onboarding_3_title: { 
    en: "Safe & Secure", 
    fr: "Sûr et Sécurisé",
    dr: "Sécurisé 100%"
  },
  onboarding_3_desc: { 
    en: "Your data stays on this device.", 
    fr: "Vos données restent sur cet appareil.",
    dr: "Données dyalek kayb9aw ghi f had l'telephone."
  },
  btn_continue: { en: "Continue", fr: "Continuer", dr: "Zid" },
  btn_get_started: { en: "Get Started", fr: "Commencer", dr: "Yallah Nebdaw" },
  btn_skip: { en: "Skip", fr: "Passer", dr: "Doz" },

  // Dashboard Common
  hi: { en: "Hi", fr: "Salut", dr: "Ahlan" },
  dashboard_subtitle: { en: "All your progress will appear here", fr: "Votre progression s'affiche ici", dr: "L'progress dyalek kayban hna" },
  daily_goal: { en: "Daily Goal", fr: "Objectif Quotidien", dr: "Objectif Dyal L'youm" },
  your_progress: { en: "Your Progress", fr: "Votre Progression", dr: "L'avancement" },
  total_spent: { en: "Total Spent", fr: "Total Dépensé", dr: "Total Dépensé" },
  mistakes_logged: { en: "Mistakes Logged", fr: "Erreurs Notées", dr: "Erreurs" },
  
  // Dashboard Sections
  btn_start_day: { en: "Start Your Day", fr: "Commencer", dr: "Bda nharek" },
  quick_overview: { en: "Quick Overview", fr: "Aperçu Rapide", dr: "Tliila" },
  pending: { en: "pending", fr: "en attente", dr: "en attente" },
  logged: { en: "logged", fr: "noté", dr: "noté" },
  push_yourself: { en: "Push yourself", fr: "Dépassez-vous", dr: "Ziyyer rasek" },
  track_debts: { en: "Track debts", fr: "Suivi des dettes", dr: "Suivi des dettes" },
  
  // Quick Menu
  quick_menu_title: { en: "What do you want to add?", fr: "Que voulez-vous ajouter ?", dr: "Chnou baghi tzid?" },
  quick_task: { en: "New Task", fr: "Nouvelle Tâche", dr: "Tâche Jdida" },
  quick_wallet: { en: "Transaction", fr: "Transaction", dr: "Transaction" },
  quick_challenge: { en: "Challenge", fr: "Défi", dr: "Challenge" },
  quick_mistake: { en: "Mistake", fr: "Erreur", dr: "Ghalta" },

  // Sections Titles
  section_tasks: { en: "Tasks", fr: "Tâches", dr: "Tâches" },
  section_challenges: { en: "Challenges", fr: "Défis", dr: "Challenges" },
  section_money: { en: "Money Saver", fr: "Économies", dr: "L'flouss" },
  section_wallet: { en: "My Wallet", fr: "Mon Portefeuille", dr: "Bztami" },
  section_mistakes: { en: "Daily Mistakes", fr: "Erreurs du Jour", dr: "Aghlat" },
  section_loans: { en: "Loans / IOU", fr: "Prêts / Dettes", dr: "Kridiyat" },
  section_trash: { en: "Trash", fr: "Corbeille", dr: "Zbel (Hachak)" },

  // Time Manager
  tasks_title: { en: "Today's Focus", fr: "Objectif du Jour", dr: "Objectif L'youm" },
  tasks_placeholder: { en: "What needs to be done?", fr: "Que faut-il faire ?", dr: "Chnou khassek dir?" },
  tasks_empty: { en: "No tasks yet. Start small.", fr: "Aucune tâche. Commencez petit.", dr: "Walou. Bda b chi 7aja sghira." },
  
  // Challenges
  challenges_title: { en: "Personal Challenges", fr: "Défis Personnels", dr: "Challenges" },
  challenges_placeholder: { en: "Push yourself today...", fr: "Dépassez-vous aujourd'hui...", dr: "Dir chi challenge..." },

  // Money & Wallet
  money_spent: { en: "Expenses", fr: "Dépenses", dr: "Dépenses" },
  money_income: { en: "Income", fr: "Revenus", dr: "Revenus" },
  money_balance: { en: "Net Balance", fr: "Solde Net", dr: "Solde" },
  money_placeholder: { en: "Amount", fr: "Montant", dr: "Montant" },
  money_desc_placeholder: { en: "Description...", fr: "Description...", dr: "Description..." },
  person_name: { en: "Person Name", fr: "Nom de la personne", dr: "Smiya dyal sayd(a)" },
  due_date: { en: "Due Date", fr: "Date d'échéance", dr: "Imta يرد lik?" },
  
  // Transaction Types
  tx_type_income: { en: "Income", fr: "Revenu", dr: "Dkhul (Income)" },
  tx_type_expense: { en: "Expense", fr: "Dépense", dr: "Khruj (Expense)" },
  tx_type_lent: { en: "Lent", fr: "Prêté", dr: "Sleft" },
  tx_type_borrowed: { en: "Borrowed", fr: "Emprunté", dr: "Tsleft" },
  tx_add_btn: { en: "Add Transaction", fr: "Ajouter Transaction", dr: "Zid l'3amaliya" },
  tx_history: { en: "Transactions", fr: "Historique", dr: "Transactions" },
  tx_empty: { en: "No transactions yet", fr: "Aucune transaction", dr: "Aucune transaction" },
  
  // Filters & Actions
  filter_all: { en: "All", fr: "Tout", dr: "Kulchi" },
  filter_title: { en: "Filter", fr: "Filtrer", dr: "Filtri" },
  loan_paid: { en: "Paid", fr: "Payé", dr: "Khaless" },
  loan_mark_paid: { en: "Mark as Paid", fr: "Marquer comme payé", dr: "Cocher 'Khaless'" },
  loan_unpaid: { en: "Unpaid", fr: "Non payé", dr: "Mazal" },

  // Mistakes
  mistakes_title: { en: "Daily Mistakes", fr: "Erreurs du Jour", dr: "Aghlat L'youm" },
  mistakes_placeholder: { en: "Be honest with yourself...", fr: "Sois honnête avec toi-même...", dr: "Koun sari7 m3a rasek..." },
  
  // Loans
  loans_net: { en: "Net Balance", fr: "Solde Net", dr: "Solde" },
  loans_add: { en: "Add Record", fr: "Ajouter", dr: "Zid" },
  loans_lent: { en: "I Lent", fr: "J'ai prêté", dr: "Sleft" },
  loans_borrowed: { en: "I Borrowed", fr: "J'ai emprunté", dr: "Tsleft" },

  // Summary
  summary_title: { en: "Daily Summary", fr: "Résumé du Jour", dr: "Résumé" },
  summary_footer: { 
    en: "A real day. One step forward.", 
    fr: "Une vraie journée. Un pas en avant.",
    dr: "Nhar 7a9i9i. Zid l9eddam."
  },
  
  // Settings
  settings_title: { en: "Settings", fr: "Paramètres", dr: "I3dadat" },
  settings_language: { en: "Language", fr: "Langue", dr: "Lougha" },
  settings_currency: { en: "Currency", fr: "Devise", dr: "L'3oumla" },
  settings_reset: { en: "Reset Data", fr: "Réinitialiser", dr: "Mse7 kolchi" },
  settings_gender: { en: "Character", fr: "Personnage", dr: "Personnage" },
  settings_male: { en: "Male", fr: "Homme", dr: "Rajel" },
  settings_female: { en: "Female", fr: "Femme", dr: "Mra" },
  reset_confirm_msg: {
    en: "WARNING: This will delete ALL your data permanently. Are you sure?",
    fr: "ATTENTION : Cela effacera TOUTES vos données définitivement. Êtes-vous sûr ?",
    dr: "A7DII RASSK: Hadchi ghaymse7 ga3 l'ma3loumat dyalek b merra. Wach mt2ked?"
  },

  // Trash
  trash_title: { en: "Trash", fr: "Corbeille", dr: "Zbel (Hachak)" },
  trash_empty: { en: "Trash is empty", fr: "La corbeille est vide", dr: "L'corbeille khawya" },
  trash_restore: { en: "Restore", fr: "Restaurer", dr: "Rje3" },
  trash_delete: { en: "Delete Forever", fr: "Supprimer", dr: "Mse7" },
  trash_warning: { en: "Deleted items appear here.", fr: "Les éléments supprimés apparaissent ici.", dr: "Dakchi li mse7ti kayban hna." },
  
  // Calendar
  calendar_title: { en: "Calendar", fr: "Calendrier", dr: "Calendrier" },
  calendar_empty: { 
    en: "No activity recorded for this day.", 
    fr: "Aucune activité enregistrée pour ce jour.",
    dr: "Walou f had nhar."
  },
  stats_month: { en: "Monthly Report", fr: "Rapport Mensuel", dr: "Rapport Mensuel" },
  stats_weekly: { en: "Weekly Report", fr: "Rapport Hebdomadaire", dr: "Rapport Semana" },
  stats_since: { en: "Since", fr: "Depuis", dr: "Mn" },
  stats_week_of: { en: "Week of", fr: "Semaine du", dr: "Semana dyal" },
  stats_respected: { en: "Days Respected", fr: "Jours Respectés", dr: "Jours Respectés" },
  stats_missed: { en: "Days Missed", fr: "Jours Manqués", dr: "Jours Manqués" },
  stats_completion: { en: "Completion", fr: "Complétion", dr: "Complétion" },
  
  // General
  back: { en: "Back", fr: "Retour", dr: "Rjou3" },
  next: { en: "Next", fr: "Suivant", dr: "Zid" },
};

export const INITIAL_DATA: AppData = {
  hasOnboarded: false,
  joinDate: new Date().toISOString(), // Initial join date
  name: "Anas", 
  gender: 'male',
  currency: 'AED',
  tasks: [],
  challenges: [],
  expenses: [],
  incomes: [],
  loans: [],
  mistakes: [],
  trash: [], // Initialize trash
  dailyGoodThing: "",
  lastActiveDate: new Date().toISOString(),
};

export const CURRENCIES = [
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'AED', name: 'United Arab Emirates Dirham' },
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', name: 'Qatari Rial' },
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'TND', name: 'Tunisian Dinar' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
];