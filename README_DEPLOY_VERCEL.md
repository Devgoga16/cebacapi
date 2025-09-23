# Despliegue en Vercel

Este proyecto está listo para desplegar en Vercel como función serverless:

- `api/index.js` exporta el handler que reutiliza la app Express (`src/app.js`).
- `vercel.json` reescribe todas las rutas a `/api/index.js`.
- La conexión a MongoDB usa `MONGODB_URI` (o `MONGO_URI`/`DATABASE_URL`). Configura esta variable en Vercel.

## Variables de entorno

- `MONGODB_URI`: cadena de conexión a MongoDB Atlas u otro.
- `PORT`: ignorado en Vercel (solo local).

## Pasos de despliegue

1. Instala Vercel CLI y haz login.
2. Ejecuta `vercel` en la raíz del proyecto y sigue el asistente.
3. En el dashboard del proyecto, define `MONGODB_URI` en Project Settings > Environment Variables.
4. Despliega con `vercel --prod`.

## Desarrollo local

- `npm run dev` inicia el servidor local en `src/server.js` (Express escucha en `PORT` o 3000).
- Documentación Swagger: `http://localhost:3000/api-docs`.
