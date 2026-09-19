import React from 'react';
import { Home, MessageCircle, FileText, Bell, ShieldCheck } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isDark: boolean;
  dueRemindersCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  isDark,
  dueRemindersCount,
}) => {
  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: 'Home',
      icon: Home,
      ariaLabel: 'Go to Home and Daily Briefing',
    },
    {
      id: 'ask' as ActiveTab,
      label: 'Ask',
      icon: MessageCircle,
      ariaLabel: 'Ask Sathi a question with voice or text',
    },
    {
      id: 'simplify' as ActiveTab,
      label: 'Simplify',
      icon: FileText,
      ariaLabel: 'Simplify a letter, bill, or medical prescription',
    },
    {
      id: 'reminders' as ActiveTab,
      label: 'Reminders',
      icon: Bell,
      ariaLabel: `Reminders and medicines. ${dueRemindersCount > 0 ? `${dueRemindersCount} due now` : ''}`,
      badge: dueRemindersCount,
    },
    {
      id: 'scam' as ActiveTab,
      label: 'Safety',
      icon: ShieldCheck,
      ariaLabel: 'Scam Shield: check suspicious messages and protect against fraud',
    },
  ];

  return (
    <nav
      id="sathi-bottom-navigation"
      aria-label="Main Navigation"
      className={`fixed bottom-0 left-0 right-0 z-30 border-t shadow-lg safe-area-bottom transition-colors ${
        isDark
          ? 'bg-stone-950 border-stone-800 text-stone-100'
          : 'bg-[#fdfbf7] border-stone-300 text-stone-900'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[58px] min-w-[62px] flex-1 flex flex-col items-center justify-center rounded-2xl py-1 px-1 transition-all focus-visible:ring-4 focus-visible:ring-amber-500 ${
                isActive
                  ? isDark
                    ? 'bg-amber-950 text-amber-300 font-extrabold ring-2 ring-amber-500'
                    : 'bg-amber-100 text-amber-950 font-extrabold ring-2 ring-amber-700 shadow-xs'
                  : isDark
                    ? 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-amber-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-7 h-7 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge && item.badge > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center animate-bounce"
                  >
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-xs md:text-sm tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
