import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Package, Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import api from '../api';

const Stats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/stats/summary');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const chartOption = {
        tooltip: { trigger: 'item' },
        series: [
            {
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '50%'],
                data: [
                    { value: stats?.pendingOrders || 0, name: '待处理', itemStyle: { color: '#f59e0b' } },
                    { value: (stats?.totalOrders || 0) - (stats?.pendingOrders || 0), name: '已完成', itemStyle: { color: '#10b981' } }
                ],
                label: { show: true, position: 'outside' }
            }
        ]
    };

    if (loading) return <div className="text-center py-12">加载中...</div>;

    return (
        <div>
            <div className="admin-header">
                <BarChart3 size={22} />
                数据统计
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3 p-3">
                <div className="stat-card">
                    <TrendingUp size={24} className="mx-auto text-blue-500 mb-2" />
                    <div className="stat-value text-blue-600">¥{stats?.totalSales.toFixed(0)}</div>
                    <div className="stat-label">总销售额</div>
                </div>
                <div className="stat-card">
                    <ShoppingCart size={24} className="mx-auto text-emerald-500 mb-2" />
                    <div className="stat-value text-emerald-600">{stats?.totalOrders}</div>
                    <div className="stat-label">总订单数</div>
                </div>
                <div className="stat-card">
                    <Clock size={24} className="mx-auto text-amber-500 mb-2" />
                    <div className="stat-value text-amber-600">{stats?.pendingOrders}</div>
                    <div className="stat-label">待处理订单</div>
                </div>
                <div className="stat-card">
                    <Package size={24} className="mx-auto text-purple-500 mb-2" />
                    <div className="stat-value text-purple-600">{stats?.totalProducts}</div>
                    <div className="stat-label">商品总数</div>
                </div>
            </div>

            {/* Chart */}
            <div className="card mx-3 p-4">
                <h3 className="font-bold mb-4">订单状态分布</h3>
                <ReactECharts option={chartOption} style={{ height: '200px' }} />
            </div>
        </div>
    );
};

export default Stats;
