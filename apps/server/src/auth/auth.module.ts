import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { AuthService } from './application/auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { AUTH_PROVIDERS } from './domain/auth-provider.port';
import { PASSWORD_HASHER } from './domain/password-hasher.port';
import { TOKEN_SERVICE } from './domain/token-service.port';
import { InternalAuthProvider } from './infrastructure/internal-auth.provider';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher';

// 포트 → 어댑터 바인딩을 한 곳에 모은다. provider를 추가하려면 어댑터를 만들고 AUTH_PROVIDERS 배열에 넣으면 끝.
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // ms 형식 문자열("30m"). @nestjs/jwt의 expiresIn 타입이 좁아 런타임 문자열을 캐스팅한다.
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '30m') as unknown as number },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    InternalAuthProvider,
    {
      provide: AUTH_PROVIDERS,
      useFactory: (internal: InternalAuthProvider) => [internal],
      inject: [InternalAuthProvider],
    },
  ],
  exports: [JwtAuthGuard, TOKEN_SERVICE],
})
export class AuthModule {}
