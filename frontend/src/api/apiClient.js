import axios from "axios";

const API = axios.create({
  baseURL: "https://attendance-fw8v.onrender.com",
});

// Automatically attach token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
