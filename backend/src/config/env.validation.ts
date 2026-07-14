const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
] as const;

// Vars that are required for specific features (payments, payouts, email) but
// whose absence shouldn't block boot in a dev/demo environment — they fail
// loudly at the point of use instead. Listed here only so `npm run start`
// prints a clear warning instead of a silent 401/undefined downstream.
const RECOMMENDED_VARS = [
  'DATABASE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RAZORPAYX_ACCOUNT_NUMBER',
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
] as const;

const WEAK_JWT_SECRETS = new Set([
  'super-secret-jwt-key-replace-with-secure-key',
  'secret',
  'changeme',
]);

/**
 * Fails fast at boot if required config is missing, instead of surfacing as an
 * `undefined`-derived runtime error (e.g. a JWT signed with `undefined`, or an
 * admin migration client connecting with a blank connection string).
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED_VARS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
      `See backend/.env.example for the full list.`,
    );
  }

  const jwtSecret = String(config.JWT_SECRET ?? '');
  if (jwtSecret.length < 32 || WEAK_JWT_SECRETS.has(jwtSecret)) {
    throw new Error(
      'JWT_SECRET is missing, too short (<32 chars), or a known placeholder value. ' +
      'Generate a strong random secret before starting the server.',
    );
  }

  const missingRecommended = RECOMMENDED_VARS.filter((key) => !config[key]);
  if (missingRecommended.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Warning: the following variables are not set and their features will fail at ` +
      `runtime when used: ${missingRecommended.join(', ')}`,
    );
  }

  return config;
}
