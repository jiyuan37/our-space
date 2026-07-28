import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: { userId: string; email: string; name: string };
  }
  interface User {
    id: string;
    email: string;
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    name: string;
  }
}
