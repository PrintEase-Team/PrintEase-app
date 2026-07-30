import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// -------------------------------------------------------------------
// IMPORTANT: UPDATE THIS IP ADDRESS WHENEVER YOU CHANGE NETWORKS/PCS!
// -------------------------------------------------------------------
const YOUR_CURRENT_IP = "10.167.0.240"; // <-- Change this to your PC's IP address

const BASE_URL = `http://${YOUR_CURRENT_IP}:8080/api`;
export const API_BASE = BASE_URL.replace("/api", "");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token && !config.url?.includes("/auth/")) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token from AsyncStorage", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token is likely expired or invalid
      console.warn("401 Unauthorized received. Logging out user.");

      // Clear token and user state
      const { useAuthStore } = require("@/store/useAuthStore");
      await useAuthStore.getState().logout();

      // Redirect to login screen
      const { router } = require("expo-router");
      router.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
