const app = require('../src/app');

// En Vercel, exportamos un handler (Express app es compatible como handler)
module.exports = (req, res) => {
  return app(req, res);
};
