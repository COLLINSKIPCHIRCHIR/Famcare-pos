import axios from 'axios';

// This logic detects if you are on your local machine or the live server
const isLocal = window.location.hostname === "localhost";

const API_BASE_URL = isLocal 
  ? "http://localhost:5003/api" 
  : "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically add the token to every request if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;