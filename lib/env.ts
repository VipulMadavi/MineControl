/**
 * Environment Variable Validation
 *
 * Call validateEnv() at server startup to fail fast with clear errors.
 * Only import this from server-side code (API routes, lib/).
 * Never import from client components.
 */

const REQUIRED_ENV_VARS = [
  // AWS
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "INSTANCE_ID",
  // Auth
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  // Discord Webhook
  "DISCORD_WEBHOOK_URL",
] as const;

const OPTIONAL_ENV_VARS = [] as const;

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates all required environment variables are present.
 * Returns a result object — does NOT throw. Use assertEnv() to throw.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    const val = process.env[key];
    if (!val || val.trim() === "") {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_ENV_VARS) {
    const val = process.env[key];
    if (!val || val.trim() === "") {
      warnings.push(`Optional env var ${key} is not set. Related features will be disabled.`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Asserts all required env vars are present. Throws with a clear message if not.
 * Call this at the top of any API route handler.
 */
export function assertEnv(): void {
  const result = validateEnv();

  if (result.warnings.length > 0) {
    result.warnings.forEach((w) => console.warn(`[env] ${w}`));
  }

  if (!result.valid) {
    const list = result.missing.map((k) => `  - ${k}`).join("\n");
    throw new Error(
      `[MineControl] Missing required environment variables:\n${list}\n\nSet these in your .env file or Vercel environment settings.`
    );
  }
}

/**
 * Gets a required env var, throwing with a clear message if absent.
 */
export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === "") {
    throw new Error(
      `[MineControl] Missing required environment variable: ${key}\nSet this in your .env file or Vercel environment settings.`
    );
  }
  return val.trim().replace(/^['"]+|['"]+$/g, "");
}

/**
 * Gets an optional env var, returning a default if absent.
 */
export function optionalEnv(key: string, defaultValue = ""): string {
  const val = process.env[key];
  if (!val || val.trim() === "") return defaultValue;
  return val.trim().replace(/^['"]+|['"]+$/g, "");
}
