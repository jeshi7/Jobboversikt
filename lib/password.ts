import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hash a password using SHA-256 with a salt
 * In production, consider using bcrypt or Argon2 for better security
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  
  // Store as salt:hash format
  return { hash: `${salt}:${hash}`, salt };
}

/**
 * Verify a password against a stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    
    const testHash = createHash("sha256")
      .update(password + salt)
      .digest("hex");
    
    // Use timing-safe comparison to prevent timing attacks
    const testHashBuffer = Buffer.from(testHash, "hex");
    const hashBuffer = Buffer.from(hash, "hex");
    
    if (testHashBuffer.length !== hashBuffer.length) return false;
    
    return timingSafeEqual(testHashBuffer, hashBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a temporary password (for initial user setup)
 */
export function generateTemporaryPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const bytes = randomBytes(length);
  let password = "";
  
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  
  return password;
}







