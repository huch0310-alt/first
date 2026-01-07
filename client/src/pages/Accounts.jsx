import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, MapPin, Key } from 'lucide-react';
import api from '../api';

const Accounts = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('customer');
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [passwordUser, setPasswordUser] = useState(null);

    // 获取当前登录用户
    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isSuperAdmin = currentUser.role === 'super_admin';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get(`/users?operator_role=${currentUser.role}`);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        if (activeTab === 'customer') {
            return u.role === 'customer';
        } else {
            return ['purchaser', 'seller', 'admin'].includes(u.role);
        }
    });

    const handleDelete = async (id) => {
        if (!confirm('确定删除该用户？')) return;
        try {
            await api.delete(`/users/${id}?operator_role=${currentUser.role}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || '删除失败');
        }
    };

    const handleSave = async (userData) => {
        try {
            const dataWithOperator = { ...userData, operator_role: currentUser.role };
            if (editUser) {
                await api.put(`/users/${editUser.id}`, dataWithOperator);
            } else {
                await api.post('/users', dataWithOperator);
            }
            setShowModal(false);
            setEditUser(null);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || '保存失败');
        }
    };

    const handleChangePassword = async (newPassword) => {
        try {
            await api.put(`/users/${passwordUser.id}/password`, {
                new_password: newPassword,
                operator_id: currentUser.id,
                operator_role: currentUser.role
            });
            alert('密码修改成功');
            setShowPasswordModal(false);
            setPasswordUser(null);
        } catch (err) {
            alert(err.response?.data?.error || '密码修改失败');
        }
    };

    // 检查是否可以编辑该用户
    const canEditUser = (user) => {
        if (isSuperAdmin) return true;
        // 普通经理不能编辑经理和超级管理员
        return user.role !== 'admin' && user.role !== 'super_admin';
    };

    // 检查是否可以删除该用户
    const canDeleteUser = (user) => {
        if (user.role === 'super_admin') return false;
        if (isSuperAdmin) return true;
        return user.role !== 'admin';
    };

    // 检查是否可以修改密码
    const canChangePassword = (user) => {
        if (isSuperAdmin) return true;
        // 经理可以改自己和非经理的密码
        if (user.id === currentUser.id) return true;
        return user.role !== 'admin' && user.role !== 'super_admin';
    };

    const roleLabels = {
        super_admin: '超级管理员',
        admin: '经理',
        purchaser: '采购员',
        seller: '销售员',
        customer: '客户'
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div className="tabs" style={{ margin: 0, border: 0 }}>
                        <div
                            className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
                            onClick={() => setActiveTab('customer')}
                        >
                            客户账户
                        </div>
                        <div
                            className={`tab ${activeTab === 'staff' ? 'active' : ''}`}
                            onClick={() => setActiveTab('staff')}
                        >
                            员工账户
                        </div>
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setEditUser(null); setShowModal(true); }}
                    >
                        <Plus size={16} /> 新增用户
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 max-w-md">
                        <Search size={20} className="text-slate-400" />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="搜索用户..."
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">加载中...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>账号名</th>
                                <th>姓名</th>
                                <th>电话</th>
                                {activeTab === 'customer' && <th>地址</th>}
                                <th>角色</th>
                                {activeTab === 'customer' && <th>折扣率</th>}
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td className="font-mono text-sm text-blue-600">{user.username || '-'}</td>
                                    <td className="font-medium">{user.name}</td>
                                    <td>
                                        {user.phone && (
                                            <span className="flex items-center gap-1 text-sm text-slate-600">
                                                <Phone size={14} /> {user.phone}
                                            </span>
                                        )}
                                    </td>
                                    {activeTab === 'customer' && (
                                        <td>
                                            {user.address && (
                                                <span className="flex items-center gap-1 text-sm text-slate-600">
                                                    <MapPin size={14} /> {user.address}
                                                </span>
                                            )}
                                        </td>
                                    )}
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                                            {roleLabels[user.role]}
                                        </span>
                                    </td>
                                    {activeTab === 'customer' && <td>{user.discount_percentage}%</td>}
                                    <td>
                                        <div className="flex gap-2">
                                            {canEditUser(user) && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => { setEditUser(user); setShowModal(true); }}
                                                >
                                                    编辑
                                                </button>
                                            )}
                                            {canChangePassword(user) && (
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#f59e0b', color: 'white' }}
                                                    onClick={() => { setPasswordUser(user); setShowPasswordModal(true); }}
                                                >
                                                    <Key size={14} />
                                                </button>
                                            )}
                                            {canDeleteUser(user) && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    删除
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

            {/* 用户编辑弹窗 */}
            {showModal && (
                <UserModal
                    user={editUser}
                    onClose={() => { setShowModal(false); setEditUser(null); }}
                    onSave={handleSave}
                    isCustomerTab={activeTab === 'customer'}
                    isSuperAdmin={isSuperAdmin}
                />
            )}

            {/* 密码修改弹窗 */}
            {showPasswordModal && (
                <PasswordModal
                    user={passwordUser}
                    onClose={() => { setShowPasswordModal(false); setPasswordUser(null); }}
                    onSave={handleChangePassword}
                />
            )}
        </div>
    );
};

const UserModal = ({ user, onClose, onSave, isCustomerTab, isSuperAdmin }) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        name: user?.name || '',
        password: '',
        role: user?.role || (isCustomerTab ? 'customer' : 'purchaser'),
        phone: user?.phone || '',
        address: user?.address || '',
        discount_percentage: user?.discount_percentage || 0
    });
    const [usernameError, setUsernameError] = useState('');

    const validateUsername = (value) => {
        if (!value) {
            setUsernameError('请输入账号名');
            return false;
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)) {
            setUsernameError('账号名只能是英文或英文数字组合，必须以字母开头');
            return false;
        }
        setUsernameError('');
        return true;
    };

    const handleSave = () => {
        if (!user && !validateUsername(formData.username)) return;
        onSave(formData);
    };

    // 获取可用角色列表
    const getAvailableRoles = () => {
        if (isCustomerTab) {
            return [{ value: 'customer', label: '客户' }];
        }
        const roles = [
            { value: 'purchaser', label: '采购员' },
            { value: 'seller', label: '销售员' }
        ];
        // 只有超级管理员可以创建经理
        if (isSuperAdmin) {
            roles.push({ value: 'admin', label: '经理' });
        }
        return roles;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">{user ? '编辑用户' : '新增用户'}</h3>
                {!user && (
                    <div className="form-group">
                        <label className="form-label">账号名 <span className="text-red-500">*</span></label>
                        <input
                            className={`form-input ${usernameError ? 'border-red-500' : ''}`}
                            placeholder="英文或英文数字组合"
                            value={formData.username}
                            onChange={e => {
                                setFormData({ ...formData, username: e.target.value });
                                validateUsername(e.target.value);
                            }}
                        />
                        {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
                    </div>
                )}
                {!user && (
                    <div className="form-group">
                        <label className="form-label">密码 <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="请设置密码（至少6位）"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">姓名</label>
                    <input
                        className="form-input"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">电话</label>
                    <input
                        className="form-input"
                        placeholder="请输入电话号码"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                {isCustomerTab && (
                    <div className="form-group">
                        <label className="form-label">地址</label>
                        <input
                            className="form-input"
                            placeholder="请输入送货地址"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">角色</label>
                    <select
                        className="form-select"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                        {getAvailableRoles().map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>
                {isCustomerTab && (
                    <div className="form-group">
                        <label className="form-label">折扣率 (%)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.discount_percentage}
                            onChange={e => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                )}
                <div className="flex gap-3 mt-6">
                    <button className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
                    <button className="btn btn-primary flex-1" onClick={handleSave}>保存</button>
                </div>
            </div>
        </div>
    );
};

// 密码修改弹窗
const PasswordModal = ({ user, onClose, onSave }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (newPassword.length < 6) {
            setError('密码长度至少6位');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('两次密码输入不一致');
            return;
        }
        onSave(newPassword);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold mb-4">修改密码</h3>
                <p className="text-sm text-slate-500 mb-4">
                    正在修改 <span className="font-bold text-slate-700">{user?.name}</span> 的密码
                </p>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">新密码</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="请输入新密码（至少6位）"
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">确认密码</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="请再次输入新密码"
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    />
                </div>
                <div className="flex gap-3 mt-6">
                    <button className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
                    <button className="btn btn-primary flex-1" onClick={handleSave}>确认修改</button>
                </div>
            </div>
        </div>
    );
};

export default Accounts;
