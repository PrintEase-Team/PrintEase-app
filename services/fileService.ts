import api from './api';
import { Platform } from 'react-native';

export interface FileUploadInfo {
  uri: string;
  name: string;
  mimeType: string;
}

export interface FileResponse {
  file_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  page_count: number;
}

export const fileService = {
  uploadFile: async (orderId: string, uploadedBy: string, fileInfo: FileUploadInfo): Promise<FileResponse> => {
    const formData = new FormData();
    
    formData.append('order_id', orderId);
    formData.append('uploaded_by', uploadedBy);
    
    // Create file object for React Native FormData
    formData.append('file', {
      uri: Platform.OS === 'ios' ? fileInfo.uri.replace('file://', '') : fileInfo.uri,
      name: fileInfo.name,
      type: fileInfo.mimeType || 'application/pdf',
    } as any);

    const response = await api.post<FileResponse>('/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  getFile: async (fileId: string): Promise<FileResponse> => {
    const response = await api.get<FileResponse>(`/file/${fileId}`);
    return response.data;
  }
};
