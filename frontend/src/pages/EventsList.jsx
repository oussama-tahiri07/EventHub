import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState(25);
  const [formStatus, setFormStatus] = useState('published');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const toast = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/events', { params });
      setEvents(res.data.data.events);
    } catch (err) {
      console.error('Error fetching events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await api.post('/events', {
        title: formTitle,
        description: formDescription,
        location: formLocation,
        eventDate: new Date(formEventDate).toISOString(),
        maxParticipants: parseInt(formMaxParticipants, 10),
        status: formStatus,
      });

      toast.success('Événement créé avec succès !');
      setIsCreateModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de la création de l'événement";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormLocation('');
    setFormEventDate('');
    setFormMaxParticipants(25);
    setFormStatus('published');
    setFormError(null);
  };

  const handlePublish = async (id) => {
    try {
      await api.patch(`/events/${id}/status`, { status: 'published' });
      toast.success('Événement publié avec succès ! Les inscriptions sont ouvertes.');
      fetchEvents();
    } catch (err) {
      toast.error("Erreur lors de la publication de l'événement");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Événements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez la création, publication et suivi des jauges d'événements
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un événement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou lieu..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
          {[
            { value: '', label: 'Tous' },
            { value: 'published', label: 'Publiés' },
            { value: 'draft', label: 'Brouillons' },
            { value: 'cancelled', label: 'Annulés' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.value
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold">Aucun événement trouvé</p>
          <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou créez-en un nouveau</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const fillPct = Math.min(100, parseFloat(ev.fill_rate || 0));
            const eventDateFormatted = new Date(ev.event_date).toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ev.id}
                className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusBadge status={ev.status} />
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {eventDateFormatted}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white hover:text-purple-300 transition line-clamp-1">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>

                {/* Progress bar and actions */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        Inscriptions
                      </span>
                      <span className="font-bold text-slate-200">
                        {ev.active_registrations_count || 0} / {ev.max_participants} ({fillPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          fillPct >= 100
                            ? 'bg-rose-500'
                            : fillPct >= 60
                            ? 'bg-amber-400'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {ev.status === 'draft' ? (
                      <button
                        onClick={() => handlePublish(ev.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Publier</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Par {ev.creator_name || 'Équipe'}
                      </span>
                    )}

                    <Link
                      to={`/events/${ev.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center gap-1.5 ml-auto"
                    >
                      <span>Détails & Inscrits</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un Nouvel Événement"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Titre de l'événement *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ex : Tech Conference 2026"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Présentation des thématiques abordées..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lieu *</label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Ex : Paris ou En ligne"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date et Heure *
              </label>
              <input
                type="datetime-local"
                required
                value={formEventDate}
                onChange={(e) => setFormEventDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Capacité Max (Places) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formMaxParticipants}
                onChange={(e) => setFormMaxParticipants(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Statut initial
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="published">Publié (ouvert aux inscriptions)</option>
                <option value="draft">Brouillon (inscriptions bloquées)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow transition"
            >
              {formLoading ? 'Création...' : 'Créer l\'événement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
