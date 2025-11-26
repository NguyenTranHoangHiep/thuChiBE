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
  host: 'yamanote.proxy.rlwy.net',   // host Railway
  user: 'root',                       // user Railway
  password: 'CLEVyJEUlkSuEPmnXPLwwYPOHFdUSnqt', // password Railway
  database: 'thuchi',                // database Railway
  port: 46333,                        // port Railway
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


// ================== API NGÂN SÁCH ==================
// Lấy danh sách tất cả ngân sách
app.get('/ngansach/thongke', async (req, res) => {
  try {
    const sql = `
      SELECT 
        dm.tenDanhMuc,
        ns.gioiHanTien,
        IFNULL(SUM(gd.soTien), 0) AS soTienDaThucHien,
        DATE_FORMAT(MIN(gd.ngayGiaoDich), '%Y-%m-%d') AS ngayTao,
        ns.thang,
        ns.nam
      FROM ngansach ns
      JOIN danhmuc dm ON ns.maDanhMuc = dm.maDanhMuc
      LEFT JOIN giaodich gd 
        ON gd.maDanhMuc = ns.maDanhMuc 
        AND MONTH(gd.ngayGiaoDich) = ns.thang 
        AND YEAR(gd.ngayGiaoDich) = ns.nam
      GROUP BY ns.maDanhMuc, ns.thang, ns.nam;
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy thống kê ngân sách theo người dùng
app.get('/ngansach/thongke/:id', async (req, res) => {
  const maNguoiDung = req.params.id;
  if (!maNguoiDung) return res.status(400).json({ error: 'Thiếu mã người dùng (maNguoiDung)' });

  try {
    const sql = `
      SELECT 
        ns.maNganSach,
        dm.tenDanhMuc,
        dm.loai,
        ns.gioiHanTien,
        IFNULL(SUM(gd.soTien), 0) AS soTienDaThucHien,
        ns.ngayTao,
        ns.thang,
        ns.nam
      FROM ngansach ns
      JOIN danhmuc dm ON ns.maDanhMuc = dm.maDanhMuc
      LEFT JOIN giaodich gd 
        ON gd.maDanhMuc = ns.maDanhMuc
        AND YEAR(gd.ngayGiaoDich) = ns.nam
        AND gd.maNguoiDung = ns.maNguoiDung
        AND (ns.thang IS NULL OR MONTH(gd.ngayGiaoDich) = ns.thang)
      WHERE ns.maNguoiDung = ?
      GROUP BY ns.maNganSach, dm.tenDanhMuc, dm.loai, ns.gioiHanTien, ns.ngayTao, ns.thang, ns.nam;
    `;
    const [results] = await db.query(sql, [maNguoiDung]);
    res.json(results);
  } catch (err) {
    console.error('Lỗi truy vấn thống kê ngân sách:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy chi tiết ngân sách theo maNganSach
app.get('/ngansach/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM ngansach WHERE maNganSach = ?', [id]);
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy ngân sách' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm ngân sách
app.post('/ngansach', async (req, res) => {
  const { maNguoiDung, maDanhMuc, gioiHanTien, thang, nam } = req.body;
  if (!maNguoiDung || !maDanhMuc || !gioiHanTien || !nam) {
    return res.status(400).json({ message: 'maNguoiDung, maDanhMuc, gioiHanTien và nam là bắt buộc' });
  }

  try {
    let sqlCheck, params;
    if (thang) {
      sqlCheck = `SELECT * FROM ngansach WHERE maNguoiDung = ? AND maDanhMuc = ? AND thang = ? AND nam = ?`;
      params = [maNguoiDung, maDanhMuc, thang, nam];
    } else {
      sqlCheck = `SELECT * FROM ngansach WHERE maNguoiDung = ? AND maDanhMuc = ? AND thang IS NULL AND nam = ?`;
      params = [maNguoiDung, maDanhMuc, nam];
    }

    const [nsResults] = await db.query(sqlCheck, params);
    if (nsResults.length > 0) return res.status(409).json({ message: 'Ngân sách đã tồn tại cho danh mục và thời gian này' });

    const sqlInsert = `INSERT INTO ngansach (maNguoiDung, maDanhMuc, gioiHanTien, thang, nam) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.query(sqlInsert, [maNguoiDung, maDanhMuc, gioiHanTien, thang || null, nam]);
    res.status(201).json({ message: 'Ngân sách được tạo thành công', maNganSach: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Cập nhật ngân sách theo maNganSach
app.put('/ngansach/:maNganSach', async (req, res) => {
  const { maNganSach } = req.params;
  let { gioiHanTien, thang, nam, tenDanhMuc } = req.body;

  try {
    // Validate dữ liệu bắt buộc
    if (!gioiHanTien || !nam || !tenDanhMuc) {
      return res.status(400).json({ message: 'gioiHanTien, nam và tenDanhMuc là bắt buộc' });
    }

    // Trim khoảng trắng và ép kiểu
    tenDanhMuc = tenDanhMuc.trim();
    gioiHanTien = Number(gioiHanTien);
    nam = Number(nam);
    thang = thang != null ? Number(thang) : null;

    if (isNaN(gioiHanTien) || isNaN(nam) || (thang !== null && isNaN(thang))) {
      return res.status(400).json({ message: 'gioiHanTien, nam, thang phải là số hợp lệ' });
    }

    // Lấy maDanhMuc từ tên danh mục
    const [dmResults] = await db.query('SELECT maDanhMuc FROM danhmuc WHERE tenDanhMuc = ?', [tenDanhMuc]);
    if (dmResults.length === 0) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }
    const maDanhMuc = dmResults[0].maDanhMuc;

    // Cập nhật ngân sách
    const sqlUpdate = `
      UPDATE ngansach 
      SET gioiHanTien = ?, thang = ?, nam = ?, maDanhMuc = ?
      WHERE maNganSach = ?
    `;
    const [result] = await db.query(sqlUpdate, [gioiHanTien, thang, nam, maDanhMuc, maNganSach]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy ngân sách để cập nhật' });
    }

    res.status(200).json({ message: 'Cập nhật ngân sách thành công' });
  } catch (err) {
    console.error('Lỗi cập nhật ngân sách:', err);
    res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
});


// Xóa ngân sách
app.delete('/ngansach/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM ngansach WHERE maNganSach = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Ngân sách không tồn tại' });
    res.json({ message: 'Ngân sách đã bị xóa' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== START SERVER ==================
app.listen(port, () => {
  console.log(`Server đang chạy tại port ${port}`);
});
