import { randomUUID } from 'node:crypto';

import { MikroORM } from '@mikro-orm/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';
import { Preset } from '../src/presets/preset.entity';
import { User } from '../src/users/user.entity';
import { UserTier } from '../src/users/user.enums';

type AuthRes = { accessToken: string; user: { id: string } };
type PresetRes = { id: string; shareToken?: string | null };
type LeaderboardEntry = { shareToken: string; copyCount: number };

const sampleParty = () => [
  {
    species: '한카리아스',
    level: 50,
    nature: '고집',
    ability: '까칠한피부',
    item: '구애스카프',
    teraType: '땅',
    moves: ['지진', '역린', '스톤에지', '불꽃엄니'],
    evs: { H: 0, A: 32, B: 0, C: 0, D: 0, S: 32 },
  },
];

describe('리더보드 + 공유 복사 수 추적', () => {
  let app: NestExpressApplication;

  const newUser = async (): Promise<{ token: string; userId: string }> => {
    const email = `${randomUUID()}@test.local`;
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' });
    const body = res.body as AuthRes;
    return { token: body.accessToken, userId: body.user.id };
  };

  const makePaid = async (userId: string): Promise<void> => {
    const em = app.get(MikroORM).em.fork();
    const user = await em.findOneOrFail(User, { id: userId });
    user.tier = UserTier.PAID;
    await em.flush();
  };

  const createPreset = (token: string, name: string) =>
    request(app.getHttpServer())
      .post('/presets')
      .set('authorization', `Bearer ${token}`)
      .send({ name, party: sampleParty() });

  const sharePreset = (token: string, id: string) =>
    request(app.getHttpServer()).post(`/presets/${id}/share`).set('authorization', `Bearer ${token}`);

  const copyPreset = (token: string, shareToken: string) =>
    request(app.getHttpServer())
      .post('/presets/copy')
      .set('authorization', `Bearer ${token}`)
      .send({ token: shareToken });

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  // 리더보드는 전역 top-N이라 다른 테스트가 남긴 공유 프리셋이 누적·순서를 오염시킨다.
  // 파일 순차 실행(fileParallelism:false)이므로 각 테스트 전에 프리셋을 비워 결정적으로 만든다.
  beforeEach(async () => {
    await app.get(MikroORM).em.fork().nativeDelete(Preset, {});
  });

  afterAll(async () => {
    await app.close();
  });

  it('공유 프리셋을 복사하면 원본 copyCount가 1 증가한다', async () => {
    const owner = await newUser();
    const copier = await newUser();

    const created = await createPreset(owner.token, '인기 파티');
    const id = (created.body as PresetRes).id;

    const shared = await sharePreset(owner.token, id);
    const shareToken = (shared.body as { shareToken: string }).shareToken;

    const copied = await copyPreset(copier.token, shareToken);
    expect(copied.status).toBe(201);
    expect((copied.body as { name: string }).name).toBe('인기 파티');

    // 공개 열람으로 copyCount 확인
    const leaderboard = await request(app.getHttpServer()).get('/leaderboard');
    expect(leaderboard.status).toBe(200);
    const entry = (leaderboard.body as LeaderboardEntry[]).find((p) => p.shareToken === shareToken);
    expect(entry).toBeDefined();
    expect(entry!.copyCount).toBe(1);
  });

  it('리더보드는 copyCount 내림차순으로 반환한다', async () => {
    const owner = await newUser();
    await makePaid(owner.userId);

    const a = await createPreset(owner.token, '파티A');
    const b = await createPreset(owner.token, '파티B');
    const c = await createPreset(owner.token, '파티C');

    const sharedA = (await sharePreset(owner.token, (a.body as PresetRes).id)).body as { shareToken: string };
    const sharedB = (await sharePreset(owner.token, (b.body as PresetRes).id)).body as { shareToken: string };
    const _sharedC = (await sharePreset(owner.token, (c.body as PresetRes).id)).body as { shareToken: string };

    // A: 3회, B: 1회, C: 0회
    for (let i = 0; i < 3; i++) {
      const copier = await newUser();
      await copyPreset(copier.token, sharedA.shareToken);
    }
    const copierB = await newUser();
    await copyPreset(copierB.token, sharedB.shareToken);

    const leaderboard = await request(app.getHttpServer()).get('/leaderboard');
    expect(leaderboard.status).toBe(200);

    const tokens = (leaderboard.body as LeaderboardEntry[]).map((p) => p.shareToken);
    const idxA = tokens.indexOf(sharedA.shareToken);
    const idxB = tokens.indexOf(sharedB.shareToken);
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThanOrEqual(0);
    expect(idxA).toBeLessThan(idxB);
  });

  it('복사 시 무료 계정 한도(2)를 넘기면 403', async () => {
    const owner = await newUser();
    const copier = await newUser();

    // 이미 무료 한도(2)를 채운다
    await createPreset(copier.token, '내 파티1');
    await createPreset(copier.token, '내 파티2');

    const created = await createPreset(owner.token, '공유 파티');
    const shared = await sharePreset(owner.token, (created.body as PresetRes).id);
    const shareToken = (shared.body as { shareToken: string }).shareToken;

    const res = await copyPreset(copier.token, shareToken);
    expect(res.status).toBe(403);
  });

  it('리더보드는 인증 없이 조회할 수 있다', async () => {
    const res = await request(app.getHttpServer()).get('/leaderboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('공유되지 않은 토큰으로 복사하면 404', async () => {
    const copier = await newUser();
    const res = await copyPreset(copier.token, '없는토큰');
    expect(res.status).toBe(404);
  });
});
