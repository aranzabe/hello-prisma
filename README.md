
## **1️⃣ Crear proyecto NestJS**

```bash
yarn global add @nestjs/cli       # Instalar CLI de NestJS si no lo tienes
nest new hello-prisma
cd hello-prisma
```

* Escoge Yarn como package manager.
* Se genera la estructura base: `src/`, `main.ts`, `app.module.ts`, etc.

---

## **2️⃣ Quitar prettier si no lo queremos**

```bash
yarn remove prettier
yarn remove "eslint-config-prettier" "eslint-plugin-prettier"
```

* Esto es opcional, solo si no queremos prettier.

---

## **3️⃣ Configuración de variables de entorno**

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

## **4️⃣ Instalar Prisma**

```bash
yarn add prisma
yarn prisma init
```

* Esto genera:

  * `prisma/schema.prisma` → tu esquema de DB.
  * `.env` (ya lo editamos arriba).
  * Carpeta `prisma/migrations` (se crea al hacer la primera migration).

---

## **5️⃣ Configurar Prisma para PostgreSQL (Prisma 7)**

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

## **6️⃣ Crear base de datos y migración**

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

## **7️⃣ Generar PrismaService y PrismaModule**

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

## **8️⃣ Generar Users y Posts Resources**

```bash
nest g res users --no-spec
nest g res posts --no-spec
```

Esto crea:

* `users/users.module.ts`, `users/users.service.ts`, `users/users.controller.ts`
* `posts/posts.module.ts`, `posts/posts.service.ts`, `posts/posts.controller.ts`

---

## **9️⃣ UsersService usando Prisma**

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

## **10️⃣ PostsService usando Prisma**

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

## **11️⃣ PostsModule**

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

## **12️⃣ AppModule final**

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

---

## ✅ Resultado

* Proyecto NestJS listo con **Users** y **Posts** conectados a **PostgreSQL**.
* Prisma 7 configurado con **adapter PostgreSQL**.
* `.env` con `DATABASE_URL`.
* DTOs y validaciones (`class-validator`).
* CRUD completo listo para probar con Postman o frontend.

