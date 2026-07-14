export interface PasswordStrength {
  score: number; // 0-5
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const levels: Array<{ label: PasswordStrength['label']; color: string }> = [
    { label: 'Too weak', color: '#ef4444' },
    { label: 'Too weak', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#84cc16' },
    { label: 'Strong', color: '#10b981' },
  ];

  return { score, ...levels[score], checks };
}

// Mirrors the backend's minimum bar (8 chars, upper+lower+number) — used for
// client-side pre-validation so users see the same requirement before submit.
export function meetsMinimumRequirements(password: string): boolean {
  const s = getPasswordStrength(password);
  return s.checks.length && s.checks.lowercase && s.checks.uppercase && s.checks.number;
}
