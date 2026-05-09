import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface GamificationState {
  isInitialized: boolean;
  termsAccepted: boolean;
  deviceId: string | null;
  coins: number;
  attempts: {
    voice: number;
    video: number;
    live: number;
    toxic: number;
  };
  adLimits: {
    voiceDaily: number;
    videoDaily: number;
    videoWeekly: number;
  };
  lastResetDate: string | null;
  lastWeeklyResetDate: string | null;
  
  initializeStore: () => Promise<void>;
  acceptTerms: () => Promise<void>;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  useAttempt: (feature: keyof GamificationState['attempts']) => Promise<boolean>;
  addAttempts: (feature: keyof GamificationState['attempts'], count: number) => Promise<void>;
  watchAd: (type: 'voice' | 'video') => Promise<boolean>;
  resetDailyAttempts: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      termsAccepted: false,
      deviceId: null,
      coins: 100, // Starting bonus
      attempts: {
        voice: 3,
        video: 1,
        live: 0,
        toxic: 5,
      },
      adLimits: {
        voiceDaily: 0,
        videoDaily: 0,
        videoWeekly: 0,
      },
      lastResetDate: null,
      lastWeeklyResetDate: null,

      initializeStore: async () => {
        const state = get();
        if (state.isInitialized) return;

        try {
          // 1. Try to get existing session or sign in anonymously
          const { data: { session } } = await supabase.auth.getSession();
          let user = session?.user;

          if (!user) {
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
            if (authError) throw authError;
            user = authData.user;
          }

          if (!user) throw new Error('Failed to initialize user session');

          const deviceId = user.id;

          // 2. Fetch User Profile for terms_accepted
          const { data: userProfile } = await supabase
            .from('users')
            .select('terms_accepted')
            .eq('id', deviceId)
            .single();

          let termsAccepted = state.termsAccepted;
          if (userProfile) {
            termsAccepted = userProfile.terms_accepted;
          }

          // 3. Check for daily/weekly resets
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          
          // Calculate start of week (Sunday)
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const weekStr = startOfWeek.toISOString().split('T')[0];

          let shouldResetDaily = state.lastResetDate !== todayStr;
          let shouldResetWeekly = state.lastWeeklyResetDate !== weekStr;

          if (shouldResetDaily || shouldResetWeekly) {
            set((s) => ({
              lastResetDate: todayStr,
              lastWeeklyResetDate: shouldResetWeekly ? weekStr : s.lastWeeklyResetDate,
              attempts: {
                ...s.attempts,
                voice: shouldResetDaily ? 3 : s.attempts.voice,
                video: shouldResetDaily ? 1 : s.attempts.video,
              },
              adLimits: {
                ...s.adLimits,
                voiceDaily: shouldResetDaily ? 0 : s.adLimits.voiceDaily,
                videoDaily: shouldResetDaily ? 0 : s.adLimits.videoDaily,
                videoWeekly: shouldResetWeekly ? 0 : s.adLimits.videoWeekly,
              }
            }));
          }

          set({ deviceId, termsAccepted, isInitialized: true });
          
          // Force sync to ensure Supabase matches LocalState
          if (termsAccepted) {
             await get().syncWithSupabase();
          }

        } catch (error) {
          console.error("Failed to initialize gamification store:", error);
          // Fallback to local init if offline
          set({ isInitialized: true });
        }
      },

      acceptTerms: async () => {
        const { deviceId } = get();
        if (!deviceId) return;

        set({ termsAccepted: true });

        // Upsert user profile
        await supabase.from('users').upsert({
          id: deviceId,
          terms_accepted: true
        });

        // Initialize gamification state in DB
        await get().syncWithSupabase();
      },

      syncWithSupabase: async () => {
        const state = get();
        if (!state.deviceId || !state.termsAccepted) return;

        try {
          await supabase.from('user_gamification').upsert({
            user_id: state.deviceId,
            voice_base_attempts: state.attempts.voice,
            video_base_attempts: state.attempts.video,
            voice_ad_attempts_daily: state.adLimits.voiceDaily,
            video_ad_attempts_daily: state.adLimits.videoDaily,
            video_ad_attempts_weekly: state.adLimits.videoWeekly,
            last_daily_reset: new Date().toISOString(),
            last_weekly_reset: new Date().toISOString()
          });
        } catch (error) {
          console.error("Supabase sync failed", error);
        }
      },

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      
      deductCoins: (amount) => {
        const { coins } = get();
        if (coins >= amount) {
          set({ coins: coins - amount });
          return true;
        }
        return false;
      },

      useAttempt: async (feature) => {
        const state = get();
        if (!state.termsAccepted) return false;

        if (state.attempts[feature] > 0) {
          set({
            attempts: {
              ...state.attempts,
              [feature]: state.attempts[feature] - 1,
            },
          });
          await get().syncWithSupabase();
          return true;
        }
        return false;
      },

      addAttempts: async (feature, count) => {
        const state = get();
        set({
          attempts: {
            ...state.attempts,
            [feature]: state.attempts[feature] + count,
          },
        });
        await get().syncWithSupabase();
      },

      watchAd: async (type) => {
        const state = get();
        if (!state.termsAccepted) return false;

        let granted = false;

        if (type === 'voice') {
          if (state.adLimits.voiceDaily < 6) {
            set((s) => ({
              attempts: { ...s.attempts, voice: s.attempts.voice + 1 },
              adLimits: { ...s.adLimits, voiceDaily: s.adLimits.voiceDaily + 1 }
            }));
            granted = true;
          }
        } else if (type === 'video') {
          if (state.adLimits.videoDaily < 3) {
            set((s) => ({
              attempts: { ...s.attempts, video: s.attempts.video + 1 },
              adLimits: { ...s.adLimits, videoDaily: s.adLimits.videoDaily + 1 }
            }));
            granted = true;
          } else if (state.adLimits.videoWeekly < 6) {
            set((s) => ({
              attempts: { ...s.attempts, video: s.attempts.video + 1 },
              adLimits: { ...s.adLimits, videoWeekly: s.adLimits.videoWeekly + 1 }
            }));
            granted = true;
          }
        }

        if (granted) {
          await get().syncWithSupabase();
        }

        return granted;
      },

      resetDailyAttempts: async () => {
        set((s) => ({
          attempts: {
            ...s.attempts,
            voice: 3,
            video: 1,
          },
          adLimits: {
            ...s.adLimits,
            voiceDaily: 0,
            videoDaily: 0
          }
        }));
        await get().syncWithSupabase();
      },
    }),
    {
      name: 'seemepro-gamification',
    }
  )
);
