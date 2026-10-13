import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const ParticipantsList = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Participant Detail / History modal state
  const [selectedParticipantHistory, setSelectedParticipantHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const toast = useToast();

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/participants', {
        params: { search: search || undefined, limit: 100 },
      });
      setParticipants(res.data.data.participants);
    } catch (err) {
      console.error('Error fetching participants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchParticipants();
  };

  const openCreateModal = () => {
    setEditingParticipant(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingParticipant(p);
    setFormName(p.full_name);
    setFormEmail(p.email);
    setFormPhone(p.phone || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveParticipant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingParticipant) {
        await api.put(`/participants/${editingParticipant.id}`, {
          fullName: formName,
          email: formEmail,
          phone: formPhone || null,
        });
        toast.success('Participant mis à jour avec succès !');
      } else {
        await api.post('/participants', {
          fullName: formName,
          email: formEmail,
          phone: formPhone || null,
        });
        toast.success('Participant créé avec succès !');
      }
      setIsModalOpen(false);
      fetchParticipants();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l enregistrement';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirm = window.confirm(`Êtes-vous sûr de vouloir supprimer le participant "${name}" ?`);
    if (!confirm) return;

    try {
      await api.delete(`/participants/${id}`);
      toast.success(`Participant "${name}" supprimé.`);
      fetchParticipants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const viewHistory = async (id) => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/participants/${id}`);
      setSelectedParticipantHistory(res.data.data);
    } catch (err) {
      toast.error('Impossible de charger l historique');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Annuaire des Participants
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez la base de participants et consultez leur historique d'inscriptions
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un participant</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </form>

        <span className="text-xs text-slate-400 hidden sm:block">
          {participants.length} participant(s) répertorié(s)
        </span>
      </div>

      {/* Participants Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-white font-semibold">Aucun participant trouvé</p>
            <p className="text-xs text-slate-400 mt-1">Modifiez vos critères de recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-semibold">Nom complet</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Téléphone</th>
                  <th className="pb-3 font-semibold text-center">Événements</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 font-semibold text-white">{p.full_name}</td>
                    <td className="py-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.email}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-400">
                      {p.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => viewHistory(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{p.total_registrations || 0} inscr.</span>
                      </button>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Modifier"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.full_name)}
                          title="Supprimer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Participant Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParticipant ? 'Modifier le Participant' : 'Nouveau Participant'}
      >
        <form onSubmit={handleSaveParticipant} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex : Sarah Connor"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Adresse Email * (unique)
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="sarah.connor@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Numéro de Téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow transition"
            >
              {formLoading
                ? 'Sauvegarde...'
                : editingParticipant
                ? 'Mettre à jour'
                : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Participant History Modal */}
      <Modal
        isOpen={!!selectedParticipantHistory}
        onClose={() => setSelectedParticipantHistory(null)}
        title={
          selectedParticipantHistory
            ? `Inscriptions de ${selectedParticipantHistory.participant.full_name}`
            : 'Historique'
        }
        maxWidth="max-w-xl"
      >
        {selectedParticipantHistory && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/60 rounded-xl text-xs space-y-1 text-slate-300">
              <p>Email : <strong className="text-white">{selectedParticipantHistory.participant.email}</strong></p>
              {selectedParticipantHistory.participant.phone && (
                <p>Téléphone : <strong className="text-white">{selectedParticipantHistory.participant.phone}</strong></p>
              )}
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Événements auxquels ce participant participe :
            </h4>

            {selectedParticipantHistory.registrations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Ce participant n'est encore inscrit à aucun événement.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedParticipantHistory.registrations.map((r) => (
                  <div
                    key={r.registration_id}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{r.event_title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(r.event_date).toLocaleDateString('fr-FR')} • {r.location}
                      </p>
                    </div>
                    <StatusBadge status={r.registration_status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
