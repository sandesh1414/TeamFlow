import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const { token } = JSON.parse(user);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
