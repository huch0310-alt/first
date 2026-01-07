import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import api from '../api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"id":5}');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            // 只显示当前用户的订单
            const myOrders = res.data.filter(o => o.customer_id === currentUser.id);
            setOrders(myOrders);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        return o.status === filter;
    });

    return (
        <div>
            <div className="page-header">我的订单</div>

            {/* Filter Tabs */}
            <div className="flex bg-white border-b border-slate-100">
                {[
                    { key: 'all', label: '全部' },
                    { key: 'pending', label: '待确认' },
                    { key: 'confirmed', label: '已完成' }
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
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-400">暂无订单</p>
                </div>
            ) : (
                <div className="p-3 space-y-3">
                    {filteredOrders.map(order => (
                        <Link key={order.id} to={`/order/${order.id}`} className="order-card block">
                            <div className="order-header">
                                <span className="text-sm text-slate-500 font-mono">{order.order_no || `#${order.id}`}</span>
                                <span className={`status-badge ${order.status === 'pending' ? 'status-pending' : 'status-confirmed'}`}>
                                    {order.status === 'pending' ? '待确认' : '已完成'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">
                                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-500">¥{order.total_amount.toFixed(2)}</span>
                                    <ChevronRight size={18} className="text-slate-400" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
