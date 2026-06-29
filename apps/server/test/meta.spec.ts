import { randomUUID } from 'node:crypto';

import { MikroORM } from '@mikro-orm/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';

type AuthRes = { accessToken: string };
type MetaSummary = {
  totalGames: number;
  topLeads: Array<{ species: string; games: number; wins: number; winRate: number; usage: number }>;
  topOpponents: Array<{ species: string; games: number; wins: number; winRate: number; usage: number }>;
  gimmickUsage: Array<{ gimmick: string; games: number; share: number }>;
};

describe('리빙 메타', () => {
  let app: NestExpressApplication;

  const newUser = async (): Promise<string> => {
    const email = `${randomUUID()}@test.local`;
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' });
    return (res.body as AuthRes).accessToken;
  };

  const addLog = (token: string, body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/battle-logs').set('authorization', `Bearer ${token}`).send(body);

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('빈 DB에서 totalGames 0, 빈 배열을 반환한다', async () => {
    const res = await request(app.getHttpServer()).get('/meta/usage');
    expect(res.status).toBe(200);
    const body = res.body as MetaSummary;
    expect(typeof body.totalGames).toBe('number');
    expect(Array.isArray(body.topLeads)).toBe(true);
    expect(Array.isArray(body.topOpponents)).toBe(true);
    expect(Array.isArray(body.gimmickUsage)).toBe(true);
  });

  it('인증 없이 접근할 수 있다', async () => {
    const res = await request(app.getHttpServer()).get('/meta/usage');
    expect(res.status).toBe(200);
  });

  it('여러 사용자의 로그를 통합해 집계한다', async () => {
    await app.get(MikroORM).em.fork().getConnection().execute('delete from battle_logs');
    const tokenA = await newUser();
    const tokenB = await newUser();

    await addLog(tokenA, { myLead: '뮤우METASPEC', opponentLead: '셀비', gimmick: 'none', result: 'win' });
    await addLog(tokenA, { myLead: '뮤우METASPEC', opponentLead: '셀비', gimmick: 'none', result: 'win' });
    await addLog(tokenA, { myLead: '뮤우METASPEC', opponentLead: '셀비', gimmick: 'none', result: 'loss' });

    await addLog(tokenB, { myLead: '세레비METASPEC', opponentLead: '뮤우METASPEC', gimmick: 'mega', result: 'win' });

    const res = await request(app.getHttpServer()).get('/meta/usage');
    expect(res.status).toBe(200);

    const { totalGames, topLeads, topOpponents, gimmickUsage } = res.body as MetaSummary;

    expect(totalGames).toBe(4);

    const mew = topLeads.find((r) => r.species === '뮤우METASPEC');
    expect(mew).toBeDefined();
    expect(mew!.games).toBe(3);
    expect(mew!.wins).toBe(2);
    expect(mew!.winRate).toBeCloseTo(66.7, 1);

    const serebii = topLeads.find((r) => r.species === '세레비METASPEC');
    expect(serebii).toBeDefined();
    expect(serebii!.games).toBe(1);

    const mewIdx = topLeads.findIndex((r) => r.species === '뮤우METASPEC');
    const serebiiIdx = topLeads.findIndex((r) => r.species === '세레비METASPEC');
    expect(mewIdx).toBeLessThan(serebiiIdx);

    const oppMew = topOpponents.find((r) => r.species === '뮤우METASPEC');
    expect(oppMew).toBeDefined();
    expect(oppMew!.games).toBe(1);

    expect(gimmickUsage.some((g) => g.gimmick === 'none')).toBe(true);
    expect(gimmickUsage.some((g) => g.gimmick === 'mega')).toBe(true);
  });
});
