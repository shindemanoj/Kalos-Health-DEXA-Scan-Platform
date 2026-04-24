import axios from 'axios';

// MemberGPT has no auth — no token injection needed
const api = axios.create({ baseURL: '/api' });

export default api;
