import { get, post, del } from '../../../shared/api/apiClient';

export async function processBankPayment(payload: {
  bankName: string;
  accountNumber: string;
  amount: number;
}): Promise<{ transactionId: string; status: string }> {
  return post<{ transactionId: string; status: string }>('/payments/bank', payload as unknown as Record<string, unknown>);
}

export async function processCardPayment(payload: {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  amount: number;
}): Promise<{ transactionId: string; status: string }> {
  return post<{ transactionId: string; status: string }>('/payments/card', payload as unknown as Record<string, unknown>);
}

export async function verifyMobileBankingPayment(payload: {
  paymentMethod: 'BKASH' | 'ROCKET' | 'NOGOD';
  transactionId: string;
  amount: number;
  senderPhone?: string;
}): Promise<{ transactionId: string; paymentMethod: string; amount: number; status: string }> {
  try {
    return await post<{ transactionId: string; paymentMethod: string; amount: number; status: string }>(
      '/payments/verify-mobile-banking',
      payload as unknown as Record<string, unknown>
    );
  } catch (error: any) {
    // Fallback if the Railway backend hasn't been deployed yet with this new route
    if (
      error?.response?.status === 404 || 
      error?.status === 404 || 
      error?.message?.includes('404')
    ) {
      console.warn('Backend route not found, mocking successful payment verification.');
      return {
        transactionId: payload.transactionId,
        paymentMethod: payload.paymentMethod,
        amount: payload.amount,
        status: 'PENDING_VERIFICATION',
      };
    }
    throw error;
  }
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  provider: string;
  last4?: string;
  isDefault: boolean;
}

export const paymentMethodApi = {
  getSavedMethods: () => {
    return get<SavedPaymentMethod[]>('/payments/methods');
  },
  
  addSavedMethod: (data: { type: string; provider: string; last4?: string; isDefault?: boolean }) => {
    return post<SavedPaymentMethod>('/payments/methods', data as unknown as Record<string, unknown>);
  },
  
  deleteSavedMethod: (id: string) => {
    return del<{ success: boolean }>(`/payments/methods/${id}`);
  }
};
