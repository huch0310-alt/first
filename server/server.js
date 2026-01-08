const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { initDB, User, hashPassword, comparePassword } = require('./database');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = 3000;

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer使用内存存储（便于sharp处理）
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 限制10MB
    fileFilter: (req, file, cb) => {
        // 只允许图片
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('只支持图片格式 (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));

// Initialize DB
initDB();

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

// Basic Routes
app.get('/', (req, res) => {
    res.send('B2B 生鲜系统后端已启动 (B2B Market Server is Running)');
});

// API: 图片上传（带压缩）
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        // 生成唯一文件名（使用webp格式）
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `product-${uniqueSuffix}.webp`;
        const outputPath = path.join(uploadsDir, filename);

        // 使用sharp压缩图片
        await sharp(req.file.buffer)
            .resize(800, 800, {
                fit: 'inside',           // 保持比例，不超过800x800
                withoutEnlargement: true // 小图不放大
            })
            .webp({ quality: 80 })       // 转换为WebP，质量80%
            .toFile(outputPath);

        // 返回图片访问URL
        const imageUrl = `/uploads/${filename}`;
        res.json({
            success: true,
            url: imageUrl,
            filename: filename
        });
    } catch (err) {
        console.error('图片处理错误:', err);
        res.status(500).json({ error: '图片处理失败: ' + err.message });
    }
});

// API: 获取所有用户
app.get('/api/users', async (req, res) => {
    try {
        const { operator_role } = req.query;
        let users = await User.findAll({
            attributes: { exclude: ['password'] } // 不返回密码
        });
        // 如果是普通经理，不显示超级管理员和其他经理
        if (operator_role === 'admin') {
            users = users.filter(u => u.role !== 'super_admin' && u.role !== 'admin');
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: 用户登录 (使用 bcrypt 验证)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const where = { username };
        if (role) where.role = role;
        const user = await User.findOne({ where });
        if (!user) {
            return res.status(401).json({ error: '账号或密码错误' });
        }
        // 使用 bcrypt 验证密码
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: '账号或密码错误' });
        }
        // 返回用户信息（不含密码）
        const userData = user.toJSON();
        delete userData.password;
        res.json(userData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: 创建用户 (带权限检查)
app.post('/api/users', async (req, res) => {
    try {
        const { username, name, role, phone, address, discount_percentage, password, operator_role } = req.body;

        // 权限检查：只有超级管理员可以创建经理
        if (role === 'admin' && operator_role !== 'super_admin') {
            return res.status(403).json({ error: '只有超级管理员可以创建经理账号' });
        }
        // 禁止创建超级管理员
        if (role === 'super_admin') {
            return res.status(403).json({ error: '不能创建超级管理员账号' });
        }
        // 验证 username 格式
        if (username && !/^[a-zA-Z][a-zA-Z0-9]*$/.test(username)) {
            return res.status(400).json({ error: '账号名只能是英文或英文数字组合，且必须以字母开头' });
        }
        // 密码加密
        const hashedPassword = await hashPassword(password || '123456');
        const user = await User.create({
            username,
            name,
            role,
            phone,
            address,
            password: hashedPassword,
            discount_percentage: discount_percentage || 0
        });
        // 返回用户（不含密码）
        const userData = user.toJSON();
        delete userData.password;
        res.json(userData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: 更新用户 (带权限检查)
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, phone, address, discount_percentage, operator_role } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: '用户不存在' });

        // 权限检查：普通经理不能修改超级管理员和其他经理
        if (operator_role === 'admin' && (user.role === 'super_admin' || user.role === 'admin')) {
            return res.status(403).json({ error: '经理不能修改经理或超级管理员账号' });
        }
        // 禁止将角色改为超级管理员
        if (role === 'super_admin') {
            return res.status(403).json({ error: '不能设置超级管理员角色' });
        }
        // 只有超级管理员可以改角色为admin
        if (role === 'admin' && operator_role !== 'super_admin') {
            return res.status(403).json({ error: '只有超级管理员可以设置经理角色' });
        }

        if (name !== undefined) user.name = name;
        if (role !== undefined) user.role = role;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (discount_percentage !== undefined) user.discount_percentage = discount_percentage;
        await user.save();

        const userData = user.toJSON();
        delete userData.password;
        res.json(userData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: 修改密码
app.put('/api/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password, operator_id, operator_role } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: '密码长度至少6位' });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: '用户不存在' });

        // 权限检查
        const isSelf = parseInt(id) === parseInt(operator_id);

        // 超级管理员可以修改任何人密码
        if (operator_role === 'super_admin') {
            // 允许
        }
        // 经理可以修改自己和非经理/非超级管理员的密码
        else if (operator_role === 'admin') {
            if (!isSelf && (user.role === 'super_admin' || user.role === 'admin')) {
                return res.status(403).json({ error: '经理不能修改其他经理或超级管理员的密码' });
            }
        }
        // 其他用户只能修改自己
        else {
            if (!isSelf) {
                return res.status(403).json({ error: '只能修改自己的密码' });
            }
        }

        user.password = await hashPassword(new_password);
        await user.save();
        res.json({ message: '密码修改成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: 删除用户 (带权限检查)
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { operator_role } = req.query;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: '用户不存在' });

        // 禁止删除超级管理员
        if (user.role === 'super_admin') {
            return res.status(403).json({ error: '不能删除超级管理员账号' });
        }
        // 普通经理不能删除其他经理
        if (operator_role === 'admin' && user.role === 'admin') {
            return res.status(403).json({ error: '经理不能删除其他经理账号' });
        }

        await user.destroy();
        res.json({ message: '删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

