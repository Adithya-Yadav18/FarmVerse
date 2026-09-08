import api from './api';
import type {
  CreditScoreResponse,
  LoanOffer,
  LoanApplication,
  ApplyLoanPayload,
  ReviewLoanPayload,
  SahayakRequestPayload,
  SahayakResponse,
  KendraCenter,
} from '../types';

export const creditService = {
  // Get farmer's credit score & telemetry breakdown
  getCreditScore: async (farmId?: number): Promise<CreditScoreResponse> => {
    const res = await api.get('/credit/score', { params: { farmId } });
    return res.data;
  },

  // Recalculate credit score with latest live farm telemetry
  recalculateScore: async (farmId?: number): Promise<CreditScoreResponse> => {
    const res = await api.post('/credit/recalculate', null, { params: { farmId } });
    return res.data;
  },

  // Get pre-approved micro-loan and KCC offers
  getLoanOffers: async (farmId?: number): Promise<LoanOffer[]> => {
    const res = await api.get('/credit/offers', { params: { farmId } });
    return res.data;
  },

  // Apply for a loan with 1-click farm telemetry passport
  applyForLoan: async (payload: ApplyLoanPayload): Promise<LoanApplication> => {
    const res = await api.post('/credit/apply', payload);
    return res.data;
  },

  // Get loan applications ledger
  getApplications: async (farmId?: number): Promise<LoanApplication[]> => {
    const res = await api.get('/credit/applications', { params: { farmId } });
    return res.data;
  },

  // Admin/Bank: Review loan application
  reviewApplication: async (id: number, payload: ReviewLoanPayload): Promise<LoanApplication> => {
    const res = await api.put(`/credit/applications/${id}/review`, payload);
    return res.data;
  },

  // Agronomist: Endorse farm creditworthiness
  endorseFarm: async (farmId: number, notes: string): Promise<CreditScoreResponse> => {
    const res = await api.post('/credit/endorse', { agronomistNotes: notes }, { params: { farmId } });
    return res.data;
  },

  // Kisan Sahayak: Doorstep visit or phone callback request
  requestSahayak: async (payload: SahayakRequestPayload): Promise<SahayakResponse> => {
    const res = await api.post('/credit/request-sahayak', payload);
    return res.data;
  },

  // Physical CSC Kendras & Rural Bank Branches Locator
  getKendraCenters: async (farmId?: number): Promise<KendraCenter[]> => {
    const res = await api.get('/credit/kendra-locator', { params: { farmId } });
    return res.data;
  },
};

