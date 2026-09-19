import React, { useState } from 'react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Clock,
  Pill,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Trash2,
  History,
  Volume2,
  X,
  HelpCircle,
} from 'lucide-react';
import { Reminder, UserProfile } from '../types';

interface RemindersViewProps {
  profile: UserProfile;
  reminders: Reminder[];
  onAddReminder: (reminder: Reminder) => void;
  onUpdateReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onTakeReminder: (id: string) => void;
  onSnoozeReminder: (id: string, minutes?: number) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onTakeReminder,
  onSnoozeReminder,
}) => {
  const [filter, setFilter] = useState<'all' | 'medicine' | 'bill' | 'appointment' | 'history'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [audioFeedback, setAudioFeedback] = useState('');

  // Form states for new reminder
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'medicine' | 'appointment' | 'bill' | 'other'>('medicine');
  const [newTime, setNewTime] = useState('09:00');
  const [newRepeat, setNewRepeat] = useState<'daily' | 'weekly' | 'once' | 'morning-evening'>('daily');
  const [newDosage, setNewDosage] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification('Sathi Reminders Active', {
            body: 'You will receive gentle notifications when medicines and tasks are due.',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  const playChimeSound = () => {
    try {
      // Gentle web audio chime for seniors
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
      setAudioFeedback('Chime played!');
      setTimeout(() => setAudioFeedback(''), 2000);
    } catch {
      setAudioFeedback('Sound preview not supported');
    }
  };

  const handleSaveNewReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: Reminder = {
      id: 'rem-' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      time: newTime,
      repeat: newRepeat,
      dosage: newDosage.trim(),
      notes: newNotes.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    onAddReminder(created);
    setNewTitle('');
    setNewDosage('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  // Filter lists
  const activeReminders = reminders.filter((r) => r.status === 'active' || r.status === 'snoozed');
  const completedReminders = reminders.filter((r) => r.status === 'completed');

  const displayedReminders = filter === 'history'
    ? completedReminders
    : activeReminders.filter((r) => (filter === 'all' ? true : r.category === filter));

  return (
    <div className="space-y-6 pb-28">
      {/* Screen hint */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-stone-800/80 border border-emerald-200 dark:border-emerald-900/50 flex items-start justify-between text-sm text-stone-700 dark:text-stone-300">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-900 dark:text-stone-100">Medicines & Reminders:</strong>
            <p className="mt-0.5">
              Keep track of your blood pressure pills, doctor appointments, and utility bills. When taken, tap the big green Taken button.
            </p>
          </div>
        </div>

        {/* Browser notification test */}
        {notificationPermission !== 'granted' && typeof Notification !== 'undefined' && (
          <button
            onClick={requestNotificationPermission}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 hover:bg-emerald-700"
          >
            Enable Alerts
          </button>
        )}
      </div>

      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: 'all', label: `Active (${activeReminders.length})` },
              { id: 'medicine', label: 'Medicines' },
              { id: 'bill', label: 'Bills' },
              { id: 'appointment', label: 'Appointments' },
              { id: 'history', label: `History (${completedReminders.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`min-h-[48px] px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Preview */}
          <button
            onClick={playChimeSound}
            aria-label="Test gentle chime sound"
            title="Test alert sound"
            className="min-h-[48px] px-3 py-2 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 hover:bg-stone-50"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>{audioFeedback || 'Test Chime'}</span>
          </button>

          {/* Add Reminder Button */}
          <button
            id="reminders-add-new-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base flex items-center gap-1.5 shadow-md focus-visible:ring-4 focus-visible:ring-emerald-400"
          >
            <Plus className="w-5 h-5" />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {displayedReminders.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-center space-y-2">
            <Bell className="w-10 h-10 text-stone-400 mx-auto" />
            <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {filter === 'history' ? 'No completed reminders yet' : 'No active reminders in this view'}
            </h4>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              Tap the green "Add Reminder" button or ask Sathi to remind you.
            </p>
          </div>
        ) : (
          displayedReminders.map((rem) => {
            const isCompleted = rem.status === 'completed';

            return (
              <div
                key={rem.id}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-xs ${
                  isCompleted
                    ? 'bg-stone-100 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 opacity-75'
                    : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 hover:border-emerald-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                        rem.category === 'medicine'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : rem.category === 'bill'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {rem.category === 'medicine' && <Pill className="w-6 h-6" />}
                      {rem.category === 'bill' && <DollarSign className="w-6 h-6" />}
                      {rem.category === 'appointment' && <Calendar className="w-6 h-6" />}
                      {rem.category === 'other' && <Clock className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700">
                          {rem.time || 'Anytime'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {rem.repeat}
                        </span>
                        {rem.status === 'snoozed' && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 animate-pulse">
                            Snoozed 15 min
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xl sm:text-2xl font-bold mt-1 ${
                          isCompleted ? 'line-through text-stone-600 dark:text-stone-400' : 'text-stone-900 dark:text-stone-50'
                        }`}
                      >
                        {rem.title}
                      </h4>

                      {rem.dosage && (
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mt-0.5">
                          Dosage: {rem.dosage}
                        </p>
                      )}

                      {rem.notes && (
                        <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
                          {rem.notes}
                        </p>
                      )}

                      {rem.lastTaken && (
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Last taken: {rem.lastTaken}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Big Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isCompleted ? (
                      <>
                        {/* Big Taken / Done Button */}
                        <button
                          onClick={() => onTakeReminder(rem.id)}
                          aria-label={`Mark ${rem.title} as taken or completed`}
                          className="min-h-[54px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-base flex items-center gap-2 shadow-md focus-visible:ring-4 focus-visible:ring-emerald-400"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Taken / Done</span>
                        </button>

                        {/* Snooze 15m Button */}
                        <button
                          onClick={() => onSnoozeReminder(rem.id, 15)}
                          aria-label={`Snooze ${rem.title} for 15 minutes`}
                          className="min-h-[54px] px-3.5 py-2 rounded-2xl bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-sm border border-stone-300 dark:border-stone-600"
                        >
                          +15m Snooze
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          onUpdateReminder({
                            ...rem,
                            status: 'active',
                          })
                        }
                        className="min-h-[48px] px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                      >
                        Restore to Active
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      aria-label={`Delete reminder ${rem.title}`}
                      className="min-h-[50px] min-w-[50px] p-2 rounded-2xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-reminder-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#fdfbf7] dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 shadow-2xl p-6 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
              <h3 id="add-reminder-title" className="text-2xl font-black">
                Add New Reminder
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close add reminder dialog"
                className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewReminder} className="mt-4 space-y-4">
              <div>
                <label htmlFor="rem-title" className="block text-sm font-bold mb-1">
                  Medicine or Task Name
                </label>
                <input
                  id="rem-title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Amlodipine 5mg or Electricity Bill"
                  className="w-full min-h-[52px] p-3 text-base rounded-2xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="rem-category" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    id="rem-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'medicine' | 'appointment' | 'bill' | 'other')}
                    className="w-full min-h-[50px] p-2 text-sm font-semibold rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                  >
                    <option value="medicine">Medicine</option>
                    <option value="appointment">Doctor Appointment</option>
                    <option value="bill">Bill Payment</option>
                    <option value="other">Routine / Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rem-time" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Time
                  </label>
                  <input
                    id="rem-time"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full min-h-[50px] p-2 text-base font-mono rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="rem-repeat" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Repeat Schedule
                  </label>
                  <select
                    id="rem-repeat"
                    value={newRepeat}
                    onChange={(e) => setNewRepeat(e.target.value as 'daily' | 'weekly' | 'once' | 'morning-evening')}
                    className="w-full min-h-[50px] p-2 text-sm font-semibold rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                  >
                    <option value="daily">Every Day</option>
                    <option value="morning-evening">Morning & Evening</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rem-dosage" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Dosage (optional)
                  </label>
                  <input
                    id="rem-dosage"
                    type="text"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    placeholder="e.g. 1 pill with warm water"
                    className="w-full min-h-[50px] p-2 text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rem-notes" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Notes
                </label>
                <input
                  id="rem-notes"
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Take after breakfast"
                  className="w-full min-h-[50px] p-2 text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[54px] px-5 rounded-2xl border border-stone-300 dark:border-stone-700 font-bold text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[54px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg shadow-md"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
