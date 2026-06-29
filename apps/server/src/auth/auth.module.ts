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

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
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
