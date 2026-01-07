import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Package, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import api from '../api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [trendData, setTrendData] = useState({ dates: [], sales: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, ordersRes, trendRes] = await Promise.all([
                api.get('/stats/summary'),
                api.get('/orders'),
                api.get('/stats/trend')
            ]);
            setStats(statsRes.data);
            setOrders(ordersRes.data.slice(0, 5));

            // 处理趋势数据
            const dates = trendRes.data.map(item => item.date);
            const sales = trendRes.data.map(item => item.sales);
            setTrendData({ dates, sales });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const chartOption = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>销售额: ¥{c}'
        },
        xAxis: {
            type: 'category',
            data: trendData.dates,
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisLabel: { color: '#64748b' }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#f1f5f9' } },
            axisLabel: {
                color: '#64748b',
                formatter: '¥{value}'
            }
        },
        series: [{
            data: trendData.sales,
            type: 'line',
            smooth: true,
            areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
            lineStyle: { color: '#3b82f6', width: 3 },
            itemStyle: { color: '#3b82f6' }
        }],
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
    };

    if (loading) return <div className="text-center py-12">加载中...</div>;

    return (
        <div>
            {/* Stats Grid */}
            <div className="stat-grid">
                <StatCard
                    icon={TrendingUp}
                    color="bg-blue-100 text-blue-600"
                    label="总销售额"
                    value={`¥${stats?.totalSales?.toFixed(0) || 0}`}
                    trend={stats?.salesChange !== undefined ? `${stats.salesChange >= 0 ? '+' : ''}${stats.salesChange}%` : null}
                    up={stats?.salesChange >= 0}
                />
                <StatCard
                    icon={ShoppingCart}
                    color="bg-emerald-100 text-emerald-600"
                    label="总订单数"
                    value={stats?.totalOrders || 0}
                    trend={stats?.ordersChange !== undefined ? `${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange}%` : null}
                    up={stats?.ordersChange >= 0}
                />
                <StatCard
                    icon={Package}
                    color="bg-purple-100 text-purple-600"
                    label="商品总数"
                    value={stats?.totalProducts || 0}
                />
                <StatCard
                    icon={Users}
                    color="bg-amber-100 text-amber-600"
                    label="待处理订单"
                    value={stats?.pendingOrders || 0}
                    trend={stats?.pendingChange !== undefined ? `${stats.pendingChange >= 0 ? '+' : ''}${stats.pendingChange}%` : null}
                    up={stats?.pendingChange <= 0}  // 待处理订单减少是好事
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="card lg:col-span-2">
                    <div className="card-header">销售趋势</div>
                    <div className="card-body">
                        <ReactECharts option={chartOption} style={{ height: '300px' }} />
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="card">
                    <div className="card-header">最新订单</div>
                    <div className="divide-y divide-slate-100">
                        {orders.map(order => (
                            <div key={order.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-sm">{order.User?.name || '客户'}</div>
                                    <div className="text-xs text-slate-500 font-mono">{order.order_no}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm">¥{order.total_amount?.toFixed(2)}</div>
                                    <span className={`badge ${order.status === 'pending' ? 'badge-pending' : 'badge-success'}`}>
                                        {order.status === 'pending' ? '待处理' : '已完成'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, color, label, value, trend, up }) => (
    <div className="stat-card">
        <div className={`stat-icon ${color}`}>
            <Icon size={24} />
        </div>
        <div className="stat-value">{value}</div>
        <div className="flex items-center justify-between">
            <span className="stat-label">{label}</span>
            {trend && (
                <span className={`text-sm flex items-center ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                    {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </span>
            )}
        </div>
    </div>
);

export default Dashboard;
