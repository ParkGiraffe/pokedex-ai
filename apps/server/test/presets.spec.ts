import { randomUUID } from 'node:crypto';

import { MikroORM } from '@mikro-orm/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.factory';
import { User } from '../src/users/entities';
import { UserTier } from '../src/users/enums';

type AuthRes = { accessToken: string; user: { id: string } };
type PresetRes = { id: string; name: string; party: unknown; shareToken?: string | null };

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

describe('프리셋 (티어 한도)', () => {
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

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('프리셋을 생성·조회·수정·삭제한다', async () => {
    const { token } = await newUser();
    const created = await createPreset(token, '내 파티');
    expect(created.status).toBe(201);
    const createdBody = created.body as PresetRes;
    expect(createdBody.id).toBeTruthy();
    expect(createdBody.name).toBe('내 파티');
    expect(createdBody.party).toHaveLength(1);

    const id = createdBody.id;
    const auth = `Bearer ${token}`;

    const listed = await request(app.getHttpServer()).get('/presets').set('authorization', auth);
    expect(listed.status).toBe(200);
    expect((listed.body as PresetRes[]).some((preset) => preset.id === id)).toBe(true);

    const updated = await request(app.getHttpServer())
      .put(`/presets/${id}`)
      .set('authorization', auth)
      .send({ name: '수정한 파티' });
    expect(updated.status).toBe(200);
    expect((updated.body as PresetRes).name).toBe('수정한 파티');

    const removed = await request(app.getHttpServer()).delete(`/presets/${id}`).set('authorization', auth);
    expect(removed.status).toBe(204);

    const gone = await request(app.getHttpServer()).get(`/presets/${id}`).set('authorization', auth);
    expect(gone.status).toBe(404);
  });

  it('무료 계정은 3번째 프리셋에서 403', async () => {
    const { token } = await newUser();
    expect((await createPreset(token, '1')).status).toBe(201);
    expect((await createPreset(token, '2')).status).toBe(201);
    expect((await createPreset(token, '3')).status).toBe(403);
  });

  it('유료 계정은 무료 한도(2)를 넘겨 저장한다', async () => {
    const { token, userId } = await newUser();
    await makePaid(userId);
    expect((await createPreset(token, '1')).status).toBe(201);
    expect((await createPreset(token, '2')).status).toBe(201);
    expect((await createPreset(token, '3')).status).toBe(201);
  });

  it('남의 프리셋은 404', async () => {
    const owner = await newUser();
    const created = await createPreset(owner.token, '비밀 파티');
    const intruder = await newUser();
    const res = await request(app.getHttpServer())
      .get(`/presets/${(created.body as PresetRes).id}`)
      .set('authorization', `Bearer ${intruder.token}`);
    expect(res.status).toBe(404);
  });

  it('토큰 없이는 401', async () => {
    const res = await request(app.getHttpServer()).get('/presets');
    expect(res.status).toBe(401);
  });

  it('잘못된 party는 400', async () => {
    const { token } = await newUser();
    const res = await request(app.getHttpServer())
      .post('/presets')
      .set('authorization', `Bearer ${token}`)
      .send({ name: '엉터리', party: [{ species: '한카리아스' }] });
    expect(res.status).toBe(400);
  });

  it('공유 토큰을 발급하고 비로그인으로 읽기전용 조회한다', async () => {
    const { token } = await newUser();
    const created = await createPreset(token, '공유할 파티');
    const id = (created.body as PresetRes).id;
    const auth = `Bearer ${token}`;

    const shared = await request(app.getHttpServer()).post(`/presets/${id}/share`).set('authorization', auth);
    expect(shared.status).toBe(200);
    const shareToken = (shared.body as { shareToken: string }).shareToken;
    expect(shareToken).toBeTruthy();

    const publicView = await request(app.getHttpServer()).get(`/shared-presets/${shareToken}`);
    expect(publicView.status).toBe(200);
    const publicBody = publicView.body as { name: string; party: unknown; id?: string; shareToken?: string };
    expect(publicBody.name).toBe('공유할 파티');
    expect(publicBody.party).toHaveLength(1);
    expect(publicBody.id).toBeUndefined();
    expect(publicBody.shareToken).toBeUndefined();
  });

  it('같은 프리셋 재공유는 같은 토큰을 준다(멱등)', async () => {
    const { token } = await newUser();
    const created = await createPreset(token, '파티');
    const auth = `Bearer ${token}`;
    const first = await request(app.getHttpServer())
      .post(`/presets/${(created.body as PresetRes).id}/share`)
      .set('authorization', auth);
    const second = await request(app.getHttpServer())
      .post(`/presets/${(created.body as PresetRes).id}/share`)
      .set('authorization', auth);
    expect((second.body as { shareToken: string }).shareToken).toBe((first.body as { shareToken: string }).shareToken);
  });

  it('공유 취소 후에는 옛 링크가 404', async () => {
    const { token } = await newUser();
    const created = await createPreset(token, '파티');
    const auth = `Bearer ${token}`;
    const shared = await request(app.getHttpServer())
      .post(`/presets/${(created.body as PresetRes).id}/share`)
      .set('authorization', auth);
    const shareToken = (shared.body as { shareToken: string }).shareToken;

    const unshared = await request(app.getHttpServer())
      .delete(`/presets/${(created.body as PresetRes).id}/share`)
      .set('authorization', auth);
    expect(unshared.status).toBe(204);

    const gone = await request(app.getHttpServer()).get(`/shared-presets/${shareToken}`);
    expect(gone.status).toBe(404);
  });

  it('없는 공유 토큰은 404', async () => {
    const res = await request(app.getHttpServer()).get('/shared-presets/없는토큰');
    expect(res.status).toBe(404);
  });

  it('남의 프리셋은 공유할 수 없다(404)', async () => {
    const owner = await newUser();
    const created = await createPreset(owner.token, '비밀 파티');
    const intruder = await newUser();
    const res = await request(app.getHttpServer())
      .post(`/presets/${(created.body as PresetRes).id}/share`)
      .set('authorization', `Bearer ${intruder.token}`);
    expect(res.status).toBe(404);
  });
});
