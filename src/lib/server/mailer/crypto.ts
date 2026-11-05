import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM. Stored form is base64(iv) "." base64(tag) "." base64(ciphertext).
// Pure functions: the key is passed in so they can be tested without SvelteKit.

const IV_BYTES = 12;
const TAG_BYTES = 16;

/** Decode a base64 key. Returns null unless it is exactly 32 bytes. */
export function parseEncryptionKey(b64: string | undefined | null): Buffer | null {
	if (!b64 || typeof b64 !== 'string') return null;
	const trimmed = b64.trim();
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return null;
	const key = Buffer.from(trimmed, 'base64');
	return key.length === 32 ? key : null;
}

export function encryptSecret(plain: string, key: Buffer): string {
	if (key.length !== 32) throw new Error('Encryption key must be 32 bytes');
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return [iv, tag, ct].map((b) => b.toString('base64')).join('.');
}

/** Throws if the blob is malformed, the key is wrong, or the data was tampered with. */
export function decryptSecret(blob: string, key: Buffer): string {
	if (key.length !== 32) throw new Error('Encryption key must be 32 bytes');
	const parts = blob.split('.');
	if (parts.length !== 3) throw new Error('Malformed encrypted value');
	const [iv, tag, ct] = parts.map((p) => Buffer.from(p, 'base64'));
	if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error('Malformed encrypted value');
	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
