import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/registerAdmin.dto';
import { AddAddressDto } from './dto/addAddress.dto';
import { UpdateAddressDto } from './dto/updateAddress.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import * as bcrypt from 'bcrypt';
import { StripeService } from 'src/utils/stripe/stripe.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService, private stripe: StripeService) {}

  async createUserDB(data: RegisterDto) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findFirst({
        where: { 
          OR: [
            { email: data.email },
            { phoneNumber: data.phoneNumber }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new Error('El usuario con este email ya existe');
        }
        if (existingUser.phoneNumber === data.phoneNumber) {
          throw new Error('El usuario con este número de teléfono ya existe');
        }
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Crear usuario y dirección en una transacción
      const result = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
        // 1. Crear usuario
        const newUser = await prisma.user.create({
          data: {
            roleID: 2,
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            password: hashedPassword,
            phoneNumber: data.phoneNumber,
            // stripeCustomerID se agregará después
          }
        });

        // 2. Crear dirección por defecto
        const newAddress = await prisma.address.create({
          data: {
            userID: newUser.userID,
            addressType: (data.address.addressType as 'BILLING' | 'SHIPPING' | 'BOTH') || 'BOTH',
            firstName: data.address.firstName,
            lastName: data.address.lastName,
            street: data.address.street,
            neighborhood: data.address.neighborhood || null,
            city: data.address.city,
            state: data.address.state,
            postalCode: data.address.postalCode,
            countryCode: data.address.countryCode,
            // Establecer como direcciones por defecto para el primer registro
            isBillingDefault: data.address.isBillingDefault ?? true,
            isShippingDefault: data.address.isShippingDefault ?? true,
          }
        });

        return { user: newUser, address: newAddress };
      });

      return { 
        message: 'Usuario y dirección creados correctamente en la base de datos',
        userId: result.user.userID,
        addressId: result.address.addressID
      };
    } catch (error) {
      throw new Error(`Error al crear usuario en BD: ${error.message}`);
    }
  }

  async createUserStripe(data: RegisterDto) {
    try {
      const stripeCustomer = await this.stripe.createCustomer({ 
        name: `${data.name} ${data.lastName}`,
        email: data.email,
        phone: data.phoneNumber,
        address: data.address
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
    let createdUser: { userID: number } | null = null;
    let stripeCustomer: any = null;

    try {
      // 1. Primero crear usuario y dirección en la base de datos
      const dbResult = await this.createUserDB(data);
      
      // 2. Obtener el usuario recién creado para tener su ID
      createdUser = await this.prisma.user.findUnique({
        where: { email: data.email },
        select: { userID: true }
      });

      if (!createdUser) {
        throw new Error('Error al obtener usuario recién creado');
      }

      // 3. Crear cliente en Stripe con dirección completa
      stripeCustomer = await this.stripe.createCustomer({ 
        name: `${data.name} ${data.lastName}`,
        email: data.email,
        phone: data.phoneNumber,
        address: data.address
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
        // Si se creó en BD pero no en Stripe, eliminar usuario y direcciones
        try {
          await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            // Eliminar direcciones primero (por la foreign key)
            await prisma.address.deleteMany({
              where: { userID: createdUser!.userID }
            });
            
            // Eliminar usuario
            await prisma.user.delete({
              where: { userID: createdUser!.userID }
            });
          });
          console.log('Usuario y direcciones eliminados de BD debido a error en Stripe');
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
          },
          addresses: {
            select: {
              addressID: true,
              addressType: true,
              firstName: true,
              lastName: true,
              street: true,
              neighborhood: true,
              city: true,
              state: true,
              postalCode: true,
              countryCode: true,
              isBillingDefault: true,
              isShippingDefault: true,
              createdAt: true,
              updatedAt: true
            },
            orderBy: {
              createdAt: 'asc'
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

  // Crear cuenta de administrador (sin dirección)
  async createAdminAccount(data: RegisterAdminDto) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findFirst({
        where: { 
          OR: [
            { email: data.email },
            { phoneNumber: data.phoneNumber }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new Error('El usuario con este email ya existe');
        }
        if (existingUser.phoneNumber === data.phoneNumber) {
          throw new Error('El usuario con este número de teléfono ya existe');
        }
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Crear solo el usuario (sin dirección)
      const newUser = await this.prisma.user.create({
        data: {
          roleID: 1,
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          password: hashedPassword,
          phoneNumber: data.phoneNumber,
          // stripeCustomerID se puede agregar después si es necesario
        }
      });

      return { 
        message: 'Cuenta de administrador creada correctamente',
        userId: newUser.userID,
        role: 'admin'
      };
    } catch (error) {
      throw new Error(`Error al crear cuenta de administrador: ${error.message}`);
    }
  }

  // Agregar nueva dirección a un usuario
  async addAddress(userID: number, addressData: AddAddressDto) {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { userID: userID }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Si se está estableciendo como default, quitar el default de otras direcciones
      if (addressData.isBillingDefault) {
        await this.prisma.address.updateMany({
          where: { 
            userID: userID,
            isBillingDefault: true 
          },
          data: { isBillingDefault: false }
        });
      }

      if (addressData.isShippingDefault) {
        await this.prisma.address.updateMany({
          where: { 
            userID: userID,
            isShippingDefault: true 
          },
          data: { isShippingDefault: false }
        });
      }

      // Crear la nueva dirección
      const newAddress = await this.prisma.address.create({
        data: {
          userID: userID,
          addressType: addressData.addressType as 'BILLING' | 'SHIPPING' | 'BOTH',
          firstName: addressData.firstName,
          lastName: addressData.lastName,
          street: addressData.street,
          neighborhood: addressData.neighborhood || null,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
          countryCode: addressData.countryCode,
          isBillingDefault: addressData.isBillingDefault || false,
          isShippingDefault: addressData.isShippingDefault || false,
        }
      });

      return {
        message: 'Dirección agregada correctamente',
        addressId: newAddress.addressID,
        address: {
          addressID: newAddress.addressID,
          addressType: newAddress.addressType,
          firstName: newAddress.firstName,
          lastName: newAddress.lastName,
          street: newAddress.street,
          neighborhood: newAddress.neighborhood,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          countryCode: newAddress.countryCode,
          isBillingDefault: newAddress.isBillingDefault,
          isShippingDefault: newAddress.isShippingDefault,
          createdAt: newAddress.createdAt
        }
      };
    } catch (error) {
      throw new Error(`Error al agregar dirección: ${error.message}`);
    }
  }

  // Actualizar dirección existente
  async updateAddress(userID: number, addressID: number, addressData: UpdateAddressDto) {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { userID: userID }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que la dirección existe y pertenece al usuario
      const existingAddress = await this.prisma.address.findFirst({
        where: { 
          addressID: addressID,
          userID: userID 
        }
      });

      if (!existingAddress) {
        throw new Error('Dirección no encontrada o no pertenece al usuario');
      }

      // Si se está estableciendo como default, quitar el default de otras direcciones
      if (addressData.isBillingDefault === true) {
        await this.prisma.address.updateMany({
          where: { 
            userID: userID,
            isBillingDefault: true,
            addressID: { not: addressID } // Excluir la dirección actual
          },
          data: { isBillingDefault: false }
        });
      }

      if (addressData.isShippingDefault === true) {
        await this.prisma.address.updateMany({
          where: { 
            userID: userID,
            isShippingDefault: true,
            addressID: { not: addressID } // Excluir la dirección actual
          },
          data: { isShippingDefault: false }
        });
      }

      // Preparar los datos para actualizar (solo los campos que se proporcionaron)
      const updateData: any = {};
      
      if (addressData.addressType !== undefined) {
        updateData.addressType = addressData.addressType as 'BILLING' | 'SHIPPING' | 'BOTH';
      }
      if (addressData.firstName !== undefined) {
        updateData.firstName = addressData.firstName;
      }
      if (addressData.lastName !== undefined) {
        updateData.lastName = addressData.lastName;
      }
      if (addressData.street !== undefined) {
        updateData.street = addressData.street;
      }
      if (addressData.neighborhood !== undefined) {
        updateData.neighborhood = addressData.neighborhood;
      }
      if (addressData.city !== undefined) {
        updateData.city = addressData.city;
      }
      if (addressData.state !== undefined) {
        updateData.state = addressData.state;
      }
      if (addressData.postalCode !== undefined) {
        updateData.postalCode = addressData.postalCode;
      }
      if (addressData.countryCode !== undefined) {
        updateData.countryCode = addressData.countryCode;
      }
      if (addressData.isBillingDefault !== undefined) {
        updateData.isBillingDefault = addressData.isBillingDefault;
      }
      if (addressData.isShippingDefault !== undefined) {
        updateData.isShippingDefault = addressData.isShippingDefault;
      }

      // Actualizar la dirección
      const updatedAddress = await this.prisma.address.update({
        where: { addressID: addressID },
        data: updateData
      });

      return {
        message: 'Dirección actualizada correctamente',
        addressId: updatedAddress.addressID,
        address: {
          addressID: updatedAddress.addressID,
          addressType: updatedAddress.addressType,
          firstName: updatedAddress.firstName,
          lastName: updatedAddress.lastName,
          street: updatedAddress.street,
          neighborhood: updatedAddress.neighborhood,
          city: updatedAddress.city,
          state: updatedAddress.state,
          postalCode: updatedAddress.postalCode,
          countryCode: updatedAddress.countryCode,
          isBillingDefault: updatedAddress.isBillingDefault,
          isShippingDefault: updatedAddress.isShippingDefault,
          updatedAt: updatedAddress.updatedAt
        }
      };
    } catch (error) {
      throw new Error(`Error al actualizar dirección: ${error.message}`);
    }
  }

  // Actualizar perfil del usuario (nombre, apellido, foto de perfil)
  async updateUserProfile(userID: number, profileData: UpdateProfileDto) {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { userID: userID }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Preparar los datos para actualizar (solo los campos que se proporcionaron)
      const updateData: any = {};
      
      if (profileData.name !== undefined) {
        updateData.name = profileData.name;
      }
      if (profileData.lastName !== undefined) {
        updateData.lastName = profileData.lastName;
      }
      if (profileData.imageURL !== undefined) {
        updateData.imageURL = profileData.imageURL;
      }

      // Si no se proporcionó ningún campo para actualizar
      if (Object.keys(updateData).length === 0) {
        throw new Error('No se proporcionaron datos para actualizar');
      }

      // Actualizar el usuario
      const updatedUser = await this.prisma.user.update({
        where: { userID: userID },
        data: updateData
      });

      // Si se actualizó la imagen, también actualizar en Stripe si existe stripeCustomerID
      if (profileData.imageURL !== undefined && user.stripeCustomerID) {
        try {
          await this.stripe.updateCustomer(user.stripeCustomerID, {
            metadata: {
              profileImage: profileData.imageURL
            }
          });
        } catch (stripeError) {
          console.warn('No se pudo actualizar la imagen en Stripe:', stripeError.message);
          // No lanzamos error porque la actualización en BD ya fue exitosa
        }
      }

      return {
        message: 'Perfil actualizado correctamente',
        user: {
          userID: updatedUser.userID,
          name: updatedUser.name,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          imageURL: (updatedUser as any).imageURL,
          updatedAt: updatedUser.updatedAt
        }
      };
    } catch (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }
  }
}
