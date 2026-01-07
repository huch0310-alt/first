import axios from 'axios';

// 动态获取 API 地址，支持局域网访问
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:3000/api`;
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
});

export default api;
