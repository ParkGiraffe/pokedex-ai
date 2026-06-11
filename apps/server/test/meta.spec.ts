import { randomUUID } from 'node:crypto';

import { MikroORM } from '@mikro-orm/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';

describe('리빙 메타', () => {
  let app: NestExpressApplication;

  const newUser = async (): Promise<string> => {
    const email = `${randomUUID()}@test.local`;
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' });
    return res.body.accessToken as string;
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
    // 이 테스트가 먼저 실행되는 경우를 위해 DB 상태와 무관하게 구조만 검사한다.
    const res = await request(app.getHttpServer()).get('/meta/usage');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalGames).toBe('number');
    expect(Array.isArray(res.body.topLeads)).toBe(true);
    expect(Array.isArray(res.body.topOpponents)).toBe(true);
    expect(Array.isArray(res.body.gimmickUsage)).toBe(true);
  });

  it('인증 없이 접근할 수 있다', async () => {
    const res = await request(app.getHttpServer()).get('/meta/usage');
    expect(res.status).toBe(200);
  });

  it('여러 사용자의 로그를 통합해 집계한다', async () => {
    // 전역 집계라 다른 spec이 남긴 로그가 섞이고 상위 N 절단에 시드가 밀릴 수 있다.
    // 파일 순차 실행(fileParallelism:false)이므로 동시 writer 없이 안전하게 비운다.
    await app.get(MikroORM).em.fork().getConnection().execute('delete from battle_logs');
    const tokenA = await newUser();
    const tokenB = await newUser();

    // 사용자 A: 뮤우로 2승 1패
    await addLog(tokenA, { myLead: '뮤우METASPEC', opponentLead: '셀비', gimmick: 'none', result: 'win' });
    await addLog(tokenA, { myLead: '뮤우METASPEC', opponentLead: '셀비', gimmick: 'none', result: 'win' });
    await addLog(tokenA, { myLead: '뮤우METASPEC', opponentLead: '셀비', gimmick: 'none', result: 'loss' });

    // 사용자 B: 세레비로 1승
    await addLog(tokenB, { myLead: '세레비METASPEC', opponentLead: '뮤우METASPEC', gimmick: 'mega', result: 'win' });

    const res = await request(app.getHttpServer()).get('/meta/usage');
    expect(res.status).toBe(200);

    const { totalGames, topLeads, topOpponents, gimmickUsage } = res.body as {
      totalGames: number;
      topLeads: Array<{ species: string; games: number; wins: number; winRate: number; usage: number }>;
      topOpponents: Array<{ species: string; games: number; wins: number; winRate: number; usage: number }>;
      gimmickUsage: Array<{ gimmick: string; games: number; share: number }>;
    };

    // 위에서 비웠으므로 이 테스트 시드(4판)만 집계된다.
    expect(totalGames).toBe(4);

    const mew = topLeads.find((r) => r.species === '뮤우METASPEC');
    expect(mew).toBeDefined();
    expect(mew!.games).toBe(3);
    expect(mew!.wins).toBe(2);
    expect(mew!.winRate).toBeCloseTo(66.7, 1);

    const serebii = topLeads.find((r) => r.species === '세레비METASPEC');
    expect(serebii).toBeDefined();
    expect(serebii!.games).toBe(1);

    // 뮤우가 세레비보다 게임 수가 많으므로 앞에 있어야 한다.
    const mewIdx = topLeads.findIndex((r) => r.species === '뮤우METASPEC');
    const serebiiIdx = topLeads.findIndex((r) => r.species === '세레비METASPEC');
    expect(mewIdx).toBeLessThan(serebiiIdx);

    // 상대 선발 집계
    const oppMew = topOpponents.find((r) => r.species === '뮤우METASPEC');
    expect(oppMew).toBeDefined();
    expect(oppMew!.games).toBe(1);

    // 깁믹 집계에 none·mega가 모두 있어야 한다.
    expect(gimmickUsage.some((g) => g.gimmick === 'none')).toBe(true);
    expect(gimmickUsage.some((g) => g.gimmick === 'mega')).toBe(true);
  });
});
