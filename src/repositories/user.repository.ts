import { getRedisClient } from "@/lib/redis/client";
import type { User, UserStatus } from "@/types";

const USERS_PREFIX = "users";
const EMAIL_INDEX_PREFIX = "users:email";
const USERS_INDEX_KEY = "users:index";

export class UserRepository {
  private get redis() {
    return getRedisClient();
  }

  private key(id: string): string {
    return `${USERS_PREFIX}:${id}`;
  }

  private emailKey(email: string): string {
    return `${EMAIL_INDEX_PREFIX}:${email}`;
  }

  async findById(id: string): Promise<User | null> {
    const data = await this.redis.hgetall<Record<string, string>>(this.key(id));
    if (!data || Object.keys(data).length === 0) return null;
    return this.deserialize(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const id = await this.redis.get<string>(this.emailKey(email));
    if (!id) return null;
    return this.findById(id);
  }

  async save(user: User): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.hset(this.key(user.id), this.serialize(user));
    pipeline.set(this.emailKey(user.email), user.id);
    pipeline.sadd(USERS_INDEX_KEY, user.id);
    await pipeline.exec();
  }

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    const now = new Date().toISOString();
    await this.redis.hset(this.key(id), { status, updatedAt: now });
  }

  async listAll(): Promise<User[]> {
    const ids = await this.redis.smembers(USERS_INDEX_KEY);
    if (ids.length === 0) return [];
    const users = await Promise.all(ids.map((id) => this.findById(id)));
    return users.filter((u): u is User => u !== null);
  }

  private serialize(user: User): Record<string, string> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private deserialize(data: Record<string, string>): User {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role as User["role"],
      status: data.status as User["status"],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
