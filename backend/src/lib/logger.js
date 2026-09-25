const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'cookie',
]);

function sanitize(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function output(level, context, message) {
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? sanitize(context) : {};

  if (process.env.NODE_ENV === 'development') {
    const contextStr = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(sanitizedContext)}` : '';
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(`${prefix} ${message}${contextStr}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}${contextStr}`);
    } else {
      console.log(`${prefix} ${message}${contextStr}`);
    }
  } else {
    const entry = {
      timestamp,
      level,
      message,
      ...(typeof sanitizedContext === 'object' ? sanitizedContext : { context: sanitizedContext }),
    };
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (contextOrMsg, msg) => {
    if (typeof contextOrMsg === 'string') {
      output('info', undefined, contextOrMsg);
    } else {
      output('info', contextOrMsg, msg || '');
    }
  },
  warn: (contextOrMsg, msg) => {
    if (typeof contextOrMsg === 'string') {
      output('warn', undefined, contextOrMsg);
    } else {
      output('warn', contextOrMsg, msg || '');
    }
  },
  error: (contextOrMsg, msg) => {
    if (typeof contextOrMsg === 'string') {
      output('error', undefined, contextOrMsg);
    } else {
      output('error', contextOrMsg, msg || '');
    }
  },
  debug: (contextOrMsg, msg) => {
    if (typeof contextOrMsg === 'string') {
      output('debug', undefined, contextOrMsg);
    } else {
      output('debug', contextOrMsg, msg || '');
    }
  },
};
