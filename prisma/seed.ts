import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "demo@cryptosentry.com";
    const hashed = await bcrypt.hash("demo1234", 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: "Demo User",
            password: hashed,
        },
    });

    console.log("Seed OK. Test login:", { email: user.email, password: "demo1234" });
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
