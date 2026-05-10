import { supabase } from '../lib/supabase';
import type { AnalysisReport } from '../types/global';
import { useReportStore } from '../store/reportStore';

export const saveReportToSupabase = async (report: AnalysisReport) => {
  const { error } = await supabase
    .from('reports')
    .insert([
      {
        user_id: report.userId,
        type: report.type,
        overall_score: report.overallScore,
        timestamp: report.timestamp,
        category_scores: report.categoryScores,
        summary: report.summary,
        strengths: report.strengths,
        areas_to_improve: report.areasToImprove,
        details: report.details,
      },
    ]);

  if (error) {
    console.error('Error saving report:', error.message);
    throw error;
  }
};

export const fetchReportsFromSupabase = async (userId: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error.message);
    throw error;
  }

  return (data as any[]).map((item) => ({
    id: item.id,
    userId: item.user_id,
    type: item.type,
    overallScore: item.overall_score,
    timestamp: item.timestamp,
    categoryScores: item.category_scores,
    summary: item.summary,
    strengths: item.strengths,
    areasToImprove: item.areas_to_improve,
    details: item.details,
  }));
};
