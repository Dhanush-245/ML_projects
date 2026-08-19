import { apiClient } from './client';

export interface UserProfile {
  id: number | string;
  username: string;
  email: string;
  phone_number?: string | null;
  full_name: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export const authApi = {
  login: async (usernameOrEmailOrPhone: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/auth/login', {
        username_or_email_or_phone: usernameOrEmailOrPhone,
        password: password,
      });
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail);
      }
      throw err;
    }
  },

  register: async (
    username: string, 
    email: string, 
    fullName: string, 
    password: string,
    phoneNumber?: string
  ): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/auth/register', {
        username,
        email,
        full_name: fullName,
        password,
        phone_number: phoneNumber || null,
      });
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail);
      }
      throw err;
    }
  },

  requestOTP: async (contact: string) => {
    try {
      const response = await apiClient.post('/auth/forgot-password/request-otp', { contact });
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail);
      }
      throw err;
    }
  },

  verifyOTP: async (contact: string, otpCode: string) => {
    try {
      const response = await apiClient.post('/auth/forgot-password/verify-otp', {
        contact,
        otp_code: otpCode,
      });
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail);
      }
      throw err;
    }
  },

  resetPassword: async (contact: string, otpCode: string, newPassword: string) => {
    try {
      const response = await apiClient.post('/auth/forgot-password/reset-password', {
        contact,
        otp_code: otpCode,
        new_password: newPassword,
      });
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail);
      }
      throw err;
    }
  },
};
