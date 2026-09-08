import api from './api';
import type {
  CarbonAuditRequest,
  CarbonAuditResult,
  CarbonCreditListing,
  ListCreditsPayload,
  BuyCreditPayload,
  CertificateReceipt
} from '../types';

export const carbonService = {
  audit: async (request: CarbonAuditRequest): Promise<CarbonAuditResult> => {
    const { data } = await api.post<CarbonAuditResult>('/carbon/audit', request);
    return data;
  },

  getLatestAudit: async (farmId: number | string): Promise<CarbonAuditResult> => {
    const { data } = await api.get<CarbonAuditResult>(`/carbon/farms/${farmId}/latest`);
    return data;
  },

  listCredits: async (payload: ListCreditsPayload): Promise<CarbonCreditListing> => {
    const { data } = await api.post<CarbonCreditListing>('/carbon/credits/list', payload);
    return data;
  },

  getMarketplace: async (): Promise<CarbonCreditListing[]> => {
    const { data } = await api.get<CarbonCreditListing[]>('/carbon/marketplace');
    return data;
  },

  buyCredits: async (listingId: number | string, payload: BuyCreditPayload): Promise<CertificateReceipt> => {
    const { data } = await api.post<CertificateReceipt>(`/carbon/credits/${listingId}/buy`, payload);
    return data;
  }
};

export default carbonService;
