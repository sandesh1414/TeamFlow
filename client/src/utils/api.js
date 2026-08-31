import axios from 'axios';

const api = axios.create({
  baseURL: 'https://teamflow-qe2b.onrender.com',
});

api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');

  if (user) {
    const { token } = JSON.parse(user);
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

