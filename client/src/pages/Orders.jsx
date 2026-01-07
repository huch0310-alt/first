import React, { useState, useEffect } from 'react';
import { Search, Check, Eye, Printer, Phone, MapPin } from 'lucide-react';
import api from '../api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [filters, setFilters] = useState({ customer: '', startDate: '', endDate: '' });
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, usersRes] = await Promise.all([
                api.get('/orders'),
                api.get('/users')
            ]);
            setOrders(ordersRes.data);
            setUsers(usersRes.data.filter(u => u.role === 'customer'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        // Tab filter
        if (activeTab === 'pending' && o.status !== 'pending') return false;
        if (activeTab === 'confirmed' && o.status !== 'confirmed') return false;
        // Customer filter
        if (filters.customer && o.customer_id !== parseInt(filters.customer)) return false;
        // Date filter
        if (filters.startDate && new Date(o.createdAt) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(o.createdAt) > new Date(filters.endDate + 'T23:59:59')) return false;
        return true;
    });

    const handleConfirm = async (id) => {
        try {
            await api.put(`/orders/${id}/confirm`);
            fetchData();
        } catch (err) {
            alert('确认失败');
        }
    };

    const tabs = [
        { key: 'all', label: '全部' },
        { key: 'pending', label: '待处理' },
        { key: 'confirmed', label: '已完成' }
    ];

    return (
        <div>
            <div className="card no-print">
                <div className="card-header">
                    <div className="tabs" style={{ margin: 0, border: 0 }}>
                        {tabs.map(tab => (
                            <div
                                key={tab.key}
                                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="filter-bar p-4 border-b border-slate-100">
                    <div className="filter-group">
                        <label className="filter-label">选择客户</label>
                        <select
                            className="form-select"
                            style={{ width: '180px' }}
                            value={filters.customer}
                            onChange={e => setFilters({ ...filters, customer: e.target.value })}
                        >
                            <option value="">全部客户</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">开始日期</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">结束日期</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => { }}>筛选</button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">加载中...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>订单号</th>
                                <th>客户</th>
                                <th>金额</th>
                                <th>折扣</th>
                                <th>状态</th>
                                <th>时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="font-mono text-sm">{order.order_no || `#${order.id}`}</td>
                                    <td className="font-medium">{order.User?.name || '未知客户'}</td>
                                    <td className="font-bold text-red-500">¥{order.total_amount?.toFixed(2)}</td>
                                    <td>{order.applied_discount}%</td>
                                    <td>
                                        <span className={`badge ${order.status === 'pending' ? 'badge-pending' : 'badge-success'}`}>
                                            {order.status === 'pending' ? '待处理' : '已完成'}
                                        </span>
                                    </td>
                                    <td className="text-sm text-slate-500">
                                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                查看
                                            </button>
                                            {order.status === 'pending' && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleConfirm(order.id)}
                                                >
                                                    确认
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                打印
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onPrint={() => window.print()}
                />
            )}
        </div>
    );
};

const OrderDetailModal = ({ order, onClose, onPrint }) => {
    const subtotal = order.OrderItems?.reduce((sum, item) => sum + (item.price_snapshot * item.quantity), 0) || 0;
    const discountAmount = subtotal * (order.applied_discount / 100);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] overflow-auto">
                {/* 顶部栏 */}
                <div className="px-6 py-4 border-b flex justify-between items-center no-print">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {order.status === 'confirmed' ? '已完成' : '待处理'}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onPrint} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded">打印</button>
                        <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded">关闭</button>
                    </div>
                </div>

                {/* 打印内容 */}
                <div className="p-6" id="print-order">
                    {/* 标题 */}
                    <h1 className="text-xl font-bold text-center mb-4">销售订单</h1>

                    {/* 订单信息行 */}
                    <div className="flex justify-between text-sm mb-4 pb-3 border-b">
                        <div><span className="text-gray-500">订单编号：</span><span className="font-mono">{order.order_no || `#${order.id}`}</span></div>
                        <div><span className="text-gray-500">日期：</span>{new Date(order.createdAt).toLocaleString('zh-CN')}</div>
                    </div>

                    {/* 客户信息 */}
                    <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-gray-500">客户：</span>{order.User?.name || '-'}</div>
                            <div><span className="text-gray-500">电话：</span>{order.User?.phone || '-'}</div>
                            <div className="col-span-2"><span className="text-gray-500">地址：</span>{order.User?.address || '-'}</div>
                        </div>
                    </div>

                    {/* 商品表格 */}
                    <table className="w-full text-sm mb-4">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="text-left py-2">商品名称</th>
                                <th className="text-center py-2">单价</th>
                                <th className="text-center py-2">数量</th>
                                <th className="text-right py-2">小计</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.OrderItems?.map(item => (
                                <tr key={item.id} className="border-b border-gray-100">
                                    <td className="py-2">{item.Product?.name || '商品'}</td>
                                    <td className="py-2 text-center">¥{item.price_snapshot?.toFixed(2)}</td>
                                    <td className="py-2 text-center">{item.quantity}</td>
                                    <td className="py-2 text-right">¥{(item.price_snapshot * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 金额汇总 */}
                    <div className="text-sm text-right space-y-1">
                        <div><span className="text-gray-500">商品数量：</span>{order.OrderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} 件</div>
                        <div><span className="text-gray-500">原价合计：</span>¥{subtotal.toFixed(2)}</div>
                        {order.applied_discount > 0 && (
                            <div className="text-green-600"><span>折扣 ({order.applied_discount}%)：</span>-¥{discountAmount.toFixed(2)}</div>
                        )}
                        <div className="pt-2 border-t">
                            <span className="text-gray-500">应付金额：</span>
                            <span className="text-xl font-bold text-red-500">¥{order.total_amount?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orders;

