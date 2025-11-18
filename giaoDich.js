const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

app.use(cors({
  origin: '*',  // Chỉ cho phép frontend Angular gọi API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức cho phép
  credentials: true, // Nếu bạn cần gửi cookie
}));
// Middleware parse JSON
app.use(express.json());

// Kết nối database MySQL
const db = mysql.createPool({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12808282',
  password: 'ssJaXSuIdK',
  database: 'sql12808282'
});

db.connect(err => {
  if (err) {
    console.error('Kết nối DB lỗi:', err);
    return;
  }
  console.log('Đã kết nối tới MySQL');
});
// Lấy tất cả giao dịch
// Lấy giao dịch theo người dùng
app.get('/giaodich', (req, res) => {
  const { maNguoiDung } = req.query;

  if (!maNguoiDung) {
    return res.status(400).json({ message: 'Thiếu mã người dùng' });
  }

  const sql = `
    SELECT 
      gd.maGiaoDich,
      dm.tenDanhMuc,
      gd.soTien,
      dm.loai,
      gd.ngayGiaoDich,
      gd.ngayTao,
      gd.ghiChu
    FROM giaoDich gd
    JOIN danhMuc dm ON gd.maDanhMuc = dm.maDanhMuc
    WHERE gd.maNguoiDung = ?
    ORDER BY gd.ngayTao DESC
  `;

  db.query(sql, [maNguoiDung], (err, results) => {
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
  const { tenDangNhap, tenDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;

  if (!tenDangNhap || !tenDanhMuc || !soTien || !ngayGiaoDich) {
    return res.status(400).json({ message: 'tenDangNhap, tenDanhMuc, soTien và ngayGiaoDich là bắt buộc' });
  }

  // Bước 1: Lấy maNguoiDung từ tenDangNhap
  const sqlUser = 'SELECT maNguoiDung FROM users WHERE tenDangNhap = ?';
  db.query(sqlUser, [tenDangNhap], (err, userResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (userResults.length === 0) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const maNguoiDung = userResults[0].maNguoiDung;

    // Bước 2: Lấy maDanhMuc từ tenDanhMuc
    const sqlDanhMuc = 'SELECT maDanhMuc FROM danhMuc WHERE tenDanhMuc = ?';
    db.query(sqlDanhMuc, [tenDanhMuc], (err2, dmResults) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (dmResults.length === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });

      const maDanhMuc = dmResults[0].maDanhMuc;

      // Bước 3: Insert giao dịch
      const sqlInsert = 'INSERT INTO giaoDich (maNguoiDung, maDanhMuc, soTien, ghiChu, ngayGiaoDich) VALUES (?, ?, ?, ?, ?)';
      db.query(sqlInsert, [maNguoiDung, maDanhMuc, soTien, ghiChu || null, ngayGiaoDich], (err3, result) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.status(201).json({ message: 'Giao dịch được tạo', maGiaoDich: result.insertId });
      });
    });
  });
});


// Cập nhật giao dịch theo maGiaoDich
app.put('/giaodich/:id', (req, res) => {
  const { id } = req.params;
  const { tenDanhMuc, soTien, ghiChu, ngayGiaoDich } = req.body;

  // Lấy mã danh mục theo tên
  const getDanhMucSql = `SELECT maDanhMuc FROM danhMuc WHERE tenDanhMuc = ? LIMIT 1`;
  db.query(getDanhMucSql, [tenDanhMuc], (err, danhMucResult) => {
    if (err) return res.status(500).json({ error: err.message });
    if (danhMucResult.length === 0) return res.status(400).json({ message: 'Không tìm thấy danh mục' });

    const maDanhMuc = danhMucResult[0].maDanhMuc;

    const updateSql = `
      UPDATE giaoDich SET maDanhMuc = ?, soTien = ?, ghiChu = ?, ngayGiaoDich = ?
      WHERE maGiaoDich = ?
    `;
    db.query(updateSql, [maDanhMuc, soTien, ghiChu, ngayGiaoDich, id], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Cập nhật thành công' });
    });
  });
});


// Xóa giao dịch theo maGiaoDich
app.delete('/giaodich/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID không hợp lệ' });

  const sql = 'DELETE FROM giaoDich WHERE maGiaoDich = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    res.json({ message: 'Giao dịch đã bị xóa' });
  });
});
//thống kê users
app.get('/giaodich/thongke/:maNguoiDung', (req, res) => {
  const { maNguoiDung } = req.params; // Lấy từ URL path

  if (!maNguoiDung) {
    return res.status(400).json({ message: 'Thiếu mã người dùng' });
  }

  const sql = `
    SELECT 
      dm.loai,
      SUM(gd.soTien) AS tongSoTien
    FROM giaoDich gd
    JOIN danhMuc dm ON gd.maDanhMuc = dm.maDanhMuc
    WHERE gd.maNguoiDung = ?
    GROUP BY dm.loai
  `;

  db.query(sql, [maNguoiDung], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    }

    let tongThu = 0;
    let tongChi = 0;

    results.forEach(row => {
      if (row.loai === 'thu') tongThu = row.tongSoTien;
      else if (row.loai === 'chi') tongChi = row.tongSoTien;
    });

    const tienTietKiem = tongThu - tongChi;

    res.json({ tongThu, tongChi, tienTietKiem });
  });
});
  // Thống kê % thu theo từng danh mục của 1 người dùng
app.get('/giaodich/thu-theo-danh-muc/:maNguoiDung', (req, res) => {
  const { maNguoiDung } = req.params;

  const sql = `
    SELECT 
      dm.tenDanhMuc,
      SUM(gd.soTien) AS tongTien
    FROM giaoDich gd
    JOIN danhMuc dm ON gd.maDanhMuc = dm.maDanhMuc
    WHERE gd.maNguoiDung = ? AND dm.loai = 'thu'
    GROUP BY gd.maDanhMuc
  `;

  db.query(sql, [maNguoiDung], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const tongThu = results.reduce((sum, r) => sum + Number(r.tongTien), 0);

    const phanTramTheoDanhMuc = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      tongTien: Number(r.tongTien),
      phanTram: tongThu > 0 ? ((r.tongTien / tongThu) * 100).toFixed(2) : 0
    }));

    res.json({ tongThu, phanTramTheoDanhMuc });
  });
});
app.get('/giaodich/chi-theo-danh-muc/:maNguoiDung', (req, res) => {
  const { maNguoiDung } = req.params;

  const sql = `
    SELECT 
      dm.tenDanhMuc,
      SUM(gd.soTien) AS tongTien
    FROM giaoDich gd
    JOIN danhMuc dm ON gd.maDanhMuc = dm.maDanhMuc
    WHERE gd.maNguoiDung = ? AND dm.loai = 'chi'
    GROUP BY gd.maDanhMuc
  `;

  db.query(sql, [maNguoiDung], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const tongChi = results.reduce((sum, r) => sum + Number(r.tongTien), 0);

    const phanTramTheoDanhMuc = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      tongTien: Number(r.tongTien),
      phanTram: tongChi > 0 ? ((r.tongTien / tongChi) * 100).toFixed(2) : 0
    }));

    res.json({ tongChi, phanTramTheoDanhMuc });
  });
});

app.get('/giaodich/thongke-thang/:maNguoiDung', (req, res) => {
  const { maNguoiDung } = req.params;
  const { year } = req.query;

  // Nếu không có year, dùng năm hiện tại mặc định
  const selectedYear = year || new Date().getFullYear();

  const sql = `
    SELECT 
      MONTH(g.ngayGiaoDich) AS thang,
      SUM(CASE WHEN d.loai = 'thu' THEN g.soTien ELSE 0 END) AS tongThu,
      SUM(CASE WHEN d.loai = 'chi' THEN g.soTien ELSE 0 END) AS tongChi
    FROM giaoDich g
    JOIN danhMuc d ON g.maDanhMuc = d.maDanhMuc
    WHERE g.maNguoiDung = ? AND YEAR(g.ngayGiaoDich) = ?
    GROUP BY MONTH(g.ngayGiaoDich)
    ORDER BY MONTH(g.ngayGiaoDich)
  `;

  db.query(sql, [maNguoiDung, selectedYear], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const formatted = results.map(row => ({
      thang: `Tháng ${row.thang}`,
      thu: row.tongThu,
      chi: row.tongChi,
      tong: row.tongThu + row.tongChi,
      tietKiem: row.tongThu - row.tongChi  // Tính tiền tiết kiệm từng tháng
    }));

    res.json(formatted);
  });
});
//                            ADMIN
// Thống kê toàn bộ hệ thống
app.get('/admin/thongkeAdmin', (req, res) => {
  const sql = `
    SELECT 
      u.maNguoiDung,
      u.tenDangNhap,
      COALESCE(SUM(CASE WHEN dm.loai = 'thu' THEN gd.soTien ELSE 0 END), 0) AS tongThu,
      COALESCE(SUM(CASE WHEN dm.loai = 'chi' THEN gd.soTien ELSE 0 END), 0) AS tongChi
    FROM users u
    LEFT JOIN giaoDich gd ON u.maNguoiDung = gd.maNguoiDung
    LEFT JOIN danhMuc dm ON gd.maDanhMuc = dm.maDanhMuc
    GROUP BY u.maNguoiDung, u.tenDangNhap
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ error: err.message });
    }

    const thongKe = results.map(row => ({
      tongThu: parseFloat(row.tongThu),
      tongChi: parseFloat(row.tongChi)
    }));

    const tongThuAll = thongKe.reduce((sum, user) => sum + user.tongThu, 0);
    const tongChiAll = thongKe.reduce((sum, user) => sum + user.tongChi, 0);
    const tienTietKiemAll = tongThuAll - tongChiAll;

    res.json({
      tongThuAll,
      tongChiAll,
      tienTietKiemAll
    });
  });
});
// Thống kê % thu theo từng danh mục của toàn bộ hệ thống
app.get('/admin/thu-theo-danh-muc', (req, res) => {
  const sql = `
    SELECT 
      dm.tenDanhMuc,
      SUM(gd.soTien) AS tongTien
    FROM giaoDich gd
    JOIN danhMuc dm ON gd.maDanhMuc = dm.maDanhMuc
    WHERE dm.loai = 'thu'
    GROUP BY gd.maDanhMuc
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const tongThu = results.reduce((sum, r) => sum + Number(r.tongTien), 0);

    const data = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      phanTram: tongThu > 0 ? ((r.tongTien / tongThu) * 100).toFixed(2) : "0.00"
    }));

    res.json(data); // ✅ Trả về mảng như yêu cầu
  });
});
// Thống kê % chi theo từng danh mục của toàn bộ hệ thống
app.get('/admin/chi-theo-danh-muc', (req, res) => {
  const sql = `
    SELECT 
      dm.tenDanhMuc,
      SUM(gd.soTien) AS tongTien
    FROM giaoDich gd
    JOIN danhMuc dm ON gd.maDanhMuc = dm.maDanhMuc
    WHERE dm.loai = 'chi'
    GROUP BY gd.maDanhMuc
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const tongChi = results.reduce((sum, r) => sum + Number(r.tongTien), 0);

    const data = results.map(r => ({
      tenDanhMuc: r.tenDanhMuc,
      phanTram: tongChi > 0 ? ((r.tongTien / tongChi) * 100).toFixed(2) : "0.00"
    }));

    res.json(data);
  });
});
app.get('/admin/thongke-thang-he-thong', (req, res) => {
  const { year } = req.query;

  // Nếu không có year, lấy năm hiện tại
  const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();

  const sql = `
    SELECT 
      MONTH(g.ngayGiaoDich) AS thang,
      SUM(CASE WHEN d.loai = 'thu' THEN g.soTien ELSE 0 END) AS tongThu,
      SUM(CASE WHEN d.loai = 'chi' THEN g.soTien ELSE 0 END) AS tongChi
    FROM giaoDich g
    JOIN danhMuc d ON g.maDanhMuc = d.maDanhMuc
    WHERE YEAR(g.ngayGiaoDich) = ?
    GROUP BY MONTH(g.ngayGiaoDich)
    ORDER BY MONTH(g.ngayGiaoDich)
  `;

  db.query(sql, [selectedYear], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: err.message });
    }

    // Nếu không có dữ liệu, trả về mảng rỗng
    if (!results.length) return res.json([]);

    const formatted = results.map(row => ({
      thang: `Tháng ${row.thang}`,
      thu: Number(row.tongThu) || 0,
      chi: Number(row.tongChi) || 0,
      // Tổng ở đây tính là thu - chi, nếu muốn tổng cộng thu + chi thì thay bằng: (row.tongThu + row.tongChi)
      tong: (Number(row.tongThu) || 0) + (Number(row.tongChi) || 0),
      tietKiem: (Number(row.tongThu) || 0) - (Number(row.tongChi) || 0)
    }));

    res.json(formatted);
  });
});


app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
