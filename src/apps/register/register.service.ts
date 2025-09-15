import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { StripeService } from 'src/utils/stripe/stripe.service';

@Injectable()
export class RegisterService {

  constructor(private prisma: PrismaService, private stripe: StripeService) {}

  async createUserDB(data: RegisterDto) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findFirst({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('El usuario con este email ya existe');
      }

      data.password = await bcrypt.hash(data.password, 10); //Encriptar la contraseña 
      const newUser = await this.prisma.user.create({ data: data });
      
      return { 
        message: 'Usuario creado correctamente en la base de datos'
      };
    } catch (error) {
      throw new Error(`Error al crear usuario en BD: ${error.message}`);
    }
  }

  async createUserStripe(data: RegisterDto) {
    try {
      const stripeCustomer = await this.stripe.createCustomer({ 
        name: data.name, 
        email: data.email 
      });

      return { 
        message: 'Usuario creado correctamente en Stripe',
        stripeCustomerId: stripeCustomer.id 
      };
    } catch (error) {
      throw new Error(`Error al crear usuario en Stripe: ${error.message}`);
    }
  }

  // Función que ejecuta ambas operaciones secuencialmente
  async createUserComplete(data: RegisterDto) {
    let createdUser = null;
    let stripeCustomer = null;

    try {
      // 1. Primero crear usuario en la base de datos
      const dbResult = await this.createUserDB(data);
      
      // 2. Obtener el usuario recién creado para tener su ID
      createdUser = await this.prisma.user.findUnique({
        where: { email: data.email },
        select: { userID: true }
      });

      if (!createdUser) {
        throw new Error('Error al obtener usuario recién creado');
      }

      // 3. Crear cliente en Stripe
      stripeCustomer = await this.stripe.createCustomer({ 
        name: data.name, 
        email: data.email 
      });

      // 4. Actualizar usuario con el stripeCustomerID
      await this.prisma.user.update({
        where: { userID: createdUser.userID },
        data: { stripeCustomerID: stripeCustomer.id }
      });

      return {
        message: 'Usuario creado exitosamente en la base de datos y Stripe',
        database: dbResult,
        stripe: {
          message: 'Usuario creado correctamente en Stripe',
          stripeCustomerId: stripeCustomer.id
        }
      };

    } catch (error) {
      // Si hay error, intentar limpiar lo que se haya creado
      if (createdUser && !stripeCustomer) {
        // Si se creó en BD pero no en Stripe, eliminar de BD
        try {
          await this.prisma.user.delete({
            where: { userID: createdUser.userID }
          });
          console.log('Usuario eliminado de BD debido a error en Stripe');
        } catch (cleanupError) {
          console.error('Error al limpiar usuario de BD:', cleanupError.message);
        }
      }

      throw new Error(`Error al crear usuario completo: ${error.message}`);
    }
  }

  async getUserById(userID: number) {
    try {
      const foundUser = await this.prisma.user.findFirst({
        where: { userID: userID },
        select: {
          userID: true,
          roleID: true,
          name: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          stripeCustomerID: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              roleName: true
            }
          }
        },
      });

      if (foundUser) {
        return {
          success: true,
          data: foundUser
        };
      }

      return { 
        success: false,
        message: 'Usuario no encontrado' 
      };
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }
}
