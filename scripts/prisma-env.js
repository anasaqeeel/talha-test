// Load .env.local so Prisma CLI finds DATABASE_URL (Prisma only reads .env by default)
require("dotenv").config({ path: ".env.local" });
const { execSync } = require("child_process");
const args = process.argv.slice(2);
const cmd = args.length ? ["npx", "prisma", ...args] : ["npx", "prisma"];
execSync(cmd.join(" "), { stdio: "inherit", env: process.env });
