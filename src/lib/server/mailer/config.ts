import { env } from '$env/dynamic/private';
import { parseEncryptionKey } from './crypto.ts';

/** The 32-byte key, or null when MAILER_KEY_ENCRYPTION_KEY is missing or malformed (fail closed). */
export function getEncryptionKey(): Buffer | null {
	return parseEncryptionKey(env.MAILER_KEY_ENCRYPTION_KEY);
}

/** Fixed by the operator. Never derived from user input. */
export function getMailerBaseUrl(): string {
	return (env.MAILER_API_URL || 'https://mail.axene.io').replace(/\/+$/, '');
}
