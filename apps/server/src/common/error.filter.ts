import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from "@nestjs/common";
import { type Response } from "express";

// 기존 Fastify 서버와 동일한 응답 계약을 유지한다: 본문은 항상 { error: message }.
// 검증 실패(BadRequestException)는 400, Anthropic 인증·한도 등 기타 오류는 500.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception instanceof Error ? exception.message : String(exception);
    response.status(status).json({ error: message });
  }
}
