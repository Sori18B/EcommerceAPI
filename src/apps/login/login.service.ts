import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from 'src/middlewares/auth/auth.service';
import type { Response } from 'express';

@Injectable()
export class LoginService {
  constructor(private authService: AuthService) {}

  async verifyLogin(data: LoginDto, res?: Response) {
    try {
      const user = await this.authService.validateUser(data);

      if (!user) {
        throw new UnauthorizedException({
          success: false,
          message: 'Credenciales inválidas. Verifica tu email y contraseña.'
        });
      }

      return await this.authService.login(user, res);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({
        success: false,
        message: 'Error interno del servidor durante el login'
      });
    }
  }

  async logout(res: Response) {
    try {
      return await this.authService.logout(res);
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        message: 'Error interno del servidor durante el logout'
      });
    }
  }
}
