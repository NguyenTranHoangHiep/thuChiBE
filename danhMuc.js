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
// Thống kê người dùng, admin... tương tự, đổi db.query(callback) => async/await
// Ví dụ thống kê thu chi người dùng
app.get('/giaodich/thongke/:maNguoiDung', async (req, res) => {
  try {
    const { maNguoiDung } = req.params;
    const sql = `
      SELECT dm.loai, SUM(gd.soTien) AS tongSoTien
      FROM giaodich gd
      JOIN danhmuc dm ON gd.maDanhMuc = dm.maDanhMuc
      WHERE gd.maNguoiDung = ?
      GROUP BY dm.loai
    `;
    const [results] = await db.query(sql, [maNguoiDung]);

    let tongThu = 0, tongChi = 0;
    results.forEach(r => { if(r.loai==='thu') tongThu=r.tongSoTien; else if(r.loai==='chi') tongChi=r.tongSoTien; });
    res.json({ tongThu, tongChi, tienTietKiem: tongThu - tongChi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 // Thống kê % thu theo từng danh mục của 1 người dùng
app.get('/giaodich/thu-theo-danh-muc/:maNguoiDung', async (req, res) => {
  try {
    const { maNguoiDung } = req.params;

    const sql = `
      SELECT 
        dm.tenDanhMuc,
        SUM(gd.soTien) AS tongTien
      FROM giaodich gd
      JOIN danhmuc dm ON gd.maDanhMuc = dm.maDanhMuc
      WHERE gd.maNguoiDung = ? AND dm.loai = 'thu'
      GROUP BY gd.maDanhMuc
    `;

    const [results] = await db.query(sql, [maNguoiDung]);

    const tongThu = results.reduce((sum, r) => sum + Number(r.tongTien), 0);

    const phanTramTheoDanhMuc = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      tongTien: Number(r.tongTien),
      phanTram: tongThu > 0 ? ((r.tongTien / tongThu) * 100).toFixed(2) : "0.00"
    }));

    res.json({ tongThu, phanTramTheoDanhMuc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thống kê % chi theo từng danh mục của 1 người dùng
app.get('/giaodich/chi-theo-danh-muc/:maNguoiDung', async (req, res) => {
  try {
    const { maNguoiDung } = req.params;

    const sql = `
      SELECT 
        dm.tenDanhMuc,
        SUM(gd.soTien) AS tongTien
      FROM giaodich gd
      JOIN danhmuc dm ON gd.maDanhMuc = dm.maDanhMuc
      WHERE gd.maNguoiDung = ? AND dm.loai = 'chi'
      GROUP BY gd.maDanhMuc
    `;

    const [results] = await db.query(sql, [maNguoiDung]);

    const tongChi = results.reduce((sum, r) => sum + Number(r.tongTien), 0);

    const phanTramTheoDanhMuc = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      tongTien: Number(r.tongTien),
      phanTram: tongChi > 0 ? ((r.tongTien / tongChi) * 100).toFixed(2) : "0.00"
    }));

    res.json({ tongChi, phanTramTheoDanhMuc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thống kê theo tháng của 1 người dùng
app.get('/giaodich/thongke-thang/:maNguoiDung', async (req, res) => {
  try {
    const { maNguoiDung } = req.params;
    const { year } = req.query;
    const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const sql = `
      SELECT 
        MONTH(g.ngayGiaoDich) AS thang,
        SUM(CASE WHEN d.loai = 'thu' THEN g.soTien ELSE 0 END) AS tongThu,
        SUM(CASE WHEN d.loai = 'chi' THEN g.soTien ELSE 0 END) AS tongChi
      FROM giaodich g
      JOIN danhmuc d ON g.maDanhMuc = d.maDanhMuc
      WHERE g.maNguoiDung = ? AND YEAR(g.ngayGiaoDich) = ?
      GROUP BY MONTH(g.ngayGiaoDich)
      ORDER BY MONTH(g.ngayGiaoDich)
    `;

    const [results] = await db.query(sql, [maNguoiDung, selectedYear]);

    const formatted = results.map(row => ({
      thang: `Tháng ${row.thang}`,
      thu: Number(row.tongThu) || 0,
      chi: Number(row.tongChi) || 0,
      tong: (Number(row.tongThu) || 0) + (Number(row.tongChi) || 0),
      tietKiem: (Number(row.tongThu) || 0) - (Number(row.tongChi) || 0)
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: thống kê toàn bộ hệ thống
app.get('/admin/thongkeAdmin', async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.maNguoiDung,
        u.tenDangNhap,
        COALESCE(SUM(CASE WHEN dm.loai = 'thu' THEN gd.soTien ELSE 0 END), 0) AS tongThu,
        COALESCE(SUM(CASE WHEN dm.loai = 'chi' THEN gd.soTien ELSE 0 END), 0) AS tongChi
      FROM users u
      LEFT JOIN giaodich gd ON u.maNguoiDung = gd.maNguoiDung
      LEFT JOIN danhmuc dm ON gd.maDanhMuc = dm.maDanhMuc
      GROUP BY u.maNguoiDung, u.tenDangNhap
    `;

    const [results] = await db.query(sql);

    const tongThuAll = results.reduce((sum, row) => sum + Number(row.tongThu), 0);
    const tongChiAll = results.reduce((sum, row) => sum + Number(row.tongChi), 0);
    const tienTietKiemAll = tongThuAll - tongChiAll;

    res.json({ tongThuAll, tongChiAll, tienTietKiemAll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: % thu theo danh mục
app.get('/admin/thu-theo-danh-muc', async (req, res) => {
  try {
    const sql = `
      SELECT 
        dm.tenDanhMuc,
        SUM(gd.soTien) AS tongTien
      FROM giaodich gd
      JOIN danhmuc dm ON gd.maDanhMuc = dm.maDanhMuc
      WHERE dm.loai = 'thu'
      GROUP BY gd.maDanhMuc
    `;
    const [results] = await db.query(sql);

    const tongThu = results.reduce((sum, r) => sum + Number(r.tongTien), 0);
    const data = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      phanTram: tongThu > 0 ? ((r.tongTien / tongThu) * 100).toFixed(2) : "0.00"
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: % chi theo danh mục
app.get('/admin/chi-theo-danh-muc', async (req, res) => {
  try {
    const sql = `
      SELECT 
        dm.tenDanhMuc,
        SUM(gd.soTien) AS tongTien
      FROM giaodich gd
      JOIN danhmuc dm ON gd.maDanhMuc = dm.maDanhMuc
      WHERE dm.loai = 'chi'
      GROUP BY gd.maDanhMuc
    `;
    const [results] = await db.query(sql);

    const tongChi = results.reduce((sum, r) => sum + Number(r.tongTien), 0);
    const data = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      phanTram: tongChi > 0 ? ((r.tongTien / tongChi) * 100).toFixed(2) : "0.00"
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: thống kê theo tháng của toàn hệ thống
app.get('/admin/thongke-thang-he-thong', async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const sql = `
      SELECT 
        MONTH(g.ngayGiaoDich) AS thang,
        SUM(CASE WHEN d.loai = 'thu' THEN g.soTien ELSE 0 END) AS tongThu,
        SUM(CASE WHEN d.loai = 'chi' THEN g.soTien ELSE 0 END) AS tongChi
      FROM giaodich g
      JOIN danhmuc d ON g.maDanhMuc = d.maDanhMuc
      WHERE YEAR(g.ngayGiaoDich) = ?
      GROUP BY MONTH(g.ngayGiaoDich)
      ORDER BY MONTH(g.ngayGiaoDich)
    `;
    const [results] = await db.query(sql, [selectedYear]);

    const formatted = results.map(row => ({
      thang: `Tháng ${row.thang}`,
      thu: Number(row.tongThu) || 0,
      chi: Number(row.tongChi) || 0,
      tong: (Number(row.tongThu) || 0) + (Number(row.tongChi) || 0),
      tietKiem: (Number(row.tongThu) || 0) - (Number(row.tongChi) || 0)
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
