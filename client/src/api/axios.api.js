import axios from "axios";

export const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url.includes('/auth/refresh')) {
                return Promise.reject(error);
            }
            originalRequest._retry = true;
            
            try {
                await API.get('/auth/refresh');
                return API(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);