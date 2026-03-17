import axios from 'axios';

// Determine the base URL. If NEXT_PUBLIC_API_URL is set (e.g., http://192.168.2.122), 
// we must ensure it ends with '/api' so it hits the Nginx proxy correctly.
let baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
if (baseUrl && !baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
} else if (!baseUrl) {
    baseUrl = '/api';
}

const api = axios.create({
    baseURL: baseUrl,
});

// Attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// If the server returns 401 (expired / invalid token), log the user out
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined' && error.response?.status === 401) {
            // Only redirect if we're NOT already on the login or register page
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/register') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
