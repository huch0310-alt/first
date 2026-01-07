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
            // 调用登录 API
            const res = await api.post('/login', { username, password });
            const user = res.data;

            // 验证是否为管理员角色（超级管理员或普通经理）
            if (user.role !== 'admin' && user.role !== 'super_admin') {
                setError('只有管理员可以登录管理后台');
                return;
            }

            // 存储用户信息
            localStorage.setItem('adminUser', JSON.stringify(user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Leaf className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">FreshTrade 管理后台</h1>
                    <p className="text-slate-500 mt-1">B2B 生鲜系统管理</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">账号名</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="请输入账号名"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">密码</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="请输入密码"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
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
