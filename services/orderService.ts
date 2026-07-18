import api from './api';

export interface CreateOrderRequest {
  student_id: string;
  shop_id: string;
}

export interface OrderResponse {
  order_id: string;
  student_id: string;
  pickup_code: string;
  status: string;
  estimated_ready_time: string;
  priority: number;
  submitted_at: string;
}

export const orderService = {
  createOrder: async (data: CreateOrderRequest): Promise<OrderResponse> => {
    const response = await api.post<OrderResponse>('/orders', data);
    return response.data;
  },
  
  getOrder: async (orderId: string): Promise<OrderResponse> => {
    const response = await api.get<OrderResponse>(`/orders/${orderId}`);
    return response.data;
  }
};
