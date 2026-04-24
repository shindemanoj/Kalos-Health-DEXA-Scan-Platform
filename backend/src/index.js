require('dotenv').config();
require('express-async-errors');

const app = require('./app');
const { testConnection } = require('./db');

const PORT = process.env.PORT || 4000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Kalos API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

start();
