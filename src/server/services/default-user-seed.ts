import { Role, UserStatus } from "@prisma/client";

type SeedUserReference = {
  id: string;
};

type UserSeedClient = {
  user: {
    findFirst(args: {
      where: {
        role: Role;
      };
      select: {
        id: true;
      };
      orderBy: {
        createdAt: "asc";
      };
    }): Promise<SeedUserReference | null>;
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

async function ensureDefaultAdmin(
  prisma: UserSeedClient,
  passwordHash: string,
): Promise<SeedUserReference> {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingAdmin) {
    return existingAdmin;
  }

  return prisma.user.create({
    data: {
      username: "admin",
      passwordHash,
      name: "系统管理员",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: { id: true },
  });
}

export async function ensureDefaultUsers(
  prisma: UserSeedClient,
  { adminPasswordHash, memberPasswordHash }: EnsureDefaultUsersInput,
) {
  const admin = await ensureDefaultAdmin(prisma, adminPasswordHash);

  const member = await ensureDefaultUser(prisma, {
    username: "member01",
    passwordHash: memberPasswordHash,
    name: "示例成员",
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
  });

  return { admin, member };
}
