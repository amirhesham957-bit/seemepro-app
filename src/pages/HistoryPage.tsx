import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { fetchReportsFromSupabase } from '../lib/reportService';
import { useReportStore } from '../store/reportStore';
import { useToastStore } from '../store/toastStore';
import { TrendingUp, Clock, Award, FileText, ChevronRight, Download, RefreshCw, Video, Mic, Activity } from 'lucide-react';
import { AnalysisReport } from '../types/global';

const HistoryPage = () => {
  const { reports, setReports, isLoading, setLoading } = useReportStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fetchedReports = await fetchReportsFromSupabase(user.id);
        setReports(fetchedReports);
      }
    } catch (error) {
      useToastStore.getState().addToast('error', 'Failed to load history.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReports();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="text-brand-secondary">Review your past performance and track improvements.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-brand-secondary transition-all"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-ai/30 border-t-brand-ai rounded-full animate-spin" />
          <p className="text-brand-secondary animate-pulse">Syncing with secure database...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-panel p-20 rounded-3xl text-center space-y-4">
          <TrendingUp size={64} className="mx-auto text-brand-secondary/30" />
          <h3 className="text-xl font-medium">No analyses found</h3>
          <p className="text-brand-secondary">Start your first AI-powered session to build your history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card p-6 rounded-3xl hover:border-brand-ai/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-2">
                    <button className="p-2 bg-white/10 rounded-lg hover:bg-brand-ai hover:text-white transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl ${
                    report.type === 'video' ? 'bg-blue-500/20 text-blue-400' :
                    report.type === 'voice' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {report.type === 'video' ? <Video size={20} /> : report.type === 'voice' ? <Mic size={20} /> : <Activity size={20} />}
                  </div>
                  <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-1 truncate">{report.type.toUpperCase()} Analysis</h3>
                <p className="text-sm text-brand-secondary mb-4 line-clamp-2">{report.summary}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/20 p-3 rounded-2xl">
                    <p className="text-[10px] text-brand-secondary uppercase mb-1">Score</p>
                    <p className="text-xl font-bold text-gradient">{report.overallScore}%</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-2xl">
                    <p className="text-[10px] text-brand-secondary uppercase mb-1">Confidence</p>
                    <p className="text-xl font-bold text-brand-ai">High</p>
                  </div>
                </div>

                <button className="w-full py-3 rounded-xl bg-white/5 group-hover:bg-brand-ai/20 text-white text-sm font-medium transition-all flex items-center justify-center space-x-2">
                  <span>View Full Report</span>
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default HistoryPage;
