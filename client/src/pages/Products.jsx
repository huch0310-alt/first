import React, { useState, useEffect } from 'react';
import { Search, Check, ChevronUp, ChevronDown, Plus, Camera, X, Package } from 'lucide-react';
import api from '../api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [priceInputs, setPriceInputs] = useState({});
    const [stockInputs, setStockInputs] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return p.status === 'pending';
        if (activeTab === 'active') return p.status === 'active';
        if (activeTab === 'off') return p.status === 'off_shelf';
        return true;
    });

    const handleApprove = async (id) => {
        const price = priceInputs[id];
        if (!price) return alert('请输入零售价');
        try {
            await api.put(`/products/${id}`, { retail_price: parseFloat(price), status: 'active' });
            fetchProducts();
        } catch (err) {
            alert('操作失败');
        }
    };

    const handleStatus = async (id, status) => {
        try {
            await api.put(`/products/${id}`, { status });
            fetchProducts();
        } catch (err) {
            alert('操作失败');
        }
    };

    const handleStockUpdate = async (id) => {
        const stock = stockInputs[id];
        if (stock === undefined || stock === '') return;
        try {
            await api.put(`/products/${id}`, { stock: parseInt(stock) });
            fetchProducts();
            setStockInputs({ ...stockInputs, [id]: '' });
        } catch (err) {
            alert('更新库存失败');
        }
    };

    const handleAddProduct = async (productData) => {
        try {
            await api.post('/products', productData);
            setShowAddModal(false);
            fetchProducts();
        } catch (err) {
            alert('录入失败: ' + err.message);
        }
    };

    const statusLabels = {
        pending: { label: '待审核', class: 'badge-pending' },
        active: { label: '已上架', class: 'badge-success' },
        off_shelf: { label: '已下架', class: 'badge-info' }
    };

    const tabs = [
        { key: 'all', label: '全部' },
        { key: 'pending', label: '待审核' },
        { key: 'active', label: '已上架' },
        { key: 'off', label: '已下架' }
    ];

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div className="tabs" style={{ margin: 0, border: 0 }}>
                        {tabs.map(tab => (
                            <div
                                key={tab.key}
                                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                            <Plus size={16} /> 采购录入
                        </button>
                        <div className="flex items-center gap-2">
                            <Search size={18} className="text-slate-400" />
                            <input type="text" className="form-input" placeholder="搜索商品..." style={{ width: '180px' }} />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">加载中...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>图片</th>
                                <th>商品名称</th>
                                <th>采购价</th>
                                <th>采购数量</th>
                                <th>实时库存</th>
                                <th>零售价</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                            ) : '🥬'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-medium">{product.name}</div>
                                        {product.description && (
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                                        )}
                                    </td>
                                    <td>¥{product.purchase_price}</td>
                                    <td>{product.purchase_quantity || 1}</td>
                                    <td>
                                        <span className={`font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            <Package size={14} className="inline mr-1" />
                                            {product.stock || 0}
                                        </span>
                                    </td>
                                    <td>
                                        {product.status === 'pending' ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-input"
                                                style={{ width: '100px' }}
                                                placeholder="设置价格"
                                                value={priceInputs[product.id] || ''}
                                                onChange={e => setPriceInputs({ ...priceInputs, [product.id]: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-medium text-red-500">¥{product.retail_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${statusLabels[product.status]?.class}`}>
                                            {statusLabels[product.status]?.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {product.status === 'pending' && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleApprove(product.id)}
                                                >
                                                    审核上架
                                                </button>
                                            )}
                                            {product.status === 'active' && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleStatus(product.id, 'off_shelf')}
                                                >
                                                    下架
                                                </button>
                                            )}
                                            {product.status === 'off_shelf' && (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleStatus(product.id, 'active')}
                                                >
                                                    上架
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <AddProductModal onClose={() => setShowAddModal(false)} onSave={handleAddProduct} />
            )}
        </div>
    );
};

const AddProductModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        purchase_price: '',
        purchase_quantity: '',
        stock: '',
        description: '',
        image_url: '',
        creator_id: 2
    });

    const handleSubmit = () => {
        if (!formData.name || !formData.purchase_price) {
            return alert('请填写商品名称和采购价');
        }
        const qty = parseInt(formData.purchase_quantity) || 1;
        onSave({
            ...formData,
            purchase_price: parseFloat(formData.purchase_price),
            purchase_quantity: qty,
            stock: parseInt(formData.stock) || qty
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">采购录入</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="form-group">
                    <label className="form-label">商品名称 *</label>
                    <input
                        className="form-input"
                        placeholder="例如：新鲜大白菜"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="form-group">
                        <label className="form-label">采购单价 *</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            placeholder="0.00"
                            value={formData.purchase_price}
                            onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">采购数量</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="1"
                            value={formData.purchase_quantity}
                            onChange={e => setFormData({ ...formData, purchase_quantity: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">初始库存</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="同采购数量"
                            value={formData.stock}
                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">商品说明</label>
                    <textarea
                        className="form-input"
                        rows="3"
                        placeholder="描述商品的产地、新鲜度、规格等..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">图片链接</label>
                    <div className="flex gap-2">
                        <input
                            className="form-input"
                            placeholder="https://..."
                            value={formData.image_url}
                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        />
                        <button className="btn btn-secondary">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
                    <button className="btn btn-primary flex-1" onClick={handleSubmit}>
                        <Plus size={16} /> 确认录入
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Products;
