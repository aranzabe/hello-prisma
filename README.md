
## **1 Crear proyecto NestJS**

```bash
yarn global add @nestjs/cli       # Instalar CLI de NestJS si no lo tienes
nest new hello-prisma
cd hello-prisma
```

* Escoge Yarn como package manager.
* Se genera la estructura base: `src/`, `main.ts`, `app.module.ts`, etc.

---

## **2 Quitar prettier si no lo queremos**

```bash
yarn remove prettier
yarn remove "eslint-config-prettier" "eslint-plugin-prettier"
```

* Esto es opcional, solo si no queremos prettier.

---

## **3 Configuración de variables de entorno**

Instalamos el módulo de NestJS para `.env`:

```bash
yarn add @nestjs/config
```

* Creamos archivo `.env` en la raíz:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/hello_prisma?schema=public"
```

* En `app.module.ts` importamos el ConfigModule:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // carga variables .env globalmente
  ],
})
export class AppModule {}
```

---

## **4 Instalar Prisma**

```bash
yarn add prisma
yarn prisma init
```

* Esto genera:

  * `prisma/schema.prisma` → tu esquema de DB.
  * `.env` (ya lo editamos arriba).
  * Carpeta `prisma/migrations` (se crea al hacer la primera migration).

---

## **5 Configurar Prisma para PostgreSQL (Prisma 7)**

### **schema.prisma**

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../generated/prisma"
  moduleFormat  = "cjs"
}

datasource db {
  provider = "postgresql"
  // no poner url aquí en Prisma 7
}

model User {
  id    Int     @default(autoincrement()) @id
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @default(autoincrement()) @id
  title     String
  content   String?
  published Boolean? @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

---

### **prisma.config.ts**

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    adapter: {
      provider: "postgresql",
      url: process.env.DATABASE_URL,
    },
  },
});
```

---

## **6 Crear base de datos y migración**

* Asegúrate de que la DB exista:

```bash
createdb -U postgres hello_prisma
```

* Ejecuta la primera migration:

```bash
yarn prisma migrate dev --name init
```

* Esto genera `_prisma_migrations` y crea las tablas `User` y `Post`.

---

## **7 Generar PrismaService y PrismaModule**

```ts
// src/prisma/prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({ adapter });
  }
}
```

```ts
// src/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## **8 Generar Users y Posts Resources**

```bash
nest g res users --no-spec
nest g res posts --no-spec
```

Esto crea:

* `users/users.module.ts`, `users/users.service.ts`, `users/users.controller.ts`
* `posts/posts.module.ts`, `posts/posts.service.ts`, `posts/posts.controller.ts`

---

## **9 UsersService usando Prisma**

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async findAll() {
    return this.prisma.user.findMany({ include: { posts: true } });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id }, include: { posts: true } });
  }

  async update(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

**DTOs** (`create-user.dto.ts` y `update-user.dto.ts`) los tenemos ya definidos.

---

## **10 PostsService usando Prisma**

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePostDto) {
    return this.prisma.post.create({ data: dto });
  }

  async findAll() {
    return this.prisma.post.findMany({ include: { author: true } });
  }

  async findOne(id: number) {
    return this.prisma.post.findUnique({ where: { id }, include: { author: true } });
  }

  async update(id: number, dto: UpdatePostDto) {
    return this.prisma.post.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }
}
```

**DTOs** (`create-post.dto.ts` y `update-post.dto.ts`) también ya definidos.

---

## **11 PostsModule**

```ts
import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
```

---

## **12 AppModule final**

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    PostsModule,
  ],
})
export class AppModule {}
```


## **13 Migrations**



## 1️⃣ ¿En Prisma 7 se pueden poner migrations “en archivos aparte”?

**No, no como hemos hecho hasta ahora.**
Y aquí está la clave:

👉 **En Prisma NO escribes migrations a mano** (como en Eloquent, TypeORM, etc.)

### En Prisma:

* **La única fuente de verdad es `schema.prisma`**
* Las migrations se **generan automáticamente** a partir de los cambios en el schema
* Prisma crea **carpetas de migración**, no archivos sueltos editables

Ejemplo real:

```
prisma/
 ├── schema.prisma        👈 fuente de verdad
 └── migrations/
     ├── 20260125123045_init/
     │   └── migration.sql
     ├── 20260126101500_add_posts/
     │   └── migration.sql
```

⚠️ El archivo `migration.sql` **no deberías editarlo a mano**, salvo casos muy concretos.

---

## 2️⃣ Entonces… ¿para qué sirve `migrations.path` en Prisma 7?

Esto:

```ts
migrations: {
  path: "prisma/migrations",
},
```

**solo sirve para decirle a Prisma dónde guardar las migrations generadas**, nada más.

❌ **No es**:

* Un sitio donde escribir modelos
* Un sitio donde definir tablas
* Un sitio donde Prisma “lee” modelos

✔️ Es simplemente:

> “Guarda aquí los SQL generados automáticamente”

---

## 3️⃣ ¿Hay que lanzar TODAS las migrations siempre?

### 👉 En Prisma: **sí, siempre en orden**

Prisma mantiene una tabla:

```sql
_prisma_migrations
```

Y:

* Guarda qué migrations ya se ejecutaron
* Ejecuta **solo las pendientes**
* Siempre en **orden cronológico**

Cuando haces:

```bash
yarn prisma migrate deploy
```

Prisma:

* NO vuelve a ejecutar las ya aplicadas
* Aplica solo las nuevas

---

##  4️⃣ ¿Se puede ejecutar solo UNA migration concreta?

### ❌ No oficialmente

Prisma **no soporta**:

* `migrate up 20240101`
* `migrate only add_users`

Como sí hacen otros ORM.

### ¿Por qué?

Porque Prisma **no piensa en migrations como scripts independientes**, sino como:

> “diferencias entre estados del schema”

---

## 5️⃣ Entonces… ¿qué pasa si quiero algo tipo Eloquent?

### Opción A – La forma Prisma (recomendada)

1. Cambias `schema.prisma`
2. Ejecutas:

```bash
yarn prisma migrate dev --name add_users
```

Prisma:

* Calcula el diff
* Genera el SQL
* Registra la migration
* Aplica solo lo nuevo

---

### Opción B – SQL manual (avanzado)

Si necesitas control total:

* Puedes escribir **SQL a mano**
* Ejecutarlo con:

  * `psql`
  * scripts propios
* Y **NO usar Prisma Migrate** para eso

Pero entonces:
⚠️ Prisma **no sabrá** que esa migration existe

---

## 6️⃣ ¿Se puede borrar o rehacer migrations?

### En desarrollo (sí):

```bash
yarn prisma migrate reset
```

* Borra la DB
* Reaplica todas las migrations
* Muy útil al empezar

### En producción (NO):

* Nunca borres migrations aplicadas
* Siempre crea una nueva

---

## 7️⃣ Comparación rápida Prisma vs Eloquent

| Feature                     | Prisma          | Eloquent   |
| --------------------------- | --------------- | ---------- |
| Escribes migrations         | ❌ No            | ✅ Sí       |
| Fuente de verdad            | `schema.prisma` | migrations |
| Ejecutar una sola migration | ❌ No            | ✅ Sí       |
| Rollback manual             | ❌ Limitado      | ✅ Sí       |
| Seguridad en prod           | ⭐⭐⭐⭐⭐           | ⭐⭐⭐        |

---

## 8️⃣ Resumen corto (para que quede clarísimo)

👉 **En Prisma 7**:

* ❌ No defines migrations en archivos propios
* ❌ No ejecutas migrations individuales
* ✅ Cambias `schema.prisma`
* ✅ Prisma genera y ejecuta las migrations necesarias
* ✅ Se aplican solo las pendientes, en orden


---

## ✅ Resultado

* Proyecto NestJS listo con **Users** y **Posts** conectados a **PostgreSQL**.
* Prisma 7 configurado con **adapter PostgreSQL**.
* `.env` con `DATABASE_URL`.
* DTOs y validaciones (`class-validator`).
* CRUD completo listo para probar con Postman o frontend.



---

## **14 ¿En Prisma 7 se definen asociaciones como en Eloquent o TypeORM?**

### ❌ No.

Ni como Eloquent
Ni como TypeORM

👉 **Las relaciones se definen SOLO en `schema.prisma`**, de forma **declarativa**, no con clases ni métodos.

---

## 🧠 Cambio mental clave

### Eloquent

```php
class User extends Model {
  public function posts() {
    return $this->hasMany(Post::class);
  }
}
```

### TypeORM

```ts
@OneToMany(() => Post, post => post.user)
posts: Post[];
```

### Prisma

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]   // 👈 relación declarativa
}

model Post {
  id       Int
  userId   Int
  user     User @relation(fields: [userId], references: [id])
}
```

👉 **No hay métodos**
👉 **No hay decorators**
👉 **No hay lógica en runtime**
👉 **Todo es esquema**

---

## 🔗 Tipos de relaciones en Prisma

### 1️⃣ One-to-Many (User → Posts)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String
  posts Post[]
}

model Post {
  id      Int    @id @default(autoincrement())
  title   String
  userId  Int
  user    User   @relation(fields: [userId], references: [id])
}
```

✔ Prisma entiende automáticamente:

* FK
* JOINs
* Includes
* Tipos TypeScript

---

### 2️⃣ One-to-One

```prisma
model User {
  id      Int     @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int   @id @default(autoincrement())
  userId Int   @unique
  user   User  @relation(fields: [userId], references: [id])
}
```

---

### 3️⃣ Many-to-Many (automática)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int    @id @default(autoincrement())
  users  User[]
}
```

👉 Prisma crea la tabla intermedia automáticamente.

---

### 4️⃣ Many-to-Many con tabla explícita (avanzado)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  roles UserRole[]
}

model Role {
  id    Int    @id @default(autoincrement())
  users UserRole[]
}

model UserRole {
  userId Int
  roleId Int

  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}
```

---

## 🧩 ¿Y cómo se usan las relaciones en código?

### ❌ No haces:

```ts
user.posts()
```

### ✅ Haces:

```ts
this.prisma.user.findMany({
  include: {
    posts: true,
  },
});
```

O:

```ts
this.prisma.post.findMany({
  where: {
    userId: 1,
  },
});
```

---

## 💡 Prisma ≠ Active Record

Prisma sigue un modelo:

* ❌ No Active Record
* ✅ Data Mapper
* ✅ Tipado fuerte
* ✅ Queries explícitas

Eso es **a propósito**:

* Menos magia
* Más control
* Más seguridad en producción

---

## 🧠 Resumen mental rápido

| Concepto            | Prisma          |
| ------------------- | --------------- |
| Relaciones          | `schema.prisma` |
| Métodos `hasMany()` | ❌               |
| Decorators          | ❌               |
| Lazy loading        | ❌               |
| Includes explícitos | ✅               |
| Tipos automáticos   | ✅               |

---

## 🎯 Frase clave para recordarlo

> **En Prisma las relaciones no se programan, se describen.**

