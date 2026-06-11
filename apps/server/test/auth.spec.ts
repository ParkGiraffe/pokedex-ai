import { randomUUID } from 'node:crypto';

import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';

const uniqueEmail = (): string => `${randomUUID()}@test.local`;

type AuthRes = { accessToken: string; user: { id: string; email: string; tier: string } };

describe('인증 (내부 로그인)', () => {
  let app: NestExpressApplication;

  const register = (email: string, password: string, nickname?: string) =>
    request(app.getHttpServer()).post('/auth/register').send({ email, password, nickname });
  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('회원가입하면 토큰과 사용자(기본 free)를 반환한다', async () => {
    const email = uniqueEmail();
    const res = await register(email, 'password123', '트레이너');
    expect(res.status).toBe(201);
    const body = res.body as AuthRes;
    expect(body.accessToken).toBeTruthy();
    expect(body.user.email).toBe(email);
    expect(body.user.tier).toBe('free');
  });

  it('같은 이메일로 재가입하면 409', async () => {
    const email = uniqueEmail();
    await register(email, 'password123');
    const res = await register(email, 'password123');
    expect(res.status).toBe(409);
  });

  it('가입 후 로그인하면 토큰을 발급한다', async () => {
    const email = uniqueEmail();
    await register(email, 'password123');
    const res = await login(email, 'password123');
    expect(res.status).toBe(200);
    expect((res.body as AuthRes).accessToken).toBeTruthy();
  });

  it('틀린 비밀번호 로그인은 401', async () => {
    const email = uniqueEmail();
    await register(email, 'password123');
    const res = await login(email, 'wrong-password');
    expect(res.status).toBe(401);
  });

  it('발급한 토큰으로 /auth/me를 조회한다', async () => {
    const email = uniqueEmail();
    const registered = await register(email, 'password123');
    const token = (registered.body as AuthRes).accessToken;
    const res = await request(app.getHttpServer()).get('/auth/me').set('authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect((res.body as { email: string }).email).toBe(email);
  });

  it('토큰 없이 /auth/me는 401', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('8자 미만 비밀번호 가입은 400', async () => {
    const res = await register(uniqueEmail(), 'short');
    expect(res.status).toBe(400);
  });
});
