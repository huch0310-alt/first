import React, { useState, useEffect } from 'react';
import { CheckSquare, Check } from 'lucide-react';
import api from '../api';

const Seller = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products?status=pending');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, retailPrice) => {
        if (!retailPrice) return alert('请输入零售价');
        try {
            await api.put(`/products/${id}`, {
                retail_price: parseFloat(retailPrice),
                status: 'active'
            });
            fetchProducts();
        } catch (err) {
            alert('操作失败: ' + err.message);
        }
    };

    return (
        <div>
            <div className="admin-header">
                <CheckSquare size={22} />
                商品审核
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                    {products.length}
                </span>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
                    <p>暂无待审核商品</p>
                </div>
            ) : (
                <div className="space-y-0">
                    {products.map(product => (
                        <ProductReviewCard key={product.id} product={product} onApprove={handleApprove} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ProductReviewCard = ({ product, onApprove }) => {
    const [price, setPrice] = useState('');

    return (
        <div className="review-card">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-slate-500">采购员: {product.User?.name || '未知'}</p>
                </div>
                <span className="badge badge-pending">待审核</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-500">采购单价</div>
                    <div className="font-bold text-lg">¥{product.purchase_price}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-500">采购数量</div>
                    <div className="font-bold text-lg">{product.purchase_quantity || 1}</div>
                </div>
            </div>

            {product.description && (
                <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-600">
                    {product.description}
                </div>
            )}

            <div className="mt-4">
                <label className="input-label">设置零售价 (元)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ flex: 1, background: '#fff', border: '2px solid #e2e8f0' }}
                        placeholder="请输入零售价..."
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                    />
                    <button
                        onClick={() => onApprove(product.id, price)}
                        className="btn btn-success"
                        style={{ width: '100px' }}
                    >
                        审核上架
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Seller;
