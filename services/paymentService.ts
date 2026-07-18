import api from './api';

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  payment_method: string;
}

export interface PaymentResponse {
  payment_id: string;
  order_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export const paymentService = {
  createPayment: async (data: CreatePaymentRequest): Promise<PaymentResponse> => {
    const response = await api.post<PaymentResponse>('/payments', data);
    return response.data;
  },

  confirmPayment: async (paymentId: string, reference: string): Promise<PaymentResponse> => {
    const response = await api.post<PaymentResponse>(`/payments/${paymentId}/confirm`, null, {
      params: { reference }
    });
    return response.data;
  }
};
