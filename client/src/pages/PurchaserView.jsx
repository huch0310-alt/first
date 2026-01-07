import React, { useState } from 'react';
import { Upload, Plus, DollarSign, Image as ImageIcon } from 'lucide-react';
import api from '../api';

const PurchaserView = () => {
    const [formData, setFormData] = useState({
        name: '',
        purchase_price: '',
        image_url: '',
        creator_id: 2
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products', formData);
            setMessage({ type: 'success', text: '商品录入成功！等待销售审核。' });
            setFormData({ ...formData, name: '', purchase_price: '', image_url: '' });
        } catch (err) {
            setMessage({ type: 'error', text: '录入失败：' + err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="card p-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">采购录入</h2>
                        <p className="text-slate-500">上传市场采购的生鲜信息</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">商品名称</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="例如：新鲜大白菜"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">采购单价 (元)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="form-input pl-10"
                                    placeholder="0.00"
                                    value={formData.purchase_price}
                                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">图片链接 (可选)</label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className="form-input pl-10"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3"
                        >
                            {loading ? '提交中...' : <><Plus size={20} /> 确认录入</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaserView;
