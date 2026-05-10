import { create } from 'zustand';
import type { AnalysisReport } from '../types/global';

interface ReportState {
  reports: AnalysisReport[];
  currentReport: AnalysisReport | null;
  isLoading: boolean;
  setReports: (reports: AnalysisReport[]) => void;
  setCurrentReport: (report: AnalysisReport | null) => void;
  addReport: (report: AnalysisReport) => void;
  setLoading: (loading: boolean) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  currentReport: null,
  isLoading: false,
  setReports: (reports) => set({ reports }),
  setCurrentReport: (currentReport) => set({ currentReport }),
  addReport: (report) => set((state) => ({ reports: [report, ...state.reports] })),
  setLoading: (isLoading) => set({ isLoading }),
}));
