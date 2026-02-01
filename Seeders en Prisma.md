
# 🌱 Seeders en Prisma vs Sequelize vs TypeORM

## 1️⃣ ¿Existen seeders “como tal”?

| ORM           | ¿Seeders nativos?                         |
| ------------- | ----------------------------------------- |
| **Sequelize** | ✅ Sí (CLI oficial)                        |
| **TypeORM**   | ⚠️ No oficial (libs externas)             |
| **Prisma**    | ⚠️ No como concepto, pero **sí se puede** |

👉 Prisma **no copia el modelo Active Record / CLI-heavy** de Sequelize.

---

## 2️⃣ Cómo funciona cada uno

---

## 🟦 Sequelize

### Seeder típico

```bash
npx sequelize-cli seed:generate --name user-seed
```

```js
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Users', [
      { email: 'a@test.com' },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
```

### Características

✔ Seeders versionados
✔ `up` / `down`
✔ Ejecutables individualmente
❌ Muy acoplado al CLI
❌ Poco tipado

---

## 🟨 TypeORM

TypeORM **no tiene seeders oficiales**, se usan librerías como:

* `typeorm-extension`
* `typeorm-seeding` (deprecated)

Ejemplo:

```ts
export default class UserSeeder implements Seeder {
  run(dataSource: DataSource) {
    return dataSource
      .getRepository(User)
      .save({ email: 'admin@test.com' });
  }
}
```

### Características

✔ Cercano a Sequelize
✔ Basado en entidades
❌ Ecosistema fragmentado
❌ Sin estándar claro

---

## 🟩 Prisma (enfoque distinto)

### Seeder Prisma

```ts
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

await prisma.user.upsert({
  where: { email: 'admin@test.com' },
  update: {},
  create: { email: 'admin@test.com' },
});
```

Se ejecuta con:

```bash
yarn prisma db seed
```

---

## 3️⃣ Diferencia FILOSÓFICA clave

### Sequelize / TypeORM

* Seeders = **scripts versionados**
* Parecidos a migrations
* Pueden ejecutarse individualmente

### Prisma

* Seed = **estado deseado**
* Script **idempotente**
* Se puede ejecutar N veces sin romper nada

👉 Prisma **piensa en datos**, no en pasos.

---

## 4️⃣ Comparación directa

| Feature        | Sequelize | TypeORM | Prisma |
| -------------- | --------- | ------- | ------ |
| Seeder oficial | ✅         | ❌       | ⚠️     |
| CLI integrado  | ✅         | ❌       | ✅      |
| Tipado TS      | ❌         | ⚠️      | ✅      |
| `up/down`      | ✅         | ⚠️      | ❌      |
| Idempotente    | ❌         | ❌       | ✅      |
| Acoplado a ORM | 🔥        | 🔥      | 🔥🔥🔥 |

---

## 5️⃣ Cómo hacer algo “parecido” a Sequelize en Prisma

### Estructura recomendada

```
prisma/
 ├── seed.ts
 └── seeds/
     ├── users.seed.ts
     └── posts.seed.ts
```

### users.seed.ts

```ts
export async function seedUsers(prisma) {
  await prisma.user.createMany({
    data: [{ email: 'a@test.com' }],
    skipDuplicates: true,
  });
}
```

### seed.ts

```ts
await seedUsers(prisma);
```

✔ Modular
✔ Orden controlado
✔ Idempotente

---

## 6️⃣ ¿Se pueden ejecutar “seeders individuales”?

### ❌ Prisma CLI no

### ✅ Pero tú sí

```ts
if (process.env.SEED_USERS === 'true') {
  await seedUsers(prisma);
}
```

```bash
SEED_USERS=true yarn prisma db seed
```

---

## 7️⃣ ¿Cuándo Prisma es mejor?

✔ Apps modernas
✔ Tipado fuerte
✔ CI/CD serio
✔ Docker
✔ Menos magia

---

## 8️⃣ ¿Cuándo Sequelize / TypeORM son más cómodos?

✔ Proyectos legacy
✔ Mentalidad Active Record
✔ Seeders tipo “paso a paso”
✔ Rollbacks manuales

---

## 🧠 Frase para grabar a fuego

> **Prisma no ejecuta pasos, asegura estados.**

---

## 🔚 Resumen práctico

* Prisma **sí tiene seed**, pero no “seeders”
* Es más parecido a **scripts declarativos**
* No hay `up/down`
* Se prioriza idempotencia y seguridad



```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  authorId  Int?
  author    User?   @relation(fields: [authorId], references: [id])
}
```

---

# 📁 Estructura de seeds

```
prisma/
 ├── seed.ts
 └── seeds/
     ├── users.seed.ts
     └── posts.seed.ts
```

---

# 1️⃣ `users.seed.ts` 

✔ Idempotente
✔ Similar a un seeder de Sequelize
✔ Seguro para múltiples ejecuciones

```ts
// prisma/seeds/users.seed.ts
import { PrismaClient } from '../../generated/prisma/client';

export async function seedUsers(prisma: PrismaClient) {
  console.log('🌱 Seeding users...');

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@test.com',
        name: 'Admin',
      },
      {
        email: 'user1@test.com',
        name: 'User One',
      },
      {
        email: 'user2@test.com',
        name: 'User Two',
      },
    ],
    skipDuplicates: true, // 🔑 clave para idempotencia
  });

  console.log('✅ Users seeded');
}
```

---

# 2️⃣ `posts.seed.ts` 

✔ Depende de usuarios existentes
✔ No asume IDs fijos
✔ Muy importante en Prisma

```ts
// prisma/seeds/posts.seed.ts
import { PrismaClient } from '../../generated/prisma/client';

export async function seedPosts(prisma: PrismaClient) {
  console.log('🌱 Seeding posts...');

  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.warn('⚠️ No users found. Skipping post seed.');
    return;
  }

  const postsData = users.flatMap((user) => [
    {
      title: `Welcome post for ${user.name ?? user.email}`,
      content: 'This is an auto-generated welcome post.',
      published: true,
      authorId: user.id,
    },
    {
      title: `Draft post for ${user.name ?? user.email}`,
      content: null,
      published: false,
      authorId: user.id,
    },
  ]);

  await prisma.post.createMany({
    data: postsData,
    skipDuplicates: true,
  });

  console.log('✅ Posts seeded');
}
```

---

# 3️⃣ `seed.ts` (orquestador)

Este archivo **equivale al `DatabaseSeeder.php` de Laravel** o al index de Sequelize.

```ts
// prisma/seed.ts
import { PrismaClient } from '../generated/prisma/client';
import { seedUsers } from './seeds/users.seed';
import { seedPosts } from './seeds/posts.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await seedUsers(prisma);
  await seedPosts(prisma);

  console.log('🌱 Database seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

# 4️⃣ Configurar `package.json`

Añade esto:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Instala `ts-node` si no lo tienes:

```bash
yarn add -D ts-node
```

---

# 5️⃣ Cómo lanzar los seeds

### 👉 Manual (local o Docker)

```bash
yarn seed
```

---

### 👉 Después de migraciones (local)

```bash
yarn prisma migrate dev
yarn seed
```

---

### 👉 Automático en Docker

```yaml
command: sh -c "yarn prisma migrate deploy && yarn prisma db seed && node dist/main.js"
```

---

# 6️⃣ Ejecutar solo algunos seeds (opcional)

```ts
if (process.env.SEED_USERS === 'true') {
  await seedUsers(prisma);
}
```

```bash
SEED_USERS=true yarn prisma db seed
```

---

# 🧠 Comparación mental rápida

| ORM       | Seed               |
| --------- | ------------------ |
| Sequelize | `seed:run --name`  |
| TypeORM   | Script externo     |
| Prisma    | Script idempotente |

---

## 🏁 Resumen final

* ✔ Prisma **sí soporta seeds**
* ✔ Son scripts TypeScript
* ✔ Idempotentes
* ✔ Separables por dominio
* ❌ No `up/down`
* ❌ No versionados


---

## Posibles fallos.

Si te da fallos como:
```
node:internal/modules/cjs/loader:1424
  throw err;
  ^

Error: Cannot find module '.prisma/client/default'
Require stack:
````

Prueba a:
Limpieza Profunda (Obligatorio)
Node v24 y Prisma 7 guardan mucha caché de motores. Ejecuta estos comandos en orden:

Borra instalaciones y archivos generados:
```
rm -rf node_modules
rm -rf generated
rm -rf .yarn/cache
```
Reinstalamos:
```
yarn install
````

Generamos el cliente:
```
yarn prisma generate
````
