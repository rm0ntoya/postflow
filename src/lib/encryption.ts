import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY!;

if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error(
    "ENCRYPTION_KEY deve ser 64 caracteres hex (32 bytes). Gere com: openssl rand -hex 32"
  );
}

const KEY = Buffer.from(KEY_HEX, "hex");

export interface EncryptedPayload {
  ciphertext: string; // hex
  iv: string;         // hex — 12 bytes for GCM
  authTag: string;    // hex — 16 bytes
}

export function encryptApiKey(plaintext: string): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptApiKey(payload: EncryptedPayload): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(payload.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
