const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 4000;
const cors = require('cors');

app.use(cors({
  origin: '*',  // Chỉ cho phép frontend Angular gọi API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức cho phép
  credentials: true, // Nếu bạn cần gửi cookie
}));
// Middleware parse JSON
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

// Lấy danh sách tất cả danh mục
app.get('/danhmuc', (req, res) => {
  const sql = 'SELECT * FROM danhMuc';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Lấy danh mục theo maDanhMuc
app.get('/danhmuc/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM danhMuc WHERE maDanhMuc = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });
    res.json(results[0]);
  });
});

// Tạo danh mục mới
app.post('/danhmuc', (req, res) => {
  const { tenDanhMuc, loai } = req.body;

  if (!tenDanhMuc || !loai) {
    return res.status(400).json({ message: 'tenDanhMuc và loai là bắt buộc' });
  }

  if (loai !== 'thu' && loai !== 'chi') {
    return res.status(400).json({ message: "loai phải là 'thu' hoặc 'chi'" });
  }

  const sql = 'INSERT INTO danhMuc (tenDanhMuc, loai) VALUES (?, ?)';
  db.query(sql, [tenDanhMuc, loai], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Danh mục được tạo', maDanhMuc: result.insertId });
  });
});


// Cập nhật danh mục theo maDanhMuc
app.put('/danhmuc/:id', (req, res) => {
  const { id } = req.params;
  const { tenDanhMuc, loai } = req.body;

  if (loai && loai !== 'thu' && loai !== 'chi') {
    return res.status(400).json({ message: "loai phải là 'thu' hoặc 'chi'" });
  }

  const sql = 'UPDATE danhMuc SET tenDanhMuc = ?, loai = ? WHERE maDanhMuc = ?';
  db.query(sql, [tenDanhMuc, loai, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });
    res.json({ message: 'Danh mục được cập nhật' });
  });
});

// Xóa danh mục theo maDanhMuc
app.delete('/danhmuc/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM danhMuc WHERE maDanhMuc = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });
    res.json({ message: 'Danh mục đã bị xóa' });
  });
});
app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});