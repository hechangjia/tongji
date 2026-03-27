import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "LEADER" | "MEMBER";
      status: "ACTIVE" | "INACTIVE";
      username: string;
    };
  }

  interface User {
    id: string;
    role: "ADMIN" | "LEADER" | "MEMBER";
    status: "ACTIVE" | "INACTIVE";
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "ADMIN" | "LEADER" | "MEMBER";
    status?: "ACTIVE" | "INACTIVE";
    username?: string;
  }
}
