import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginCredentials, RegisterDetails } from '../services/authService';
import api from '../services/api';

interface AuthState {
  token: string | null;
  user_id: string | null;
  defaultLocationName: string | null;
  defaultLatitude: number | null;
  defaultLongitude: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Unified Location State
  isUsingLiveLocation: boolean;
  activeLocationName: string | null;
  activeLatitude: number | null;
  activeLongitude: number | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (details: RegisterDetails) => Promise<void>;
  setDefaultLocation: (name: string, lat: number, lng: number) => void;
  setLiveLocation: (name: string, lat: number, lng: number) => void;
  clearLiveLocation: () => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user_id: null,
  defaultLocationName: null,
  defaultLatitude: null,
  defaultLongitude: null,
  isLoading: false,
  error: null,
  
  isUsingLiveLocation: false,
  activeLocationName: null,
  activeLatitude: null,
  activeLongitude: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user_id', response.user_id);
      
      try {
        const userRes = await api.get(`/users/${response.user_id}`);
        const userData = userRes.data;
        
        if (userData.default_location_name) {
          await AsyncStorage.setItem('defaultLocationName', userData.default_location_name);
          await AsyncStorage.setItem('defaultLatitude', String(userData.default_latitude));
          await AsyncStorage.setItem('defaultLongitude', String(userData.default_longitude));
          
          set({ 
            token: response.token, 
            user_id: response.user_id,
            defaultLocationName: userData.default_location_name,
            defaultLatitude: userData.default_latitude,
            defaultLongitude: userData.default_longitude,
            isLoading: false 
          });
          return;
        }
      } catch (err) {
        console.log("Could not fetch user profile on login", err);
      }
      
      set({ token: response.token, user_id: response.user_id, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed. Please check your credentials.',
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (details: RegisterDetails) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(details);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user_id', response.user_id);
      if (details.defaultLocationName) {
        await AsyncStorage.setItem('defaultLocationName', details.defaultLocationName);
        await AsyncStorage.setItem('defaultLatitude', String(details.defaultLatitude));
        await AsyncStorage.setItem('defaultLongitude', String(details.defaultLongitude));
      }
      set({ 
        token: response.token, 
        user_id: response.user_id, 
        defaultLocationName: details.defaultLocationName || null,
        defaultLatitude: details.defaultLatitude || null,
        defaultLongitude: details.defaultLongitude || null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Registration failed. Please try again.',
        isLoading: false 
      });
      throw error;
    }
  },

  setDefaultLocation: async (name: string, lat: number, lng: number) => {
    await AsyncStorage.setItem('defaultLocationName', name);
    await AsyncStorage.setItem('defaultLatitude', String(lat));
    await AsyncStorage.setItem('defaultLongitude', String(lng));
    const state = get();
    set({
      defaultLocationName: name,
      defaultLatitude: lat,
      defaultLongitude: lng,
      // Update active if not using live location
      ...(!state.isUsingLiveLocation && {
        activeLocationName: name,
        activeLatitude: lat,
        activeLongitude: lng
      })
    });
  },

  setLiveLocation: (name: string, lat: number, lng: number) => {
    set({
      isUsingLiveLocation: true,
      activeLocationName: name,
      activeLatitude: lat,
      activeLongitude: lng
    });
  },

  clearLiveLocation: () => {
    const state = get();
    set({
      isUsingLiveLocation: false,
      activeLocationName: state.defaultLocationName,
      activeLatitude: state.defaultLatitude,
      activeLongitude: state.defaultLongitude
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user_id');
    await AsyncStorage.removeItem('defaultLocationName');
    await AsyncStorage.removeItem('defaultLatitude');
    await AsyncStorage.removeItem('defaultLongitude');
    set({ 
      token: null, 
      user_id: null,
      defaultLocationName: null,
      defaultLatitude: null,
      defaultLongitude: null
    });
  },

  hydrate: async () => {
    const token = await AsyncStorage.getItem('token');
    const user_id = await AsyncStorage.getItem('user_id');
    const defaultLocationName = await AsyncStorage.getItem('defaultLocationName');
    const defaultLatitude = await AsyncStorage.getItem('defaultLatitude');
    const defaultLongitude = await AsyncStorage.getItem('defaultLongitude');
    
    if (token) {
      set({ 
        token, 
        user_id,
        defaultLocationName: defaultLocationName || null,
        defaultLatitude: defaultLatitude ? parseFloat(defaultLatitude) : null,
        defaultLongitude: defaultLongitude ? parseFloat(defaultLongitude) : null,
        activeLocationName: defaultLocationName || null,
        activeLatitude: defaultLatitude ? parseFloat(defaultLatitude) : null,
        activeLongitude: defaultLongitude ? parseFloat(defaultLongitude) : null,
        isUsingLiveLocation: false
      });
    }
  }
}));
