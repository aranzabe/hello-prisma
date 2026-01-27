import 'dotenv/config'
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { 
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { 
    url: env("DATABASE_URL") 
  }
});

//https://www.prisma.io/docs/orm/reference/prisma-config-reference
//https://www.prisma.io/docs/orm/reference/prisma-client-reference
//https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
//https://www.prisma.io/docs/orm/prisma-schema/data-model/relations