import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/auth/password";
import type {
  CreateAdminUserInput,
  ResetAdminUserPasswordInput,
  UpdateAdminUserInput,
} from "@/lib/validations/admin-user";
import { UserRepository } from "@/repositories/user.repository";
import type { PublicUser, User } from "@/types";

const userRepository = new UserRepository();

function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  void passwordHash;

  return publicUser;
}

async function protectActiveAdministrator(
  existing: User,
  input: UpdateAdminUserInput,
): Promise<void> {
  const removesActiveAdministrator =
    existing.role === "ADMIN" &&
    existing.status === "ACTIVE" &&
    (input.role === "PROFESSIONAL" || input.status === "INACTIVE");

  if (!removesActiveAdministrator) return;

  const users = await userRepository.listAll();
  const activeAdministrators = users.filter(
    (user) => user.role === "ADMIN" && user.status === "ACTIVE",
  );

  if (activeAdministrators.length <= 1) {
    throw new Error("LAST_ACTIVE_ADMIN");
  }
}

export const AdminUserService = {
  async list(): Promise<PublicUser[]> {
    const users = await userRepository.listAll();

    return users.sort((first, second) => first.name.localeCompare(second.name)).map(toPublicUser);
  },

  async getById(id: string): Promise<PublicUser | null> {
    const user = await userRepository.findById(id);
    return user ? toPublicUser(user) : null;
  },

  async create(input: CreateAdminUserInput): Promise<PublicUser> {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    await userRepository.save(user);
    return toPublicUser(user);
  },

  async update(
    id: string,
    input: UpdateAdminUserInput,
    actorUserId: string,
  ): Promise<PublicUser | null> {
    const existing = await userRepository.findById(id);

    if (!existing) return null;

    if (id === actorUserId && input.status === "INACTIVE") {
      throw new Error("SELF_DEACTIVATION_NOT_ALLOWED");
    }

    await protectActiveAdministrator(existing, input);

    const updatedUser: User = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await userRepository.save(updatedUser);
    return toPublicUser(updatedUser);
  },

  async resetPassword(id: string, input: ResetAdminUserPasswordInput): Promise<PublicUser | null> {
    const existing = await userRepository.findById(id);

    if (!existing) return null;

    const updatedUser: User = {
      ...existing,
      passwordHash: await hashPassword(input.password),
      updatedAt: new Date().toISOString(),
    };

    await userRepository.save(updatedUser);
    return toPublicUser(updatedUser);
  },
};
