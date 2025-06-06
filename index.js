const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Middleware xử lý JSON
app.use(express.json());

// Import các route
const danhMuc = require('../danhMuc');
const giaoDich = require('../giaoDich');
const nganSach = require('../nganSach');
const user = require('../user');

// Gắn routes
app.use('/danhmuc', danhMuc);
app.use('/giaodich', giaoDich);
app.use('/ngansach', nganSach);
app.use('/user', user);

// Root
app.get('/', (req, res) => {
  res.send('Hello from Express on Vercel!');
});

module.exports.handler = serverless(app);
