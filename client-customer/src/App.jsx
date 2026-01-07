import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, ClipboardList } from 'lucide-react';
import './index.css';

import HomePage from './pages/Home';
import ProductsPage from './pages/Products';
import CartPage from './pages/Cart';
import OrdersPage from './pages/Orders';
import OrderDetailPage from './pages/OrderDetail';
import ProductDetailPage from './pages/ProductDetail';
import LoginPage from './pages/Login';

// 底部导航组件
const BottomNav = () => {
  const location = useLocation();

  // 登录页不显示导航
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home />
        <span>首页</span>
      </NavLink>
      <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingBag />
        <span>商品</span>
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingCart />
        <span>购物车</span>
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ClipboardList />
        <span>订单</span>
      </NavLink>
    </nav>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order/:id" element={<OrderDetailPage />} />
        </Routes>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
