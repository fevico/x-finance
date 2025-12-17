import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { AllExceptionsFilter } from './lib/http-exception.filter';
import { ResponseInterceptor } from './lib/response.interceptor';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.LIVE_FRONTEND_URL,
      process.env.WWW_LIVE_FRONTEND_URL,
    ],
    // origin: '*',
    credentials: true,
  });

  // app.enableCors({
  //   origin: (origin, callback) => {
  //     const allowedOrigins = [
  //       process.env.FRONTEND_URL,        // http://localhost:3000
  //       process.env.LIVE_FRONTEND_URL,   // https://fevico.com.ng
  //       process.env.WWW_LIVE_FRONTEND_URL, // https://www.fevico.com.ng
  //     ].filter(Boolean); // 🔥 removes undefined

  //     // Allow server-to-server / Postman / curl
  //     if (!origin) {
  //       return callback(null, true);
  //     }

  //     if (allowedOrigins.includes(origin)) {
  //       return callback(null, true);
  //     }

  //     return callback(
  //       new Error(`CORS blocked origin: ${origin}`),
  //       false,
  //     );
  //   },
  //   credentials: true,
  // });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.PORT ?? 3810);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
