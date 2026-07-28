import { get, post, put, del, patch } from '../../../shared/api/apiClient';
import { Address, CreateAddressPayload, UpdateAddressPayload } from '../../../shared/types/address.types';

export async function fetchAddresses(): Promise<Address[]> {
  return get<Address[]>('/addresses');
}

export async function createAddress(payload: CreateAddressPayload): Promise<Address> {
  return post<Address>('/addresses', payload as unknown as Record<string, unknown>);
}

export async function updateAddress(id: string, payload: UpdateAddressPayload): Promise<Address> {
  return put<Address>(`/addresses/${id}`, payload as unknown as Record<string, unknown>);
}

export async function deleteAddress(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<Address> {
  return patch<Address>(`/addresses/${id}/default`);
}
