import api from './api';

export interface PrintSettingsRequest {
  order_id: string;
  copies: number;
  color_mode: 'Black_and_White' | 'Colored';
  sided: 'Double_sided' | 'Single_sided';
  page_range: string;
}

export interface PrintSettingsResponse extends PrintSettingsRequest {
  setting_id: string;
  created_at: string;
}

export const printSettingsService = {
  createPrintSettings: async (data: PrintSettingsRequest): Promise<PrintSettingsResponse> => {
    const response = await api.post<PrintSettingsResponse>('/printsettings', data);
    return response.data;
  },

  getPrintSettings: async (settingsId: string): Promise<PrintSettingsResponse> => {
    const response = await api.get<PrintSettingsResponse>(`/printsettings/${settingsId}`);
    return response.data;
  }
};
