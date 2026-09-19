import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  HelpCircle,
  BookmarkPlus,
  RefreshCw,
  Sparkles,
  Bot,
  User,
  Check,
} from 'lucide-react';
import { UserProfile, ChatMessage, Reminder, MoodCheckIn } from '../types';
import { speakText, stopSpeaking, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { SUGGESTED_QUESTIONS } from '../utils/sampleData';

interface AskViewProps {
  profile: UserProfile;
  checkIn: MoodCheckIn | undefined;
  chatMessages: ChatMessage[];
  onAddChatMessage: (msg: ChatMessage) => void;
  onUpdateChatMessage: (id: string, updatedText: string) => void;
  onAddReminder: (reminder: Reminder) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const AskView: React.FC<AskViewProps> = ({
  profile,
  checkIn,
  chatMessages,
  onAddChatMessage,
  onUpdateChatMessage,
  onAddReminder,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [savedReminderId, setSavedReminderId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  // Handle Speech Recognition
  const handleToggleMic = () => {
    setSpeechError('');
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Voice typing is not supported on this browser. You can type your question below.');
      return;
    }

    const recognizer = createSpeechRecognizer(
      profile.language,
      (transcript) => {
        setInputText(transcript);
      },
      (errorMsg) => {
        setSpeechError(errorMsg);
        setIsListening(false);
      },
      (listening) => {
        setIsListening(listening);
      }
    );

    if (recognizer) {
      recognizer.start();
    }
  };

  // Send message to Gemini Ask endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    // Create user message
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddChatMessage(userMsg);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: chatMessages.slice(-6),
          profile,
          checkIn,
          simpler: false,
        }),
      });

      const data = await res.json();
      const sathiMsg: ChatMessage = {
        id: 'sathi-' + Date.now(),
        sender: 'sathi',
        text: data.text || 'I heard you. Please let me know if you would like me to explain anything further.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReminders: data.suggestedReminders,
      };

      onAddChatMessage(sathiMsg);
    } catch {
      onAddChatMessage({
        id: 'sathi-' + Date.now(),
        sender: 'sathi',
        text: `I understand your question, ${profile.name.split(' ')[0]}. While I am working offline, please remember to take things one step at a time, drink warm water, and consult family or your doctor for any urgent needs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Explain Simpler workflow
  const handleExplainSimpler = async (msg: ChatMessage) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Please explain this in much simpler words for a senior citizen: "${msg.text}"`,
          history: [],
          profile,
          checkIn,
          simpler: true,
        }),
      });
      const data = await res.json();
      if (data.text) {
        onUpdateChatMessage(msg.id, `[Explained Even Simpler]:\n\n${data.text}`);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  // Read Aloud workflow
  const handleReadAloud = (msg: ChatMessage) => {
    if (isSpeaking && activeSpeakingMsgId === msg.id) {
      stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
      return;
    }

    setIsSpeaking(true);
    setActiveSpeakingMsgId(msg.id);
    speakText(
      msg.text,
      profile.language,
      profile.speechSpeed,
      () => {
        setIsSpeaking(true);
        setActiveSpeakingMsgId(msg.id);
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      }
    );
  };

  // Save as Reminder workflow
  const handleSaveAsReminder = (msg: ChatMessage) => {
    const suggested = msg.suggestedReminders?.[0];
    const newRem: Reminder = {
      id: 'rem-' + Date.now(),
      title: suggested?.title || msg.text.slice(0, 45) + '...',
      category: suggested?.category || 'other',
      time: suggested?.time || '10:00',
      repeat: 'daily',
      dosage: suggested?.dosage || '',
      notes: 'Saved from Sathi Ask guidance',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    onAddReminder(newRem);
    setSavedReminderId(msg.id);
    setTimeout(() => setSavedReminderId(null), 3000);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Screen hint */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs sm:text-sm text-stone-700 dark:text-stone-300">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>How to use:</strong> Tap the big microphone to speak or pick a suggested question. Sathi gives steps one at a time.
          </span>
        </div>
      </div>

      {/* Suggested question chips */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 px-1">
          Suggested Questions for Senior Care:
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="min-h-[46px] px-3.5 py-1.5 rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-amber-500 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 shadow-xs focus-visible:ring-4 focus-visible:ring-amber-500"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        id="ask-chat-history"
        className="min-h-[340px] max-h-[58vh] overflow-y-auto space-y-4 p-4 rounded-3xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 shadow-inner"
      >
        {chatMessages.map((msg) => {
          const isSathi = msg.sender === 'sathi';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSathi ? 'items-start' : 'items-end'}`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
                {isSathi ? (
                  <>
                    <Bot className="w-4 h-4 text-amber-600" />
                    <span>Sathi</span>
                  </>
                ) : (
                  <>
                    <span>You</span>
                    <User className="w-4 h-4 text-amber-700" />
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              {/* Message Body */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] p-4 sm:p-5 rounded-3xl text-lg sm:text-xl font-medium leading-relaxed shadow-sm ${
                  isSathi
                    ? 'bg-[#f7f3ec] dark:bg-stone-800 text-stone-950 dark:text-stone-100 border-2 border-stone-300 dark:border-stone-700 rounded-tl-sm'
                    : 'bg-amber-600 text-white font-semibold rounded-tr-sm'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Sathi Message Actions: Read Aloud, Explain Simpler, Save as Reminder */}
                {isSathi && (
                  <div className="mt-4 pt-3 border-t border-stone-300 dark:border-stone-700 flex flex-wrap items-center gap-2">
                    {/* Read Aloud Button */}
                    <button
                      onClick={() => handleReadAloud(msg)}
                      aria-label={
                        isSpeaking && activeSpeakingMsgId === msg.id
                          ? 'Stop reading'
                          : 'Read this response aloud'
                      }
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors ${
                        isSpeaking && activeSpeakingMsgId === msg.id
                          ? 'bg-amber-600 text-white animate-pulse'
                          : 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600 hover:bg-amber-50'
                      }`}
                    >
                      <Volume2 className="w-4 h-4 text-amber-600" />
                      <span>{isSpeaking && activeSpeakingMsgId === msg.id ? 'Stop' : 'Read Aloud'}</span>
                    </button>

                    {/* Explain Simpler Button */}
                    <button
                      onClick={() => handleExplainSimpler(msg)}
                      aria-label="Explain this answer in simpler words"
                      className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600 hover:bg-amber-50 text-xs sm:text-sm font-bold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Explain Simpler</span>
                    </button>

                    {/* Save as Reminder Button */}
                    <button
                      onClick={() => handleSaveAsReminder(msg)}
                      aria-label="Save this task or advice as a reminder"
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors ${
                        savedReminderId === msg.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600 hover:bg-amber-50'
                      }`}
                    >
                      {savedReminderId === msg.id ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Saved to Reminders!</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4 text-emerald-600" />
                          <span>Save as Reminder</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
            <span className="text-base font-semibold">
              Sathi is thinking with patience...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {speechError && (
        <p className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 px-2">
          {speechError}
        </p>
      )}

      {/* Voice & Text Input Bar */}
      <div className="p-3 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-md">
        <div className="flex items-center gap-2">
          {/* Big Microphone Button */}
          <button
            id="ask-voice-mic-btn"
            type="button"
            onClick={handleToggleMic}
            aria-label={isListening ? 'Stop listening' : 'Start speaking with microphone'}
            className={`min-h-[58px] min-w-[58px] rounded-2xl flex items-center justify-center transition-all focus-visible:ring-4 focus-visible:ring-amber-400 shrink-0 ${
              isListening
                ? 'bg-red-600 text-white animate-pulse shadow-lg scale-105'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
            }`}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          {/* Text Input */}
          <input
            id="ask-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              isListening
                ? 'Listening... Speak clearly now'
                : 'Type question here or tap microphone...'
            }
            className="flex-1 min-h-[58px] px-4 text-base sm:text-lg font-medium rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus-visible:ring-4 focus-visible:ring-amber-500"
          />

          {/* Send Button */}
          <button
            id="ask-send-btn"
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send your question to Sathi"
            className="min-h-[58px] min-w-[58px] px-4 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold disabled:opacity-40 flex items-center justify-center shrink-0 shadow-xs focus-visible:ring-4 focus-visible:ring-stone-400"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        {isListening && (
          <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-2 text-center animate-pulse">
            🔴 Recording your speech... Tap red button again when finished.
          </p>
        )}
      </div>
    </div>
  );
};
