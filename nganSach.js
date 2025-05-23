const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 6000;

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
// Lấy danh sách tất cả ngân sách
app.get('/ngansach', (req, res) => {
  const sql = 'SELECT * FROM nganSach';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
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

// Tạo ngân sách mới
app.post('/ngansach', (req, res) => {
  const { maNguoiDung, maDanhMuc, gioiHanTien } = req.body;

  if (!maNguoiDung || !maDanhMuc || !gioiHanTien) {
    return res.status(400).json({ message: 'maNguoiDung, maDanhMuc, gioiHanTien là bắt buộc' });
  }

  const sql = 'INSERT INTO nganSach (maNguoiDung, maDanhMuc, gioiHanTien) VALUES (?, ?, ?)';
  db.query(sql, [maNguoiDung, maDanhMuc, gioiHanTien], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Ngân sách đã được tạo', maNganSach: result.insertId });
  });
});

// Cập nhật ngân sách theo maNganSach
app.put('/ngansach/:id', (req, res) => {
  const { id } = req.params;
  const { maNguoiDung, maDanhMuc, gioiHanTien } = req.body;

  if (!maNguoiDung || !maDanhMuc || !gioiHanTien) {
    return res.status(400).json({ message: 'maNguoiDung, maDanhMuc, gioiHanTien là bắt buộc' });
  }

  const sql = 'UPDATE nganSach SET maNguoiDung = ?, maDanhMuc = ?, gioiHanTien = ? WHERE maNganSach = ?';
  db.query(sql, [maNguoiDung, maDanhMuc, gioiHanTien, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Ngân sách không tồn tại' });
    res.json({ message: 'Ngân sách đã được cập nhật' });
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