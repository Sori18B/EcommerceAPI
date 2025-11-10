import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { PrismaService } from 'src/config/prisma/prisma.service';

// Guard para validar roles de usuario, se ejecuta después de JwtAuthGuard

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles especificados, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener usuario del request (ya validado por JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.userID) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      );
    }

    // Obtener rol del usuario desde la base de datos
    const userWithRole = await this.prisma.user.findUnique({
      where: { userID: user.userID },
      include: { role: true },
    });

    if (!userWithRole || !userWithRole.role) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      );
    }

    // Validar si el rol del usuario está en los roles requeridos
    const hasRole = requiredRoles.some(
      (role) => userWithRole.role.roleName.toLowerCase() === role.toLowerCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
