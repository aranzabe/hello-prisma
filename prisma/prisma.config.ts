// import { defineConfig } from '@prisma/config';

// export default defineConfig({
//   datasource: {
//     url: process.env.DATABASE_URL,
//   },
//   migrations: {
//     // Definimos el comando que ejecutará el seeder
//     seed: 'tsx prisma/seed.ts',
//   },
// });

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