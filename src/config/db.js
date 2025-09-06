const mongoose = require('mongoose');
const config = require('./config');

const MONGO_URI = 'mongodb+srv://monkeywit:Ngluj7Fw8zRfk96z@cluster0.2elgi.mongodb.net/cebac?retryWrites=true&w=majority&appName=Cluster0';

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
