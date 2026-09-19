import React, { useState } from 'react';
import { Phone, AlertTriangle, MessageSquare, X, HeartHandshake, MapPin } from 'lucide-react';
import { UserProfile } from '../types';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, profile }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(profile.emergencyCountry || '112');
  const [shareFeedback, setShareFeedback] = useState<string>('');

  if (!isOpen) return null;

  const familyPhone = profile.familyContact?.phone || '';
  const familyName = profile.familyContact?.name || 'Family';

  const emergencyNumbers: Record<string, { num: string; label: string }> = {
    '112': { num: '112', label: '112 (India / Europe / International Standard)' },
    '911': { num: '911', label: '911 (United States / Canada)' },
    '999': { num: '999', label: '999 (United Kingdom)' },
    '000': { num: '000', label: '000 (Australia)' },
  };

  const currentEmergencyNum = emergencyNumbers[selectedCountry]?.num || '112';

  const emergencyMessage = `SOS ALERT: Hello ${familyName}, this is ${profile.name}. I need assistance right now. Please call or check on me immediately. Sent from Sathi Companion.`;

  const handleShareMessage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SOS Alert from Sathi',
          text: emergencyMessage,
        });
        setShareFeedback('Message shared successfully.');
      } catch {
        // User cancelled or fallback
      }
    } else {
      // Fallback to copying or opening SMS
      try {
        await navigator.clipboard.writeText(emergencyMessage);
        setShareFeedback('Emergency message copied to clipboard! You can paste it into any chat.');
      } catch {
        setShareFeedback('Please use the direct Call buttons below.');
      }
    }
  };

  // SMS link
  const cleanPhone = familyPhone.replace(/[^0-9+]/g, '');
  const smsHref = `sms:${cleanPhone}?body=${encodeURIComponent(emergencyMessage)}`;
  const whatsappHref = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(emergencyMessage)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="sos-modal-content"
        className="w-full max-w-xl rounded-3xl bg-red-50 dark:bg-stone-900 border-4 border-red-500 shadow-2xl p-6 md:p-8 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-red-200 dark:border-red-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 id="sos-title" className="text-2xl md:text-3xl font-black text-red-700 dark:text-red-400">
                I Need Help
              </h2>
              <p className="text-base md:text-lg font-medium text-stone-700 dark:text-stone-300">
                You are not alone. Help is one tap away.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close emergency help dialog"
            className="min-h-[48px] min-w-[48px] p-2 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 font-bold text-lg flex items-center justify-center focus-visible:ring-4 focus-visible:ring-red-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-4">
          {/* Action 1: Call Family Contact */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border-2 border-red-300 dark:border-red-900/80 shadow-sm">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Step 1: Contact Family
            </p>
            {familyPhone ? (
              <a
                id="sos-call-family-btn"
                href={`tel:${cleanPhone}`}
                className="w-full min-h-[64px] px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-xl md:text-2xl flex items-center justify-center gap-3 shadow-md focus-visible:ring-4 focus-visible:ring-red-400 text-center"
              >
                <Phone className="w-7 h-7 shrink-0" />
                <span>Call {familyName}</span>
              </a>
            ) : (
              <p className="text-base text-stone-600 dark:text-stone-400">
                No family phone number saved yet. You can add one in Settings.
              </p>
            )}
            {familyPhone && (
              <p className="text-center text-sm text-stone-700 dark:text-stone-300 mt-2 font-mono">
                {familyPhone}
              </p>
            )}
          </div>

          {/* Action 2: Call Emergency Services */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="country-select" className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Step 2: Emergency Services
              </label>
              <select
                id="country-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                aria-label="Select country for emergency number"
                className="text-xs font-semibold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
              >
                <option value="112">112 (India / EU / Global)</option>
                <option value="911">911 (USA / Canada)</option>
                <option value="999">999 (UK)</option>
                <option value="000">000 (Australia)</option>
              </select>
            </div>

            <a
              id="sos-call-police-ambulance-btn"
              href={`tel:${currentEmergencyNum}`}
              className="w-full min-h-[64px] px-6 py-4 rounded-2xl bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 font-extrabold text-xl md:text-2xl flex items-center justify-center gap-3 shadow-md focus-visible:ring-4 focus-visible:ring-stone-400 text-center"
            >
              <Phone className="w-7 h-7 shrink-0 text-red-500" />
              <span>Call Emergency {currentEmergencyNum}</span>
            </a>
            <p className="text-xs text-center text-stone-700 dark:text-stone-300 mt-2">
              Police, Ambulance & Fire Services
            </p>
          </div>

          {/* Action 3: Send Pre-filled Message */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-sm">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Step 3: Send Quick Text to Family
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={smsHref}
                id="sos-send-sms-btn"
                className="min-h-[56px] px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg flex items-center justify-center gap-2 text-center"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Send SMS</span>
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                id="sos-send-whatsapp-btn"
                className="min-h-[56px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg flex items-center justify-center gap-2 text-center"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Send WhatsApp</span>
              </a>
            </div>

            <button
              onClick={handleShareMessage}
              className="w-full mt-2 min-h-[48px] py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Share Alert to Other Apps</span>
            </button>

            {shareFeedback && (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-2 text-center">
                {shareFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Reassuring note */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-red-200 dark:border-red-900/50">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 text-sm">
            <HeartHandshake className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Stay calm. Sit down safely and breathe slowly.</span>
          </div>
          <button
            onClick={onClose}
            className="min-h-[48px] px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-sm hover:bg-stone-300"
          >
            I am Safe, Close
          </button>
        </div>
      </div>
    </div>
  );
};
