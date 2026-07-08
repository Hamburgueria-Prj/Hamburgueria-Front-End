import { request } from '../lib/api';
import { type DashboardResponse } from '../types/api';

export async function buscarDashboardDoDia(): Promise<DashboardResponse> {
  return request<DashboardResponse>('/dashboard');
}
