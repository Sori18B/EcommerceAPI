# Script de Generación de Entorno
# 1. Usamos una imagen base de Node.js (Esto define el entorno)
FROM node:18-alpine

# 2. Creamos el directorio de trabajo
WORKDIR /usr/src/app

# 3. Copiamos los archivos de dependencias
COPY package*.json ./

# 4. Instalamos dependencias (Script de preparación)
RUN npm install

# 5. Copiamos el resto del código
COPY . .

# 6. Compilamos el proyecto (NestJS build)
RUN npm run build

# 7. Exponemos el puerto
EXPOSE 3000

# 8. Comando para iniciar
CMD ["npm", "run", "start:prod"]