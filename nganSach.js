const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 7000;
const cors = require('cors');

// Middleware parse JSON
app.use(cors({
  origin: '*',  // Cho phép frontend Angular gọi API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức cho phép
  credentials: true, // Nếu bạn cần gửi cookie
}));
app.use(express.json());

// Kết nối database MySQL
const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',  // host FreeSQL
  user: 'sql12808282',                // username FreeSQL
  password: 'ssJaXSuIdK',  // password FreeSQL
  database: 'sql12808282'             // database name trên FreeSQL
});

db.connect(err => {
  if (err) {
    console.error('Kết nối DB lỗi:', err);
    return;
  }
  console.log('Đã kết nối tới MySQL');
});

// Lấy danh sách tất cả ngân sách
app.get('/ngansach/thongke', (req, res) => {
  const sql = `
    SELECT 
      dm.tenDanhMuc,
      ns.gioiHanTien,
      IFNULL(SUM(gd.soTien), 0) AS soTienDaThucHien,
      DATE_FORMAT(MIN(gd.ngayGiaoDich), '%Y-%m-%d') AS ngayTao,
      ns.thang,
      ns.nam
    FROM nganSach ns
    JOIN danhMuc dm ON ns.maDanhMuc = dm.maDanhMuc
    LEFT JOIN giaoDich gd 
      ON gd.maDanhMuc = ns.maDanhMuc 
      AND MONTH(gd.ngayGiaoDich) = ns.thang 
      AND YEAR(gd.ngayGiaoDich) = ns.nam
    GROUP BY ns.maDanhMuc, ns.thang, ns.nam;
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// Lấy thống kê ngân sách theo người dùng với :id trong URL
app.get('/ngansach/thongke/:id', (req, res) => {
  const maNguoiDung = req.params.id;

  if (!maNguoiDung) {
    return res.status(400).json({ error: 'Thiếu mã người dùng (maNguoiDung)' });
  }

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
FROM nganSach ns
JOIN danhMuc dm ON ns.maDanhMuc = dm.maDanhMuc
LEFT JOIN giaoDich gd 
  ON gd.maDanhMuc = ns.maDanhMuc
  AND YEAR(gd.ngayGiaoDich) = ns.nam
  AND gd.maNguoiDung = ns.maNguoiDung
  AND (ns.thang IS NULL OR MONTH(gd.ngayGiaoDich) = ns.thang)
WHERE ns.maNguoiDung = ?
GROUP BY ns.maNganSach, dm.tenDanhMuc, dm.loai, ns.gioiHanTien, ns.ngayTao, ns.thang, ns.nam;

      `;

  db.query(sql, [maNguoiDung], (err, results) => {
    if (err) {
      console.error('Lỗi truy vấn thống kê ngân sách:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


// Lấy chi tiết ngân sách theo maNganSach
app.get('/ngansach/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM nganSach WHERE maNganSach = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy ngân sách' });
    res.json(results[0]);
  });
});

app.post('/ngansach', (req, res) => {
  const { maNguoiDung, maDanhMuc, gioiHanTien, thang, nam } = req.body;

  if (!maNguoiDung || !maDanhMuc || !gioiHanTien || !nam) {
    return res.status(400).json({ message: 'maNguoiDung, maDanhMuc, gioiHanTien và nam là bắt buộc' });
  }

  let sqlCheck;
  let params;

  if (thang) {
    sqlCheck = `
      SELECT * FROM nganSach
      WHERE maNguoiDung = ? AND maDanhMuc = ? AND thang = ? AND nam = ?
    `;
    params = [maNguoiDung, maDanhMuc, thang, nam];
  } else {
    sqlCheck = `
      SELECT * FROM nganSach
      WHERE maNguoiDung = ? AND maDanhMuc = ? AND thang IS NULL AND nam = ?
    `;
    params = [maNguoiDung, maDanhMuc, nam];
  }

  db.query(sqlCheck, params, (err3, nsResults) => {
    if (err3) return res.status(500).json({ error: err3.message });

    if (nsResults.length > 0) {
      return res.status(409).json({ message: 'Ngân sách đã tồn tại cho danh mục và thời gian này' });
    }

    const sqlInsert = `
      INSERT INTO nganSach (maNguoiDung, maDanhMuc, gioiHanTien, thang, nam)
      VALUES (?, ?, ?, ?, ?)
    `;

    const thangValue = thang || null;

    db.query(sqlInsert, [maNguoiDung, maDanhMuc, gioiHanTien, thangValue, nam], (err4, result) => {
      if (err4) return res.status(500).json({ error: err4.message });
      res.status(201).json({ message: 'Ngân sách được tạo thành công', maNganSach: result.insertId });
    });
  });
});

// Cập nhật ngân sách theo maNganSach (bắt buộc maNguoiDung, maDanhMuc, gioiHanTien, thang, nam)
app.put('/ngansach/:maNganSach', (req, res) => {
  const { maNganSach } = req.params;
  const { gioiHanTien, thang, nam, tenDanhMuc } = req.body;

  if (!gioiHanTien || !nam || !tenDanhMuc) {
    return res.status(400).json({ message: 'gioiHanTien, nam và tenDanhMuc là bắt buộc' });
  }

  // Bước 1: Lấy maDanhMuc từ tenDanhMuc
  const sqlGetDanhMuc = 'SELECT maDanhMuc FROM danhMuc WHERE tenDanhMuc = ?';
  db.query(sqlGetDanhMuc, [tenDanhMuc], (err, dmResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (dmResults.length === 0) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    const maDanhMuc = dmResults[0].maDanhMuc;

    // Bước 2: Cập nhật ngân sách
    const sqlUpdate = `
      UPDATE nganSach 
      SET gioiHanTien = ?, thang = ?, nam = ?, maDanhMuc = ?
      WHERE maNganSach = ?
    `;
    db.query(sqlUpdate, [gioiHanTien, thang || null, nam, maDanhMuc, maNganSach], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy ngân sách để cập nhật' });
      }
      res.status(200).json({ message: 'Cập nhật ngân sách thành công' });
    });
  });
});

// Xóa ngân sách theo maNganSach
app.delete('/ngansach/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM nganSach WHERE maNganSach = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Ngân sách không tồn tại' });
    res.json({ message: 'Ngân sách đã bị xóa' });
  });
});

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
