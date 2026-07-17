import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const EMAIL = "renebenegas.rb@gmail.com";
const PASS  = "raxis2026";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log("✅ Admin ya existe:", existing.id);
    return;
  }

  const hash = await bcrypt.hash(PASS, 12);
  const user = await prisma.user.create({
    data: { email: EMAIL, password: hash, role: "ADMIN", name: "René Benegas" },
  });
  console.log("✅ Admin creado:", user.id, user.email);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
