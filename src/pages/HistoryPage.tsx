import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../store/toastStore';
import { TrendingUp, RefreshCw, Video, Mic, Activity, Download, Clock, Award, ChevronRight } from 'lucide-react';
import type { AnalysisReport } from '../types/global';

const typeIcon = (type: string) => {
  if (type === 'video') return <Video size={20} />;
  if (type === 'voice') return <Mic size={20} />;
  return <Activity size={20} />;
};

const typeColor = (type: string) => {
  if (type === 'video') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (type === 'voice') return 'bg-green-500/20 text-green-400 border-green-500/30';
  return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
};

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

const HistoryPage = () => {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadReports = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', uid)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: AnalysisReport[] = (data ?? []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        type: item.type,
        overallScore: item.overall_score,
        timestamp: item.timestamp,
        categoryScores: item.category_scores ?? {},
        summary: item.summary ?? '',
        strengths: item.strengths ?? [],
        areasToImprove: item.areas_to_improve ?? [],
        details: item.details ?? {},
      }));

      setReports(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load history.';
      useToastStore.getState().addToast('error', msg);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await loadReports(user.id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleRefresh = async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await loadReports(userId);
    setTimeout(() => setIsRefreshing(false), 800);
    useToastStore.getState().addToast('success', 'History refreshed.');
  };

  const avgScore = reports.length
    ? Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / reports.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="text-brand-secondary">Review your past performance and track improvements.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-brand-secondary transition-all disabled:opacity-50"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Bar */}
      {reports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Sessions', value: reports.length, icon: <Award size={18} />, color: 'text-brand-ai' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: <TrendingUp size={18} />, color: scoreColor(avgScore) },
            { label: 'Video Sessions', value: reports.filter(r => r.type === 'video').length, icon: <Video size={18} />, color: 'text-blue-400' },
            { label: 'Voice Sessions', value: reports.filter(r => r.type === 'voice').length, icon: <Mic size={18} />, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-5 rounded-2xl flex items-center space-x-4">
              <div className={`${stat.color} p-2 bg-white/5 rounded-xl`}>{stat.icon}</div>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-brand-secondary">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-ai/30 border-t-brand-ai rounded-full animate-spin" />
          <p className="text-brand-secondary animate-pulse">Syncing with secure database...</p>
        </div>
      ) : !userId ? (
        <div className="glass-panel p-20 rounded-3xl text-center space-y-4">
          <TrendingUp size={64} className="mx-auto text-brand-secondary/30" />
          <h3 className="text-xl font-medium">Not logged in</h3>
          <p className="text-brand-secondary">Sign in to see your analysis history.</p>
        </div>
      ) : reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-20 rounded-3xl text-center space-y-4"
        >
          <TrendingUp size={64} className="mx-auto text-brand-secondary/30" />
          <h3 className="text-xl font-medium">No analyses found</h3>
          <p className="text-brand-secondary">Start your first AI-powered session to build your history.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {reports.map((report, idx) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.04 }}
                className="glass-card p-6 rounded-3xl hover:border-brand-ai/50 transition-all group relative overflow-hidden cursor-pointer"
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-ai/0 to-brand-ai/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

                {/* Type + Date */}
                <div className="flex items-center justify-between mb-5 relative">
                  <div className={`p-2 rounded-xl border ${typeColor(report.type)}`}>
                    {typeIcon(report.type)}
                  </div>
                  <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest flex items-center">
                    <Clock size={10} className="mr-1" />
                    {new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-1 capitalize">{report.type} Analysis</h3>
                <p className="text-sm text-brand-secondary mb-5 line-clamp-2">{report.summary || 'No summary available.'}</p>

                {/* Scores */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-black/20 p-3 rounded-2xl">
                    <p className="text-[10px] text-brand-secondary uppercase mb-1">Overall Score</p>
                    <p className={`text-2xl font-bold ${scoreColor(report.overallScore)}`}>{report.overallScore}%</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-2xl">
                    <p className="text-[10px] text-brand-secondary uppercase mb-1">Confidence</p>
                    <p className={`text-2xl font-bold ${scoreColor(report.categoryScores?.confidence ?? 0)}`}>
                      {report.categoryScores?.confidence ?? '—'}%
                    </p>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expanded === report.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 pt-4 space-y-3">
                        {report.strengths?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-green-400 uppercase font-semibold mb-1">Strengths</p>
                            <ul className="space-y-1">
                              {report.strengths.slice(0, 3).map((s, i) => (
                                <li key={i} className="text-xs text-white/80 flex items-start">
                                  <span className="w-1 h-1 bg-green-500 rounded-full mr-1.5 mt-1.5 shrink-0" />{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {report.areasToImprove?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-orange-400 uppercase font-semibold mb-1">To Improve</p>
                            <ul className="space-y-1">
                              {report.areasToImprove.slice(0, 2).map((a, i) => (
                                <li key={i} className="text-xs text-white/80 flex items-start">
                                  <span className="w-1 h-1 bg-orange-500 rounded-full mr-1.5 mt-1.5 shrink-0" />{a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {report.categoryScores && Object.keys(report.categoryScores).length > 0 && (
                          <div className="space-y-2">
                            {(Object.entries(report.categoryScores) as [string, number | undefined][]).map(([k, v]) => v !== undefined && (
                              <div key={k}>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                  <span className="text-brand-secondary uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-white">{v}%</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${v}%` }}
                                    transition={{ duration: 0.6 }}
                                    className="h-full rounded-full bg-brand-ai"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expand toggle */}
                <button className="w-full py-2.5 rounded-xl bg-white/5 group-hover:bg-brand-ai/20 text-white text-xs font-medium transition-all flex items-center justify-center space-x-2 mt-2">
                  <span>{expanded === report.id ? 'Collapse' : 'View Details'}</span>
                  <ChevronRight size={14} className={`transition-transform ${expanded === report.id ? 'rotate-90' : ''}`} />
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
