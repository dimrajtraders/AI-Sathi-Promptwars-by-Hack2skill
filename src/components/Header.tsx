import React from 'react';
import { ShieldAlert, Settings, VolumeX, Sparkles, Moon, Sun, Type } from 'lucide-react';
import { UserProfile, TextSize } from '../types';
import { stopSpeaking } from '../utils/speech';

interface HeaderProps {
  profile: UserProfile;
  isSpeaking: boolean;
  onOpenSOS: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onChangeTextSize?: (size: TextSize) => void;
  onToggleTextSize?: () => void;
  onLoadDemo?: () => void;
  onStopSpeaking?: () => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  isSpeaking,
  onOpenSOS,
  onOpenSettings,
  onToggleTheme,
  onChangeTextSize,
  onToggleTextSize,
  onLoadDemo,
  onStopSpeaking,
}) => {
  const isDark = profile.theme === 'high-contrast-dark';

  const nextTextSize = (): TextSize => {
    if (profile.textSize === 'normal') return 'large';
    if (profile.textSize === 'large') return 'extra-large';
    return 'normal';
  };

  const textSizeLabel = {
    normal: 'A',
    large: 'A+',
    'extra-large': 'A++',
  }[profile.textSize];

  return (
    <header
      id="sathi-main-header"
      className={`sticky top-0 z-30 px-4 py-3 border-b shadow-xs transition-colors ${
        isDark
          ? 'bg-stone-900 border-stone-800 text-stone-100'
          : 'bg-[#fdfbf7] border-stone-200 text-stone-900'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Greeting */}
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
            साथी
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight tracking-tight flex items-center gap-1.5">
              Sathi
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold dark:bg-amber-950 dark:text-amber-200">
                Companion
              </span>
            </h1>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
              Daily Care for {profile.name.split(' ')[0] || 'You'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Speaking indicator with Stop Button */}
          {isSpeaking && (
            <button
              id="header-stop-speech-btn"
              onClick={() => {
                if (onStopSpeaking) onStopSpeaking();
                else stopSpeaking();
              }}
              aria-label="Stop reading aloud"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 text-white font-semibold text-sm animate-pulse hover:bg-amber-700 focus-visible:ring-4 focus-visible:ring-amber-400"
            >
              <VolumeX className="w-5 h-5" />
              <span className="hidden sm:inline">Stop Audio</span>
            </button>
          )}

          {/* Text Size Cycle Button */}
          <button
            id="header-text-size-btn"
            onClick={() => {
              if (onToggleTextSize) onToggleTextSize();
              else if (onChangeTextSize) onChangeTextSize(nextTextSize());
            }}
            aria-label={`Current text size is ${profile.textSize}. Tap to switch size.`}
            title="Adjust Text Size (A / A+ / A++)"
            className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1 font-bold text-base transition-colors ${
              isDark
                ? 'border-stone-700 bg-stone-800 text-amber-300 hover:bg-stone-700'
                : 'border-stone-300 bg-white text-stone-800 hover:bg-amber-50'
            }`}
          >
            <Type className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            <span>{textSizeLabel}</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            id="header-theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to warm light mode' : 'Switch to high-contrast dark mode'}
            title="Switch Theme"
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
              isDark
                ? 'border-stone-700 bg-stone-800 text-amber-300 hover:bg-stone-700'
                : 'border-stone-300 bg-white text-stone-800 hover:bg-amber-50'
            }`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Demo Data Quick Trigger */}
          <button
            id="header-demo-data-btn"
            onClick={onLoadDemo}
            aria-label="Load demo data for evaluation"
            title="Load Sample Data"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Demo Data</span>
          </button>

          {/* Settings Button */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="App Settings"
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
              isDark
                ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-amber-50'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* SOS Help Button - High Priority, prominent red */}
          <button
            id="header-sos-btn"
            onClick={onOpenSOS}
            aria-label="Emergency SOS help. Tap for immediate help options."
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm md:text-base flex items-center gap-1.5 shadow-md ring-2 ring-red-300 dark:ring-red-900 focus-visible:ring-4 focus-visible:ring-red-500 transition-all"
          >
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>SOS Help</span>
          </button>
        </div>
      </div>
    </header>
  );
};
