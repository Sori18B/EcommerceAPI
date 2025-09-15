import { RegisterService } from './register.service';
import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, ParseIntPipe, Request } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { Public } from 'src/middlewares/auth/public.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Usuarios')
@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Registrar usuario' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await this.registerService.createUserComplete(registerDto);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error interno del servidor',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiBearerAuth()
  @Get(':userID')
  @ApiOperation({ summary: 'Obtener usuario por ID (requiere autenticación)' })
  async getUserById(@Param('userID', ParseIntPipe) userID: number) {
    try {
      const result = await this.registerService.getUserById(userID);
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error interno del servidor',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
