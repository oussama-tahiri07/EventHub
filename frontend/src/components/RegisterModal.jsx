import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { AlertCircle, CheckCircle2, UserCheck, Calendar, Clock, AlertTriangle } from 'lucide-react';

export const RegisterModal = ({ isOpen, onClose, onSuccess, preselectedEventId = null }) => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId || '');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [status, setStatus] = useState('confirmed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedEventId(preselectedEventId || '');
      setSelectedParticipantId('');
      setStatus('confirmed');
      fetchData();
    }
  }, [isOpen, preselectedEventId]);

  const fetchData = async () => {
    try {
      const [eventsRes, partsRes] = await Promise.all([
        api.get('/events?limit=50'),
        api.get('/participants?limit=100'),
      ]);
      setEvents(eventsRes.data.data.events);
      setParticipants(partsRes.data.data.participants);
    } catch (err) {
      console.error('Error loading events/participants', err);
    }
  };

  const selectedEvent = events.find((ev) => ev.id === selectedEventId);
  const isFull =
    selectedEvent &&
    (selectedEvent.active_registrations_count || 0) >= selectedEvent.max_participants;

  // Auto-switch to waitlist if event is full
  useEffect(() => {
    if (isFull) {
      setStatus('waitlist');
    } else {
      setStatus('confirmed');
    }
  }, [isFull]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !selectedParticipantId) {
      setError('Veuillez sélectionner un événement et un participant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/registrations', {
        eventId: selectedEventId,
        participantId: selectedParticipantId,
        status,
      });

      toast.success(
        status === 'waitlist'
          ? 'Participant ajouté sur la Liste d’Attente avec succès !'
          : 'Inscription confirmée avec succès !'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'inscription";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inscrire un Participant à un Événement">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Échec de l'inscription</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Waitlist banner if full */}
        {isFull && (
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Capacité maximale atteinte ({selectedEvent.max_participants} places).</strong> L'inscription sera automatiquement enregistrée sur <strong>Liste d'attente</strong>.
            </span>
          </div>
        )}

        {/* Event selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Sélectionner l'Événement</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            required
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">-- Choisir un événement --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.status.toUpperCase()}) — {ev.active_registrations_count || 0}/
                {ev.max_participants} places
              </option>
            ))}
          </select>
          {selectedEvent && (
            <div className="mt-1.5 text-xs flex items-center gap-2 text-slate-400">
              <span>
                Statut :{' '}
                <strong
                  className={
                    selectedEvent.status === 'published' ? 'text-emerald-400' : 'text-amber-400'
                  }
                >
                  {selectedEvent.status}
                </strong>
              </span>
              <span>•</span>
              <span>
                Places occupées :{' '}
                <strong>
                  {selectedEvent.active_registrations_count || 0} / {selectedEvent.max_participants}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Participant selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sélectionner le Participant</span>
          </label>
          <select
            value={selectedParticipantId}
            onChange={(e) => setSelectedParticipantId(e.target.value)}
            required
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">-- Choisir un participant --</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.email})
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Statut de l'inscription
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {!isFull && <option value="confirmed">Confirmé (place réservée)</option>}
            {!isFull && <option value="pending">En attente de validation</option>}
            <option value="waitlist">Liste d'attente (priorité si désistement)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition active:scale-[0.98]"
          >
            {loading
              ? 'Traitement...'
              : status === 'waitlist'
              ? 'Rejoindre la liste d\'attente'
              : 'Valider l\'inscription'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
