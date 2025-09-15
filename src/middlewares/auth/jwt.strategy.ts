import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      // Verificar que el usuario aún existe en la base de datos
      const user = await this.prismaService.user.findUnique({
        where: { userID: payload.userID },
        select: {
          userID: true,
          roleID: true,
          name: true,
          lastName: true,
          email: true,
          stripeCustomerID: true,
          role: {
            select: {
              roleName: true
            }
          }
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      return {
        userID: user.userID,
        roleID: user.roleID,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        stripeCustomerID: user.stripeCustomerID,
        roleName: user.role?.roleName,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
