import api from './api';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterDetails {
  fullname: string;
  email: string;
  phoneNumber: string;
  password?: string;
  defaultLocationName?: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
}

export interface AuthResponse {
  token: string;
  userId?: string;
  user_id?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/auth/authenticate', credentials);
    return response.data;
  },
  
  register: async (details: RegisterDetails): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/auth/register', details);
    return response.data;
  },

  updateDefaultLocation: async (userId: string, locationName: string, latitude: number, longitude: number) => {
    const response = await api.put(`/users/${userId}/default-location`, {
      locationName,
      latitude,
      longitude
    });
    return response.data;
  }
};
