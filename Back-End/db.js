const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "Col4468lins$",
  host: "localhost",
  port: 5432,
  database: "famcare_pos"
});

module.exports = pool;