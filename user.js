// users.js
const express = require('express');
const mysql = require('mysql2/promise'); // Hỗ trợ async/await
const bcryptjs = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',  // cho phép frontend gọi API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Tạo pool kết nối MySQL
const db = mysql.createPool({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12808282',
  password: 'ssJaXSuIdK',
  database: 'sql12808282',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Đã tạo pool kết nối MySQL');

// ----------------- API -----------------

// Lấy tất cả users
app.get('/users', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM users');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy user theo maNguoiDung
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM users WHERE maNguoiDung = ?', [id]);

    if (results.length === 0) return res.status(404).json({ message: 'User không tồn tại' });

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo user mới (mã hóa mật khẩu)
app.post('/users', async (req, res) => {
  try {
    const { tenDangNhap, matKhau, email } = req.body;
    if (!tenDangNhap || !matKhau) return res.status(400).json({ message: 'tenDangNhap và matKhau là bắt buộc' });

    const hashedPassword = await bcryptjs.hash(matKhau, 10);
    const sql = 'INSERT INTO users (tenDangNhap, matKhau, email, role) VALUES (?, ?, ?, ?)';
    const [result] = await db.execute(sql, [tenDangNhap, hashedPassword, email, 1]);

    res.status(201).json({ message: 'Tạo tài khoản thành công', maNguoiDung: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi tạo user' });
  }
});

// Đăng nhập
app.post('/login', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body;
    if (!tenDangNhap || !matKhau) return res.status(400).json({ message: 'tenDangNhap và matKhau là bắt buộc' });

    const [rows] = await db.execute('SELECT * FROM users WHERE tenDangNhap = ?', [tenDangNhap]);
    if (rows.length === 0) return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });

    const user = rows[0];
    const isMatch = await bcryptjs.compare(matKhau, user.matKhau);
    if (!isMatch) return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        maNguoiDung: user.maNguoiDung,
        tenDangNhap: user.tenDangNhap,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
});

// Cập nhật user theo maNguoiDung (mã hóa mật khẩu)
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenDangNhap, matKhau, email, role } = req.body;
    if (!tenDangNhap || !matKhau || role === undefined) return res.status(400).json({ message: 'tenDangNhap, matKhau và role là bắt buộc' });

    const hashedPassword = await bcryptjs.hash(matKhau, 10);
    const sql = 'UPDATE users SET tenDangNhap = ?, matKhau = ?, email = ?, role = ? WHERE maNguoiDung = ?';
    const [result] = await db.execute(sql, [tenDangNhap, hashedPassword, email, role, id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'User không tồn tại' });

    res.json({ message: 'User đã được cập nhật' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi cập nhật user' });
  }
});

// Cập nhật user (admin) không đổi mật khẩu
app.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenDangNhap, email, role } = req.body;
    if (!tenDangNhap || role === undefined) return res.status(400).json({ message: 'tenDangNhap và role là bắt buộc' });

    const sql = 'UPDATE users SET tenDangNhap = ?, email = ?, role = ? WHERE maNguoiDung = ?';
    const [result] = await db.execute(sql, [tenDangNhap, email, role, id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'User không tồn tại' });

    res.json({ message: 'User đã được cập nhật' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi cập nhật user' });
  }
});

// Xóa user theo maNguoiDung
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM users WHERE maNguoiDung = ?';
    const [result] = await db.execute(sql, [id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'User không tồn tại' });

    res.json({ message: 'User đã được xóa' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi xóa user' });
  }
});

// Kiểm tra tên đăng nhập tồn tại
app.get('/users/check-username/:tenDangNhap', async (req, res) => {
  try {
    const { tenDangNhap } = req.params;
    const [rows] = await db.execute('SELECT 1 FROM users WHERE tenDangNhap = ? LIMIT 1', [tenDangNhap]);
    res.json({ exists: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi kiểm tra tên đăng nhập' });
  }
});

// Kiểm tra email tồn tại
app.get('/users/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const [rows] = await db.execute('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
    res.json({ exists: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi kiểm tra email' });
  }
});

// ----------------- Khởi chạy server -----------------
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
