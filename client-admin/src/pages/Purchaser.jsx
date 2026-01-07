import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Package, LogOut, User } from 'lucide-react';
import api from '../api';

const Purchaser = () => {
    const navigate = useNavigate();

    // 获取当前登录用户
    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const [formData, setFormData] = useState({
        name: '',
        purchase_price: '',
        purchase_quantity: '',
        description: '',
        image_url: '',
        creator_id: currentUser.id || 2
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // 未登录时跳转到登录页
        if (!currentUser.id) {
            navigate('/login');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products', {
                ...formData,
                creator_id: currentUser.id
            });
            setMessage({ type: 'success', text: '商品录入成功！等待销售审核。' });
            setFormData({
                ...formData,
                name: '',
                purchase_price: '',
                purchase_quantity: '',
                description: '',
                image_url: ''
            });
        } catch (err) {
            setMessage({ type: 'error', text: '录入失败：' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const roleLabels = {
        purchaser: '采购员',
        seller: '销售员',
        admin: '经理'
    };

    return (
        <div>
            {/* 顶部用户信息栏 */}
            <div className="admin-header" style={{ justifyContent: 'space-between' }}>
                <div className="flex items-center gap-2">
                    <Package size={22} />
                    采购录入
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm opacity-80">
                        <User size={14} className="inline mr-1" />
                        {currentUser.name} ({roleLabels[currentUser.role] || '员工'})
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1 text-sm opacity-80"
                    >
                        <LogOut size={16} />
                        退出
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mx-3 mt-3 p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-card">
                <div className="input-group">
                    <label className="input-label">商品名称 *</label>
                    <input
                        type="text"
                        required
                        className="input"
                        placeholder="例如：新鲜大白菜"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="input-group">
                        <label className="input-label">采购单价 (元) *</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="input"
                            placeholder="0.00"
                            value={formData.purchase_price}
                            onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">采购数量 *</label>
                        <input
                            type="number"
                            required
                            className="input"
                            placeholder="0"
                            value={formData.purchase_quantity}
                            onChange={e => setFormData({ ...formData, purchase_quantity: e.target.value })}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">商品说明</label>
                    <textarea
                        className="input"
                        placeholder="描述商品的产地、新鲜度、规格等信息..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">图片链接</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="input"
                            placeholder="https://..."
                            value={formData.image_url}
                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        />
                        <button type="button" className="p-3 bg-slate-100 rounded-lg">
                            <Camera size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary mt-4">
                    {loading ? '提交中...' : <><Plus size={20} /> 确认录入</>}
                </button>
            </form>
        </div>
    );
};

export default Purchaser;
