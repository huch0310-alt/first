import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, LogOut, User } from 'lucide-react';
import api from '../api';

const Home = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 获取当前登录用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    useEffect(() => {
        // 未登录时跳转到登录页
        if (!currentUser.id) {
            navigate('/login');
            return;
        }
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products?status=active');
            setProducts(res.data.slice(0, 4)); // 只显示4个
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('cart');
        navigate('/login');
    };

    return (
        <div>
            {/* 顶部用户信息栏 */}
            <div className="page-header" style={{ justifyContent: 'space-between' }}>
                <div className="flex items-center gap-2">
                    <User size={18} />
                    <span>{currentUser.name || '未登录'}</span>
                    {currentUser.discount_percentage > 0 && (
                        <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full">
                            VIP {currentUser.discount_percentage}%
                        </span>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm opacity-80"
                >
                    <LogOut size={16} />
                    退出
                </button>
            </div>

            {/* 搜索栏 */}
            <div className="p-4">
                <div className="flex items-center gap-3 bg-slate-100 px-4 py-3 rounded-full">
                    <Search size={20} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="搜索商品..."
                        className="bg-transparent border-none outline-none flex-1 text-sm"
                    />
                </div>
            </div>

            {/* 分类快捷入口 */}
            <div className="grid grid-cols-4 gap-4 p-4">
                {['蔬菜', '水果', '海鲜', '肉类'].map(cat => (
                    <Link key={cat} to="/products" className="text-center">
                        <div className="w-14 h-14 bg-blue-50 rounded-xl mx-auto mb-2 flex items-center justify-center text-2xl">
                            {cat === '蔬菜' ? '🥬' : cat === '水果' ? '🍎' : cat === '海鲜' ? '🦐' : '🥩'}
                        </div>
                        <span className="text-xs text-slate-600">{cat}</span>
                    </Link>
                ))}
            </div>

            {/* 热销商品 */}
            <div className="px-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold text-lg">热销商品</h2>
                    <Link to="/products" className="text-sm text-blue-600 flex items-center">
                        查看全部 <ChevronRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-slate-400">加载中...</div>
                ) : (
                    <div className="product-grid">
                        {products.map(product => (
                            <Link key={product.id} to={`/product/${product.id}`} className="product-card">
                                <div className="aspect-square bg-slate-100">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🥬</div>
                                    )}
                                </div>
                                <div className="product-card-info">
                                    <div className="product-card-name">{product.name}</div>
                                    <div className="product-card-price">¥{product.retail_price}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
