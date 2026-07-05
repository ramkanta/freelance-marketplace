import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Enable request validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties not defined in the DTO
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Servify API')
    .setDescription('The Servify Freelance & Service Marketplace API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
