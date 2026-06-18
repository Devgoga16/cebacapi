const mongoose = require('mongoose');

const LOGS_URI = process.env.MONGODB_LOGS_URI;

let logsConn;

function getLogsConnection() {
  if (logsConn && logsConn.readyState === 1) return logsConn;

  if (!global.__MONGO_LOGS_PROMISE) {
    global.__MONGO_LOGS_PROMISE = mongoose
      .createConnection(LOGS_URI, { useNewUrlParser: true, useUnifiedTopology: true })
      .asPromise()
      .then((conn) => {
        logsConn = conn;
        return conn;
      })
      .catch((err) => {
        global.__MONGO_LOGS_PROMISE = null;
        console.error('[AuditLog] Error al conectar a la BD de logs:', err.message);
        throw err;
      });
  }

  return global.__MONGO_LOGS_PROMISE;
}

module.exports = { getLogsConnection };
