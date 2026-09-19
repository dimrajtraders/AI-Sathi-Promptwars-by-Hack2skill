import React, { useState } from 'react';
import {
  Smile,
  Meh,
  Frown,
  Heart,
  Volume2,
  Calendar,
  Sparkles,
  HelpCircle,
  Activity,
  Mic,
  MicOff,
  CheckCircle2,
} from 'lucide-react';
import { MoodCheckIn, UserProfile } from '../types';
import { speakText, stopSpeaking, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';

interface CheckInViewProps {
  profile: UserProfile;
  checkIns: MoodCheckIn[];
  onSaveCheckIn: (checkIn: MoodCheckIn) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  profile,
  checkIns,
  onSaveCheckIn,
  isSpeaking,
  setIsSpeaking,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const existingToday = checkIns.find((c) => c.date === todayStr);

  const [selectedMood, setSelectedMood] = useState<'good' | 'okay' | 'not-well'>(
    existingToday?.mood || 'good'
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    existingToday?.symptoms || []
  );
  const [note, setNote] = useState(existingToday?.notes || '');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>(existingToday?.aiResponse || '');
  const [justSaved, setJustSaved] = useState(false);

  const symptomOptions = [
    'Tired / Low Energy',
    'Joint or Knee Pain',
    'Dizzy or Lightheaded',
    'Headache',
    'Sleepless night',
    'No symptoms / Feeling fine',
  ];

  const handleToggleSymptom = (symptom: string) => {
    if (symptom.includes('No symptoms')) {
      setSelectedSymptoms(['No symptoms / Feeling fine']);
      return;
    }
    const filtered = selectedSymptoms.filter((s) => !s.includes('No symptoms'));
    if (filtered.includes(symptom)) {
      setSelectedSymptoms(filtered.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...filtered, symptom]);
    }
  };

  const handleToggleVoiceNote = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    if (!isSpeechRecognitionSupported()) return;

    const recognizer = createSpeechRecognizer(
      profile.language,
      (transcript) => setNote(transcript),
      () => setIsListening(false),
      (listening) => setIsListening(listening)
    );
    if (recognizer) recognizer.start();
  };

  const handleSubmitCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setJustSaved(false);

    try {
      const res = await fetch('/api/gemini/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          symptoms: selectedSymptoms,
          notes: note,
          profile,
        }),
      });

      const data = await res.json();
      const responseText = data.response || 'Thank you for sharing. Please rest well and stay hydrated today.';
      setAiResponse(responseText);

      const checkInRecord: MoodCheckIn = {
        id: 'chk-' + Date.now(),
        date: todayStr,
        mood: selectedMood,
        symptoms: selectedSymptoms,
        notes: note,
        aiResponse: responseText,
        timestamp: Date.now(),
      };

      onSaveCheckIn(checkInRecord);
      setJustSaved(true);
    } catch {
      const fallback = `Thank you for checking in, ${profile.name.split(' ')[0]}. Take it easy today, stay hydrated, and let family know if you need any rest.`;
      setAiResponse(fallback);
      onSaveCheckIn({
        id: 'chk-' + Date.now(),
        date: todayStr,
        mood: selectedMood,
        symptoms: selectedSymptoms,
        notes: note,
        aiResponse: fallback,
        timestamp: Date.now(),
      });
      setJustSaved(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    if (!aiResponse) return;

    setIsSpeaking(true);
    speakText(
      aiResponse,
      profile.language,
      profile.speechSpeed,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  // Past 7 days history
  const recentCheckIns = [...checkIns]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <div className="space-y-6 pb-28">
      {/* Screen hint */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
        <Heart className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900 dark:text-stone-100">Daily Wellbeing Check-in:</strong>
          <p className="mt-0.5">
            A quick 3-step check to log how your body and mind are feeling today. Sathi gives you gentle care tips and adapts your daily routine.
          </p>
        </div>
      </div>

      {/* Check-In Form */}
      <form
        onSubmit={handleSubmitCheckIn}
        className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-md space-y-6"
      >
        {/* Step 1: Mood */}
        <div>
          <label className="block text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 mb-2">
            1. How are you feeling overall today?
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMood('good')}
              className={`min-h-[64px] p-3 rounded-2xl border-2 font-black text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
                selectedMood === 'good'
                  ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500 shadow-sm'
                  : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900'
              }`}
            >
              <Smile className="w-7 h-7 text-emerald-600" />
              <span>Good</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMood('okay')}
              className={`min-h-[64px] p-3 rounded-2xl border-2 font-black text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
                selectedMood === 'okay'
                  ? 'border-amber-600 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500 shadow-sm'
                  : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900'
              }`}
            >
              <Meh className="w-7 h-7 text-amber-600" />
              <span>Okay</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMood('not-well')}
              className={`min-h-[64px] p-3 rounded-2xl border-2 font-black text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
                selectedMood === 'not-well'
                  ? 'border-red-600 bg-red-100 dark:bg-red-950 text-red-950 dark:text-red-200 ring-2 ring-red-500 shadow-sm'
                  : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900'
              }`}
            >
              <Frown className="w-7 h-7 text-red-600" />
              <span>Not Well</span>
            </button>
          </div>
        </div>

        {/* Step 2: Symptoms */}
        <div>
          <label className="block text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 mb-2">
            2. Any symptoms or bodily discomfort?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {symptomOptions.map((symptom) => {
              const isChecked = selectedSymptoms.includes(symptom);

              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleToggleSymptom(symptom)}
                  className={`min-h-[52px] px-4 py-2 rounded-2xl border text-left font-bold text-sm sm:text-base flex items-center justify-between transition-all ${
                    isChecked
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500'
                      : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <span>{symptom}</span>
                  {isChecked && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Free-form Note with Voice Typing */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="checkin-note" className="block text-base font-bold text-stone-900 dark:text-stone-100">
              3. Any thoughts or note for Sathi? (Optional)
            </label>
            <button
              type="button"
              onClick={handleToggleVoiceNote}
              className={`min-h-[42px] px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-600" />}
              <span>{isListening ? 'Stop' : 'Voice Note'}</span>
            </button>
          </div>
          <textarea
            id="checkin-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Woke up feeling a bit stiff, had tea and biscuits..."
            className="w-full p-3 text-base rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
          />
        </div>

        {/* Submit button */}
        <button
          id="checkin-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[58px] px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-md focus-visible:ring-4 focus-visible:ring-amber-400"
        >
          {isLoading ? (
            <span>Saving and generating advice...</span>
          ) : (
            <>
              <Heart className="w-5 h-5" />
              <span>{existingToday ? 'Update Today’s Check-in' : 'Save Today’s Check-in'}</span>
            </>
          )}
        </button>

        {justSaved && (
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 text-center animate-in fade-in">
            ✓ Check-in saved! Your morning briefing has updated.
          </p>
        )}
      </form>

      {/* AI Care Response Card */}
      {aiResponse && (
        <div className="p-6 rounded-3xl bg-amber-50/80 dark:bg-stone-800/90 border-2 border-amber-300 dark:border-amber-800 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Sathi’s Gentle Care Advice
              </h4>
            </div>
            <button
              onClick={handleReadAloud}
              className="min-h-[46px] px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Stop' : 'Read Aloud'}</span>
            </button>
          </div>
          <p className="text-base sm:text-lg font-medium leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line">
            {aiResponse}
          </p>
        </div>
      )}

      {/* Weekly Mood History Log */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Past 7 Days History
            </h4>
          </div>
          <span className="text-xs text-stone-700 dark:text-stone-300">
            {recentCheckIns.length} records logged
          </span>
        </div>

        {recentCheckIns.length === 0 ? (
          <p className="text-sm text-stone-700 dark:text-stone-300 text-center py-4">
            No previous check-ins yet. Check in today to start your personal health trend!
          </p>
        ) : (
          <div className="space-y-2">
            {recentCheckIns.map((ci) => (
              <div
                key={ci.date}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-stone-700 dark:text-stone-300">
                    {ci.date}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${
                      ci.mood === 'good'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ci.mood === 'okay'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ci.mood}
                  </span>
                </div>

                <div className="text-xs text-stone-700 dark:text-stone-300 max-w-[50%] truncate text-right">
                  {ci.symptoms.join(', ') || ci.notes || 'Normal day'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
