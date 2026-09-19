import React, { useState } from 'react';
import { Sparkles, ArrowRight, Heart, Globe, Type } from 'lucide-react';
import { UserProfile, TextSize } from '../types';
import { DEFAULT_PROFILE } from '../utils/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [medications, setMedications] = useState('');

  if (!isOpen) return null;

  const handleUseDemo = () => {
    onComplete(DEFAULT_PROFILE);
  };

  const handleFinish = () => {
    const medList = medications
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean);

    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      name: name.trim() || 'Friend',
      language,
      textSize,
      familyContact: {
        name: familyName.trim() || 'Family',
        phone: familyPhone.trim() || '',
        relation: 'Family',
      },
      medications: medList.length > 0 ? medList : DEFAULT_PROFILE.medications,
      isOnboarded: true,
    };
    onComplete(profile);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#fdfbf7] dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 shadow-2xl p-6 md:p-8 text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto">
        {/* Top badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-black text-xl flex items-center justify-center">
              साथी
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                Welcome to Sathi
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300">Your warm daily companion</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            Step {step} of 2
          </span>
        </div>

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h2 id="onboarding-heading" className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                Namaste! What should we call you?
              </h2>
              <p className="text-base text-stone-700 dark:text-stone-300 mt-1">
                Let’s make Sathi feel right at home for you.
              </p>
            </div>

            {/* Name Input */}
            <div>
              <label htmlFor="onboarding-name" className="block text-sm font-bold mb-1">
                Your Name
              </label>
              <input
                id="onboarding-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full min-h-[58px] p-3 text-lg font-semibold rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 focus-visible:ring-4 focus-visible:ring-amber-500"
              />
            </div>

            {/* Language Selection */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Globe className="w-4 h-4 text-amber-600" />
                <label htmlFor="onboarding-lang" className="text-sm font-bold">
                  Preferred Language for Voice & AI
                </label>
              </div>
              <select
                id="onboarding-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full min-h-[58px] p-3 text-lg font-semibold rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="es">Español (Spanish)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            {/* Text Size Choice */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Type className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold">Preferred Text Size</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'normal', label: 'A', desc: 'Normal (22px)' },
                    { id: 'large', label: 'A+', desc: 'Large (26px)' },
                    { id: 'extra-large', label: 'A++', desc: 'Extra (30px)' },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setTextSize(sz.id)}
                    className={`min-h-[54px] p-2 rounded-xl border-2 font-bold flex flex-col items-center justify-center ${
                      textSize === sz.id
                        ? 'border-amber-600 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    <span className="text-lg">{sz.label}</span>
                    <span className="text-xs font-normal text-stone-700 dark:text-stone-300">{sz.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Navigation */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full min-h-[56px] px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleUseDemo}
                className="w-full min-h-[48px] py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Or start instantly with Sample Senior Profile</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                Safety & Health (Optional)
              </h2>
              <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                Who should Sathi call if you need help?
              </p>
            </div>

            <div>
              <label htmlFor="onboarding-family-name" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Family Member Name
              </label>
              <input
                id="onboarding-family-name"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. Priya (Daughter)"
                className="w-full min-h-[52px] p-3 text-base rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
              />
            </div>

            <div>
              <label htmlFor="onboarding-family-phone" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Family Phone Number (for SOS & scam alerts)
              </label>
              <input
                id="onboarding-family-phone"
                type="tel"
                value={familyPhone}
                onChange={(e) => setFamilyPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full min-h-[52px] p-3 text-base rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
              />
            </div>

            <div>
              <label htmlFor="onboarding-meds" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Routine Medications (one per line)
              </label>
              <textarea
                id="onboarding-meds"
                rows={3}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="e.g. Amlodipine 5mg morning&#10;Metformin 500mg evening"
                className="w-full p-3 text-sm rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[56px] px-4 rounded-2xl border border-stone-300 dark:border-stone-700 font-bold text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 min-h-[56px] px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-md"
              >
                <Heart className="w-5 h-5" />
                <span>Start Using Sathi</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
