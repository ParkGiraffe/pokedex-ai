import { randomUUID } from 'node:crypto';

import { MikroORM } from '@mikro-orm/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';

const kstToday = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

const validParty = {
  party: [
    {
      species: '한카리아스',
      nature: '고집',
      ability: '까칠한피부',
      teraType: '땅',
      moves: ['지진', '역린', '스톤에지', '불꽃엄니'],
      evs: { H: 0, A: 32, B: 0, C: 0, D: 0, S: 32 },
    },
  ],
};

type AuthRes = { accessToken: string; user: { id: string } };
type QuotaRes = { used: number; remaining: number; cap: number };

describe('일일 쿼터', () => {
  let app: NestExpressApplication;

  const register = async (): Promise<{ token: string; userId: string }> => {
    const email = `${randomUUID()}@test.local`;
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' });
    const body = res.body as AuthRes;
    return { token: body.accessToken, userId: body.user.id };
  };

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('로그인 없이 AI 엔드포인트 호출은 401', async () => {
    const res = await request(app.getHttpServer()).post('/analyze-party').send(validParty);
    expect(res.status).toBe(401);
  });

  it('무료 계정의 쿼터 현황은 0/2', async () => {
    const { token } = await register();
    const res = await request(app.getHttpServer()).get('/quota').set('authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ used: 0, remaining: 2, cap: 2 });
  });

  it('한도(2회) 소진 후 AI 호출은 429', async () => {
    const { token, userId } = await register();
    await app
      .get(MikroORM)
      .em.getConnection()
      .execute('insert into usage_daily (user_id, usage_date, count) values (?, ?, ?)', [userId, kstToday(), 2]);

    const status = await request(app.getHttpServer()).get('/quota').set('authorization', `Bearer ${token}`);
    expect((status.body as QuotaRes).remaining).toBe(0);

    const res = await request(app.getHttpServer())
      .post('/analyze-party')
      .set('authorization', `Bearer ${token}`)
      .send(validParty);
    expect(res.status).toBe(429);
  });
});
