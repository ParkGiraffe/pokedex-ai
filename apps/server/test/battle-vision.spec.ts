import { randomUUID } from 'node:crypto';

import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';

type AuthRes = { accessToken: string };

// 실제 Anthropic 호출(비용)을 피하려 가드·검증 단계만 검증한다.
// 토큰 없음 → 가드에서 401, 잘못된 body → 검증 파이프에서 400(둘 다 비전 호출 전에 차단).
describe('배틀 스크린샷 조언 게이팅', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('토큰 없이는 401', async () => {
    const res = await request(app.getHttpServer()).post('/battle-screenshot').send({ image: 'x' });
    expect(res.status).toBe(401);
  });

  it('이미지가 없으면 400', async () => {
    const email = `${randomUUID()}@test.local`;
    const registered = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' });
    const token = (registered.body as AuthRes).accessToken;

    const res = await request(app.getHttpServer())
      .post('/battle-screenshot')
      .set('authorization', `Bearer ${token}`)
      .send({ note: '메모만 있음' });
    expect(res.status).toBe(400);
  });
});
