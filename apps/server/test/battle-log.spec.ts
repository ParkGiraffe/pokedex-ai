import { randomUUID } from 'node:crypto';

import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';

type AuthRes = { accessToken: string };
type BattleLogRes = { id: string; result: string; memo: string | null };
type BattleStatsRes = {
  total: number;
  wins: number;
  winRate: number;
  byLead: Array<{ lead: string; games: number; wins: number; winRate: number }>;
};

describe('배틀 로그·통계', () => {
  let app: NestExpressApplication;

  const newUser = async (): Promise<string> => {
    const email = `${randomUUID()}@test.local`;
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' });
    return (res.body as AuthRes).accessToken;
  };

  const addLog = (token: string, body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/battle-logs').set('authorization', `Bearer ${token}`).send(body);

  const sample = (over: Record<string, unknown> = {}) => ({
    myLead: '한카리아스',
    opponentLead: '위대한엄니',
    gimmick: 'tera',
    result: 'win',
    ...over,
  });

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('로그를 기록·조회·삭제한다', async () => {
    const token = await newUser();
    const auth = `Bearer ${token}`;

    const created = await addLog(token, sample({ memo: '선공으로 정리' }));
    expect(created.status).toBe(201);
    const createdBody = created.body as BattleLogRes;
    expect(createdBody.id).toBeTruthy();
    expect(createdBody.result).toBe('win');
    expect(createdBody.memo).toBe('선공으로 정리');

    const listed = await request(app.getHttpServer()).get('/battle-logs').set('authorization', auth);
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);

    const removed = await request(app.getHttpServer())
      .delete(`/battle-logs/${createdBody.id}`)
      .set('authorization', auth);
    expect(removed.status).toBe(204);

    const empty = await request(app.getHttpServer()).get('/battle-logs').set('authorization', auth);
    expect(empty.body).toHaveLength(0);
  });

  it('전체·선발별 승률을 집계한다', async () => {
    const token = await newUser();
    const auth = `Bearer ${token}`;
    await addLog(token, sample({ myLead: '한카리아스', result: 'win' }));
    await addLog(token, sample({ myLead: '한카리아스', result: 'loss' }));
    await addLog(token, sample({ myLead: '리자몽', result: 'win' }));

    const stats = await request(app.getHttpServer()).get('/battle-logs/stats').set('authorization', auth);
    expect(stats.status).toBe(200);
    const statsBody = stats.body as BattleStatsRes;
    expect(statsBody.total).toBe(3);
    expect(statsBody.wins).toBe(2);
    expect(statsBody.winRate).toBeCloseTo(66.7, 1);

    const garchomp = statsBody.byLead.find((row) => row.lead === '한카리아스');
    expect(garchomp).toBeDefined();
    expect(garchomp!.games).toBe(2);
    expect(garchomp!.wins).toBe(1);
    expect(garchomp!.winRate).toBe(50);
  });

  it('빈 로그의 통계는 0이다', async () => {
    const token = await newUser();
    const stats = await request(app.getHttpServer()).get('/battle-logs/stats').set('authorization', `Bearer ${token}`);
    const statsBody = stats.body as BattleStatsRes;
    expect(statsBody.total).toBe(0);
    expect(statsBody.winRate).toBe(0);
    expect(statsBody.byLead).toHaveLength(0);
  });

  it('남의 로그는 삭제할 수 없다(404)', async () => {
    const ownerToken = await newUser();
    const created = await addLog(ownerToken, sample());
    const intruderToken = await newUser();
    const res = await request(app.getHttpServer())
      .delete(`/battle-logs/${(created.body as BattleLogRes).id}`)
      .set('authorization', `Bearer ${intruderToken}`);
    expect(res.status).toBe(404);
  });

  it('토큰 없이는 401', async () => {
    const res = await request(app.getHttpServer()).get('/battle-logs');
    expect(res.status).toBe(401);
  });

  it('잘못된 승패 값은 400', async () => {
    const token = await newUser();
    const res = await addLog(token, sample({ result: '비김' }));
    expect(res.status).toBe(400);
  });
});
