import { app } from "./app";
import { env } from "./config";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
