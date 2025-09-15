import { Injectable } from '@nestjs/common';
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
  async login(user: any) {
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

      return {
        success: true,
        message: 'Login exitoso',
        access_token: access_token
      };
    } catch (error) {
      throw new Error(`Error al generar token: ${error.message}`);
    }
  }
}
