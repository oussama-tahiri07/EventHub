import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { RegisterModal } from '../components/RegisterModal';
import { TicketPassModal } from '../components/TicketPassModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  MapPin,
  Users,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Mail,
  Phone,
  ShieldAlert,
  Download,
  QrCode,
} from 'lucide-react';

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Selected registration for Ticket / Badge Modal
  const [selectedTicketReg, setSelectedTicketReg] = useState(null);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.data.event);
      setRegistrations(res.data.data.registrations || []);
    } catch (err) {
      console.error('Error fetching event details', err);
      setError(err.response?.data?.message || 'Impossible de charger cet événement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'cancelled') {
      const confirm = window.confirm(
        'Attention : En annulant cet événement, TOUTES les inscriptions passeront automatiquement en statut "Annulé" (Règle métier). Confirmez-vous ?'
      );
      if (!confirm) return;
    }

    try {
      setUpdatingStatus(true);
      await api.patch(`/events/${id}/status`, { status: newStatus });
      toast.success(
        newStatus === 'published'
          ? "Événement publié avec succès !"
          : "Événement annulé (toutes les inscriptions ont été annulées)."
      );
      fetchEventData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateRegStatus = async (regId, newRegStatus) => {
    try {
      await api.patch(`/registrations/${regId}/status`, { status: newRegStatus });
      toast.success(`Statut d'inscription mis à jour : ${newRegStatus}`);
      fetchEventData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  // Export CSV Feature
  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) {
      toast.info('Aucune inscription à exporter pour cet événement.');
      return;
    }

    const headers = [
      'Nom complet',
      'Email',
      'Téléphone',
      'Statut',
      "Date d'inscription",
      'Événement',
      'Lieu',
    ];

    const rows = registrations.map((r) => [
      `"${(r.full_name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${new Date(r.created_at).toLocaleDateString('fr-FR')}"`,
      `"${(event.title || '').replace(/"/g, '""')}"`,
      `"${(event.location || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanFilename = (event.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 30);

    link.setAttribute('href', url);
    link.setAttribute('download', `inscriptions_${cleanFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Fichier CSV généré et téléchargé avec succès !');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-4 text-center">
          <p className="font-semibold text-lg">{error || 'Événement non trouvé'}</p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux événements</span>
          </Link>
        </div>
      </div>
    );
  }

  const fillPct = Math.min(100, parseFloat(event.fill_rate || 0));
  const isFull = (event.active_registrations_count || 0) >= event.max_participants;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des événements</span>
        </button>
      </div>

      {/* Main Event Card Header */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3">
              <StatusBadge status={event.status} />
              {isFull && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  COMPLET
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">{event.description}</p>
          </div>

          {/* Quick status management buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {event.status === 'draft' && (
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus('published')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Publier l'événement</span>
              </button>
            )}

            {event.status === 'published' && (
              isAdmin ? (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus('cancelled')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Annuler l'événement</span>
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs"
                  title="Seul un administrateur peut annuler un événement"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Annulation réservée aux admins</span>
                </div>
              )
            )}

            {event.status === 'cancelled' && (
              isAdmin ? (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus('published')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition"
                >
                  <span>Repasser en Publié</span>
                </button>
              ) : (
                <span className="text-xs text-rose-400 font-semibold px-2 py-1">Événement annulé</span>
              )
            )}
          </div>
        </div>

        {/* Metadata info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Date & Heure</p>
              <p className="text-sm font-semibold text-white">
                {new Date(event.event_date).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-purple-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Lieu</p>
              <p className="text-sm font-semibold text-white truncate">{event.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Capacité</p>
              <p className="text-sm font-semibold text-white">
                {event.active_registrations_count || 0} / {event.max_participants} places ({fillPct}%)
              </p>
            </div>
          </div>
        </div>

        {/* Business rule banner if draft or cancelled */}
        {event.status === 'draft' && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              <strong>Règle Métier active :</strong> Cet événement est en statut{' '}
              <strong>Brouillon</strong>. Aucune inscription ne peut y être effectuée tant qu'il n'est pas publié.
            </p>
          </div>
        )}

        {event.status === 'cancelled' && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>
              <strong>Événement annulé :</strong> Toutes les inscriptions associées ont été
              automatiquement basculées en statut annulé conformément à la règle métier #4.
            </p>
          </div>
        )}
      </div>

      {/* Registrations List Section */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Liste des Inscriptions ({registrations.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Suivi individuel des participants inscrits et gestion de leurs statuts
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={registrations.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Exporter les participants au format CSV pour Excel"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Exporter CSV</span>
            </button>

            {/* Register Participant Button */}
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              disabled={event.status !== 'published'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isFull ? 'Liste d\'attente' : 'Ajouter une inscription'}</span>
            </button>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Aucune inscription pour cet événement</p>
            <p className="text-xs text-slate-400 mt-1">
              {event.status === 'published'
                ? 'Cliquez sur "Ajouter une inscription" pour associer un participant'
                : 'Publiez d\'abord l\'événement pour pouvoir inscrire des personnes'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-semibold">Participant</th>
                  <th className="pb-3 font-semibold">Contact</th>
                  <th className="pb-3 font-semibold">Date d'inscription</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 font-semibold text-center">Pass / Badge</th>
                  <th className="pb-3 font-semibold text-right">Modifier Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                          <User className="w-4 h-4" />
                        </div>
                        <span>{reg.full_name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{reg.email}</span>
                      </div>
                      {reg.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{reg.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-xs text-slate-400">
                      {new Date(reg.created_at).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => setSelectedTicketReg(reg)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 text-xs font-semibold transition"
                        title="Afficher et imprimer le badge / pass d'accès avec QR code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Voir Badge</span>
                      </button>
                    </td>
                    <td className="py-4 text-right">
                      <select
                        value={reg.status}
                        onChange={(e) => handleUpdateRegStatus(reg.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-purple-500"
                      >
                        <option value="confirmed">Confirmé</option>
                        <option value="pending">En attente</option>
                        <option value="waitlist">Liste d'attente</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding registration specifically for this event */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={fetchEventData}
        preselectedEventId={event.id}
      />

      {/* Official Pass & QR Code Badge Modal */}
      <TicketPassModal
        isOpen={!!selectedTicketReg}
        onClose={() => setSelectedTicketReg(null)}
        registration={selectedTicketReg}
        event={event}
      />
    </div>
  );
};
