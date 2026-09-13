import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  BrainCircuit,
  Sparkles,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useWords } from '../../context/WordContext';
import { useAuth } from '../../context/AuthContext';
import { CEFRLevel } from '../../types';

const LEVEL_HEX_COLORS: Record<CEFRLevel, string> = {
  A1: '#10b981', // emerald
  A2: '#14b8a6', // teal
  B1: '#0ea5e9', // sky
  B2: '#6366f1', // indigo
  C1: '#8b5cf6', // purple
  C2: '#f43f5e', // rose
};

const MASTERY_COLORS = {
  new: '#94a3b8',       // slate-400
  learning: '#f59e0b',  // amber-500
  reviewing: '#6366f1', // indigo-500
  mastered: '#10b981',  // emerald-500
};

export const AnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const { words, levelCounts, activityLogs, wordsDueToday, todayReviewsCount } = useWords();

  // 1. Level Distribution Data for BarChart
  const levelChartData = useMemo(() => {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels.map((lvl) => ({
      level: lvl,
      count: levelCounts[lvl] || 0,
      fill: LEVEL_HEX_COLORS[lvl],
    }));
  }, [levelCounts]);

  // 2. Mastery breakdown for Donut Chart
  const masteryData = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let reviewingCount = 0;
    let masteredCount = 0;

    words.forEach((w) => {
      if (w.masteryStatus === 'new') newCount++;
      else if (w.masteryStatus === 'learning') learningCount++;
      else if (w.masteryStatus === 'reviewing') reviewingCount++;
      else if (w.masteryStatus === 'mastered') masteredCount++;
    });

    return [
      { name: 'Yeni', count: newCount, color: MASTERY_COLORS.new },
      { name: 'Öğreniliyor', count: learningCount, color: MASTERY_COLORS.learning },
      { name: 'Pekiştiriliyor', count: reviewingCount, color: MASTERY_COLORS.reviewing },
      { name: 'Kalıcı / Usta', count: masteredCount, color: MASTERY_COLORS.mastered },
    ];
  }, [words]);

  // 3. Activity Trend Data (Last 7-10 Days)
  const activityData = useMemo(() => {
    return activityLogs.slice(-10).map((log) => {
      const parts = log.date.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}`;
      const accuracy =
        log.reviewsCount > 0
          ? Math.round((log.correctReviews / log.reviewsCount) * 100)
          : 100;
      return {
        date: formattedDate,
        reviews: log.reviewsCount,
        accuracy,
        newWords: log.newWordsAdded,
      };
    });
  }, [activityLogs]);

  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.masteryStatus === 'mastered').length;
  const retentionRate = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
  const dailyGoal = user?.dailyGoal || 10;
  const goalProgress = Math.min(100, Math.round((todayReviewsCount / dailyGoal) * 100));

  // Custom Tooltip for Level Bar Chart
  const CustomLevelTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg">
          <p className="font-bold">{data.level} Seviyesi</p>
          <p className="text-slate-300">
            {data.count} kelime ({totalWords > 0 ? Math.round((data.count / totalWords) * 100) : 0}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Welcome & Motivation Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Öğrenme & Kalıcılık Analizi
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit'] mb-2">
            Harika İlerliyorsun, {user?.name || 'Öğrenci'}!
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Aralıklı tekrar algoritmasıyla hafızana kazıdığın kelimelerin durumunu, seviye dağılımını ve çalışma performansını buradan canlı olarak takip edebilirsin.
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Words */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Toplam Kelime</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalWords}</p>
          <span className="text-[11px] text-slate-700">Kayıtlı ve takipteler</span>
        </div>

        {/* Due Words Today */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Tekrar Bekleyen</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {wordsDueToday.length} <span className="text-base font-semibold text-slate-700">kelime</span>
          </p>
          <span className="text-[11px] text-slate-700">Bugün çalışılmaya hazır</span>
        </div>

        {/* Today's Goal Progress */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Bugünkü Hedef</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {todayReviewsCount} <span className="text-sm font-semibold text-slate-700">/ {dailyGoal}</span>
          </p>
          <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        {/* Retention Rate */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Kalıcılık Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            %{retentionRate}
          </p>
          <span className="text-[11px] text-slate-700">{masteredWords} kelime kalıcı hafızada</span>
        </div>
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Words by CEFR Level */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Seviyelere Göre Kelime Dağılımı
              </h3>
              <p className="text-xs text-slate-700">CEFR standartlarında kelime portföyün</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              A1 → C2
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="level" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomLevelTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={34}>
                  {levelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Level Pills Legend */}
          <div className="grid grid-cols-6 gap-1 pt-2 border-t border-slate-100 text-center">
            {levelChartData.map((item) => (
              <div key={item.level} className="py-1">
                <span className="block text-[11px] font-extrabold text-slate-700">{item.level}</span>
                <span className="block text-xs font-bold" style={{ color: item.fill }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Spaced Repetition Mastery Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-emerald-600" />
                Hafıza & Kalıcılık Durumu (SRS)
              </h3>
              <p className="text-xs text-slate-700">Aralıklı tekrar algoritmasındaki aşamalar</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              %{retentionRate} Kalıcı
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={masteryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val} kelime (%${totalWords > 0 ? Math.round((val / totalWords) * 100) : 0})`,
                    name,
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Mastery Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            {masteryData.map((item) => (
              <div key={item.name} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-semibold text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Weekly Activity AreaChart */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Son Günlerin Tekrar Aktivitesi
            </h3>
            <p className="text-xs text-slate-700">Günlük tamamlanan tekrar ve çalışma hacmi</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
            Tekrar Sayısı
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                formatter={(val: number) => [`${val} Tekrar`, 'Tamamlanan']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="reviews"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorReviews)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Motivational Badges Grid */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Kazanılan Başarı Rozetleri
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              🌱
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Kelime Kaşifi</p>
              <p className="text-[11px] text-slate-700">10+ kelime kaydettin</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              ⭐
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Hedef Avcısı</p>
              <p className="text-[11px] text-slate-700">Günlük hedefleri yakala</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              🧠
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Çelik Hafıza</p>
              <p className="text-[11px] text-slate-700">5+ kalıcı kelime</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              🎯
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">B2 ve Üstü</p>
              <p className="text-[11px] text-slate-700">İleri seviye kelimeler</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
