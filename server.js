const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// 数据库连接配置 (请把 password 改成你自己的 MySQL 密码)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Lyy2694997753', // <--- 注意：这里要改成你本机 MySQL 的密码
    database: 'book_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
db.getConnection((err, connection) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('数据库连接成功！');
        connection.release();
    }
});

// 1. 获取图书列表（支持分页 + 模糊查询 + 按入库时间降序）
app.get('/api/books', (req, res) => {
    const { name = '', page = 1, pageSize = 5 } = req.query;
    const offset = (page - 1) * pageSize;
    const sql = 'SELECT b.*, t.typeName FROM book_info b LEFT JOIN book_type t ON b.bookType = t.id WHERE b.bookName LIKE ? ORDER BY b.creationTime DESC LIMIT ? OFFSET ?';
    
    db.query(sql, [`%${name}%`, parseInt(pageSize), offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query('SELECT COUNT(*) as total FROM book_info WHERE bookName LIKE ?', [`%${name}%`], (err, countRes) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: results, total: countRes[0].total });
        });
    });
});

// 2. 获取图书类型
app.get('/api/types', (req, res) => {
    db.query('SELECT * FROM book_type', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. 新增图书
app.post('/api/books', (req, res) => {
    const { bookCode, bookName, bookType, bookAuthor, publishPress, publishDate, borrowed, createdBy } = req.body;
    const sql = 'INSERT INTO book_info (bookCode, bookName, bookType, bookAuthor, publishPress, publishDate, borrowed, createdBy, creationTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())';
    db.query(sql, [bookCode, bookName, bookType, bookAuthor, publishPress, publishDate, borrowed, createdBy], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '新增失败' });
        res.json({ success: true, message: '新增成功' });
    });
});

// 4. 修改图书
app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { bookName, bookType, bookAuthor, publishPress, publishDate, borrowed } = req.body;
    const sql = 'UPDATE book_info SET bookName=?, bookType=?, bookAuthor=?, publishPress=?, publishDate=?, borrowed=?, lastUpdateTime=NOW() WHERE bookId=?';
    db.query(sql, [bookName, bookType, bookAuthor, publishPress, publishDate, borrowed, id], (err) => {
        if (err) return res.status(500).json({ success: false, message: '修改失败' });
        res.json({ success: true, message: '修改成功' });
    });
});

// 5. 删除图书
app.delete('/api/books/:id', (req, res) => {
    db.query('DELETE FROM book_info WHERE bookId = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: '删除失败' });
        res.json({ success: true, message: '删除成功' });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});