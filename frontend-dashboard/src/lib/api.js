import axios from 'axios';

// In dev: Vite proxy forwards /api → localhost:4000
// In prod: VITE_API_URL is set to the Railway backend URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api`
        : '/api',
});

// Attach JWT on every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('kalos_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-logout on 401
api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('kalos_token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
