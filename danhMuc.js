const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], credentials: true }));
app.use(express.json());

// Pool MySQL
const db = mysql.createPool({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12808282',
  password: 'ssJaXSuIdK',
  database: 'sql12808282',
  waitForConnections: true,
  connectionLimit: 10
});

console.log('✅ Pool MySQL danh mục sẵn sàng');

// ---------------- API danh mục ----------------

// Lấy danh sách tất cả danh mục
app.get('/danhmuc', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM danhmuc');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh mục theo maDanhMuc
app.get('/danhmuc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM danhmuc WHERE maDanhMuc = ?', [id]);
    if (results.length === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo danh mục mới
app.post('/danhmuc', async (req, res) => {
  try {
    const { tenDanhMuc, loai } = req.body;
    if (!tenDanhMuc || !loai) return res.status(400).json({ message: 'tenDanhMuc và loai là bắt buộc' });
    if (loai !== 'thu' && loai !== 'chi') return res.status(400).json({ message: "loai phải là 'thu' hoặc 'chi'" });

    const [result] = await db.query('INSERT INTO danhmuc (tenDanhMuc, loai) VALUES (?, ?)', [tenDanhMuc, loai]);
    res.status(201).json({ message: 'Danh mục được tạo', maDanhMuc: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật danh mục theo maDanhMuc
app.put('/danhmuc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenDanhMuc, loai } = req.body;

    if (loai && loai !== 'thu' && loai !== 'chi') return res.status(400).json({ message: "loai phải là 'thu' hoặc 'chi'" });

    const [result] = await db.query('UPDATE danhmuc SET tenDanhMuc = ?, loai = ? WHERE maDanhMuc = ?', [tenDanhMuc, loai, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    res.json({ message: 'Danh mục được cập nhật' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa danh mục theo maDanhMuc
app.delete('/danhmuc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM danhmuc WHERE maDanhMuc = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    res.json({ message: 'Danh mục đã bị xóa' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
