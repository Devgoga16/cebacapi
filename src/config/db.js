const mongoose = require('mongoose');
const config = require('./config');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/cebac';
const isVercel = !!process.env.VERCEL;
const usingLocalhost = /^mongodb:\/\//.test(MONGO_URI) && /localhost|127\.0\.0\.1/.test(MONGO_URI);

if (isVercel && usingLocalhost) {
  console.warn('Advertencia: MONGODB_URI no está configurada; la URL apunta a localhost. En Vercel esto fallará. Configura MONGODB_URI en las variables de entorno.');
}

// Evitar múltiples conexiones en entornos serverless entre invocaciones calientes
if (mongoose.connection.readyState === 1) {
  // ya conectado
} else if (!global.__MONGO_CONN_PROMISE) {
  global.__MONGO_CONN_PROMISE = mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Conexión a MongoDB exitosa');
      return mongoose;
    })
    .catch((err) => {
      console.error('Error al conectar a MongoDB:', err.message);
      throw err;
    });
}

module.exports = mongoose;
