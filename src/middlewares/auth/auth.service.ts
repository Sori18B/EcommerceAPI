import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { LoginDto } from 'src/apps/login/dto/login.dto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  //Validar que exista
  async validateUser(data: LoginDto): Promise<any> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email: data.email },
        select: {
          userID: true,
          roleID: true,
          stripeCustomerID: true,
          name: true,
          lastName: true,
          email: true,
          password: true,
          role: {
            select: {
              roleName: true
            }
          }
        },
      });

      if (user && (await bcrypt.compare(data.password, user.password))) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      throw new Error(`Error al validar usuario: ${error.message}`);
    }
  }

  //Make the token to access
  async login(user: any, res?: Response) {
    try {
      const payload = {
        userID: user.userID,
        roleID: user.roleID,
        stripeCustomerID: user.stripeCustomerID,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        roleName: user.role?.roleName,
      };

      const access_token = this.jwtService.sign(payload);

      // Si se proporciona el objeto Response, configurar cookie HTTP-only
      if (res) {
        res.cookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
          sameSite: 'strict',
          maxAge: 8 * 60 * 60 * 1000, // 24 horas en milisegundos
        });
      }

      return {
        success: true,
        message: 'Login exitoso',
        access_token: access_token
      };
    } catch (error) {
      throw new Error(`Error al generar token: ${error.message}`);
    }
  }

  // Método para logout (limpiar cookie)
  async logout(res: Response) {
    try {
      res.clearCookie('access_token');
      return {
        success: true,
        message: 'Logout exitoso'
      };
    } catch (error) {
      throw new Error(`Error al hacer logout: ${error.message}`);
    }
  }
}
