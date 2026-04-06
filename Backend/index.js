const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const PORT = process.env.PORT || 3010;

const app = express();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '1234',
  port: 5432,
  options: '-c search_path=oriontour'
});

app.use(cors());
app.use(express.json());