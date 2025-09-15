import { Controller, Body, Post, HttpException, HttpStatus } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './login.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/middlewares/auth/public.decorator';

@ApiTags('Autenticación')
@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      example: {
        success: true,
        message: 'Login exitoso',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            userID: 1,
            name: 'Juan',
            lastName: 'Pérez',
            email: 'juan@ejemplo.com',
            roleName: 'customer',
            stripeCustomerID: 'cus_1234567890'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas',
    schema: {
      example: {
        success: false,
        message: 'Credenciales inválidas. Verifica tu email y contraseña.'
      }
    }
  })
  async verifyLogin(@Body() loginDto: LoginDto) {
    try {
      const result = await this.loginService.verifyLogin(loginDto);
      return result;
    } catch (error) {
      // Si es UnauthorizedException, la lanzamos tal como está
      if (error.status === 401) {
        throw error;
      }
      
      // Para otros errores, lanzamos HttpException genérico
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error interno del servidor',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
