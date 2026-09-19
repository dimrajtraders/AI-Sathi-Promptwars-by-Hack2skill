import { UserProfile, Reminder, MoodCheckIn, ChatMessage, DailyBriefing } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'sathi_profile_v1',
  REMINDERS: 'sathi_reminders_v1',
  CHECKINS: 'sathi_checkins_v1',
  CHATS: 'sathi_chats_v1',
  BRIEFING: 'sathi_briefing_v1',
  SYNC_KEY: 'sathi_sync_key_v1',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Ramesh Sharma',
  language: 'en',
  textSize: 'normal',
  theme: 'warm-light',
  speechSpeed: 0.9,
  familyContact: {
    name: 'Priya (Daughter)',
    phone: '+1 555-0199',
    relation: 'Daughter',
  },
  emergencyCountry: '112',
  medications: [
    'Amlodipine 5mg - Morning (Blood pressure)',
    'Metformin 500mg - After dinner (Sugar control)',
    'Calcium + Vitamin D3 - Afternoon with lunch',
  ],
  healthNotes: 'Mild hypertension, arthritis in left knee. Prefers low-salt food and warm water.',
  isOnboarded: true,
};

export const DEMO_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    title: 'Amlodipine 5mg (Blood pressure)',
    category: 'medicine',
    time: '09:00',
    repeat: 'daily',
    dosage: '1 tablet with warm water',
    notes: 'Take before breakfast',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-2',
    title: 'Calcium + Vitamin D3',
    category: 'medicine',
    time: '14:00',
    repeat: 'daily',
    dosage: '1 chewable tablet',
    notes: 'After afternoon lunch',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-3',
    title: 'Evening walk & stretch in garden',
    category: 'other',
    time: '17:30',
    repeat: 'daily',
    dosage: '',
    notes: 'Wear comfortable shoes, walk 15 mins',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-4',
    title: 'Electricity Bill Payment',
    category: 'bill',
    time: '11:00',
    repeat: 'once',
    dosage: '',
    notes: 'Pay online or ask Priya to review receipt',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-5',
    title: 'Metformin 500mg',
    category: 'medicine',
    time: '20:30',
    repeat: 'daily',
    dosage: '1 tablet with dinner',
    notes: 'After finishing dinner',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_CHECKINS: MoodCheckIn[] = [
  {
    id: 'chk-1',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    mood: 'good',
    symptoms: [],
    notes: 'Slept well, went for a fresh morning walk.',
    timestamp: Date.now() - 86400000 * 3,
  },
  {
    id: 'chk-2',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    mood: 'okay',
    symptoms: ['Aches in left knee'],
    notes: 'A bit of knee stiffness due to cloudy weather.',
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: 'chk-3',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    mood: 'good',
    symptoms: [],
    notes: 'Priya called, felt very happy talking to grandson.',
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'chk-4',
    date: new Date().toISOString().split('T')[0],
    mood: 'good',
    symptoms: [],
    notes: 'Enjoyed warm ginger tea in the morning.',
    timestamp: Date.now(),
  },
];

export const DEMO_CHATS: ChatMessage[] = [
  {
    id: 'chat-1',
    sender: 'user',
    text: 'How do I make a video call to my daughter Priya on WhatsApp?',
    timestamp: '10:05 AM',
  },
  {
    id: 'chat-2',
    sender: 'sathi',
    text: `Here is how to video call Priya, step by step:

1. Open the green WhatsApp app on your phone.
2. Tap on "Priya" in your chat list.
3. Look at the top right corner for the small Video Camera icon.
4. Tap that Camera icon once.
5. Hold the phone up to your face and wait for her to pick up with a smile!`,
    timestamp: '10:05 AM',
    suggestedReminders: [
      {
        title: 'Call Priya on WhatsApp',
        time: '18:00',
        category: 'appointment',
      },
    ],
  },
];

// Profile storage
export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

export const loadUserProfile = loadProfile;
export const saveUserProfile = saveProfile;

// Reminders storage
export function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) return DEMO_REMINDERS;
    return JSON.parse(raw);
  } catch {
    return DEMO_REMINDERS;
  }
}

export function saveReminders(reminders: Reminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    console.error('Failed to save reminders:', e);
  }
}

// CheckIns storage
export function loadCheckIns(): MoodCheckIn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    if (!raw) return DEMO_CHECKINS;
    return JSON.parse(raw);
  } catch {
    return DEMO_CHECKINS;
  }
}

export function saveCheckIns(checkIns: MoodCheckIn[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkIns));
  } catch (e) {
    console.error('Failed to save check-ins:', e);
  }
}

// Chat storage
export function loadChatMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!raw) return DEMO_CHATS;
    return JSON.parse(raw);
  } catch {
    return DEMO_CHATS;
  }
}

export function saveChatMessages(chats: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  } catch (e) {
    console.error('Failed to save chats:', e);
  }
}

// Daily Briefing storage
export function loadBriefing(): DailyBriefing | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRIEFING);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBriefing(briefing: DailyBriefing): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BRIEFING, JSON.stringify(briefing));
  } catch (e) {
    console.error('Failed to save briefing:', e);
  }
}

// Cloud Sync key
export function getOrCreateSyncKey(): string {
  let key = localStorage.getItem(STORAGE_KEYS.SYNC_KEY);
  if (!key) {
    key = 'sathi-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem(STORAGE_KEYS.SYNC_KEY, key);
  }
  return key;
}

// Cloud Backup and Sync
export async function syncAllToCloud(): Promise<{ success: boolean; key: string; error?: string }> {
  try {
    const syncKey = getOrCreateSyncKey();
    const payload = {
      profile: loadProfile(),
      reminders: loadReminders(),
      checkIns: loadCheckIns(),
      chats: loadChatMessages(),
      briefing: loadBriefing(),
    };

    const res = await fetch('/api/sync/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncKey, data: payload }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, key: syncKey };
    }
    return { success: false, key: syncKey, error: data.error || 'Server sync error' };
  } catch (err) {
    return { success: false, key: getOrCreateSyncKey(), error: String(err) };
  }
}

export async function restoreFromCloudKey(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/sync/load/${encodeURIComponent(key.trim())}`);
    const result = await res.json();
    if (res.ok && result.success && result.data) {
      const d = result.data;
      if (d.profile) saveProfile(d.profile);
      if (d.reminders) saveReminders(d.reminders);
      if (d.checkIns) saveCheckIns(d.checkIns);
      if (d.chats) saveChatMessages(d.chats);
      if (d.briefing) saveBriefing(d.briefing);
      localStorage.setItem(STORAGE_KEYS.SYNC_KEY, key.trim());
      return { success: true };
    }
    return { success: false, error: result.error || 'Could not find backup with that code' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Reset data
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
    localStorage.removeItem(STORAGE_KEYS.CHECKINS);
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    localStorage.removeItem(STORAGE_KEYS.BRIEFING);
  } catch (e) {
    console.error('Failed to clear data:', e);
  }
}

export function resetToDemoData(): void {
  saveProfile(DEFAULT_PROFILE);
  saveReminders(DEMO_REMINDERS);
  saveCheckIns(DEMO_CHECKINS);
  saveChatMessages(DEMO_CHATS);
}
