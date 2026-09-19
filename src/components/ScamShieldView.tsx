import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
  Camera,
  X,
  RefreshCw,
  HelpCircle,
  Volume2,
  CheckCircle,
  PhoneCall,
} from 'lucide-react';
import { UserProfile, ScamShieldResult } from '../types';
import { SAMPLE_SCAMS, SampleScam } from '../utils/sampleData';
import { speakText, stopSpeaking } from '../utils/speech';

interface ScamShieldViewProps {
  profile: UserProfile;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const ScamShieldView: React.FC<ScamShieldViewProps> = ({
  profile,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScamShieldResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle photo upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  // Load sample scam
  const handleLoadSample = (sample: SampleScam) => {
    setInputText(sample.text);
    setSelectedImage(null);
    setResult(null);
    setErrorMsg('');
  };

  // Analyze Scam
  const handleAnalyzeScam = async () => {
    if (!inputText.trim() && !selectedImage) {
      setErrorMsg('Please paste the message or take a photo of the screen.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/gemini/scam-shield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          imageBase64: selectedImage,
          mimeType: imageMimeType,
          language: profile.language,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'Failed to check message. Please try again.');
      }
    } catch {
      setErrorMsg('Could not verify message right now. Please test again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Read aloud analysis
  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;

    const summaryText = result.explanation || result.confidenceReason || '';
    const flags = result.redFlags || result.whyReasons || [];

    const speechScript = `
Safety Verdict: ${result.verdict}.
${summaryText}.
Why this was flagged:
${flags.join('. ')}.
What you should do right now:
${result.whatToDoNow.map((step, i) => `Step ${i + 1}: ${step}`).join('. ')}.
`;

    setIsSpeaking(true);
    speakText(
      speechScript,
      profile.language,
      profile.speechSpeed,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  // Alert Family Pre-filled Message Link
  const familyPhone = profile.familyContact?.phone || '';
  const familyName = profile.familyContact?.name || 'Family';
  const cleanPhone = familyPhone.replace(/[^0-9+]/g, '');

  const alertMessage =
    result?.alertFamilyMessage ||
    result?.alertMessage ||
    `Hello ${familyName}, someone contacted me with this suspicious message: "${inputText.slice(0, 80)}...". Sathi flagged it as a potential scam. Can you please check with me before I reply?`;

  const smsAlertHref = `sms:${cleanPhone}?body=${encodeURIComponent(alertMessage)}`;
  const whatsappAlertHref = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(alertMessage)}`;

  return (
    <div className="space-y-6 pb-28">
      {/* Screen hint */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border border-amber-300 dark:border-amber-900/50 flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
        <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900 dark:text-stone-100">Scam Shield & Fraud Protection:</strong>
          <p className="mt-0.5">
            Never click unknown links or share OTPs over the phone. Paste any message here to check if it is safe before doing anything.
          </p>
        </div>
      </div>

      {/* 3 REALISTIC SAMPLE SCAMS TO TEST IN 1 TAP */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Try a Sample Fraud Message (1-Tap Test):
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_SCAMS.map((scam) => (
            <button
              key={scam.id}
              onClick={() => handleLoadSample(scam)}
              className="min-h-[58px] p-3 rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 hover:border-red-500 text-left transition-all shadow-xs flex items-center gap-2.5 focus-visible:ring-4 focus-visible:ring-red-400"
            >
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                  {scam.title}
                </p>
                <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                  {scam.senderLabel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-md space-y-4">
        <div>
          <label htmlFor="scam-text-input" className="block text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
            Suspicious SMS, WhatsApp, Email, or Phone Call story:
          </label>
          <textarea
            id="scam-text-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste message here or describe what the caller said (e.g. 'A caller claimed my pension was frozen and asked for my OTP')..."
            className="w-full p-4 text-base font-medium rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus-visible:ring-4 focus-visible:ring-red-500"
          />
        </div>

        {/* Upload screenshot or submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <label
              htmlFor="scam-screenshot-upload"
              className="min-h-[50px] px-4 py-2.5 rounded-2xl border-2 border-dashed border-stone-400 dark:border-stone-600 hover:border-red-500 hover:bg-stone-50 dark:hover:bg-stone-750 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Camera className="w-5 h-5 text-red-600" />
              <span>Attach Screenshot</span>
              <input
                id="scam-screenshot-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedImage && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200 text-xs font-bold">
                <span>Image Attached</span>
                <button
                  onClick={() => setSelectedImage(null)}
                  aria-label="Remove image"
                  className="p-1 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            id="scam-shield-check-btn"
            onClick={handleAnalyzeScam}
            disabled={isLoading}
            className="min-h-[56px] px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-red-400"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Checking Safety...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-6 h-6" />
                <span>Check If This Is A Scam</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Sathi Scam Shield is analyzing the text
          </h4>
          <p className="text-sm text-stone-700 dark:text-stone-300 max-w-md mx-auto">
            Checking for urgency tricks, OTP theft, impersonation of banks or utilities, and dangerous links.
          </p>
        </div>
      )}

      {/* ANALYSIS RESULT CARD */}
      {result && (
        <div
          id="scam-shield-result-card"
          className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-stone-800 border-3 border-stone-300 dark:border-stone-700 shadow-xl space-y-6 animate-in fade-in"
        >
          {/* Traffic Light Banner */}
          <div
            className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 ${
              result.verdict === 'LIKELY SCAM'
                ? 'bg-red-100 dark:bg-red-950/80 border-red-500 text-red-950 dark:text-red-100'
                : result.verdict === 'SUSPICIOUS'
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-950 dark:text-amber-100'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl text-white ${
                  result.verdict === 'LIKELY SCAM'
                    ? 'bg-red-600'
                    : result.verdict === 'SUSPICIOUS'
                      ? 'bg-amber-600'
                      : 'bg-emerald-600'
                }`}
              >
                {result.verdict === 'LIKELY SCAM' && <ShieldAlert className="w-8 h-8" />}
                {result.verdict === 'SUSPICIOUS' && <AlertTriangle className="w-8 h-8" />}
                {result.verdict === 'SAFE' && <ShieldCheck className="w-8 h-8" />}
              </div>

              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider">
                  Safety Verdict
                </span>
                <h4 className="text-2xl sm:text-3xl font-black">
                  {result.verdict}
                </h4>
              </div>
            </div>

            <button
              onClick={handleReadAloud}
              aria-label={isSpeaking ? 'Stop reading' : 'Read safety advice aloud'}
              className="min-h-[50px] px-4 py-2 rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <Volume2 className="w-5 h-5" />
              <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
            </button>
          </div>

          {/* Explanation summary */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
              Summary
            </h5>
            <p className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              {result.explanation || result.confidenceReason}
            </p>
          </div>

          {/* Red Flags: Why this was flagged */}
          {((result.redFlags && result.redFlags.length > 0) || (result.whyReasons && result.whyReasons.length > 0)) && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Why This Was Flagged (Red Flags):</span>
              </h5>
              <ul className="list-disc list-inside space-y-1.5 text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100">
                {(result.redFlags || result.whyReasons || []).map((flag: string, i: number) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* What to do right now (Numbered instructions) */}
          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-stone-900/80 border-2 border-amber-300 dark:border-amber-900/60 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              What You Need to Do Right Now:
            </h5>
            <ol className="space-y-2.5">
              {result.whatToDoNow.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-base flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 pt-0.5">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Alert Family Action (Connected Workflow) */}
          <div className="p-5 rounded-2xl bg-red-50 dark:bg-stone-900 border-2 border-red-300 dark:border-red-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-lg font-extrabold text-red-700 dark:text-red-400">
                  Alert Your Family Member
                </h5>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                  Send a pre-filled warning text so {familyName} can verify this for you.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={smsAlertHref}
                id="scam-alert-family-sms-btn"
                className="min-h-[54px] px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Send Alert via SMS</span>
              </a>

              <a
                href={whatsappAlertHref}
                target="_blank"
                rel="noreferrer"
                id="scam-alert-family-whatsapp-btn"
                className="min-h-[54px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Send Alert via WhatsApp</span>
              </a>
            </div>

            {familyPhone ? (
              <p className="text-xs text-center text-stone-700 dark:text-stone-300 font-mono">
                Recipient: {familyName} ({familyPhone})
              </p>
            ) : (
              <p className="text-xs text-center text-stone-700 dark:text-stone-300">
                You can save a family phone number anytime in Settings.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
