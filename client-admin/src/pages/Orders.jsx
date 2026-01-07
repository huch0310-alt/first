import React, { useState, useEffect } from 'react';
import { Package, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';

const Orders = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // 获取当前登录用户
    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            // 如果是采购员，只显示自己录入的商品
            if (currentUser.role === 'purchaser') {
                setProducts(res.data.filter(p => p.creator_id === currentUser.id));
            } else {
                setProducts(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    // 撤销未审核的商品（仅采购员可以对自己录入的商品操作）
    const handleCancel = async (productId) => {
        if (!confirm('确定撤销这个采购单？')) return;
        try {
            await api.delete(`/products/${productId}`);
            fetchProducts();
        } catch (err) {
            alert('撤销失败: ' + err.message);
        }
    };

    const statusConfig = {
        pending: { label: '待审核', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        active: { label: '已上架', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        off_shelf: { label: '已下架', icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50' }
    };

    const getTotalValue = () => {
        return products.reduce((sum, p) => sum + (p.purchase_price * (p.purchase_quantity || 1)), 0);
    };

    return (
        <div>
            <div className="admin-header">
                <Package size={22} />
                采购单
                <span className="ml-auto text-sm font-normal">
                    总计: ¥{getTotalValue().toFixed(2)}
                </span>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-3 p-3">
                <div className="stat-card">
                    <div className="stat-value text-amber-500">{products.filter(p => p.status === 'pending').length}</div>
                    <div className="stat-label">待审核</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value text-emerald-500">{products.filter(p => p.status === 'active').length}</div>
                    <div className="stat-label">已上架</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value text-slate-500">{products.filter(p => p.status === 'off_shelf').length}</div>
                    <div className="stat-label">已下架</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-white border-b border-slate-100">
                {[
                    { key: 'all', label: '全部' },
                    { key: 'pending', label: '待审核' },
                    { key: 'active', label: '已上架' },
                    { key: 'off_shelf', label: '已下架' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${filter === tab.key
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-500 border-transparent'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p>暂无采购记录</p>
                </div>
            ) : (
                <div className="space-y-0">
                    {filteredProducts.map(product => {
                        const status = statusConfig[product.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                            <div key={product.id} className="bg-white m-3 rounded-xl p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">{product.name}</h3>
                                        <p className="text-sm text-slate-500">
                                            采购时间: {new Date(product.createdAt).toLocaleDateString('zh-CN')}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${status.bg} ${status.color}`}>
                                        <StatusIcon size={14} />
                                        {status.label}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                                        <div className="text-slate-500">采购单价</div>
                                        <div className="font-bold text-lg">¥{product.purchase_price}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                                        <div className="text-slate-500">采购数量</div>
                                        <div className="font-bold text-lg">{product.purchase_quantity || 1}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                                        <div className="text-slate-500">库存</div>
                                        <div className={`font-bold text-lg ${(product.stock || 0) <= 5 ? 'text-red-500' : ''}`}>
                                            {product.stock || 0}
                                        </div>
                                    </div>
                                </div>

                                {product.status === 'active' && (
                                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg flex justify-between items-center">
                                        <span className="text-sm text-emerald-700">零售价</span>
                                        <span className="font-bold text-emerald-600">¥{product.retail_price}</span>
                                    </div>
                                )}

                                {product.description && (
                                    <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                        {product.description}
                                    </div>
                                )}

                                {/* 采购员可以撤销自己录入的未审核商品 */}
                                {product.status === 'pending' && currentUser.role === 'purchaser' && product.creator_id === currentUser.id && (
                                    <button
                                        onClick={() => handleCancel(product.id)}
                                        className="mt-3 w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
                                    >
                                        撤销采购单
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Orders;
