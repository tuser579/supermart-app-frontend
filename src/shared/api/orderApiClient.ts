import axios from 'axios';
import { API_BASE_URL } from './axiosConfig';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || API_BASE_URL || 'https://your-supermart-api.up.railway.app/api/v1';

export const orderApiClient = {
  // Place Order (User)
  createOrder: async (token: string, payload: { deliveryAddress: any; paymentMethod: string; notes?: string }) => {
    const res = await axios.post(`${BASE_URL}/orders`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Update Order Status (Staff / Admin)
  updateOrderStatus: async (token: string, orderId: string, status: string, notes?: string) => {
    const res = await axios.put(`${BASE_URL}/orders/${orderId}/status`, { status, notes }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Record Cash / Online Payment (User / Staff / Admin)
  recordPayment: async (token: string, orderId: string, paymentMethod = 'COD', transactionId?: string) => {
    const res = await axios.post(`${BASE_URL}/orders/${orderId}/pay`, { paymentMethod, transactionId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Admin Mobile Banking Transaction Verification (Admin)
  verifyPayment: async (adminToken: string, orderId: string, isValid: boolean, reason?: string) => {
    const res = await axios.post(`${BASE_URL}/orders/${orderId}/verify-payment`, { isValid, reason }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.data;
  },

  // Staff Quick Options & Cash Metrics
  getStaffQuickOptions: async (staffToken: string) => {
    const res = await axios.get(`${BASE_URL}/staff/quick-options`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    return res.data;
  },

  // Admin Quick Options & Dashboard Stats
  getAdminQuickOptions: async (adminToken: string) => {
    const res = await axios.get(`${BASE_URL}/admin/quick-options`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.data;
  },

  getAdminDashboard: async (adminToken: string) => {
    const res = await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.data;
  }
};
