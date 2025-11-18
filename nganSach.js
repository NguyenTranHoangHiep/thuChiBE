const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 7000;

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

console.log('✅ Pool MySQL đã sẵn sàng');

// ----------------- API -----------------

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
        AND (ns.thang IS NULL OR MONTH(gd.ngayGiaoDich) = ns.thang)
        AND YEAR(gd.ngayGiaoDich) = ns.nam
      GROUP BY ns.maDanhMuc, ns.thang, ns.nam;
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thống kê ngân sách theo người dùng
app.get('/ngansach/thongke/:id', async (req, res) => {
  try {
    const maNguoiDung = req.params.id;
    if (!maNguoiDung) return res.status(400).json({ error: 'Thiếu mã người dùng (maNguoiDung)' });

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
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM ngansach WHERE maNganSach = ?', [id]);
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy ngân sách' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo ngân sách mới
app.post('/ngansach', async (req, res) => {
  try {
    const { maNguoiDung, maDanhMuc, gioiHanTien, thang, nam } = req.body;
    if (!maNguoiDung || !maDanhMuc || !gioiHanTien || !nam) {
      return res.status(400).json({ message: 'maNguoiDung, maDanhMuc, gioiHanTien và nam là bắt buộc' });
    }

    const sqlCheck = thang
      ? 'SELECT * FROM ngansach WHERE maNguoiDung = ? AND maDanhMuc = ? AND thang = ? AND nam = ?'
      : 'SELECT * FROM ngansach WHERE maNguoiDung = ? AND maDanhMuc = ? AND thang IS NULL AND nam = ?';

    const params = thang ? [maNguoiDung, maDanhMuc, thang, nam] : [maNguoiDung, maDanhMuc, nam];
    const [existing] = await db.query(sqlCheck, params);
    if (existing.length > 0) return res.status(409).json({ message: 'Ngân sách đã tồn tại cho danh mục và thời gian này' });

    const [result] = await db.query(
      'INSERT INTO ngansach (maNguoiDung, maDanhMuc, gioiHanTien, thang, nam) VALUES (?, ?, ?, ?, ?)',
      [maNguoiDung, maDanhMuc, gioiHanTien, thang || null, nam]
    );

    res.status(201).json({ message: 'Ngân sách được tạo thành công', maNganSach: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật ngân sách
app.put('/ngansach/:maNganSach', async (req, res) => {
  try {
    const { maNganSach } = req.params;
    const { gioiHanTien, thang, nam, tenDanhMuc } = req.body;
    if (!gioiHanTien || !nam || !tenDanhMuc) {
      return res.status(400).json({ message: 'gioiHanTien, nam và tenDanhMuc là bắt buộc' });
    }

    const [[dm]] = await db.query('SELECT maDanhMuc FROM danhmuc WHERE tenDanhMuc = ?', [tenDanhMuc]);
    if (!dm) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    const [result] = await db.query(
      'UPDATE ngansach SET gioiHanTien = ?, thang = ?, nam = ?, maDanhMuc = ? WHERE maNganSach = ?',
      [gioiHanTien, thang || null, nam, dm.maDanhMuc, maNganSach]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy ngân sách để cập nhật' });

    res.status(200).json({ message: 'Cập nhật ngân sách thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa ngân sách
app.delete('/ngansach/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM ngansach WHERE maNganSach = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Ngân sách không tồn tại' });
    res.json({ message: 'Ngân sách đã bị xóa' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
