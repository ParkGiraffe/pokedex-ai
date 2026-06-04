import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Injectable } from "@nestjs/common";

import { type PasswordHasher } from "../domain/password-hasher.port";

// node:crypto scrypt 기반 — 외부 해시 라이브러리·네이티브 빌드 의존 없음. PasswordHasher 포트의 한 구현일 뿐이라
// argon2/bcrypt로 교체하려면 이 어댑터만 바꾸면 된다.
const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derived = await scryptAsync(plain, salt, KEY_LENGTH);
    return `${salt.toString("hex")}:${derived.toString("hex")}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) {
      return false;
    }
    const expected = Buffer.from(hashHex, "hex");
    const derived = await scryptAsync(plain, Buffer.from(saltHex, "hex"), expected.length);
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }
}
