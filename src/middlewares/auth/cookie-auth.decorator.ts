import { applyDecorators } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

/**
 * Decorador personalizado para documentar autenticación por cookies HTTP-only
 * En lugar de usar @ApiBearerAuth() que documenta Authorization header,
 * este decorador documenta que la autenticación se hace mediante cookies
 */
export function ApiCookieAuth() {
  return applyDecorators(
    ApiSecurity('cookieAuth')
  );
}
