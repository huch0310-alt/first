import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('全部');

    const categories = ['全部', '蔬菜', '水果', '海鲜', '肉类'];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products?status=active');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">全部商品</div>

            {/* 分类 Tab */}
            <div className="flex gap-2 p-3 overflow-x-auto bg-white border-b border-slate-100">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${category === cat
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : (
                <div className="product-grid">
                    {products.map(product => (
                        <Link key={product.id} to={`/product/${product.id}`} className="product-card">
                            <div className="aspect-square bg-slate-100">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">🥬</div>
                                )}
                            </div>
                            <div className="product-card-info">
                                <div className="product-card-name">{product.name}</div>
                                <div className="product-card-price">¥{product.retail_price}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;
