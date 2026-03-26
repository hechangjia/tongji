import { Role, UserStatus } from "@prisma/client";

type SeedUserReference = {
  id: string;
};

type UserSeedClient = {
  user: {
    findUnique(args: {
      where: {
        username: string;
      };
      select: {
        id: true;
      };
    }): Promise<SeedUserReference | null>;
    create(args: {
      data: DefaultUserConfig;
      select: {
        id: true;
      };
    }): Promise<SeedUserReference>;
  };
};

type EnsureDefaultUsersInput = {
  adminPasswordHash: string;
  memberPasswordHash: string;
};

type DefaultUserConfig = {
  username: string;
  passwordHash: string;
  name: string;
  role: Role;
  status: UserStatus;
};

async function ensureDefaultUser(
  prisma: UserSeedClient,
  config: DefaultUserConfig,
): Promise<SeedUserReference> {
  const existingUser = await prisma.user.findUnique({
    where: { username: config.username },
    select: { id: true },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: config,
    select: { id: true },
  });
}

export async function ensureDefaultUsers(
  prisma: UserSeedClient,
  { adminPasswordHash, memberPasswordHash }: EnsureDefaultUsersInput,
) {
  const admin = await ensureDefaultUser(prisma, {
    username: "admin",
    passwordHash: adminPasswordHash,
    name: "系统管理员",
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
  });

  const member = await ensureDefaultUser(prisma, {
    username: "member01",
    passwordHash: memberPasswordHash,
    name: "示例成员",
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
  });

  return { admin, member };
}
