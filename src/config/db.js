const mongoose = require('mongoose');
const config = require('./config');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/cebac';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Conexión a MongoDB exitosa');
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err.message);
  });

module.exports = mongoose;
