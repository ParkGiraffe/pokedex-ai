import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AUTH_PROVIDERS } from './providers/auth-provider.port';
import { InternalAuthProvider } from './providers/internal-auth.provider';
import { JwtTokenService } from './providers/jwt-token.service';
import { PASSWORD_HASHER } from './providers/password-hasher.port';
import { ScryptPasswordHasher } from './providers/scrypt-password-hasher';
import { TOKEN_SERVICE } from './providers/token-service.port';

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
