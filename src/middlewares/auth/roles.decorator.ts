import { SetMetadata } from '@nestjs/common';

//@Roles('admin', 'superadmin')
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
