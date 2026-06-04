import { EntityManager } from "@mikro-orm/postgresql";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { type PartyDraft } from "@pokedex-agent/pokedex-core";

import { User } from "../users/user.entity";
import { UserTier } from "../users/user.enums";
import { PRESET_CAP_BY_TIER } from "./preset-caps";
import { Preset } from "./preset.entity";

@Injectable()
export class PresetsService {
  constructor(private readonly em: EntityManager) {}

  list(userId: string): Promise<Preset[]> {
    return this.em.find(Preset, { user: userId }, { orderBy: { createdAt: "asc" } });
  }

  // 소유자 본인 것만 조회 — 남의 프리셋은 존재 여부도 노출하지 않도록 404.
  async getOwned(userId: string, id: string): Promise<Preset> {
    const preset = await this.em.findOne(Preset, { id, user: userId });
    if (!preset) {
      throw new NotFoundException("프리셋을 찾을 수 없습니다");
    }
    return preset;
  }

  // 개수 검사 + 생성을 한 트랜잭션으로 묶어 동시 요청이 캡을 넘기지 못하게 한다(커밋 시 flush).
  create(userId: string, name: string, party: PartyDraft): Promise<Preset> {
    return this.em.transactional(async (em) => {
      const user = await em.findOne(User, { id: userId });
      if (!user) {
        throw new NotFoundException("사용자를 찾을 수 없습니다");
      }
      const tier = user.tier as UserTier;
      const cap = PRESET_CAP_BY_TIER[tier];
      if ((await em.count(Preset, { user: userId })) >= cap) {
        const label = tier === UserTier.PAID ? "유료" : "무료";
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
}
