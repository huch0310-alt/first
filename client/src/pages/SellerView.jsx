import React, { useState, useEffect } from 'react';
import { Check, DollarSign, Package } from 'lucide-react';
import api from '../api';

const SellerView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchProducts();
  }, []);

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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">销售定价</h2>
          <p className="text-slate-500">审核采购商品并设置零售价格</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
          待审核: {products.length}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">加载中...</div>
      ) : products.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">暂无待审核商品</h3>
          <p className="text-slate-500">所有采购商品都已处理完毕</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onApprove={handleApprove} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onApprove }) => {
  const [price, setPrice] = useState('');

  return (
    <div className="card p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">采购员: {product.User?.name || '未知'}</p>
        </div>
        <span className="badge badge-pending">待审核</span>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg mb-6">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">采购成本</div>
        <div className="text-xl font-mono font-bold text-slate-700">¥{product.purchase_price}</div>
      </div>

      <div className="mt-auto">
        <label className="block text-sm font-medium text-slate-700 mb-2">设置零售价</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400">¥</span>
            <input
              type="number"
              className="form-input pl-6"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>
          <button
            onClick={() => onApprove(product.id, price)}
            className="btn btn-action px-4"
          >
            <Check size={18} /> 上架
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerView;
