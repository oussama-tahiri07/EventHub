import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Users,
  UserCheck,
  TrendingUp,
  MapPin,
  ArrowRight,
  RefreshCw,
  PieChart,
  BarChart3,
} from 'lucide-react';

export const Dashboard = ({ onOpenRegisterModal }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
      setError('Impossible de charger les statistiques.');
      toast.error('Impossible de charger les statistiques du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Chargement des données EventHub...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-between">
          <p>{error || 'Erreur inconnue'}</p>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate status breakdown totals
  const totalBreakdown = stats.statusBreakdown?.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const getStatusCount = (st) => stats.statusBreakdown?.find((s) => s.status === st)?.count || 0;

  // Max value for 7-day trend graph scaling
  const maxTrendCount = Math.max(...(stats.dailyTrend?.map((d) => d.count) || [1]), 1);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Indicateurs clés de performance, graphiques de tendance et synthèse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              toast.info('Statistiques actualisées');
            }}
            title="Rafraîchir"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenRegisterModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition active:scale-[0.98]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Inscrire un participant</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: The 4 required metrics + complementary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Événements"
          value={stats.totalEvents}
          subtitle={`Dont ${stats.draftEvents || 0} brouillon(s)`}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Événements Publiés"
          value={stats.publishedEvents}
          subtitle="Disponibles aux inscriptions"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Inscriptions du Jour"
          value={stats.registrationsToday}
          subtitle="Enregistrées aujourd'hui"
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="Participants Référencés"
          value={stats.totalParticipants}
          subtitle={`${stats.totalRegistrations} réservations actives`}
          icon={Users}
          color="amber"
        />
      </div>

      {/* Visual Analytics Row: 7-Day Trend Chart + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Days Activity Histogram */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Tendance des Inscriptions (7 Derniers Jours)
                </h3>
                <p className="text-xs text-slate-400">Volume quotidien d'inscriptions</p>
              </div>
            </div>
          </div>

          {/* SVG/CSS Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {stats.dailyTrend?.map((item, idx) => {
              const heightPct = Math.max(12, Math.round((item.count / maxTrendCount) * 100));
              const isToday = idx === stats.dailyTrend.length - 1;

              return (
                <div key={item.date_label} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[11px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div className="w-full bg-slate-800/80 rounded-xl h-36 flex items-end p-1 overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-lg transition-all duration-700 ${
                        isToday
                          ? 'bg-gradient-to-t from-purple-600 via-indigo-500 to-violet-400 shadow-lg shadow-purple-500/20'
                          : 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-indigo-600 group-hover:to-purple-500'
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${isToday ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                    {item.date_label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution Pie/Bar Card */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Répartition des Statuts
                </h3>
                <p className="text-xs text-slate-400">État de toutes les inscriptions</p>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3.5 bg-slate-800 rounded-full flex overflow-hidden p-0.5 gap-0.5 mb-6">
              <div
                style={{ width: `${(getStatusCount('confirmed') / totalBreakdown) * 100}%` }}
                className="bg-cyan-400 rounded-l-full h-full"
                title={`Confirmés: ${getStatusCount('confirmed')}`}
              />
              <div
                style={{ width: `${(getStatusCount('pending') / totalBreakdown) * 100}%` }}
                className="bg-amber-400 h-full"
                title={`En attente: ${getStatusCount('pending')}`}
              />
              <div
                style={{ width: `${(getStatusCount('waitlist') / totalBreakdown) * 100}%` }}
                className="bg-purple-400 h-full"
                title={`Liste d'attente: ${getStatusCount('waitlist')}`}
              />
              <div
                style={{ width: `${(getStatusCount('cancelled') / totalBreakdown) * 100}%` }}
                className="bg-rose-500 rounded-r-full h-full"
                title={`Annulés: ${getStatusCount('cancelled')}`}
              />
            </div>

            {/* Status Legend & Counts */}
            <div className="space-y-3">
              {[
                { label: 'Confirmés', count: getStatusCount('confirmed'), color: 'bg-cyan-400' },
                { label: 'En attente', count: getStatusCount('pending'), color: 'bg-amber-400' },
                { label: 'Liste d\'attente', count: getStatusCount('waitlist'), color: 'bg-purple-400' },
                { label: 'Annulés', count: getStatusCount('cancelled'), color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-bold text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
            Total : <strong className="text-white">{totalBreakdown}</strong> inscriptions traitées
          </div>
        </div>
      </div>

      {/* Top 5 Most Filled Events (Requirement #5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Top 5 — Événements les Plus Remplis
                </h2>
                <p className="text-xs text-slate-400">Classement selon le taux de remplissage</p>
              </div>
            </div>
            <Link
              to="/events"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
            >
              <span>Tous les événements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-semibold">Événement</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 font-semibold text-right">Inscrits / Capacité</th>
                  <th className="pb-3 font-semibold text-right">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.top5Events.map((item) => {
                  const fillPct = Math.min(100, parseFloat(item.fill_percentage || 0));
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 pr-4">
                        <Link
                          to={`/events/${item.id}`}
                          className="font-semibold text-white hover:text-purple-400 transition block truncate max-w-xs"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 text-right font-medium text-slate-200">
                        {item.registered_count} / {item.max_participants}
                      </td>
                      <td className="py-4 text-right pl-4">
                        <div className="flex items-center justify-end gap-2.5">
                          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                fillPct >= 90
                                  ? 'bg-rose-500'
                                  : fillPct >= 50
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white w-10 text-right">
                            {fillPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registrations feed */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Activité Récente</h2>
            </div>
          </div>

          <div className="space-y-4">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate max-w-[170px]">
                      {act.participant_name}
                    </p>
                    <StatusBadge status={act.status} />
                  </div>
                  <p className="text-xs text-purple-300 truncate">{act.event_title}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(act.created_at).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Aucune inscription récente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
