# 🚀 DESPLIEGUE EN RENDER - PRODUCCIÓN (React Native Play Store)

**Fecha**: 9 de noviembre de 2025
**Cliente**: React Native CLI (Play Store - Testing Interno)
**Backend**: NestJS + PostgreSQL + Stripe
**Deployment**: Render.com

---

## ⚠️ **IMPORTANTE: CONFIGURACIÓN PARA PRODUCCIÓN**

Tu app está en **Play Store (testing)**, por lo tanto necesitas:

- ✅ HTTPS obligatorio (Render lo da gratis)
- ✅ Variables de entorno seguras
- ✅ CORS configurado para producción
- ✅ Webhooks de Stripe apuntando a Render
- ✅ URL de API estable (no cambiará)

---

## 📋 **PRE-REQUISITOS**

Antes de empezar, asegúrate de tener:

- [ ] Cuenta en [Render.com](https://render.com) (gratis)
- [ ] Cuenta en [Stripe](https://stripe.com) (modo test)
- [ ] Código en GitHub (repositorio `EcommerceAPI`)
- [ ] Variables de entorno listas (ver abajo)
- [ ] Migraciones de Prisma en Git

---

## 🗄️ **PASO 1: CREAR BASE DE DATOS POSTGRESQL**

### 1.1 Crear Base de Datos

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**

### 1.2 Configuración

```
Name: ecommerce-db
Database: ecommerce
User: ecommerce_user
Region: Oregon (US West)  ← O la más cercana a tus usuarios
Plan: Free  ← $0/mes (90 días gratis, luego $7/mes)
```

3. Click **"Create Database"**

⏳ **Espera 2-3 minutos** mientras Render crea la BD.

### 1.3 Obtener URL de Conexión

1. Una vez creada, ve a la pestaña **"Info"**
2. Busca **"External Database URL"** (NO uses Internal)
3. Copia la URL completa:

```
postgresql://ecommerce_user:XXX@dpg-XXX.oregon-postgres.render.com/ecommerce
```

⚠️ **IMPORTANTE**: Guarda esta URL, la necesitarás en el siguiente paso.

---

## 🌐 **PASO 2: CREAR WEB SERVICE (API)**

### 2.1 Crear Servicio

1. Click **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Selecciona **"EcommerceAPI"**

### 2.2 Configuración Básica

```
Name: ecommerce-api-produccion
Region: Oregon (US West)  ← MISMA que la BD
Branch: main  ← O develop (tu rama estable)
Root Directory: ecommerce-api  ← Si tu código está en subcarpeta
Runtime: Node
```

### 2.3 Build & Start Commands

**Build Command**:

```bash
npm install && npx prisma generate && npm run build
```

**Start Command**:

```bash
npx prisma migrate deploy && npm run start:prod
```

⚠️ **Explicación**:

- `npx prisma migrate deploy` → Ejecuta migraciones en BD
- `npm run start:prod` → Inicia API en modo producción

### 2.4 Plan

```
Plan: Free  ← $0/mes (750 horas/mes, suficiente para testing)
```

⚠️ **Limitaciones del plan Free**:

- Servidor se apaga después de 15 min de inactividad
- Primera request puede tardar ~30 seg (cold start)
- **Recomendación**: Upgrade a plan pago ($7/mes) para producción real

---

## ⚙️ **PASO 3: CONFIGURAR VARIABLES DE ENTORNO**

### 3.1 Ir a Environment

1. En tu Web Service, ve a **"Environment"**
2. Click **"Add Environment Variable"**

### 3.2 Variables Requeridas

Agrega **UNA POR UNA** las siguientes variables:

#### **Base de Datos**

| Key            | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL` | `postgresql://ecommerce_user:XXX@dpg-XXX.oregon-postgres.render.com/ecommerce` |

⚠️ Usa la URL que copiaste en el Paso 1.3

---

#### **Node.js**

| Key        | Value        |
| ---------- | ------------ |
| `NODE_ENV` | `production` |
| `PORT`     | `3001`       |

---

#### **JWT (Autenticación)**

| Key              | Value                                 | Nota                              |
| ---------------- | ------------------------------------- | --------------------------------- |
| `JWT_SECRET`     | `tu_secreto_super_seguro_aqui_123456` | ⚠️ Cambia esto por algo aleatorio |
| `JWT_EXPIRES_IN` | `8h`                                  | Token expira en 8 horas           |

**Generar JWT_SECRET seguro**:

```bash
# En terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y úsalo como `JWT_SECRET`.

---

#### **Stripe**

| Key                 | Value         | Dónde obtenerlo                          |
| ------------------- | ------------- | ---------------------------------------- |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → Developers → API keys |

⚠️ **IMPORTANTE**:

- Usa `sk_test_...` para testing
- Cuando vayas a producción real, cambia a `sk_live_...`

---

#### **Frontend URL**

| Key            | Value      | Nota                             |
| -------------- | ---------- | -------------------------------- |
| `FRONTEND_URL` | `myapp://` | Deep link de tu React Native app |

**Explicación**:

- Esto se usa en URLs de éxito/cancelación de Stripe
- Ejemplo: `myapp://order/success?session_id={CHECKOUT_SESSION_ID}`

⚠️ **Si no usas deep links**, puedes usar:

```
FRONTEND_URL=https://tu-dominio-web.com
```

---

#### **Webhook Secret (⚠️ LO CONFIGURAREMOS DESPUÉS)**

| Key                     | Value       | Nota                      |
| ----------------------- | ----------- | ------------------------- |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ⚠️ Déjalo vacío por ahora |

**Lo configuraremos en el Paso 5** después de crear el webhook en Stripe.

---

### 3.3 Verificar Variables

Deberías tener **7 variables** en total:

```
✅ DATABASE_URL
✅ NODE_ENV
✅ PORT
✅ JWT_SECRET
✅ JWT_EXPIRES_IN
✅ STRIPE_SECRET_KEY
✅ FRONTEND_URL
⚠️ STRIPE_WEBHOOK_SECRET (vacío por ahora)
```

---

## 🚀 **PASO 4: DESPLEGAR**

### 4.1 Crear y Desplegar

1. Revisa que todo esté correcto
2. Click **"Create Web Service"**

⏳ **Espera 5-10 minutos** mientras Render:

- Clona tu repositorio
- Instala dependencias (`npm install`)
- Genera Prisma Client
- Ejecuta build (`npm run build`)
- Ejecuta migraciones (`npx prisma migrate deploy`)
- Inicia la aplicación

### 4.2 Monitorear Despliegue

Ve a la pestaña **"Logs"** para ver el progreso:

```bash
==> Cloning from https://github.com/Sori18B/EcommerceAPI...
==> Running 'npm install'...
==> Running 'npx prisma generate'...
✔ Generated Prisma Client
==> Running 'npm run build'...
✔ Build successful
==> Running 'npx prisma migrate deploy'...
✔ Migrations applied: 1 migration
==> Starting server...
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] Mapped {/api, GET}
✔ Application is running on: http://0.0.0.0:3001
```

### 4.3 Verificar Despliegue Exitoso

Cuando veas:

```
✅ Deploy succeeded
```

Tu API está lista! 🎉

### 4.4 Obtener URL de tu API

En la parte superior verás tu URL:

```
https://ecommerce-api-produccion.onrender.com
```

⚠️ **IMPORTANTE**: Guarda esta URL, la necesitarás en:

- React Native (configuración de API)
- Stripe Webhooks (siguiente paso)

---

## 🔍 **PASO 5: VERIFICAR QUE FUNCIONA**

### 5.1 Probar Endpoint de Salud

Abre en tu navegador:

```
https://ecommerce-api-produccion.onrender.com/api
```

Deberías ver la página de **Swagger UI** con la documentación.

### 5.2 Probar Login (Testing)

Desde Postman o tu terminal:

```bash
curl -X POST https://ecommerce-api-produccion.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

⚠️ **Si retorna 401 "Usuario no encontrado"**:

- Es normal, aún no tienes usuarios
- Necesitas ejecutar el seed (siguiente paso)

---

## 🌱 **PASO 6: EJECUTAR SEED (DATOS INICIALES)**

### 6.1 Opción A: Desde Render Shell

1. En tu Web Service, ve a **"Shell"** (tab)
2. Ejecuta:

```bash
npx prisma db seed
```

Esto creará:

- ✅ Roles (admin, cliente, super_admin)
- ✅ Categorías (Ropa, Zapatos, Accesorios...)
- ✅ Géneros (Hombre, Mujer, Unisex)
- ✅ Tallas (XS, S, M, L, XL...)
- ✅ Colores (Negro, Blanco, Rojo...)
- ✅ Estados de entrega y pago
- ✅ Usuario admin (admin@test.com / Admin123!)

### 6.2 Opción B: Desde Terminal Local

Si tienes acceso a la BD:

```bash
# Usar la DATABASE_URL de Render
export DATABASE_URL="postgresql://ecommerce_user:XXX@dpg-XXX.oregon-postgres.render.com/ecommerce"
npx prisma db seed
```

### 6.3 Verificar Seed Exitoso

Prueba login de nuevo:

```bash
curl -X POST https://ecommerce-api-produccion.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

Ahora deberías recibir:

```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "userID": 1,
    "name": "Admin",
    "email": "admin@test.com",
    "role": "admin"
  }
}
```

✅ **¡Funciona!**

---

## 🔔 **PASO 7: CONFIGURAR WEBHOOKS DE STRIPE**

### 7.1 Ir a Stripe Dashboard

1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. Asegúrate de estar en **"Test mode"** (toggle arriba a la derecha)
3. Ve a **Developers** → **Webhooks**

### 7.2 Crear Endpoint

1. Click **"Add endpoint"**
2. **Endpoint URL**:

```
https://ecommerce-api-produccion.onrender.com/webhook
```

⚠️ Usa TU URL de Render, no la de ejemplo.

3. **Description**: `Production webhooks for Render`
4. **Listen to**: **Events on your account**

### 7.3 Seleccionar Eventos

Busca y selecciona estos **3 eventos**:

```
✅ checkout.session.completed
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
```

5. Click **"Add events"**
6. Click **"Add endpoint"**

### 7.4 Obtener Signing Secret

1. En la lista de endpoints, click en el que acabas de crear
2. En **"Signing secret"**, click **"Reveal"**
3. Copia el secret (empieza con `whsec_`)

Ejemplo:

```
whsec_1234567890abcdefghijklmnopqrstuvwxyzABCDEF
```

### 7.5 Agregar Secret a Render

1. Ve a tu Web Service en Render
2. Tab **"Environment"**
3. Busca `STRIPE_WEBHOOK_SECRET`
4. Click **"Edit"**
5. Pega el secret que copiaste
6. Click **"Save Changes"**

⏳ Render redesplegará automáticamente (2-3 min).

### 7.6 Probar Webhook

1. En Stripe Dashboard, en tu webhook
2. Tab **"Send test webhook"**
3. Selecciona `checkout.session.completed`
4. Click **"Send test webhook"**

**Resultado esperado**:

```
✅ 200 OK
Response: {"received":true,"eventId":"evt_test_..."}
```

✅ **¡Webhook funcionando!**

---

## 📱 **PASO 8: CONFIGURAR REACT NATIVE**

### 8.1 URL de API

En tu app React Native, configura la URL base:

**Opción A: Archivo de configuración** (recomendado)

```javascript
// config/api.js
export const API_CONFIG = {
  baseURL: 'https://ecommerce-api-produccion.onrender.com',
  timeout: 30000, // 30 segundos (para cold starts)
};
```

**Opción B: Variable de entorno**

```bash
# .env (React Native)
API_URL=https://ecommerce-api-produccion.onrender.com
```

### 8.2 Configurar Axios/Fetch

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      // Timeout - servidor despertando (cold start)
      console.log('⏳ Servidor despertando, reintentando...');
      return api.request(error.config);
    }

    if (error.response?.status === 401) {
      // Token expirado
      await AsyncStorage.removeItem('authToken');
      // Redirigir a login
    }

    return Promise.reject(error);
  },
);

export default api;
```

### 8.3 Manejo de Cold Starts

Render Free tier apaga el servidor después de 15 min de inactividad.

**Solución 1: Mostrar loading** (recomendado)

```javascript
const [loading, setLoading] = useState(false);
const [coldStart, setColdStart] = useState(false);

const login = async (email, password) => {
  setLoading(true);

  try {
    const response = await api.post('/login', { email, password });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      setColdStart(true);
      // Mostrar mensaje: "Servidor iniciando, por favor espera..."
    }
  } finally {
    setLoading(false);
  }
};
```

**Solución 2: Keep-Alive Service** (avanzado)

Hacer ping al servidor cada 10 min para mantenerlo activo:

```javascript
// services/keepAlive.js
import api from './api';

export const startKeepAlive = () => {
  setInterval(
    async () => {
      try {
        await api.get('/api'); // Endpoint ligero
      } catch (error) {
        console.log('Keep-alive failed');
      }
    },
    10 * 60 * 1000,
  ); // Cada 10 minutos
};
```

### 8.4 Configurar Stripe React Native

```javascript
// App.tsx
import { StripeProvider } from '@stripe/stripe-react-native';

export default function App() {
  return (
    <StripeProvider
      publishableKey="pk_test_..." // ⚠️ Tu publishable key de Stripe
      merchantIdentifier="merchant.com.tuapp"
    >
      {/* Tu app */}
    </StripeProvider>
  );
}
```

---

## 🧪 **PASO 9: TESTING COMPLETO**

### 9.1 Desde React Native (Producción)

**Flujo completo de prueba**:

```
1. Abrir app desde Play Store (testing interno)
2. Registrar nuevo usuario
3. Login
4. Ver productos
5. Agregar al carrito
6. Agregar dirección
7. Ir a checkout
8. Crear Payment Intent
9. Pagar con tarjeta de prueba: 4242 4242 4242 4242
10. Verificar orden creada
```

### 9.2 Tarjetas de Prueba Stripe

```
✅ Éxito: 4242 4242 4242 4242
❌ Declinada: 4000 0000 0000 0002
⏳ 3D Secure: 4000 0025 0000 3155

Fecha: Cualquier futura (12/26)
CVC: Cualquier 3 dígitos (123)
```

### 9.3 Verificar en Logs

**En Render**:

1. Ve a tu Web Service
2. Tab **"Logs"**
3. Deberías ver:

```
📨 Webhook recibido de Stripe
💳 Pago confirmado: pi_xxx
🛒 Procesando checkout completado
✅ Orden #1 creada exitosamente
   - Total: $1833.20 MXN
   - Items: 3
```

**En Stripe**:

1. Dashboard → Webhooks → Tu endpoint
2. Tab **"Event logs"**
3. Verás todos los eventos procesados

---

## ⚙️ **PASO 10: CONFIGURACIÓN AVANZADA (OPCIONAL)**

### 10.1 CORS para Producción

En `main.ts`, actualizar CORS:

```typescript
// src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000', // Desarrollo web
    'http://localhost:8081', // React Native dev
    'myapp://', // Deep links
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 10.2 Rate Limiting (Protección)

Instalar:

```bash
npm install @nestjs/throttler
```

Configurar en `app.module.ts`:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 60 segundos
      limit: 10, // 10 requests por minuto
    }),
    // ... otros módulos
  ],
})
```

### 10.3 Desactivar Swagger en Producción (Seguridad)

En `main.ts`:

```typescript
// Solo habilitar Swagger en desarrollo
if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder().setTitle('Ecommerce API').build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
```

⚠️ **Recomendación**: Mantén Swagger habilitado durante testing, desactiva solo en producción real.

---

## 📊 **PASO 11: MONITOREO**

### 11.1 Logs de Render

**Ver logs en tiempo real**:

1. Web Service → **"Logs"**
2. Click **"Live tail"**

**Buscar errores**:

```
Buscar: "ERROR"
Buscar: "❌"
Buscar: "failed"
```

### 11.2 Métricas de Render

**Ver uso de recursos**:

1. Web Service → **"Metrics"**
2. Verás:
   - CPU usage
   - Memory usage
   - Response times
   - Request count

### 11.3 Eventos de Stripe

**Monitorear webhooks**:

1. Stripe Dashboard → Webhooks → Tu endpoint
2. Tab **"Event logs"**
3. Filtrar por:
   - Succeeded (✅)
   - Failed (❌)

### 11.4 Base de Datos

**Consultar datos**:

1. PostgreSQL → **"Connect"**
2. Usar `psql` o herramienta GUI (DataGrip, TablePlus)

```sql
-- Ver órdenes recientes
SELECT * FROM "Orders"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Ver usuarios registrados
SELECT "userID", "email", "name", "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- Ver logs de webhooks
SELECT * FROM "StripeWebhookLog"
WHERE "processed" = true
ORDER BY "receivedAt" DESC
LIMIT 20;
```

---

## 🚨 **TROUBLESHOOTING COMÚN**

### ❌ "Application failed to respond"

**Causa**: Cold start (servidor dormido)

**Solución**:

- Esperar 30-60 seg
- Reintentar request
- Considerar upgrade a plan pago

---

### ❌ "Database connection error"

**Causa**: `DATABASE_URL` incorrecta

**Solución**:

1. Verificar en Environment variables
2. Copiar nueva URL desde PostgreSQL → Info
3. Usar **External Database URL**
4. Redesplegar

---

### ❌ "Webhook signature verification failed"

**Causa**: `STRIPE_WEBHOOK_SECRET` incorrecto

**Solución**:

1. Ir a Stripe Dashboard → Webhooks
2. Copiar signing secret de nuevo
3. Actualizar en Render Environment
4. Esperar redespliegue
5. Probar con "Send test webhook"

---

### ❌ "Migrations failed"

**Causa**: Carpeta `prisma/migrations/` no en Git

**Solución**:

```bash
git add prisma/migrations/
git commit -m "Add Prisma migrations"
git push
```

Redesplegar en Render.

---

### ❌ "Cold start timeout en React Native"

**Causa**: Timeout muy bajo (default 10s)

**Solución**:

```javascript
const api = axios.create({
  timeout: 30000, // 30 segundos
});
```

---

## 💰 **COSTOS Y LIMITACIONES**

### Plan Free (Testing - 14 días)

| Recurso        | Límite                  | Costo |
| -------------- | ----------------------- | ----- |
| Web Service    | 750 horas/mes           | $0    |
| PostgreSQL     | 90 días gratis          | $0    |
| Ancho de banda | 100 GB/mes              | $0    |
| Cold starts    | Sí (15 min inactividad) | -     |

**Total mensual**: $0 durante 90 días

### Plan Recomendado (Producción Real)

Cuando pases a producción con usuarios reales:

| Servicio    | Plan    | Costo       |
| ----------- | ------- | ----------- |
| Web Service | Starter | $7/mes      |
| PostgreSQL  | Starter | $7/mes      |
| **Total**   |         | **$14/mes** |

**Beneficios del plan pago**:

- ✅ Sin cold starts
- ✅ Más memoria (512 MB)
- ✅ Más CPU
- ✅ Uptime 99.95%

---

## ✅ **CHECKLIST FINAL DE DESPLIEGUE**

### Backend en Render

- [ ] Base de datos PostgreSQL creada
- [ ] Web Service creado y desplegado
- [ ] 8 variables de entorno configuradas
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] Seed ejecutado (datos iniciales)
- [ ] `/api` responde (Swagger UI)
- [ ] Login funciona (admin@test.com)

### Stripe

- [ ] Webhook endpoint creado
- [ ] URL correcta (`https://tu-api.onrender.com/webhook`)
- [ ] 3 eventos seleccionados
- [ ] Signing secret copiado
- [ ] Secret agregado en Render (`STRIPE_WEBHOOK_SECRET`)
- [ ] Test webhook retorna 200 OK

### React Native

- [ ] URL de API actualizada en app
- [ ] Timeout configurado (30s)
- [ ] Interceptores de axios configurados
- [ ] Stripe Provider configurado
- [ ] Deep links configurados (opcional)

### Testing

- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Ver productos funciona
- [ ] Agregar al carrito funciona
- [ ] Checkout funciona
- [ ] Pago con tarjeta de prueba funciona
- [ ] Webhook crea orden automáticamente
- [ ] Orden visible en `/orders`

---

## 🎯 **PRÓXIMOS PASOS**

### Para Testing (14 días)

1. ✅ Compartir enlace de Play Store con testers
2. ✅ Monitorear logs en Render
3. ✅ Revisar eventos en Stripe
4. ✅ Recopilar feedback de testers
5. ✅ Corregir bugs si los hay

### Para Producción Real

1. Cambiar a `sk_live_...` en Stripe (modo live)
2. Crear nuevo webhook para producción
3. Upgrade a plan pago en Render ($14/mes)
4. Configurar dominio personalizado (opcional)
5. Habilitar monitoreo (Sentry, LogRocket)
6. Agregar analytics
7. Implementar rate limiting
8. Configurar backups automáticos de BD

---

## 📞 **SOPORTE**

### Documentación Oficial

- [Render Docs](https://render.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Prisma + Render](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render)

### Logs y Debugging

**Render**:

```
Web Service → Logs → Live tail
```

**Stripe**:

```
Developers → Webhooks → Event logs
```

**Base de Datos**:

```
PostgreSQL → Connect → psql
```

---

## 🎉 **¡FELICIDADES!**

Tu API está **en producción** y lista para recibir requests desde tu app React Native en Play Store (testing).

**Características en producción**:

- ✅ HTTPS seguro
- ✅ Base de datos PostgreSQL
- ✅ Webhooks de Stripe funcionando
- ✅ Autenticación JWT
- ✅ Pagos procesados automáticamente
- ✅ Órdenes creadas sin intervención manual

**URL de tu API**:

```
https://ecommerce-api-produccion.onrender.com
```

**¿Problemas durante el despliegue?** Revisa la sección de Troubleshooting o los logs en Render.

---

**¡Éxito con tu testing en Play Store!** 🚀📱💳
