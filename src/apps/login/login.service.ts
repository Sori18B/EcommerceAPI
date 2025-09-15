import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from 'src/middlewares/auth/auth.service';

@Injectable()
export class LoginService {
  constructor(private authService: AuthService) {}

  async verifyLogin(data: LoginDto) {
    try {
      const user = await this.authService.validateUser(data);

      if (!user) {
        throw new UnauthorizedException({
          success: false,
          message: 'Credenciales inválidas. Verifica tu email y contraseña.'
        });
      }

      return await this.authService.login(user);
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
}
