import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, Phone, MapPin, User } from 'lucide-react';
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

    if (loading) return <div className="text-center py-12">加载中...</div>;
    if (!order) return <div className="text-center py-12">订单不存在</div>;

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="page-header with-back">
                <button onClick={() => navigate(-1)}><ChevronLeft /></button>
                <span>订单详情</span>
            </div>

            {/* Status Card */}
            <div className={`p-6 ${order.status === 'pending' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                <div className="flex items-center gap-3">
                    {order.status === 'pending' ? (
                        <Clock size={32} className="text-amber-500" />
                    ) : (
                        <CheckCircle size={32} className="text-emerald-500" />
                    )}
                    <div>
                        <div className="font-bold text-lg">
                            {order.status === 'pending' ? '等待商家确认' : '订单已完成'}
                        </div>
                        <div className="text-sm text-slate-500">
                            下单时间: {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery Info */}
            <div className="p-4 bg-white m-3 rounded-xl">
                <div className="text-sm text-slate-500 mb-3">送货信息</div>
                <div className="space-y-2">
                    {order.User?.name && (
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-blue-500" />
                            <span className="font-medium">{order.User.name}</span>
                        </div>
                    )}
                    {order.User?.phone && (
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-blue-500" />
                            <span>{order.User.phone}</span>
                        </div>
                    )}
                    {order.User?.address && (
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" />
                            <span>{order.User.address}</span>
                        </div>
                    )}
                    {!order.User?.name && !order.User?.phone && !order.User?.address && (
                        <div className="text-slate-400">暂无送货信息</div>
                    )}
                </div>
            </div>

            {/* Order Info */}
            <div className="p-4 bg-white m-3 rounded-xl">
                <div className="text-sm text-slate-500 mb-2">订单编号</div>
                <div className="font-mono text-sm">{order.order_no || `#${order.id}`}</div>
            </div>

            {/* Order Items */}
            <div className="bg-white m-3 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-medium">商品清单</div>
                {order.OrderItems?.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0">
                        <div>
                            <div className="font-medium">{item.Product?.name || '商品'}</div>
                            <div className="text-sm text-slate-500">¥{item.price_snapshot} × {item.quantity}</div>
                        </div>
                        <div className="font-bold">¥{(item.price_snapshot * item.quantity).toFixed(2)}</div>
                    </div>
                ))}
            </div>

            {/* Price Summary */}
            <div className="bg-white m-3 rounded-xl p-4">
                <div className="flex justify-between py-2 text-slate-600">
                    <span>商品合计</span>
                    <span>¥{(order.total_amount / (1 - order.applied_discount / 100)).toFixed(2)}</span>
                </div>
                {order.applied_discount > 0 && (
                    <div className="flex justify-between py-2 text-emerald-600">
                        <span>VIP 折扣 ({order.applied_discount}%)</span>
                        <span>-¥{((order.total_amount / (1 - order.applied_discount / 100)) - order.total_amount).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between py-3 border-t border-slate-100 mt-2">
                    <span className="font-bold">实付金额</span>
                    <span className="text-xl font-bold text-red-500">¥{order.total_amount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
