import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Package, LogOut, User, Image, X, Loader } from 'lucide-react';
import api from '../api';

const Purchaser = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

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
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        // 未登录时跳转到登录页
        if (!currentUser.id) {
            navigate('/login');
        }
    }, []);

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
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setFormData(prev => ({ ...prev, image_url: response.data.url }));
                setMessage({ type: 'success', text: '图片上传成功！' });
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

    // 打开图片选择（相机或相册）
    const openImagePicker = (capture = false) => {
        if (fileInputRef.current) {
            // capture属性决定是打开相机还是相册
            if (capture) {
                fileInputRef.current.setAttribute('capture', 'environment');
            } else {
                fileInputRef.current.removeAttribute('capture');
            }
            fileInputRef.current.click();
        }
    };

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
            setPreviewImage(null);
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
                    <label className="input-label">商品图片</label>

                    {/* 隐藏的文件输入 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />

                    {/* 图片预览 */}
                    {previewImage ? (
                        <div className="relative mb-3">
                            <img
                                src={previewImage}
                                alt="预览"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                            {uploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                    <Loader className="w-8 h-8 text-white animate-spin" />
                                    <span className="text-white ml-2">上传中...</span>
                                </div>
                            )}
                            {!uploading && (
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            {/* 拍照按钮 */}
                            <button
                                type="button"
                                onClick={() => openImagePicker(true)}
                                className="flex-1 p-4 bg-blue-50 rounded-lg flex flex-col items-center gap-2 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                                <Camera size={28} />
                                <span className="text-sm">拍照</span>
                            </button>
                            {/* 相册按钮 */}
                            <button
                                type="button"
                                onClick={() => openImagePicker(false)}
                                className="flex-1 p-4 bg-emerald-50 rounded-lg flex flex-col items-center gap-2 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            >
                                <Image size={28} />
                                <span className="text-sm">从相册选择</span>
                            </button>
                        </div>
                    )}

                    {/* 显示已上传的URL */}
                    {formData.image_url && (
                        <p className="text-sm text-emerald-600 mt-2">
                            ✓ 图片已上传: {formData.image_url}
                        </p>
                    )}
                </div>

                <button type="submit" disabled={loading || uploading} className="btn btn-primary mt-4">
                    {loading ? '提交中...' : <><Plus size={20} /> 确认录入</>}
                </button>
            </form>
        </div>
    );
};

export default Purchaser;

