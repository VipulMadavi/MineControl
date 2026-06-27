import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

declare const require: NodeRequire;

// Load monorepo root .env file manually ONLY in Node.js server runtime
if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
  try {
    const fs = require("fs");
    const path = require("path");
    const paths = [
      path.resolve(process.cwd(), "../../.env"),
      path.resolve(process.cwd(), ".env")
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        content.split("\n").forEach((line: string) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
            process.env[key] = val;
          }
        });
        break;
      }
    }
  } catch (err) {
    console.error("[auth] Error loading manual env:", (err as Error).message);
  }
}

// Environment Variable Checks (only warn in Node.js environment)
if (process.env.NEXT_RUNTIME !== "edge") {
  if (!process.env.DISCORD_CLIENT_ID) {
    console.warn("[auth] Warning: DISCORD_CLIENT_ID is not configured in the environment.");
  }
  if (!process.env.DISCORD_CLIENT_SECRET) {
    console.warn("[auth] Warning: DISCORD_CLIENT_SECRET is not configured in the environment.");
  }
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn("[auth] Warning: NEXTAUTH_SECRET is not configured in the environment. Using fallback for local development.");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify+email"
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // Fire-and-forget audit log on every successful OAuth login
      if (profile && "username" in profile) {
        try {
          const { logUserLogin } = await import("@/lib/discord/webhook");
          logUserLogin((profile as { username?: string }).username || profile.name || "Unknown");
        } catch {
          // Never block login
        }
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile && "id" in profile) {
        token.discordId = profile.id as string;
        
        try {
          const { loadConfig } = await import("@/lib/config");
          const config = loadConfig();
          const authorizedUsers = config.permissions.authorized_users;
          token.isAuthorized = authorizedUsers.includes(profile.id as string);
        } catch (error) {
          console.error("[auth] Failed config validation in jwt callback:", (error as Error).message);
          token.isAuthorized = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.discordId) {
          session.user.discordId = token.discordId as string;
        }
        session.user.isAuthorized = !!token.isAuthorized;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: (() => {
    if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET is required in production");
    }
    return "dev-only-secret-not-for-production-use";
  })(),
});
