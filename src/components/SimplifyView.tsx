import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Camera,
  Volume2,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Zap,
  Pill,
  Landmark,
  X,
} from 'lucide-react';
import { UserProfile, Reminder, SimplifyResult } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../utils/sampleData';

interface SimplifyViewProps {
  profile: UserProfile;
  onAddReminder: (reminder: Reminder) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const SimplifyView: React.FC<SimplifyViewProps> = ({
  profile,
  onAddReminder,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimplifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedReminderSuccess, setAddedReminderSuccess] = useState(false);

  // File / Camera upload handler
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

  // Load sample document
  const handleLoadSample = (doc: SampleDocument) => {
    setInputText(doc.text);
    setSelectedImage(null);
    setResult(null);
    setErrorMsg('');
    // Auto-scroll or highlight
  };

  // Call Simplify API
  const handleSimplify = async () => {
    if (!inputText.trim() && !selectedImage) {
      setErrorMsg('Please paste text or take a photo of your letter or bill.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setAddedReminderSuccess(false);

    try {
      const res = await fetch('/api/gemini/simplify', {
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
        setErrorMsg(data.error || 'Failed to simplify document. Please try again.');
      }
    } catch {
      setErrorMsg('Network issue. Please check your connection and tap Try Again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Read aloud structured output
  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;

    const speechScript = `
What this is: ${result.whatItIs}.
What you need to do:
${result.whatYouNeedToDo.map((step, i) => `Step ${i + 1}: ${step}`).join('. ')}.
Important details:
${result.importantDatesAmounts.map((d) => `${d.label}: ${d.value}`).join('. ')}.
Things to be careful about:
${result.redFlags.join('. ')}.
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

  // One-tap Add to Reminders (Connected workflow)
  const handleAddToReminders = () => {
    if (!result) return;

    const detected = result.detectedReminder;
    const title = detected?.title || `Follow up on: ${result.whatItIs.slice(0, 40)}`;
    const category = detected?.category || 'bill';
    const time = '10:00';

    const newReminder: Reminder = {
      id: 'rem-' + Date.now(),
      title,
      category,
      time,
      repeat: 'once',
      dosage: '',
      notes: `Generated from simplified document: ${result.summary || result.whatItIs}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    onAddReminder(newReminder);
    setAddedReminderSuccess(true);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Screen hint */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-stone-800/80 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900 dark:text-stone-100">Simplify Complex Documents:</strong>
          <p className="mt-0.5">
            Take a photo or paste any letter, medical prescription, bank paper, or utility bill. Sathi translates official jargon into plain everyday instructions.
          </p>
        </div>
      </div>

      {/* 3 SAMPLE DOCUMENTS TO TEST IN 1 TAP */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Try a Sample Document (One-Tap Test):
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleLoadSample(doc)}
              className="min-h-[58px] p-3 rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 hover:border-amber-500 text-left transition-all shadow-xs flex items-center gap-3 focus-visible:ring-4 focus-visible:ring-amber-500"
            >
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                {doc.iconName === 'Zap' && <Zap className="w-5 h-5" />}
                {doc.iconName === 'Pill' && <Pill className="w-5 h-5" />}
                {doc.iconName === 'Landmark' && <Landmark className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                  {doc.title}
                </p>
                <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                  {doc.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input area: Paste Text or Photo Upload */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-md space-y-4">
        <div>
          <label htmlFor="simplify-text-input" className="block text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
            Document Content or Paste Text:
          </label>
          <textarea
            id="simplify-text-input"
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text from your letter, bill, prescription, or notice here..."
            className="w-full p-4 text-base font-medium rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus-visible:ring-4 focus-visible:ring-blue-500"
          />
        </div>

        {/* Photo Upload / Camera button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <label
              htmlFor="document-file-upload"
              className="min-h-[50px] px-4 py-2.5 rounded-2xl border-2 border-dashed border-stone-400 dark:border-stone-600 hover:border-blue-500 hover:bg-stone-50 dark:hover:bg-stone-750 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Take Photo / Upload Document</span>
              <input
                id="document-file-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedImage && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 text-xs font-bold">
                <span>Photo Attached</span>
                <button
                  onClick={() => setSelectedImage(null)}
                  aria-label="Remove photo"
                  className="p-1 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            id="simplify-submit-btn"
            onClick={handleSimplify}
            disabled={isLoading}
            className="min-h-[56px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-blue-400"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Reading with Care...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Simplify Document</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={handleSimplify}
              className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Loading state with friendly text */}
      {isLoading && (
        <div className="p-8 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Sathi is analyzing your document
          </h4>
          <p className="text-sm text-stone-700 dark:text-stone-300 max-w-md mx-auto">
            Extracting what you need to do, due dates, and checking for any hidden clauses or warnings.
          </p>
        </div>
      )}

      {/* STRUCTURED OUTPUT CARD */}
      {result && (
        <div
          id="simplify-result-card"
          className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-stone-800 border-3 border-blue-400 dark:border-blue-800 shadow-xl space-y-6 animate-in fade-in"
        >
          {/* Header & Read Aloud */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-stone-200 dark:border-stone-700">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50">
                  Simplified Explanation
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                Plain language breakdown in your chosen language
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReadAloud}
                aria-label={isSpeaking ? 'Stop reading' : 'Read simplified output aloud'}
                className="min-h-[50px] px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs"
              >
                <Volume2 className="w-5 h-5" />
                <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
              </button>
            </div>
          </div>

          {/* (a) What this is */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              (A) What This Document Is
            </span>
            <p className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {result.whatItIs}
            </p>
          </div>

          {/* (b) What you need to do (Numbered steps) */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-stone-900/80 border-2 border-blue-200 dark:border-blue-900/50 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              (B) What You Need to Do (Step-by-Step)
            </span>
            <ol className="space-y-2.5">
              {result.whatYouNeedToDo.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                    {idx + 1}
                  </span>
                  <p className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 pt-0.5">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* (c) Important dates & amounts */}
          {result.importantDatesAmounts && result.importantDatesAmounts.length > 0 && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                (C) Important Dates & Amounts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.importantDatesAmounts.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex items-center justify-between"
                  >
                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                      {item.label}:
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-amber-700 dark:text-amber-400">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* (d) Be careful about / Red flags */}
          {result.redFlags && result.redFlags.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-900 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>(D) Be Careful About (Red Flags & Cautions)</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-base font-medium text-red-950 dark:text-red-200">
                {result.redFlags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* (f) Connected Workflow: Add to Reminders */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-stone-900/80 border-2 border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-emerald-950 dark:text-emerald-300">
                Would you like a reminder for this date or action?
              </p>
              <p className="text-xs text-stone-700 dark:text-stone-300">
                {result.detectedReminder?.title
                  ? `Detected: ${result.detectedReminder.title} (${result.detectedReminder.dateOrTime})`
                  : 'Add this document due date to your Sathi reminders list.'}
              </p>
            </div>

            <button
              id="simplify-add-reminder-btn"
              onClick={handleAddToReminders}
              disabled={addedReminderSuccess}
              className={`min-h-[52px] px-6 py-2.5 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-md transition-all ${
                addedReminderSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white'
              }`}
            >
              {addedReminderSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Added to Reminders!</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="w-5 h-5" />
                  <span>Add to Reminders</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
