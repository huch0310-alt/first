import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Package,
    ClipboardList,
    Receipt,
    Leaf,
    Bell,
    User,
    LogOut
} from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();

    // 获取当前登录用户
    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: '首页' },
        { path: '/accounts', icon: Users, label: '账户管理' },
        { path: '/products', icon: Package, label: '商品管理' },
        { path: '/orders', icon: ClipboardList, label: '订单管理' },
        { path: '/billing', icon: Receipt, label: '账单管理' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Leaf size={24} />
                    </div>
                    <span>FreshTrade</span>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="page-title">管理后台</div>
                    <div className="header-actions">
                        <button className="p-2 hover:bg-slate-100 rounded-lg">
                            <Bell size={20} className="text-slate-500" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                                <User size={18} className="text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">{currentUser.name || '经理'}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                            <LogOut size={16} />
                            退出登录
                        </button>
                    </div>
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
