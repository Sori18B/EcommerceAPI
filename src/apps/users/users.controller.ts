import { UsersService } from './users.service';
import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, ParseIntPipe, Request, Put } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/registerAdmin.dto';
import { AddAddressDto } from './dto/addAddress.dto';
import { UpdateAddressDto } from './dto/updateAddress.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { Public } from 'src/middlewares/auth/public.decorator';
import { ApiCookieAuth } from 'src/middlewares/auth/cookie-auth.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Registrar usuario con dirección' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      // Log de datos recibidos en el controlador
      console.log('=== REGISTRO DE USUARIO - CONTROLADOR ===');
      console.log('📥 Datos recibidos en el controlador:');
      console.log('👤 Datos del usuario:', {
        name: registerDto.name,
        lastName: registerDto.lastName,
        email: registerDto.email,
        phoneNumber: registerDto.phoneNumber,
        imageURL: registerDto.imageURL || 'No proporcionada',
        password: '[PROTEGIDA]'
      });
      console.log('🏠 Datos de dirección:', {
        firstName: registerDto.address.firstName,
        lastName: registerDto.address.lastName,
        street: registerDto.address.street,
        neighborhood: registerDto.address.neighborhood || 'No proporcionado',
        city: registerDto.address.city,
        state: registerDto.address.state,
        postalCode: registerDto.address.postalCode,
        countryCode: registerDto.address.countryCode,
        addressType: registerDto.address.addressType,
        isBillingDefault: registerDto.address.isBillingDefault,
        isShippingDefault: registerDto.address.isShippingDefault
      });
      console.log('📝 Timestamp:', new Date().toISOString());
      console.log('==========================================');

      const result = await this.usersService.createUserComplete(registerDto);
      
      console.log('✅ Registro completado exitosamente en el controlador');
      console.log('📤 Respuesta enviada:', { success: true, data: result });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Error en el controlador de registro:', error.message);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error interno del servidor',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiCookieAuth()
  @Post('admin')
  @ApiOperation({ summary: 'Crear cuenta de administrador (sin dirección)' })
  async registerAdmin(@Body() registerAdminDto: RegisterAdminDto) {
    try {
      const result = await this.usersService.createAdminAccount(registerAdminDto) ;
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

  @ApiCookieAuth()
  @Get('getUser/:userID')
  @ApiOperation({ summary: 'Obtener usuario por ID (requiere autenticación)' })
  async getUserById(@Param('userID', ParseIntPipe) userID: number) {
    try {
      const result = await this.usersService.getUserById(userID);
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

  @ApiCookieAuth()
  @Post('address')
  @ApiOperation({ summary: 'Agregar nueva dirección al usuario autenticado' })
  async addAddress(@Body() addAddressDto: AddAddressDto, @Request() req: any) {
    try {
      const userID = req.user.userID;
      const result = await this.usersService.addAddress(userID, addAddressDto);
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

  @ApiCookieAuth()
  @Post('address/:userID')
  @ApiOperation({ summary: 'Agregar nueva dirección a un usuario específico' })
  async addAddressToUser(
    @Param('userID', ParseIntPipe) userID: number, 
    @Body() addAddressDto: AddAddressDto
  ) {
    try {
      const result = await this.usersService.addAddress(userID, addAddressDto);
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

  @ApiCookieAuth()
  @Put('address/:addressID')
  @ApiOperation({ summary: 'Actualizar dirección del usuario autenticado' })
  async updateAddress(
    @Param('addressID', ParseIntPipe) addressID: number,
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req: any
  ) {
    try {
      const userID = req.user.userID;
      const result = await this.usersService.updateAddress(userID, addressID, updateAddressDto);
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

  @ApiCookieAuth()
  @Put('address/:userID/:addressID')
  @ApiOperation({ summary: 'Actualizar dirección de un usuario específico' })
  async updateAddressForUser(
    @Param('userID', ParseIntPipe) userID: number,
    @Param('addressID', ParseIntPipe) addressID: number,
    @Body() updateAddressDto: UpdateAddressDto
  ) {
    try {
      const result = await this.usersService.updateAddress(userID, addressID, updateAddressDto);
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

  @ApiCookieAuth()
  @Put('profile/:userID')
  @ApiOperation({ 
    summary: 'Actualizar perfil del usuario (nombre, apellido, foto de perfil)',
    description: 'Permite actualizar el nombre, apellido y/o foto de perfil del usuario. Útil tanto para agregar foto por primera vez como para cambiar una existente.'
  })
  async updateUserProfile(
    @Param('userID', ParseIntPipe) userID: number,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    try {
      const result = await this.usersService.updateUserProfile(userID, updateProfileDto);
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
}
