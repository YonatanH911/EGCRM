import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
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
            if (path !== '/login') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
