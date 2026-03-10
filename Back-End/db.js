const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "comaxafrica",
  host: "localhost",
  port: 5432,
  database: "famcare_pos"
});

module.exports = pool;