export class User {}
/*
En NestJS, a veces se crean clases vacías en entities como:

    Eso se hacía en TypeORM, porque ahí las clases representaban las tablas.
    Con Prisma, tus tablas y tipos están definidos en schema.prisma.
    Prisma genera automáticamente tipos TypeScript cuando haces: yarn prisma generate
    Entonces, la clase vacía User no se usa para nada. Todo lo que necesitas viene de: import { PrismaClient } from './generated/prisma/client';
    Y los tipos:  type User = Prisma.User;

*/