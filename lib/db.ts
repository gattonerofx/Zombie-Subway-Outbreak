/**
 * Database helper — gracefully degrades when Prisma / a real DB isn't available.
 * The game runs perfectly without a database; scores & settings just use in-memory defaults.
 */

let db: any = null;

try {
  // Dynamic import so the game doesn't crash if @prisma/client isn't generated
  const { PrismaClient } = require("@prisma/client");
  const globalForPrisma = globalThis as unknown as { prisma: any };
  db = globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
} catch {
  // Prisma not available — use a stub that returns empty results
  console.info("[db] Prisma not available — running in memory-only mode (no score persistence).");
  db = {
    score: {
      findMany: async () => [],
      create: async (args: any) => ({ id: Date.now(), ...args.data }),
    },
    settings: {
      findUnique: async () => null,
      create: async (args: any) => args.data,
      upsert: async (args: any) => ({ id: "singleton", ...args.update }),
    },
  };
}

export { db };
