const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 5000;

// Middleware parse JSON
app.use(express.json());

// Kết nối database MySQL
const db = mysql.createConnection({
  host: '127.0.0.1',      // thay bằng host của bạn
  user: 'root',           // thay bằng user của bạn
  password: '1234', // thay bằng mật khẩu
  database: 'thuchi'  // thay bằng tên database
});

db.connect(err => {
  if (err) {
    console.error('Kết nối DB lỗi:', err);
    return;
  }
  console.log('Đã kết nối tới MySQL');
});
// Lấy tất cả giao dịch
app.get('/giaodich', (req, res) => {
  const sql = 'SELECT * FROM giaoDich';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Lấy giao dịch theo maGiaoDich
app.get('/giaodich/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM giaoDich WHERE maGiaoDich = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    res.json(results[0]);
  });
});

// Tạo giao dịch mới
app.post('/giaodich', (req, res) => {
  const { maNguoiDung, maDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;

  if (!maNguoiDung || !maDanhMuc || !soTien || !ngayGiaoDich) {
    return res.status(400).json({ message: 'maNguoiDung, maDanhMuc, soTien và ngayGiaoDich là bắt buộc' });
  }

  const sql = 'INSERT INTO giaoDich (maNguoiDung, maDanhMuc, soTien, ghiChu, ngayGiaoDich) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [maNguoiDung, maDanhMuc, soTien, ghiChu || null, ngayGiaoDich], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Giao dịch được tạo', maGiaoDich: result.insertId });
  });
});

// Cập nhật giao dịch theo maGiaoDich
app.put('/giaodich/:id', (req, res) => {
  const { id } = req.params;
  const { maNguoiDung, maDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;

  if (!maNguoiDung || !maDanhMuc || !soTien || !ngayGiaoDich) {
    return res.status(400).json({ message: 'maNguoiDung, maDanhMuc, soTien và ngayGiaoDich là bắt buộc' });
  }

  const sql = 'UPDATE giaoDich SET maNguoiDung = ?, maDanhMuc = ?, soTien = ?, ghiChu = ?, ngayGiaoDich = ? WHERE maGiaoDich = ?';
  db.query(sql, [maNguoiDung, maDanhMuc, soTien, ghiChu || null, ngayGiaoDich, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    res.json({ message: 'Giao dịch được cập nhật' });
  });
});

// Xóa giao dịch theo maGiaoDich
app.delete('/giaodich/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM giaoDich WHERE maGiaoDich = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    res.json({ message: 'Giao dịch đã bị xóa' });
  });
});
app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});