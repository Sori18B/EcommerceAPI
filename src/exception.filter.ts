import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
  } from '@nestjs/common';
  import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
  import { Response } from 'express';
  
  @Catch()
  export class PrismaClientExceptionFilter implements ExceptionFilter {
    // Ir agregando más conforme se necesiten xd
    private readonly commonErrorMap = new Map([
      // Errores generales contemplados
      [
        'P2001',
        {
          status: 404,
          message: 'El elemento que buscas no existe',
          error: 'Not Found',
        },
      ],
      [
        'P2002',
        {
          status: 409,
          message: 'Ya existe un registro con esos datos',
          error: 'Conflict',
        },
      ],
      [
        'P2003',
        {
          status: 400,
          message:
            'No se puede realizar la operación porque falta información relacionada',
          error: 'Bad Request',
        },
      ],
      [
        'P2011',
        {
          status: 400,
          message: 'Falta información obligatoria',
          error: 'Bad Request',
        },
      ],
      [
        'P2025',
        {
          status: 404,
          message:
            'No se encontró el elemento necesario para completar la operación',
          error: 'Not Found',
        },
      ],
  
      // Errores de conexión
      [
        'P1001',
        {
          status: 503,
          message:
            'No se puede conectar al servicio. Intenta de nuevo en unos momentos',
          error: 'Service Unavailable',
        },
      ],
      [
        'P1002',
        {
          status: 408,
          message: 'La operación está tardando demasiado. Intenta de nuevo',
          error: 'Request Timeout',
        },
      ],
      // Cuando hagan muchas soluctudes
      [
        'P5011',
        {
          status: 429,
          message:
            'Has realizado demasiadas operaciones. Espera un momento e intenta de nuevo',
          error: 'Too Many Requests',
        },
      ],
    ]);
  
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
  
      if (exception instanceof HttpException) {
        return response
          .status(exception.getStatus())
          .json(exception.getResponse());
      }
  
      if (exception instanceof PrismaClientKnownRequestError) {
        const commonError = this.commonErrorMap.get(exception.code);
        if (commonError) {
          return response.status(commonError.status).json({
            statusCode: commonError.status,
            message: this.enhanceErrorMessage(commonError.message, exception),
            error: commonError.error,
            code: exception.code,
          });
        }
  
        // Para todos los demás errores: respuesta genérica
        return response.status(400).json({
          statusCode: 400,
          message:
            'Ocurrió un problema al procesar tu solicitud. Verifica los datos e intenta de nuevo',
          error: 'Database Error',
          code: exception.code,
          // En desarrollo, incluir detalles adicionales
          ...(process.env.NODE_ENV === 'development' && {
            details: exception.meta,
            originalMessage: exception.message,
            cause: exception.cause,
          }),
        });
      }
  
      // Fallback para otros errores
      return response.status(500).json({
        statusCode: 500,
        message:
          'Algo salió mal en nuestro servidor. Estamos trabajando para solucionarlo. Por favor, intenta de nuevo en unos minutos',
        error: 'Internal Server Error',
        // Solo en desarrollo mostrar detalles
        ...(process.env.NODE_ENV === 'development' && {
          debugInfo: {
            errorType: exception?.constructor?.name || 'Unknown',
            errorMessage: exception?.message || 'No message available',
            stack: exception?.stack,
            nodeEnv: process.env.NODE_ENV,
          },
        }),
      });
    }
  
    /**
     * Mejora el mensaje de error con información específica del contexto
     * Solo para los errores más comunes que necesitan detalles adicionales
     */
    private enhanceErrorMessage(
      baseMessage: string,
      exception: PrismaClientKnownRequestError,
    ): string {
      switch (exception.code) {
        case 'P2002':
          // Para duplicados, mostrar qué campo específico ya existe
          const field = exception.meta?.target;
          if (field) {
            return `${baseMessage}. El campo "${field}" ya está en uso`;
          }
          return `${baseMessage}. Verifica que la información no esté duplicada`;
  
        case 'P2003':
          // Para relaciones, ser más específico
          const fieldName = exception.meta?.field_name;
          if (fieldName) {
            return `${baseMessage}. Verifica el campo "${fieldName}"`;
          }
          return `${baseMessage}. Verifica que todos los datos relacionados existan`;
  
        default:
          return baseMessage;
      }
    }
  }
  