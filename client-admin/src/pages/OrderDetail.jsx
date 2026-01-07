import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Printer, User, Phone, Tag } from 'lucide-react';
import api from '../api';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await api.get('/orders');
            const found = res.data.find(o => o.id === parseInt(id));
            setOrder(found);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            await api.put(`/orders/${id}/confirm`);
            fetchOrder();
        } catch (err) {
            alert('确认失败: ' + err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center py-12">加载中...</div>;
    if (!order) return <div className="text-center py-12">订单不存在</div>;

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="admin-header">
                <button onClick={() => navigate(-1)}><ChevronLeft /></button>
                订单详情
            </div>

            {/* Customer Info */}
            <div className="card p-4">
                <h3 className="font-bold mb-3 text-slate-500 text-sm">客户信息</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <User size={18} className="text-slate-400" />
                        <span className="font-medium">{order.User?.name || '未知客户'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Tag size={18} className="text-slate-400" />
                        <span>折扣: {order.applied_discount}%</span>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="card">
                <div className="p-4 border-b border-slate-100 font-bold">商品清单</div>
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left p-3">商品</th>
                            <th className="text-right p-3">数量</th>
                            <th className="text-right p-3">单价</th>
                            <th className="text-right p-3">小计</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.OrderItems?.map(item => (
                            <tr key={item.id} className="border-b border-slate-50">
                                <td className="p-3">{item.Product?.name || '商品'}</td>
                                <td className="text-right p-3">{item.quantity}</td>
                                <td className="text-right p-3">¥{item.price_snapshot}</td>
                                <td className="text-right p-3 font-medium">¥{(item.price_snapshot * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Price Summary */}
            <div className="card p-4">
                <div className="flex justify-between py-2 text-slate-600">
                    <span>商品合计</span>
                    <span>¥{(order.total_amount / (1 - order.applied_discount / 100)).toFixed(2)}</span>
                </div>
                {order.applied_discount > 0 && (
                    <div className="flex justify-between py-2 text-emerald-600">
                        <span>折扣减免 ({order.applied_discount}%)</span>
                        <span>-¥{((order.total_amount / (1 - order.applied_discount / 100)) - order.total_amount).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between py-3 border-t border-slate-100 mt-2 text-lg font-bold">
                    <span>应付金额</span>
                    <span className="text-red-500">¥{order.total_amount.toFixed(2)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-slate-100 max-w-[480px] mx-auto flex gap-3">
                <button onClick={handlePrint} className="btn btn-secondary flex-1 border border-slate-200">
                    <Printer size={18} /> 打印
                </button>
                {order.status === 'pending' && (
                    <button onClick={handleConfirm} className="btn btn-accent flex-1">
                        <Check size={18} /> 确认订单
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrderDetail;
