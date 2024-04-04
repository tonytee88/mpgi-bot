const { Client } = require('pg');

const pgClient = new Client({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

pgClient.connect();

module.exports = pgClient;