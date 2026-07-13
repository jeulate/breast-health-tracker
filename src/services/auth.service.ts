import { UserRepository } from "@/repositories/user.repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession, getSession } from "@/lib/auth/session";
import type { PublicUser } from "@/types";

const userRepo = new UserRepository();

export const AuthService = {
  async login(email: string, password: string): Promise<PublicUser> {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new Error("INVALID_CREDENTIALS");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    if (user.status !== "ACTIVE") throw new Error("ACCOUNT_INACTIVE");
    if (user.role !== "ADMIN") throw new Error("FORBIDDEN");

    await createSession({ sub: user.id, email: user.email, role: user.role });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash1, ...publicUser } = user;
    return publicUser;
  },

  async logout(): Promise<void> {
    await deleteSession();
  },

  async currentUser(): Promise<PublicUser | null> {
    const session = await getSession();
    if (!session) return null;

    const user = await userRepo.findById(session.sub);
    if (!user || user.status !== "ACTIVE") return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash2, ...publicUser } = user;
    return publicUser;
  },
};
