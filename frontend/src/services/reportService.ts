import api from './api';
import type { Report, GenerateReportRequest, ReportStats } from '../types';

export const reportService = {
  getReports: async (typeFilter?: string): Promise<Report[]> => {
    const params = typeFilter && typeFilter !== 'ALL' ? { type: typeFilter } : {};
    const { data } = await api.get<Report[]>('/reports', { params });
    return data;
  },

  getReportStats: async (): Promise<ReportStats> => {
    const { data } = await api.get<ReportStats>('/reports/stats');
    return data;
  },

  generateReport: async (payload: GenerateReportRequest): Promise<Report> => {
    const { data } = await api.post<Report>('/reports/generate', payload);
    return data;
  },

  downloadReport: async (id: string | number, customFilename?: string): Promise<void> => {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', customFilename || `FarmVerse_Agronomy_Report_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  previewReportUrl: async (id: string | number): Promise<string> => {
    const response = await api.get(`/reports/${id}/preview`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return window.URL.createObjectURL(blob);
  },

  deleteReport: async (id: string | number): Promise<void> => {
    await api.delete(`/reports/${id}`);
  },
};

export default reportService;
