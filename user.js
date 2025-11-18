const express = require('express');
const mysql = require('mysql2/promise'); // Dùng mysql2/promise để hỗ trợ async/await
const bcryptjs = require('bcryptjs');


const app = express();
const port = 3000;
const cors = require('cors');

app.use(cors({
  origin: '*',  // Chỉ cho phép frontend Angular gọi API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức cho phép
  credentials: true, // Nếu bạn cần gửi cookie
}));
// Middleware parse JSON
app.use(express.json());

// Middleware CORS (nếu bạn gọi API từ frontend khác domain)

// Kết nối database MySQL với async/await
let db;
async function connectDB() {
  try {
    db = await mysql.createConnection({
    host: 'sql12.freesqldatabase.com',  // host FreeSQL
    user: 'sql12808282',                // username FreeSQL
    password: 'mật khẩu bạn nhận trong email',  // password FreeSQL
    database: 'sql12808282'             // database name trên FreeSQL
    });
    console.log('✅ Đã kết nối tới MySQL');
  } catch (err) {
    console.error('❌ Kết nối DB lỗi:', err);
    process.exit(1); // Nếu lỗi kết nối thì dừng server luôn
  }
}
connectDB();

// API: Lấy danh sách tất cả users
app.get('/users', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM users');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Lấy user theo maNguoiDung
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM users WHERE maNguoiDung = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Tạo user mới (có mã hóa mật khẩu async)
app.post('/users', async (req, res) => {
  try {
    if (!req.body) return res.status(400).json({ message: 'Body không được để trống' });

    const { tenDangNhap, matKhau, email } = req.body;
    if (!tenDangNhap || !matKhau) {
      return res.status(400).json({ message: 'tenDangNhap và matKhau là bắt buộc' });
    }

    // Mã hóa mật khẩu async
    const hashedPassword = await bcryptjs.hash(matKhau, 10);

    const sql = 'INSERT INTO users (tenDangNhap, matKhau, email, role) VALUES (?, ?, ?, ?)';
    const [result] = await db.execute(sql, [tenDangNhap, hashedPassword, email, 1]);

    res.status(201).json({ message: 'Tạo tài khoản thành công', maNguoiDung: result.insertId });

  } catch (error) {
    console.error('❌ Lỗi khi tạo user:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo user' });
  }
});

// API: Đăng nhập
app.post('/login', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body;

    if (!tenDangNhap || !matKhau) {
      return res.status(400).json({ message: 'tenDangNhap và matKhau là bắt buộc' });
    }

    // Tìm người dùng theo tenDangNhap
    const [rows] = await db.execute('SELECT * FROM users WHERE tenDangNhap = ?', [tenDangNhap]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    const user = rows[0];

    // So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa
    const isMatch = await bcryptjs.compare(matKhau, user.matKhau);

    if (!isMatch) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Nếu đúng, trả về thông tin user cơ bản (không nên trả về mật khẩu)
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
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
});

// API: Cập nhật user theo maNguoiDung (có mã hóa lại mật khẩu async)
app.put('/users/:id', async (req, res) => {
  try {
    if (!req.body) return res.status(400).json({ message: 'Body không được để trống' });

    const { id } = req.params;
    const { tenDangNhap, matKhau, email, role } = req.body;

    if (!tenDangNhap || !matKhau || role === undefined) {
      return res.status(400).json({ message: 'tenDangNhap, matKhau và role là bắt buộc' });
    }

    const hashedPassword = await bcryptjs.hash(matKhau, 10);

    const sql = 'UPDATE users SET tenDangNhap = ?, matKhau = ?, email = ?, role = ? WHERE maNguoiDung = ?';
    const [result] = await db.execute(sql, [tenDangNhap, hashedPassword, email, role, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({ message: 'User đã được cập nhật' });

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật user:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật user' });
  }
});
//sua qlUser admin
app.put('/admin/:id', async (req, res) => {
  console.log('PUT /admin/:id', req.params, req.body);
  try {
    const { id } = req.params;
    const { tenDangNhap, email, role } = req.body;

    if (!tenDangNhap || role === undefined) {
      return res.status(400).json({ message: 'tenDangNhap và role là bắt buộc' });
    }

    const sql = 'UPDATE users SET tenDangNhap = ?, email = ?, role = ? WHERE maNguoiDung = ?';
    const [result] = await db.execute(sql, [tenDangNhap, email, role, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({ message: 'User đã được cập nhật' });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật user:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật user' });
  }
});

// API: Xóa user theo maNguoiDung
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM users WHERE maNguoiDung = ?';
    const [result] = await db.execute(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({ message: 'User đã được xóa' });
  } catch (error) {
    console.error('❌ Lỗi khi xóa user:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa user' });
  }
});
// Kiểm tra tên đăng nhập tồn tại chưa
app.get('/users/check-username/:tenDangNhap', async (req, res) => {
  try {
    const { tenDangNhap } = req.params;

    const [rows] = await db.execute('SELECT 1 FROM users WHERE tenDangNhap = ? LIMIT 1', [tenDangNhap]);

    res.json({ exists: rows.length > 0 });
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra tên đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server khi kiểm tra tên đăng nhập' });
  }
});

// Kiểm tra email tồn tại chưa
app.get('/users/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await db.execute('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);

    res.json({ exists: rows.length > 0 });
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra email:', error);
    res.status(500).json({ error: 'Lỗi server khi kiểm tra email' });
  }
});
// Khởi chạy server
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
