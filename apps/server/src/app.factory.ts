import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { json, urlencoded } from "express";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/error.filter";

// 앱 생성 로직을 main에서 분리한다. 테스트는 이 createApp만 가져다 쓰고(listen 안 함),
// main.ts는 이를 호출해 listen만 한다.
export const createApp = async (): Promise<NestExpressApplication> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  // 파티 이미지(base64)를 받으므로 본문 한도를 12MB로 둔다(기존 Fastify bodyLimit과 동일).
  app.use(json({ limit: "12mb" }));
  app.use(urlencoded({ extended: true, limit: "12mb" }));
  // class-validator DTO(auth 등) 검증. Zod 라우트는 메타타입이 클래스가 아니라 통과되고 @Body의 ZodValidationPipe가 처리한다.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();
  return app;
};
