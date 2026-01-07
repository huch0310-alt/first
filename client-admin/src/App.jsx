import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Package, CheckSquare, ClipboardList, BarChart3, LogOut, User } from 'lucide-react';
import './index.css';

import LoginPage from './pages/Login';
import PurchasePage from './pages/Purchaser';
import SellerPage from './pages/Seller';
import OrdersPage from './pages/Orders';
import OrderDetailPage from './pages/OrderDetail';
import StatsPage from './pages/Stats';

// 获取当前用户
const getUser = () => {
  return JSON.parse(localStorage.getItem('adminUser') || '{}');
};

// 权限路由保护组件
const RoleRoute = ({ children, allowedRoles }) => {
  const user = getUser();
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// 首页组件 - 根据角色动态显示不同页面
const HomePage = () => {
  const user = getUser();
  // 销售员看审核页，其他人看采购录入页
  if (user.role === 'seller') {
    return <SellerPage />;
  }
  return <PurchasePage />;
};

// 主布局组件（包含顶部栏和底部导航）
const AppLayout = ({ children }) => {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  // 登录页不显示布局
  if (location.pathname === '/login') {
    return children;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const roleLabels = {
    purchaser: '采购员',
    seller: '销售员',
    admin: '经理'
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部用户信息栏 */}
      <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <User size={18} />
          <span className="font-medium">{user.name}</span>
          <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
            {roleLabels[user.role] || '员工'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100"
        >
          <LogOut size={16} />
          退出
        </button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* 底部导航 */}
      <BottomNav role={user.role} />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <AppLayout>
              <Routes>
                {/* 首页根据角色动态显示 */}
                <Route path="/" element={<HomePage />} />
                {/* 采购录入 - 仅采购员和管理员 */}
                <Route path="/purchaser" element={
                  <RoleRoute allowedRoles={['purchaser', 'admin']}>
                    <PurchasePage />
                  </RoleRoute>
                } />
                {/* 审核上架 - 仅销售员和管理员 */}
                <Route path="/seller" element={
                  <RoleRoute allowedRoles={['seller', 'admin']}>
                    <SellerPage />
                  </RoleRoute>
                } />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/order/:id" element={<OrderDetailPage />} />
                <Route path="/stats" element={<StatsPage />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// 底部导航组件 - 根据角色显示不同选项
const BottomNav = ({ role }) => {
  return (
    <nav className="bottom-nav">
      {/* 采购员和管理员可见：采购录入 */}
      {(role === 'purchaser' || role === 'admin') && (
        <NavLink to={role === 'purchaser' ? '/' : '/purchaser'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={22} />
          <span>采购</span>
        </NavLink>
      )}
      {/* 销售员和管理员可见：审核上架 */}
      {(role === 'seller' || role === 'admin') && (
        <NavLink to={role === 'seller' ? '/' : '/seller'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={22} />
          <span>审核</span>
        </NavLink>
      )}
      {/* 所有人可见：采购单 */}
      <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ClipboardList size={22} />
        <span>采购单</span>
      </NavLink>
      {/* 所有人可见：统计 */}
      <NavLink to="/stats" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BarChart3 size={22} />
        <span>统计</span>
      </NavLink>
    </nav>
  );
};

export default App;
