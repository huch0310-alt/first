const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 数据库存储路径配置
// 生产环境：使用 /var/data/ 目录，避免代码更新导致数据丢失
// 开发环境：使用项目目录
const isProduction = process.env.NODE_ENV === 'production';
const dbDir = isProduction ? '/var/data' : __dirname;
const dbPath = path.join(dbDir, 'market.sqlite');

// 确保数据库目录存在
if (isProduction && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`创建数据库目录: ${dbDir}`);
}

// Initialize SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

console.log(`数据库路径: ${dbPath}`);

// Define Models

// 1. User (用户)
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true }, // 账号名（英文/数字）
  name: { type: DataTypes.STRING, allowNull: false }, // 显示名称
  password: { type: DataTypes.STRING, defaultValue: '' }, // 登录密码（bcrypt加密）
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'purchaser', 'seller', 'customer'),
    allowNull: false
  },
  phone: { type: DataTypes.STRING }, // 电话
  address: { type: DataTypes.STRING }, // 地址 (客户用)
  discount_percentage: { type: DataTypes.INTEGER, defaultValue: 0 } // 折扣率 (客户用)
});

// 2. Product (商品)
const Product = sequelize.define('Product', {
  name: { type: DataTypes.STRING, allowNull: false },
  purchase_price: { type: DataTypes.FLOAT, allowNull: false }, // 采购价
  purchase_quantity: { type: DataTypes.INTEGER, defaultValue: 1 }, // 采购数量
  stock: { type: DataTypes.INTEGER, defaultValue: 0 }, // 实时库存
  description: { type: DataTypes.TEXT }, // 商品说明
  retail_price: { type: DataTypes.FLOAT, defaultValue: 0 }, // 零售价 (由销售设定)
  status: {
    type: DataTypes.ENUM('pending', 'active', 'off_shelf'),
    defaultValue: 'pending'
  },
  image_url: { type: DataTypes.STRING },
  creator_id: { type: DataTypes.INTEGER } // 采购员 ID
});

// 3. Order (订单)
const Order = sequelize.define('Order', {
  order_no: { type: DataTypes.STRING, unique: true }, // 订单编号 (日期时间+客户ID+随机数)
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed'),
    defaultValue: 'pending'
  },
  total_amount: { type: DataTypes.FLOAT, defaultValue: 0 }, // 折后总价
  applied_discount: { type: DataTypes.INTEGER, defaultValue: 0 } // 下单时的折扣快照
});

// 4. OrderItem (订单项)
const OrderItem = sequelize.define('OrderItem', {
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  price_snapshot: { type: DataTypes.FLOAT, allowNull: false } // 下单时的单价
});

// Relationships (关联关系)
User.hasMany(Product, { foreignKey: 'creator_id' });
Product.belongsTo(User, { foreignKey: 'creator_id' });

User.hasMany(Order, { foreignKey: 'customer_id' });
Order.belongsTo(User, { foreignKey: 'customer_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// 密码加密辅助函数
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Initialization & Seeding (初始化与数据填充)
async function initDB() {
  try {
    await sequelize.sync({ alter: true }); // 生产模式

    // Check if users exist, if not, create super admin only
    const count = await User.count();
    if (count === 0) {
      console.log('正在初始化超级管理员账号...');
      const hashedPassword = await hashPassword('123456');
      await User.create({
        username: 'superadmin',
        name: '超级管理员',
        role: 'super_admin',
        password: hashedPassword,
        phone: '13800000000'
      });
      console.log('超级管理员账号创建完成。账号: superadmin, 密码: 123456');
    }
    console.log('数据库连接成功。');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  initDB,
  hashPassword,
  comparePassword
};

