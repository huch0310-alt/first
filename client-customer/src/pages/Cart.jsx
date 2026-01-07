import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Phone, MapPin, User, X } from 'lucide-react';
import api from '../api';

const Cart = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // 当前用户 ID
    const currentUserId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('cart') || '{}');
        setCart(savedCart);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, usersRes] = await Promise.all([
                api.get('/products?status=active'),
                api.get('/users')
            ]);
            setProducts(productsRes.data);
            // 从后台获取当前客户的完整信息（包括电话和地址）
            const user = usersRes.data.find(u => u.id === currentUserId);
            if (user) {
                setCustomerInfo(user);
                // 更新 localStorage 中的用户信息
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateCart = (pid, newQty) => {
        const newCart = { ...cart };
        const product = products.find(p => p.id === parseInt(pid));
        const maxQty = product?.stock || 0;
        let qty = Math.max(0, parseInt(newQty) || 0);

        // 限制不能超过库存
        if (qty > maxQty) {
            alert(`「${product?.name}」库存不足，最多可购买 ${maxQty} 件`);
            qty = maxQty;
        }

        if (qty === 0) {
            delete newCart[pid];
        } else {
            newCart[pid] = qty;
        }
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const handleQtyChange = (pid, delta) => {
        const currentQty = cart[pid] || 0;
        const product = products.find(p => p.id === parseInt(pid));
        const maxQty = product?.stock || 0;
        const newQty = Math.min(maxQty, Math.max(0, currentQty + delta));
        updateCart(pid, newQty);
    };

    const handleQtyInput = (pid, value) => {
        updateCart(pid, value);
    };

    const getTotal = () => {
        let total = 0;
        Object.entries(cart).forEach(([pid, qty]) => {
            const product = products.find(p => p.id === parseInt(pid));
            if (product) total += product.retail_price * qty;
        });
        return total;
    };

    // 检查库存是否充足
    const checkStock = () => {
        const stockIssues = [];
        Object.entries(cart).forEach(([pid, qty]) => {
            const product = products.find(p => p.id === parseInt(pid));
            if (product && qty > product.stock) {
                stockIssues.push({
                    name: product.name,
                    requested: qty,
                    available: product.stock
                });
            }
        });
        return stockIssues;
    };

    // 打开确认弹窗
    const openConfirmModal = () => {
        if (!customerInfo?.phone || !customerInfo?.address) {
            alert('请联系管理员完善您的电话和地址信息');
            return;
        }

        // 检查库存
        const stockIssues = checkStock();
        if (stockIssues.length > 0) {
            const messages = stockIssues.map(issue =>
                `「${issue.name}」库存不足：您选择了${issue.requested}件，仅剩${issue.available}件`
            );
            alert('以下商品库存不足，请调整数量：\n\n' + messages.join('\n'));
            return;
        }

        setShowConfirm(true);
    };

    // 确认下单
    const confirmOrder = async () => {
        const items = Object.entries(cart).map(([pid, qty]) => ({
            product_id: parseInt(pid),
            quantity: qty
        }));

        try {
            await api.post('/orders', { customer_id: currentUserId, items });
            localStorage.removeItem('cart');
            setCart({});
            setShowConfirm(false);
            navigate('/orders');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message;
            alert('下单失败：' + errorMsg);
            setShowConfirm(false);
            // 刷新商品数据以获取最新库存
            fetchData();
        }
    };

    const total = getTotal();
    const discount = total * ((customerInfo?.discount_percentage || 0) / 100);
    const finalPrice = total - discount;
    const isEmpty = Object.keys(cart).length === 0;

    return (
        <div className="pb-40">
            <div className="page-header">购物车</div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : isEmpty ? (
                <div className="text-center py-20">
                    <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-400">购物车是空的</p>
                </div>
            ) : (
                <>
                    {/* 送货信息卡片 - 从后台获取，不可编辑 */}
                    <div className="mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-sm font-medium text-slate-600 mb-2">送货信息</div>
                        {customerInfo?.phone || customerInfo?.address ? (
                            <div className="space-y-1">
                                {customerInfo.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone size={14} className="text-slate-400" />
                                        <span>{customerInfo.phone}</span>
                                    </div>
                                )}
                                {customerInfo.address && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span>{customerInfo.address}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-red-500">请联系管理员完善您的送货信息</div>
                        )}
                    </div>

                    <div className="bg-white">
                        {Object.entries(cart).map(([pid, qty]) => {
                            const product = products.find(p => p.id === parseInt(pid));
                            if (!product) return null;
                            return (
                                <div key={pid} className="cart-item">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">🥬</div>
                                        )}
                                    </div>
                                    <div className="cart-item-info flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-sm">{product.name}</div>
                                            <button
                                                onClick={() => updateCart(pid, 0)}
                                                className="text-red-400 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-red-500 font-bold">¥{product.retail_price}</div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center"
                                                    onClick={() => handleQtyChange(pid, -1)}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                {/* 手动输入数量 - B端客户订单量大 */}
                                                <input
                                                    type="number"
                                                    className="w-16 h-8 text-center border border-slate-200 rounded-lg font-bold"
                                                    value={qty}
                                                    onChange={e => handleQtyInput(pid, e.target.value)}
                                                    min="0"
                                                />
                                                <button
                                                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center"
                                                    onClick={() => handleQtyChange(pid, 1)}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500 text-right mt-1">
                                            小计: ¥{(product.retail_price * qty).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Fixed Bottom Checkout */}
            {!isEmpty && (
                <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-100 p-4 max-w-[480px] mx-auto">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">商品合计</span>
                        <span>¥{total.toFixed(2)}</span>
                    </div>
                    {(customerInfo?.discount_percentage || 0) > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600 mb-2">
                            <span>VIP 折扣 ({customerInfo.discount_percentage}%)</span>
                            <span>-¥{discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold">应付金额</span>
                        <span className="text-xl font-bold text-red-500">¥{finalPrice.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={openConfirmModal}
                        className="btn btn-primary"
                        disabled={!customerInfo?.phone || !customerInfo?.address}
                    >
                        立即下单
                    </button>
                </div>
            )}

            {/* 订单确认弹窗 */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-sm">
                        <div className="px-4 py-3 border-b flex justify-between items-center">
                            <span className="font-bold">确认订单</span>
                            <button onClick={() => setShowConfirm(false)} className="text-gray-400"><X size={20} /></button>
                        </div>
                        <div className="p-4">
                            {/* 客户信息 */}
                            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <User size={14} className="text-gray-400" />
                                    <span className="font-medium">{customerInfo?.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{customerInfo?.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span>{customerInfo?.address}</span>
                                </div>
                            </div>

                            {/* 商品列表 */}
                            <div className="text-sm mb-4">
                                <div className="text-gray-500 mb-2">商品明细</div>
                                {Object.entries(cart).map(([pid, qty]) => {
                                    const product = products.find(p => p.id === parseInt(pid));
                                    if (!product) return null;
                                    return (
                                        <div key={pid} className="flex justify-between py-1">
                                            <span>{product.name} x{qty}</span>
                                            <span>¥{(product.retail_price * qty).toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 金额汇总 */}
                            <div className="border-t pt-3 text-sm text-right space-y-1">
                                <div><span className="text-gray-500">商品合计：</span>¥{total.toFixed(2)}</div>
                                {discount > 0 && (
                                    <div className="text-green-600">折扣：-¥{discount.toFixed(2)}</div>
                                )}
                                <div className="pt-1 border-t">
                                    <span className="text-gray-500">应付：</span>
                                    <span className="text-lg font-bold text-red-500">¥{finalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 pb-4">
                            <button onClick={confirmOrder} className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium">
                                确认下单
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;

