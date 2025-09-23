const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
  console.log(`Documentación Swagger en http://localhost:${port}/api-docs`);
});
