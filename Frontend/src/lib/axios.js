import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
