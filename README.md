<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Ecommerce Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm i
```

### 2. Environment Configuration
Create `.env` file in the root directory:
```bash
cp .env.example .env
```

Add required environment variables:
```env
# Database
DATABASE_URL= "postgresql://user:password@localhost:5432/dbName"

# JWT
JWT_SECRET = ""
JWT_EXPIRES_IN = 8h

NODE_ENV=development # Para desarrollo local


# Other services
PORT=3000
STRIPE_SECRET_KEY = ""
```

### 3. Database Setup (Prisma)
```bash
# Initialize Prisma (if not already done)
npx prisma init

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name initial_migration

```

### 4. Development
```bash
# Start development server
npm run start:dev

# Watch mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 5. Database Management
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

## Project Structure

- `src/config/` - Configuration files
- `src/dtos/` - Data Transfer Objects
- `src/interfaces/` - TypeScript interfaces organized by module
- `src/middlewares/` - Custom middlewares
- `src/modules/` -  API Modules
- `src/services/` - External services (Prisma, OpenPay)
- `src/utils/` - Utility functions