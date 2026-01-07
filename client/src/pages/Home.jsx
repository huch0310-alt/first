import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来, 管理员</h1>
                <p className="text-slate-500">今天是 2026年1月5日，系统运行正常。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/customer" className="card p-8 hover:border-blue-500 transition-colors group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600">客户端入口</h3>
                    <p className="text-slate-500 mb-4">模拟客户下单流程，体验自动折扣计算与购物车功能。</p>
                    <div className="flex items-center text-blue-600 font-medium">
                        进入系统 <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link to="/manager" className="card p-8 hover:border-blue-500 transition-colors group">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600">管理驾驶舱</h3>
                    <p className="text-slate-500 mb-4">查看实时经营数据，审核订单，打印每日对账单。</p>
                    <div className="flex items-center text-blue-600 font-medium">
                        查看报表 <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Home;
