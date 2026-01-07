import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, CheckCircle, Search } from 'lucide-react';
import api from '../api';

const CustomerView = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const currentUser = { id: 5, name: 'VIP客户 B', discount: 10 };

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

  const updateCart = (productId, delta) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev };
      if (newQty === 0) delete newCart[productId];
      else newCart[productId] = newQty;
      return newCart;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([pid, qty]) => {
      const product = products.find(p => p.id === parseInt(pid));
      if (product) total += product.retail_price * qty;
    });
    return total;
  };

  const handleCheckout = async () => {
    if (Object.keys(cart).length === 0) return;

    const items = Object.entries(cart).map(([pid, qty]) => ({
      product_id: parseInt(pid),
      quantity: qty
    }));

    try {
      await api.post('/orders', {
        customer_id: currentUser.id,
        items
      });
      setOrderSuccess(true);
      setCart({});
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err) {
      alert('下单失败: ' + err.message);
    }
  };

  const totalOriginal = calculateTotal();
  const discountAmount = totalOriginal * (currentUser.discount / 100);
  const finalPrice = totalOriginal - discountAmount;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
      {/* Product Grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">今日生鲜</h2>
            <p className="text-slate-500">新鲜直达，品质保证</p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
            欢迎, {currentUser.name} (享{100 - currentUser.discount}折)
          </div>
        </div>

        <div className="overflow-y-auto pr-2 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="card p-0 overflow-hidden flex flex-col group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">暂无图片</div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{product.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-4">¥{product.retail_price}</p>

                  <div className="mt-auto">
                    {cart[product.id] ? (
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1 border border-slate-200">
                        <button onClick={() => updateCart(product.id, -1)} className="p-2 hover:bg-white rounded-md text-slate-600 transition-colors"><Minus size={18} /></button>
                        <span className="font-bold text-slate-900 w-8 text-center">{cart[product.id]}</span>
                        <button onClick={() => updateCart(product.id, 1)} className="p-2 hover:bg-white rounded-md text-blue-600 transition-colors"><Plus size={18} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateCart(product.id, 1)}
                        className="btn btn-secondary w-full hover:border-blue-500 hover:text-blue-600"
                      >
                        <ShoppingCart size={18} /> 加入购物车
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shopping Cart Sidebar */}
      <div className="w-full lg:w-96 card p-0 flex flex-col h-full border-0 shadow-xl lg:border">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart size={20} /> 购物车
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.keys(cart).length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
              <p>购物车是空的</p>
            </div>
          ) : (
            Object.entries(cart).map(([pid, qty]) => {
              const product = products.find(p => p.id === parseInt(pid));
              if (!product) return null;
              return (
                <div key={pid} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-500">¥{product.retail_price} x {qty}</div>
                  </div>
                  <div className="font-bold text-slate-700">¥{(product.retail_price * qty).toFixed(2)}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-slate-500 text-sm">
              <span>原价总额</span>
              <span>¥{totalOriginal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 text-sm font-medium">
              <span>VIP 折扣 ({currentUser.discount}%)</span>
              <span>-¥{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-slate-900 pt-2 border-t border-slate-200 mt-2">
              <span>应付金额</span>
              <span>¥{finalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={Object.keys(cart).length === 0}
            className={`w-full py-4 rounded-lg font-bold text-lg flex justify-center items-center gap-2 transition-all ${orderSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {orderSuccess ? (
              <><CheckCircle /> 下单成功</>
            ) : (
              '立即下单'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerView;
