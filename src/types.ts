export type TextSize = 'normal' | 'large' | 'extra-large';
export type AppTheme = 'warm-light' | 'high-contrast-dark';
export type SpeechSpeed = 0.8 | 0.9 | 1.0 | 1.1;

export interface FamilyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  name: string;
  language: string; // 'en' | 'hi' | 'es' | 'ta' | 'bn' | 'mr' | 'te' | 'gu' | 'fr' | 'de'
  textSize: TextSize;
  theme: AppTheme;
  speechSpeed: SpeechSpeed;
  familyContact: FamilyContact;
  emergencyCountry: '112' | '911' | '999' | '000';
  medications: string[];
  healthNotes: string;
  isOnboarded: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  category: 'medicine' | 'appointment' | 'bill' | 'other';
  time: string; // "HH:MM"
  repeat: 'daily' | 'weekly' | 'once' | 'morning-evening';
  dosage?: string;
  notes?: string;
  status: 'active' | 'snoozed' | 'completed';
  lastTaken?: string;
  snoozeUntil?: string;
  createdAt: string;
}

export interface MoodCheckIn {
  id?: string;
  date: string; // YYYY-MM-DD
  mood: 'good' | 'okay' | 'not-well';
  symptoms: string[];
  notes?: string;
  aiResponse?: string;
  timestamp?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sathi';
  text: string;
  timestamp: string;
  suggestedReminders?: Array<{
    title: string;
    time?: string;
    category: 'medicine' | 'appointment' | 'bill' | 'other';
    dosage?: string;
  }>;
}

export interface ImportantDateAmount {
  label: string;
  value: string;
  isDate?: boolean;
  isAmount?: boolean;
}

export interface SimplifyResult {
  whatItIs: string;
  whatYouNeedToDo: string[];
  importantDatesAmounts: ImportantDateAmount[];
  redFlags: string[];
  summary: string;
  detectedReminder?: {
    title: string;
    dateOrTime: string;
    category: 'medicine' | 'appointment' | 'bill' | 'other';
  };
}

export interface ScamShieldResult {
  verdict: 'SAFE' | 'SUSPICIOUS' | 'LIKELY SCAM';
  confidenceReason?: string;
  explanation?: string;
  whyReasons?: string[];
  redFlags?: string[];
  whatToDoNow: string[];
  alertMessage?: string;
  alertFamilyMessage?: string;
}

export interface DailyBriefing {
  greeting: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  medicinesDue: string[];
  gentleSuggestion: string;
  dailyTip: string;
  safetyTip: string;
  cheerMessage: string;
  lastUpdated: string;
}

export type ActiveTab = 'home' | 'ask' | 'simplify' | 'reminders' | 'scam' | 'checkin';
