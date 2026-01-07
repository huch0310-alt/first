import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import api from '../api';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await api.get('/products?status=active');
            const found = res.data.find(p => p.id === parseInt(id));
            setProduct(found);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = () => {
        // 检查库存
        const cart = JSON.parse(localStorage.getItem('cart') || '{}');
        const currentInCart = cart[id] || 0;
        const totalQty = currentInCart + quantity;

        if (totalQty > product.stock) {
            alert(`库存不足！当前库存：${product.stock}件${currentInCart > 0 ? `，购物车已有：${currentInCart}件` : ''}`);
            return;
        }

        cart[id] = totalQty;
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('已加入购物车');
    };

    if (loading) return <div className="text-center py-12">加载中...</div>;
    if (!product) return <div className="text-center py-12">商品不存在</div>;

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="page-header with-back">
                <button onClick={() => navigate(-1)}><ChevronLeft /></button>
                <span>商品详情</span>
            </div>

            {/* Image */}
            <div className="aspect-square bg-slate-100">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">🥬</div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <h1 className="text-xl font-bold mb-2">{product.name}</h1>
                <div className="text-2xl font-bold text-red-500 mb-2">¥{product.retail_price}</div>

                {/* 库存显示 */}
                <div className={`text-sm mb-4 ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                    {product.stock > 10 ? (
                        <span>✓ 库存充足 ({product.stock}件)</span>
                    ) : product.stock > 0 ? (
                        <span>⚠ 库存紧张 (仅剩{product.stock}件)</span>
                    ) : (
                        <span>✗ 暂时缺货</span>
                    )}
                </div>

                {product.description && (
                    <div className="bg-slate-50 p-4 rounded-xl mb-4">
                        <div className="text-sm text-slate-500 mb-1">商品说明</div>
                        <div className="text-slate-700">{product.description}</div>
                    </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                    <span className="text-slate-600">购买数量</span>
                    <div className="qty-selector">
                        <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                            <Minus size={18} />
                        </button>
                        <span className="w-8 text-center font-bold">{quantity}</span>
                        <button
                            className="qty-btn"
                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                            disabled={quantity >= product.stock}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-slate-100 max-w-[480px] mx-auto">
                <button
                    onClick={addToCart}
                    className="btn btn-primary"
                    disabled={product.stock === 0}
                    style={product.stock === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    <ShoppingCart size={20} />
                    {product.stock === 0 ? '暂时缺货' : '加入购物车'}
                </button>
            </div>
        </div>
    );
};

export default ProductDetail;
