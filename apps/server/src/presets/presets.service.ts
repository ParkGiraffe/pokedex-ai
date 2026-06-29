import { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { type PartyDraft } from '@pokedex-agent/pokedex-core';
import { uuidv7 } from 'uuidv7';

import { User } from '../users/user.entity';
import { UserTier } from '../users/user.enums';
import { Preset } from './preset.entity';
import { PRESET_CAP_BY_TIER } from './preset-caps';

@Injectable()
export class PresetsService {
  constructor(private readonly em: EntityManager) {}

  list(userId: string): Promise<Preset[]> {
    return this.em.find(Preset, { user: userId }, { orderBy: { createdAt: 'asc' } });
  }

  async getOwned(userId: string, id: string): Promise<Preset> {
    const preset = await this.em.findOne(Preset, { id, user: userId });
    if (!preset) {
      throw new NotFoundException('프리셋을 찾을 수 없습니다');
    }
    return preset;
  }

  create(userId: string, name: string, party: PartyDraft): Promise<Preset> {
    return this.em.transactional(async (em) => {
      const user = await em.findOne(User, { id: userId });
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }
      const tier = user.tier as UserTier;
      const cap = PRESET_CAP_BY_TIER[tier];
      if ((await em.count(Preset, { user: userId })) >= cap) {
        const label = tier === UserTier.PAID ? '유료' : '무료';
        throw new ForbiddenException(`${label} 계정은 프리셋을 최대 ${cap}개까지 저장할 수 있습니다`);
      }
      const preset = em.create(Preset, { user, name, party });
      em.persist(preset);
      return preset;
    });
  }

  async update(userId: string, id: string, patch: { name?: string; party?: PartyDraft }): Promise<Preset> {
    const preset = await this.getOwned(userId, id);
    if (patch.name !== undefined) {
      preset.name = patch.name;
    }
    if (patch.party !== undefined) {
      preset.party = patch.party;
    }
    await this.em.flush();
    return preset;
  }

  async remove(userId: string, id: string): Promise<void> {
    const preset = await this.getOwned(userId, id);
    this.em.remove(preset);
    await this.em.flush();
  }

  async share(userId: string, id: string): Promise<string> {
    const preset = await this.getOwned(userId, id);
    if (!preset.shareToken) {
      preset.shareToken = uuidv7();
      await this.em.flush();
    }
    return preset.shareToken;
  }

  async unshare(userId: string, id: string): Promise<void> {
    const preset = await this.getOwned(userId, id);
    preset.shareToken = undefined;
    await this.em.flush();
  }

  async getByShareToken(token: string): Promise<Preset> {
    const preset = await this.em.findOne(Preset, { shareToken: token });
    if (!preset) {
      throw new NotFoundException('공유된 프리셋을 찾을 수 없습니다');
    }
    return preset;
  }

  copyFromShare(userId: string, token: string): Promise<Preset> {
    return this.em.transactional(async (em) => {
      const source = await em.findOne(Preset, { shareToken: token });
      if (!source) {
        throw new NotFoundException('공유된 프리셋을 찾을 수 없습니다');
      }
      const user = await em.findOne(User, { id: userId });
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }
      const tier = user.tier as UserTier;
      const cap = PRESET_CAP_BY_TIER[tier];
      if ((await em.count(Preset, { user: userId })) >= cap) {
        const label = tier === UserTier.PAID ? '유료' : '무료';
        throw new ForbiddenException(`${label} 계정은 프리셋을 최대 ${cap}개까지 저장할 수 있습니다`);
      }
      const copied = em.create(Preset, { user, name: source.name, party: source.party });
      em.persist(copied);
      source.copyCount += 1;
      return copied;
    });
  }

  leaderboard(limit: number): Promise<Preset[]> {
    return this.em.find(Preset, { shareToken: { $ne: null } }, { orderBy: { copyCount: 'desc' }, limit });
  }
}
