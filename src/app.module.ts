import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [ConfigModule.forRoot({
              isGlobal: true, // Esto carga automáticamente el .env usando dotenv por dentro. Disponible en toda la app
           }), UsersModule, PostsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
