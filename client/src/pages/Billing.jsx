import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, FileText, Phone, MapPin } from 'lucide-react';
import api from '../api';

const Billing = () => {
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ customer: '', startDate: '', endDate: '' });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBill, setShowBill] = useState(false);
    const printRef = useRef();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, usersRes] = await Promise.all([
                api.get('/orders'),
                api.get('/users')
            ]);
            setOrders(ordersRes.data.filter(o => o.status === 'confirmed'));
            setUsers(usersRes.data.filter(u => u.role === 'customer'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filters.customer && o.customer_id !== parseInt(filters.customer)) return false;
        if (filters.startDate && new Date(o.createdAt) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(o.createdAt) > new Date(filters.endDate + 'T23:59:59')) return false;
        return true;
    });

    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredOrders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredOrders.map(o => o.id)));
        }
    };

    const selectedOrders = orders.filter(o => selectedIds.has(o.id));
    const totalAmount = selectedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const selectedCustomer = filters.customer ? users.find(u => u.id === parseInt(filters.customer)) : null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <div className="card no-print">
                <div className="card-header">
                    <span className="font-bold">账单管理</span>
                </div>

                <div className="filter-bar p-4 border-b border-slate-100">
                    <div className="filter-group">
                        <label className="filter-label">选择客户</label>
                        <select
                            className="form-select"
                            style={{ width: '200px' }}
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
                    <button
                        className="btn btn-primary"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        <Search size={16} /> 筛选
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">加载中...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th>订单号</th>
                                <th>客户</th>
                                <th>电话</th>
                                <th>日期</th>
                                <th>金额</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="checkbox-cell">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(order.id)}
                                            onChange={() => toggleSelect(order.id)}
                                        />
                                    </td>
                                    <td className="font-mono text-sm">{order.order_no || `#${order.id}`}</td>
                                    <td>{order.User?.name}</td>
                                    <td className="text-sm text-slate-600">{order.User?.phone || '-'}</td>
                                    <td className="text-sm text-slate-500">
                                        {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="font-bold">¥{order.total_amount?.toFixed(2)}</td>
                                    <td><span className="badge badge-success">已完成</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {selectedIds.size > 0 && (
                    <div className="summary-footer">
                        <div>
                            <span className="text-slate-500">已选 </span>
                            <span className="font-bold text-lg">{selectedIds.size}</span>
                            <span className="text-slate-500"> 个订单，合计 </span>
                            <span className="font-bold text-xl text-red-500">¥{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-primary" onClick={() => setShowBill(true)}>
                                <FileText size={16} /> 生成账单
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bill Preview */}
            {showBill && (
                <BillPreview
                    orders={selectedOrders}
                    customer={selectedCustomer || selectedOrders[0]?.User}
                    dateRange={filters}
                    onClose={() => setShowBill(false)}
                    onPrint={handlePrint}
                />
            )}
        </div>
    );
};

const BillPreview = ({ orders, customer, dateRange, onClose, onPrint }) => {
    const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalItems = orders.reduce((sum, o) => sum + (o.OrderItems?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] overflow-auto">
                {/* 顶部栏 */}
                <div className="px-6 py-4 border-b flex justify-between items-center no-print">
                    <span className="text-sm text-gray-500">共 {orders.length} 个订单</span>
                    <div className="flex gap-2">
                        <button onClick={onPrint} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded">打印</button>
                        <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded">关闭</button>
                    </div>
                </div>

                {/* 打印内容 */}
                <div className="p-6" id="print-area">
                    {/* 标题 */}
                    <h1 className="text-xl font-bold text-center mb-4">对账单</h1>

                    {/* 账单信息行 */}
                    <div className="flex justify-between text-sm mb-4 pb-3 border-b">
                        <div><span className="text-gray-500">账期：</span>{dateRange.startDate || '开始'} 至 {dateRange.endDate || '今日'}</div>
                        <div><span className="text-gray-500">生成时间：</span>{new Date().toLocaleString('zh-CN')}</div>
                    </div>

                    {/* 客户信息 */}
                    <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-gray-500">客户：</span>{customer?.name || '全部客户'}</div>
                            <div><span className="text-gray-500">电话：</span>{customer?.phone || '-'}</div>
                            <div className="col-span-2"><span className="text-gray-500">地址：</span>{customer?.address || '-'}</div>
                        </div>
                    </div>

                    {/* 订单表格 */}
                    <table className="w-full text-sm mb-4">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="text-left py-2">订单编号</th>
                                <th className="text-center py-2">日期</th>
                                <th className="text-center py-2">商品数</th>
                                <th className="text-right py-2">金额</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b border-gray-100">
                                    <td className="py-2 font-mono text-xs">{order.order_no || `#${order.id}`}</td>
                                    <td className="py-2 text-center">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</td>
                                    <td className="py-2 text-center">{order.OrderItems?.length || 0} 件</td>
                                    <td className="py-2 text-right">¥{order.total_amount?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 金额汇总 */}
                    <div className="text-sm text-right space-y-1 mb-6">
                        <div><span className="text-gray-500">订单数量：</span>{orders.length} 单</div>
                        <div><span className="text-gray-500">商品总数：</span>{totalItems} 件</div>
                        <div className="pt-2 border-t">
                            <span className="text-gray-500">应付总额：</span>
                            <span className="text-xl font-bold text-red-500">¥{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* 订单详情列表 - 与销售订单格式一致 */}
                    <div className="border-t pt-6">
                        {orders.map((order, index) => {
                            const orderSubtotal = order.OrderItems?.reduce((sum, item) => sum + (item.price_snapshot * item.quantity), 0) || 0;
                            const discountAmount = orderSubtotal * (order.applied_discount / 100);
                            return (
                                <div key={order.id} className="mb-8 pb-6 border-b border-gray-300 last:border-0">
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
                                        <div><span className="text-gray-500">原价合计：</span>¥{orderSubtotal.toFixed(2)}</div>
                                        {order.applied_discount > 0 && (
                                            <div className="text-green-600"><span>折扣 ({order.applied_discount}%)：</span>-¥{discountAmount.toFixed(2)}</div>
                                        )}
                                        <div className="pt-2 border-t">
                                            <span className="text-gray-500">应付金额：</span>
                                            <span className="text-xl font-bold text-red-500">¥{order.total_amount?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;
