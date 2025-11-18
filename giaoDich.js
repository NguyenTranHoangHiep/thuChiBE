const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], credentials: true }));
app.use(express.json());

const db = mysql.createPool({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12808282',
  password: 'ssJaXSuIdK',
  database: 'sql12808282',
  waitForConnections: true,
  connectionLimit: 10
});

console.log('✅ Pool MySQL giao dịch sẵn sàng');

// ---------------- API giao dịch ----------------

// Lấy tất cả giao dịch theo người dùng
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy giao dịch theo maGiaoDich
app.get('/giaodich/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM giaodich WHERE maGiaoDich = ?', [id]);
    if (results.length === 0) return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo giao dịch mới
app.post('/giaodich', async (req, res) => {
  try {
    const { tenDangNhap, tenDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;
    if (!tenDangNhap || !tenDanhMuc || !soTien || !ngayGiaoDich) {
      return res.status(400).json({ message: 'tenDangNhap, tenDanhMuc, soTien và ngayGiaoDich là bắt buộc' });
    }

    const [[user]] = await db.query('SELECT maNguoiDung FROM users WHERE tenDangNhap = ?', [tenDangNhap]);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const [[dm]] = await db.query('SELECT maDanhMuc FROM danhmuc WHERE tenDanhMuc = ?', [tenDanhMuc]);
    if (!dm) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    const [result] = await db.query(
      'INSERT INTO giaodich (maNguoiDung, maDanhMuc, soTien, ghiChu, ngayGiaoDich) VALUES (?, ?, ?, ?, ?)',
      [user.maNguoiDung, dm.maDanhMuc, soTien, ghiChu || null, ngayGiaoDich]
    );

    res.status(201).json({ message: 'Giao dịch được tạo', maGiaoDich: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật giao dịch
app.put('/giaodich/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;

    const [[dm]] = await db.query('SELECT maDanhMuc FROM danhmuc WHERE tenDanhMuc = ? LIMIT 1', [tenDanhMuc]);
    if (!dm) return res.status(400).json({ message: 'Không tìm thấy danh mục' });

    const [result] = await db.query(
      'UPDATE giaodich SET maDanhMuc = ?, soTien = ?, ghiChu = ?, ngayGiaoDich = ? WHERE maGiaoDich = ?',
      [dm.maDanhMuc, soTien, ghiChu, ngayGiaoDich, id]
    );

    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa giao dịch
app.delete('/giaodich/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID không hợp lệ' });

    const [result] = await db.query('DELETE FROM giaodich WHERE maGiaoDich = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Giao dịch không tồn tại' });

    res.json({ message: 'Giao dịch đã bị xóa' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// TODO: các route thống kê khác và admin cũng tương tự => chỉ cần đổi callback thành async/await

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
