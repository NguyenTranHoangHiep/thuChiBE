const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcryptjs = require('bcryptjs');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], credentials: true }));
app.use(express.json());

// ================== KẾT NỐI DATABASE ==================
const db = mysql.createPool({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12808282',
  password: 'ssJaXSuIdK',
  database: 'sql12808282',
  waitForConnections: true,
  connectionLimit: 10
});

console.log('MySQL pool ready');

// ================== API DANH MỤC ==================
app.get('/danhmuc', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM danhmuc');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/danhmuc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM danhmuc WHERE maDanhMuc = ?', [id]);

    if (!results.length) return res.status(404).json({ message: 'Danh mục không tồn tại' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/danhmuc', async (req, res) => {
  try {
    const { tenDanhMuc, loai } = req.body;

    if (!tenDanhMuc || !loai) return res.status(400).json({ message: 'tenDanhMuc và loai là bắt buộc' });
    if (!['thu','chi'].includes(loai)) return res.status(400).json({ message: "loai phải là 'thu' hoặc 'chi'" });

    const [result] = await db.query('INSERT INTO danhmuc (tenDanhMuc, loai) VALUES (?, ?)', [tenDanhMuc, loai]);

    res.status(201).json({ message: 'Tạo danh mục thành công', maDanhMuc: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/danhmuc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenDanhMuc, loai } = req.body;

    const [result] = await db.query(
      'UPDATE danhmuc SET tenDanhMuc = ?, loai = ? WHERE maDanhMuc = ?',
      [tenDanhMuc, loai, id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/danhmuc/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM danhmuc WHERE maDanhMuc = ?', [id]);

    if (!result.affectedRows) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== API GIAO DỊCH ==================
app.get('/giaodich', async (req, res) => {
  try {
    const { maNguoiDung } = req.query;
    if (!maNguoiDung) return res.status(400).json({ message: 'Thiếu mã người dùng' });

    const sql = `
      SELECT gd.maGiaoDich, dm.tenDanhMuc, gd.soTien, dm.loai, gd.ngayGiaoDich, gd.ngayTao, gd.ghiChu
      FROM giaodich gd
      JOIN danhmuc dm ON gd.maDanhMuc = dm.maDanhMuc
      WHERE gd.maNguoiDung = ?
      ORDER BY gd.ngayTao DESC
    `;
    const [results] = await db.query(sql, [maNguoiDung]);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/giaodich/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM giaodich WHERE maGiaoDich = ?', [id]);

    if (!results.length) return res.status(404).json({ message: 'Không tồn tại' });

    res.json(results[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/giaodich', async (req, res) => {
  try {
    const { tenDangNhap, tenDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;

    if (!tenDangNhap || !tenDanhMuc || !soTien || !ngayGiaoDich)
      return res.status(400).json({ message: 'Thiếu dữ liệu' });

    const [[user]] = await db.query('SELECT maNguoiDung FROM users WHERE tenDangNhap = ?', [tenDangNhap]);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const [[dm]] = await db.query('SELECT maDanhMuc FROM danhmuc WHERE tenDanhMuc = ?', [tenDanhMuc]);
    if (!dm) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    const [result] = await db.query(
      'INSERT INTO giaodich (maNguoiDung, maDanhMuc, soTien, ghiChu, ngayGiaoDich) VALUES (?, ?, ?, ?, ?)',
      [user.maNguoiDung, dm.maDanhMuc, soTien, ghiChu || null, ngayGiaoDich]
    );

    res.status(201).json({ message: 'Tạo giao dịch thành công', maGiaoDich: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/giaodich/:id', async (req, res) => {
  try {
    const { tenDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;

    const { id } = req.params;

    const [[dm]] = await db.query('SELECT maDanhMuc FROM danhmuc WHERE tenDanhMuc = ?', [tenDanhMuc]);
    if (!dm) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    await db.query(
      'UPDATE giaodich SET maDanhMuc=?, soTien=?, ghiChu=?, ngayGiaoDich=? WHERE maGiaoDich=?',
      [dm.maDanhMuc, soTien, ghiChu, ngayGiaoDich, id]
    );

    res.json({ message: 'Cập nhật thành công' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/giaodich/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID không hợp lệ' });

    const [result] = await db.query('DELETE FROM giaodich WHERE maGiaoDich = ?', [id]);

    if (!result.affectedRows) return res.status(404).json({ message: 'Không tồn tại' });

    res.json({ message: 'Xóa thành công' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================== API USERS ==================
app.get('/users', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM users');
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM users WHERE maNguoiDung = ?', [id]);

    if (!results.length) return res.status(404).json({ message: 'Không tồn tại' });

    res.json(results[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { tenDangNhap, matKhau, email } = req.body;

    if (!tenDangNhap || !matKhau)
      return res.status(400).json({ message: 'Thiếu dữ liệu' });

    const hashed = await bcryptjs.hash(matKhau, 10);

    const [result] = await db.query(
      'INSERT INTO users (tenDangNhap, matKhau, email, role) VALUES (?, ?, ?, ?)',
      [tenDangNhap, hashed, email || null, 1]
    );

    res.status(201).json({ message: 'Tạo thành công', maNguoiDung: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE tenDangNhap = ?', [tenDangNhap]);

    if (!rows.length) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

    const user = rows[0];

    const match = await bcryptjs.compare(matKhau, user.matKhau);
    if (!match) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        maNguoiDung: user.maNguoiDung,
        tenDangNhap: user.tenDangNhap,
        email: user.email,
        role: user.role
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenDangNhap, matKhau, email, role } = req.body;

    if (!tenDangNhap || !matKhau || role === undefined)
      return res.status(400).json({ message: 'Thiếu dữ liệu' });

    const hashed = await bcryptjs.hash(matKhau, 10);

    const [result] = await db.query(
      'UPDATE users SET tenDangNhap=?, matKhau=?, email=?, role=? WHERE maNguoiDung=?',
      [tenDangNhap, hashed, email || null, role, id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: 'Không tồn tại' });

    res.json({ message: 'Cập nhật thành công' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================== START SERVER ==================
app.listen(port, () => {
  console.log(`Server đang chạy tại port ${port}`);
});
