import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Printer, CheckCircle, Clock, TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import api from '../api';

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                api.get('/stats/summary'),
                api.get('/orders')
            ]);
            setStats(statsRes.data);
            setOrders(ordersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = async (id) => {
        try {
            await api.put(`/orders/${id}/confirm`);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const chartOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: '0%', left: 'center' },
        series: [
            {
                name: '订单状态',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
                data: [
                    { value: stats?.pendingOrders || 0, name: '待处理', itemStyle: { color: '#f59e0b' } },
                    { value: (stats?.totalOrders || 0) - (stats?.pendingOrders || 0), name: '已完成', itemStyle: { color: '#10b981' } }
                ]
            }
        ]
    };

    if (loading) return <div className="text-center p-10 text-slate-500">加载数据中...</div>;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="今日销售额"
                    value={`¥${stats?.totalSales.toFixed(2)}`}
                    icon={<TrendingUp size={24} className="text-blue-600" />}
                    trend="+12.5%"
                />
                <StatCard
                    title="总订单数"
                    value={stats?.totalOrders}
                    icon={<ShoppingCart size={24} className="text-emerald-600" />}
                    trend="+5"
                />
                <StatCard
                    title="待处理订单"
                    value={stats?.pendingOrders}
                    icon={<Clock size={24} className="text-amber-600" />}
                    highlight={stats?.pendingOrders > 0}
                />
                <StatCard
                    title="商品总数"
                    value={stats?.totalProducts}
                    icon={<Package size={24} className="text-purple-600" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="card p-6 lg:col-span-1 h-[400px]">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">订单概览</h3>
                    <ReactECharts option={chartOption} style={{ height: '320px' }} />
                </div>

                {/* Order List */}
                <div className="card p-0 lg:col-span-2 overflow-hidden flex flex-col h-[400px]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                        <h3 className="font-bold text-lg text-slate-800">最新订单</h3>
                        <button onClick={handlePrint} className="btn btn-secondary text-sm">
                            <Printer size={16} /> 打印对账单
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th>订单号</th>
                                    <th>客户</th>
                                    <th>时间</th>
                                    <th>金额</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="font-mono text-slate-500">#{order.id}</td>
                                        <td className="font-medium">{order.User?.name}</td>
                                        <td className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="font-bold">¥{order.total_amount.toFixed(2)}</td>
                                        <td>
                                            {order.status === 'pending' ? (
                                                <span className="badge badge-pending">待处理</span>
                                            ) : (
                                                <span className="badge badge-success">已完成</span>
                                            )}
                                        </td>
                                        <td>
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => handleConfirmOrder(order.id)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    确认
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, highlight }) => (
    <div className={`card p-6 ${highlight ? 'border-amber-200 bg-amber-50' : ''}`}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-lg">{icon}</div>
            {trend && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <div className="text-slate-500 text-sm mb-1">{title}</div>
        <div className="text-3xl font-bold text-slate-800">{value}</div>
    </div>
);

export default ManagerDashboard;
