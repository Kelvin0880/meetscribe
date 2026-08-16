type LogContext = Record<string, unknown>;

const SENSITIVE_KEY_HINTS = ["apikey", "api_key", "token", "password", "secret", "authorization"];

function sanitize(context?: LogContext): LogContext | undefined {
  if (!context) return context;
  const clean: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    const isSensitive = SENSITIVE_KEY_HINTS.some((hint) => key.toLowerCase().includes(hint));
    clean[key] = isSensitive ? "[REDACTED]" : value;
  }
  return clean;
}

function write(level: "info" | "warn" | "error", event: string, context?: LogContext): void {
  const entry = { level, event, timestamp: new Date().toISOString(), ...sanitize(context) };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};
