import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, LogIn } from 'lucide-react';
import api from '../api';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 调用登录 API，限制角色为员工（采购员、销售员、管理员）
            const res = await api.post('/login', { username, password });
            const user = res.data;

            // 验证是否为员工角色
            if (!['purchaser', 'seller', 'admin'].includes(user.role)) {
                setError('此账号不是员工账号');
                return;
            }

            // 存储完整用户信息
            localStorage.setItem('adminUser', JSON.stringify(user));

            // 根据角色跳转
            if (user.role === 'purchaser') {
                navigate('/');
            } else if (user.role === 'seller') {
                navigate('/seller');
            } else {
                navigate('/stats');
            }
        } catch (err) {
            setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center p-6 bg-linear-to-b from-slate-900 to-slate-800">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Leaf className="text-white" size={40} />
                </div>
                <h1 className="text-2xl font-bold text-white">FreshTrade 管理</h1>
                <p className="text-slate-400 mt-1">采购与订单管理系统</p>
            </div>

            <div className="bg-white rounded-2xl p-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="input-group">
                        <label className="input-label">账号名</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="请输入账号名"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">密码</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="请输入密码"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary mt-4"
                        disabled={loading}
                    >
                        {loading ? '登录中...' : <><LogIn size={18} /> 登录</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
