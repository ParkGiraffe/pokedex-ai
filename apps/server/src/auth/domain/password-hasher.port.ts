// 비밀번호 해싱 포트. 구현(scrypt/argon2/bcrypt)에 application이 묶이지 않도록 추상화한다.
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
