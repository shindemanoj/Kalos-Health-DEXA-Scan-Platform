import axios from 'axios';

// MemberGPT has no auth — no token injection needed
// In dev: Vite proxy forwards /api → localhost:4000
// In prod: VITE_API_URL is set to the Railway backend URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api`
        : '/api',
});

export default api;
