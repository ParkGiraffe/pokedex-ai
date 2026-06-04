import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";

import { type ProviderName } from "../auth/domain/identity";
import { User } from "./user.entity";

// EntityManager만 사용(EntityRepository 금지). 조회/생성은 SRP로 분리한다.
@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  findByProvider(provider: ProviderName, providerUserId: string): Promise<User | null> {
    return this.em.findOne(User, { provider, providerUserId });
  }

  async create(data: {
    provider: ProviderName;
    providerUserId: string;
    email?: string;
    passwordHash?: string;
    nickname?: string;
  }): Promise<User> {
    const user = this.em.create(User, data);
    this.em.persist(user);
    await this.em.flush();
    return user;
  }
}
