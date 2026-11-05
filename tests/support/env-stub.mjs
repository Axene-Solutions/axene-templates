// Live view of process.env, so a test can set or delete MAILER_KEY_ENCRYPTION_KEY.
export const env = new Proxy({}, { get: (_t, k) => process.env[k] });
