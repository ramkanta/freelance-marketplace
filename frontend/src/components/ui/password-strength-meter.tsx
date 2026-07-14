'use client';

import { Check, X } from 'lucide-react';
import { getPasswordStrength } from '@/lib/password-strength';

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color, checks } = getPasswordStrength(password);

  const requirements = [
    { met: checks.length, text: 'At least 8 characters' },
    { met: checks.uppercase, text: 'One uppercase letter' },
    { met: checks.lowercase, text: 'One lowercase letter' },
    { met: checks.number, text: 'One number' },
    { met: checks.special, text: 'One special character (bonus)' },
  ];

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors"
              style={i < score ? { backgroundColor: color } : undefined}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color }}>
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {requirements.map((r) => (
          <li key={r.text} className="flex items-center gap-1.5 text-[11px]">
            {r.met ? (
              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className={r.met ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
              {r.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
