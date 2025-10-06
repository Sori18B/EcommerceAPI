import { Controller, Body, Post, HttpException, HttpStatus, Res } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './login.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/middlewares/auth/public.decorator';
import { ApiCookieAuth } from 'src/middlewares/auth/cookie-auth.decorator';
import type { Response } from 'express';

@ApiTags('Autenticación')
@Controller('auth')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Public()
  @Post('/login')
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      example: {
        success: true,
        message: 'Login exitoso',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
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
  async verifyLogin(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.loginService.verifyLogin(loginDto, res);
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

  @ApiCookieAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión de usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout exitoso',
    schema: {
      example: {
        success: true,
        message: 'Logout exitoso'
      }
    }
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.loginService.logout(res);
      return result;
    } catch (error) {
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
