import React, { useState, useRef } from 'react';
import { Upload, Plus, DollarSign, Image as ImageIcon, X, Loader } from 'lucide-react';
import api from '../api';

const PurchaserView = () => {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        purchase_price: '',
        image_url: '',
        creator_id: 2
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    // 处理图片选择
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 验证文件类型
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: '请选择图片文件' });
                return;
            }
            // 验证文件大小 (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setMessage({ type: 'error', text: '图片大小不能超过10MB' });
                return;
            }
            // 预览图片
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewImage(event.target.result);
            };
            reader.readAsDataURL(file);
            // 上传图片
            uploadImage(file);
        }
    };

    // 上传图片到服务器
    const uploadImage = async (file) => {
        setUploading(true);
        setMessage(null);
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);

            const response = await api.post('/upload', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setFormData(prev => ({ ...prev, image_url: response.data.url }));
                setMessage({ type: 'success', text: '图片上传成功！已自动压缩优化' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: '图片上传失败：' + (err.response?.data?.error || err.message) });
            setPreviewImage(null);
        } finally {
            setUploading(false);
        }
    };

    // 清除图片
    const clearImage = () => {
        setPreviewImage(null);
        setFormData(prev => ({ ...prev, image_url: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products', formData);
            setMessage({ type: 'success', text: '商品录入成功！等待销售审核。' });
            setFormData({ ...formData, name: '', purchase_price: '', image_url: '' });
            setPreviewImage(null);
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">商品图片 (可选)</label>

                        {/* 隐藏的文件输入 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                        />

                        {/* 图片预览或上传按钮 */}
                        {previewImage ? (
                            <div className="relative">
                                <img
                                    src={previewImage}
                                    alt="预览"
                                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                        <Loader className="w-8 h-8 text-white animate-spin" />
                                        <span className="text-white ml-2">压缩上传中...</span>
                                    </div>
                                )}
                                {!uploading && (
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                                {formData.image_url && (
                                    <p className="text-sm text-emerald-600 mt-2">✓ 已上传并自动压缩</p>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2 text-slate-500"
                            >
                                <ImageIcon size={32} className="text-slate-400" />
                                <span>点击选择图片</span>
                                <span className="text-xs text-slate-400">支持 jpg、png、gif、webp，最大10MB</span>
                                <span className="text-xs text-emerald-600">上传后自动压缩优化</span>
                            </button>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || uploading}
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

