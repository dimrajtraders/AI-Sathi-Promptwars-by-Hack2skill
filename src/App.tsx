import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { AskView } from './components/AskView';
import { SimplifyView } from './components/SimplifyView';
import { RemindersView } from './components/RemindersView';
import { ScamShieldView } from './components/ScamShieldView';
import { CheckInView } from './components/CheckInView';
import { SOSModal } from './components/SOSModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';

import {
  UserProfile,
  Reminder,
  MoodCheckIn,
  ChatMessage,
  DailyBriefing,
  ActiveTab,
  TextSize,
  AppTheme,
} from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadReminders,
  saveReminders,
  loadCheckIns,
  saveCheckIns,
  loadChatMessages,
  saveChatMessages,
  loadBriefing,
  saveBriefing,
} from './utils/storage';
import { stopSpeaking, speakText } from './utils/speech';

export default function App() {
  // State from LocalStorage
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [checkIns, setCheckIns] = useState<MoodCheckIn[]>(loadCheckIns);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadChatMessages);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(loadBriefing);

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(!profile.isOnboarded);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Refresh all state from local storage (used after demo reset or cloud restore)
  const refreshAllState = useCallback(() => {
    setProfile(loadUserProfile());
    setReminders(loadReminders());
    setCheckIns(loadCheckIns());
    setChatMessages(loadChatMessages());
    setBriefing(loadBriefing());
  }, []);

  // Sync profile changes to HTML document element (for Tailwind dark mode)
  useEffect(() => {
    if (profile.theme === 'high-contrast-dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0c0a09';
      document.body.style.color = '#f5f5f4';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#fdfbf7';
      document.body.style.color = '#1c1917';
    }
  }, [profile.theme]);

  // Handle Text Size Toggle from Header
  const handleToggleTextSize = () => {
    const sequence: TextSize[] = ['normal', 'large', 'extra-large'];
    const currentIndex = sequence.indexOf(profile.textSize);
    const nextIndex = (currentIndex + 1) % sequence.length;
    const updated = { ...profile, textSize: sequence[nextIndex] };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Handle Theme Toggle from Header
  const handleToggleTheme = () => {
    const nextTheme: AppTheme =
      profile.theme === 'warm-light' ? 'high-contrast-dark' : 'warm-light';
    const updated = { ...profile, theme: nextTheme };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Save Profile Handler
  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveUserProfile(updatedProfile);
  };

  // Onboarding Complete Handler
  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveUserProfile(newProfile);
    setIsOnboardingOpen(false);
    speakText(
      `Welcome to Sathi, ${newProfile.name.split(' ')[0]} ji. I am your companion, always here to help.`,
      newProfile.language,
      newProfile.speechSpeed
    );
  };

  // Reminder Management
  const handleAddReminder = (reminder: Reminder) => {
    const updated = [reminder, ...reminders];
    setReminders(updated);
    saveReminders(updated);
  };

  const handleUpdateReminder = (reminder: Reminder) => {
    const updated = reminders.map((r) => (r.id === reminder.id ? reminder : r));
    setReminders(updated);
    saveReminders(updated);
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
  };

  const handleTakeReminder = (id: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = reminders.find((r) => r.id === id);
    const updated = reminders.map((r) =>
      r.id === id
        ? {
            ...r,
            status: 'completed' as const,
            lastTaken: nowTime,
          }
        : r
    );
    setReminders(updated);
    saveReminders(updated);

    if (target) {
      speakText(
        `Great job. ${target.title} marked as taken at ${nowTime}.`,
        profile.language,
        profile.speechSpeed
      );
    }
  };

  const handleSnoozeReminder = (id: string, minutes: number = 15) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: 'snoozed' as const } : r
    );
    setReminders(updated);
    saveReminders(updated);

    speakText(
      `Snoozed for ${minutes} minutes. Sathi will remind you again.`,
      profile.language,
      profile.speechSpeed
    );
  };

  // Check-In Management
  const handleSaveCheckIn = (checkIn: MoodCheckIn) => {
    const existingIndex = checkIns.findIndex((c) => c.date === checkIn.date);
    let updated: MoodCheckIn[];
    if (existingIndex >= 0) {
      updated = [...checkIns];
      updated[existingIndex] = checkIn;
    } else {
      updated = [checkIn, ...checkIns];
    }
    setCheckIns(updated);
    saveCheckIns(updated);
  };

  // Quick 1-tap Check-In from Home view
  const handleQuickCheckIn = (mood: 'good' | 'okay' | 'not-well') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const quickRecord: MoodCheckIn = {
      id: 'chk-' + Date.now(),
      date: todayStr,
      mood,
      symptoms: mood === 'good' ? ['Feeling fine'] : [],
      notes: 'Quick check-in from Home screen',
      aiResponse:
        mood === 'good'
          ? 'Wonderful to know you feel good today! Keep drinking water and enjoy a calm stroll.'
          : mood === 'okay'
            ? 'Noted! Take things at an easy pace today, take your routine medicines on time.'
            : 'Please rest comfortably, keep warm, and let family know if you need assistance.',
      timestamp: Date.now(),
    };
    handleSaveCheckIn(quickRecord);
    speakText(quickRecord.aiResponse || '', profile.language, profile.speechSpeed);
  };

  // Chat Messages Management
  const handleAddChatMessage = (msg: ChatMessage) => {
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    saveChatMessages(updated);
  };

  const handleUpdateChatMessage = (id: string, newText: string) => {
    const updated = chatMessages.map((m) => (m.id === id ? { ...m, text: newText } : m));
    setChatMessages(updated);
    saveChatMessages(updated);
  };

  // Update Daily Briefing
  const handleUpdateBriefing = (newBriefing: DailyBriefing) => {
    setBriefing(newBriefing);
    saveBriefing(newBriefing);
  };

  // Dynamic root font-size scaling based on UserProfile
  // 'normal' -> 22px base font
  // 'large' -> 26px base font
  // 'extra-large' -> 30px base font
  const textSizeClasses =
    profile.textSize === 'extra-large'
      ? 'text-[30px] leading-relaxed [&_h1]:text-[42px] [&_h2]:text-[36px] [&_h3]:text-[32px]'
      : profile.textSize === 'large'
        ? 'text-[26px] leading-relaxed [&_h1]:text-[38px] [&_h2]:text-[32px] [&_h3]:text-[28px]'
        : 'text-[22px] leading-relaxed [&_h1]:text-[34px] [&_h2]:text-[28px] [&_h3]:text-[24px]';

  // Count active reminders due
  const activeDueCount = reminders.filter((r) => r.status === 'active').length;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        profile.theme === 'high-contrast-dark'
          ? 'bg-stone-950 text-stone-100 dark'
          : 'bg-[#fdfbf7] text-stone-900'
      } ${textSizeClasses}`}
    >
      {/* Top Accessible Header */}
      <Header
        profile={profile}
        activeTab={activeTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleTheme={handleToggleTheme}
        onToggleTextSize={handleToggleTextSize}
        isSpeaking={isSpeaking}
        onStopSpeaking={() => {
          stopSpeaking();
          setIsSpeaking(false);
        }}
      />

      {/* Main Screen Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            reminders={reminders}
            checkIns={checkIns}
            briefing={briefing}
            onUpdateBriefing={handleUpdateBriefing}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenSOS={() => setIsSOSOpen(true)}
            onQuickCheckIn={handleQuickCheckIn}
            onTakeReminder={handleTakeReminder}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'ask' && (
          <AskView
            profile={profile}
            checkIn={checkIns.find((c) => c.date === new Date().toISOString().split('T')[0])}
            chatMessages={chatMessages}
            onAddChatMessage={handleAddChatMessage}
            onUpdateChatMessage={handleUpdateChatMessage}
            onAddReminder={handleAddReminder}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'simplify' && (
          <SimplifyView
            profile={profile}
            onAddReminder={handleAddReminder}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            profile={profile}
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onUpdateReminder={handleUpdateReminder}
            onDeleteReminder={handleDeleteReminder}
            onTakeReminder={handleTakeReminder}
            onSnoozeReminder={handleSnoozeReminder}
          />
        )}

        {activeTab === 'scam' && (
          <ScamShieldView
            profile={profile}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'checkin' && (
          <CheckInView
            profile={profile}
            checkIns={checkIns}
            onSaveCheckIn={handleSaveCheckIn}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}
      </main>

      {/* Permanent Accessible Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          // Scroll up smoothly when changing screens
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isDark={profile.theme === 'high-contrast-dark'}
        dueRemindersCount={activeDueCount}
      />

      {/* Emergency SOS Modal */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        profile={profile}
      />

      {/* Settings & Personalization Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onRefreshData={refreshAllState}
      />

      {/* 30-second Initial Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}
