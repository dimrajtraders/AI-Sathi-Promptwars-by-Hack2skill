import React, { useState } from 'react';
import { X, Volume2, Globe, Trash2, Cloud, Sparkles, User, Heart, Shield, Check } from 'lucide-react';
import { UserProfile, TextSize, SpeechSpeed, AppTheme } from '../types';
import { getOrCreateSyncKey, syncAllToCloud, restoreFromCloudKey, clearAllData, resetToDemoData } from '../utils/storage';
import { speakText } from '../utils/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onRefreshData,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newMed, setNewMed] = useState('');
  const [syncKeyInput, setSyncKeyInput] = useState('');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const currentSyncKey = getOrCreateSyncKey();

  if (!isOpen) return null;

  const handleTextSizeChange = (size: TextSize) => {
    const updated = { ...formData, textSize: size };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleThemeChange = (theme: AppTheme) => {
    const updated = { ...formData, theme };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleSpeedChange = (speed: SpeechSpeed) => {
    const updated = { ...formData, speechSpeed: speed };
    setFormData(updated);
    onSaveProfile(updated);
    speakText('Speech speed set to this pace.', updated.language, speed);
  };

  const handleLanguageChange = (lang: string) => {
    const updated = { ...formData, language: lang };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleAddMedication = () => {
    if (!newMed.trim()) return;
    const updated = {
      ...formData,
      medications: [...formData.medications, newMed.trim()],
    };
    setFormData(updated);
    onSaveProfile(updated);
    setNewMed('');
  };

  const handleRemoveMedication = (index: number) => {
    const updated = {
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleSaveAll = () => {
    onSaveProfile(formData);
    onClose();
  };

  const handleCloudSync = async () => {
    setSyncStatus('Backing up data to cloud...');
    const res = await syncAllToCloud();
    if (res.success) {
      setSyncStatus(`Cloud sync completed! Your backup key is: ${res.key}`);
    } else {
      setSyncStatus(`Sync failed: ${res.error || 'Server error'}`);
    }
  };

  const handleCloudRestore = async () => {
    if (!syncKeyInput.trim()) {
      setSyncStatus('Please enter a valid backup key.');
      return;
    }
    setSyncStatus('Restoring data from cloud...');
    const res = await restoreFromCloudKey(syncKeyInput.trim());
    if (res.success) {
      setSyncStatus('Data restored successfully!');
      onRefreshData();
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setSyncStatus(`Restore failed: ${res.error || 'No backup found'}`);
    }
  };

  const handleResetDemo = () => {
    resetToDemoData();
    onRefreshData();
    setSyncStatus('Sample senior data loaded! Feel free to explore.');
  };

  const handleClearAll = () => {
    clearAllData();
    onRefreshData();
    setShowClearConfirm(false);
    onClose();
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'fr', label: 'Français (French)' },
    { code: 'de', label: 'Deutsch (German)' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="settings-modal-content"
        className="w-full max-w-2xl rounded-3xl bg-[#fdfbf7] dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 shadow-2xl p-5 sm:p-7 text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-stone-800">
          <div>
            <h2 id="settings-title" className="text-2xl sm:text-3xl font-bold">
              Settings & Preferences
            </h2>
            <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300">
              Personalize Sathi for your comfort and vision
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[48px] min-w-[48px] p-2 rounded-2xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 flex items-center justify-center font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Section 1: Text Size */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <label className="block text-base sm:text-lg font-bold mb-2">
              Text Size on Screen
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'normal', label: 'A', desc: 'Normal (22px)' },
                  { id: 'large', label: 'A+', desc: 'Large (26px)' },
                  { id: 'extra-large', label: 'A++', desc: 'Extra (30px)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTextSizeChange(opt.id)}
                  className={`min-h-[56px] py-2 px-3 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                    formData.textSize === opt.id
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500'
                      : 'border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750'
                  }`}
                >
                  <span className="text-xl">{opt.label}</span>
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Color Theme */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <label className="block text-base sm:text-lg font-bold mb-2">
              Display Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('warm-light')}
                className={`min-h-[56px] p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${
                  formData.theme === 'warm-light'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-500'
                    : 'border-stone-300 bg-stone-50 text-stone-800'
                }`}
              >
                <span>☀️ Warm Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('high-contrast-dark')}
                className={`min-h-[56px] p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${
                  formData.theme === 'high-contrast-dark'
                    ? 'border-amber-500 bg-stone-900 text-amber-300 ring-2 ring-amber-400'
                    : 'border-stone-700 bg-stone-900 text-stone-300'
                }`}
              >
                <span>🌙 High-Contrast Dark</span>
              </button>
            </div>
          </div>

          {/* Section 3: Speech Speed & Language */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-amber-600" />
                <label htmlFor="settings-language" className="text-base sm:text-lg font-bold">
                  Language for Sathi & AI Voice
                </label>
              </div>
              <select
                id="settings-language"
                value={formData.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full min-h-[56px] p-3 text-base sm:text-lg font-semibold rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
                All AI explanations, briefings, and read-aloud voice will speak in this language.
              </p>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-amber-600" />
                <label className="text-base sm:text-lg font-bold">
                  Read Aloud Speaking Speed
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { val: 0.8 as SpeechSpeed, label: 'Slow (0.8x)' },
                    { val: 0.9 as SpeechSpeed, label: 'Calm (0.9x)' },
                    { val: 1.0 as SpeechSpeed, label: 'Normal (1.0x)' },
                    { val: 1.1 as SpeechSpeed, label: 'Brisk (1.1x)' },
                  ] as const
                ).map((sp) => (
                  <button
                    key={sp.val}
                    type="button"
                    onClick={() => handleSpeedChange(sp.val)}
                    className={`min-h-[48px] py-1 px-2 rounded-xl border text-xs sm:text-sm font-bold ${
                      formData.speechSpeed === sp.val
                        ? 'border-amber-600 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Senior Name & Family Contact */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              <h3 className="text-base sm:text-lg font-bold">Profile & Family Contact</h3>
            </div>
            <div>
              <label htmlFor="settings-name" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Your Preferred Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full min-h-[52px] p-3 text-base rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
                placeholder="e.g. Ramesh ji"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="settings-family-name" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Family Contact Name
                </label>
                <input
                  id="settings-family-name"
                  type="text"
                  value={formData.familyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      familyContact: { ...formData.familyContact, name: e.target.value },
                    })
                  }
                  className="w-full min-h-[52px] p-3 text-base rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
                  placeholder="e.g. Priya (Daughter)"
                />
              </div>
              <div>
                <label htmlFor="settings-family-phone" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Family Phone (for SOS & Scam alerts)
                </label>
                <input
                  id="settings-family-phone"
                  type="tel"
                  value={formData.familyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      familyContact: { ...formData.familyContact, phone: e.target.value },
                    })
                  }
                  className="w-full min-h-[52px] p-3 text-base rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
                  placeholder="+1 555-0199"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Medications & Health Notes */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <h3 className="text-base sm:text-lg font-bold">Medicines & Health Notes</h3>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300">
              Sathi uses this list to remind you and build your morning briefing.
            </p>

            <div className="space-y-1.5">
              {formData.medications.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-sm"
                >
                  <span className="font-medium">{m}</span>
                  <button
                    onClick={() => handleRemoveMedication(i)}
                    aria-label={`Remove medicine ${m}`}
                    className="p-1 text-red-600 hover:text-red-700 font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMed}
                onChange={(e) => setNewMed(e.target.value)}
                placeholder="e.g. Vitamin C 500mg morning"
                className="flex-1 min-h-[48px] p-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMedication()}
              />
              <button
                type="button"
                onClick={handleAddMedication}
                className="min-h-[48px] px-4 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700"
              >
                Add
              </button>
            </div>

            <div>
              <label htmlFor="settings-health-notes" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Special Health Notes or Allergies
              </label>
              <textarea
                id="settings-health-notes"
                rows={2}
                value={formData.healthNotes}
                onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
                placeholder="e.g. Mild knee joint stiffness in morning, avoid salty soups"
              />
            </div>
          </div>

          {/* Section 6: Cloud Data Synchronization */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-bold">Cloud Data Sync & Backup</h3>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300">
              Access your reminders and notes across your tablet, phone, and computer automatically.
            </p>

            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-xs flex items-center justify-between">
              <span>Your Device Sync Code: <strong>{currentSyncKey}</strong></span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(currentSyncKey)}
                className="text-amber-700 dark:text-amber-400 font-sans font-semibold text-xs ml-2 hover:underline"
              >
                Copy
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCloudSync}
                className="min-h-[50px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                <span>Backup to Cloud Now</span>
              </button>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Enter Sync Code"
                  value={syncKeyInput}
                  onChange={(e) => setSyncKeyInput(e.target.value)}
                  className="flex-1 min-h-[50px] p-2 text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCloudRestore}
                  className="min-h-[50px] px-3 rounded-xl bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-bold text-xs"
                >
                  Restore
                </button>
              </div>
            </div>

            {syncStatus && (
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 pt-1">
                {syncStatus}
              </p>
            )}
          </div>

          {/* Section 7: Demo Mode & Data Reset */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="text-base sm:text-lg font-bold">Demo Mode & Data Reset</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResetDemo}
                className="min-h-[48px] px-4 rounded-xl border-2 border-amber-600 text-amber-800 dark:text-amber-300 font-bold text-sm hover:bg-amber-50 dark:hover:bg-amber-950 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Reload Sample Senior Profile</span>
              </button>

              {!showClearConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="min-h-[48px] px-4 rounded-xl border border-red-300 text-red-600 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All My Data</span>
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 min-h-[48px] px-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                  >
                    Confirm Clear Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="min-h-[48px] px-3 rounded-xl bg-stone-200 dark:bg-stone-700 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info & Save */}
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Privacy Note: All your notes & health data stay on this device.</span>
          </div>

          <button
            id="settings-save-all-btn"
            onClick={handleSaveAll}
            className="w-full sm:w-auto min-h-[54px] px-8 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-md focus-visible:ring-4 focus-visible:ring-amber-400"
          >
            <Check className="w-5 h-5" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
