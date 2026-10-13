import React, { useRef } from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { Calendar, MapPin, User, Mail, Printer, Sparkles, QrCode } from 'lucide-react';

export const TicketPassModal = ({ isOpen, onClose, registration, event }) => {
  const printRef = useRef(null);

  if (!registration || !event) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(event.event_date).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pass d'Accès Officiel & Badge">
      <div className="space-y-6">
        {/* Printable Ticket Badge Card */}
        <div
          ref={printRef}
          className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-2 border-purple-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden print:m-0 print:border-black"
        >
          {/* Decorative glows */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Ticket Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white">EventHub</span>
                <span className="text-[9px] uppercase tracking-widest text-purple-400 block -mt-1 font-bold">
                  Billet d'accès nominatif
                </span>
              </div>
            </div>
            <StatusBadge status={registration.status} />
          </div>

          {/* Event Details */}
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-black text-white tracking-tight">{event.title}</h3>
            <div className="flex flex-col gap-1 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>

          {/* Divider with cutout holes */}
          <div className="relative my-5">
            <div className="border-t-2 border-dashed border-slate-700/80" />
          </div>

          {/* Participant Info & QR Code Section */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Participant titulaire
              </p>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <User className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{registration.full_name || registration.participant_name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {registration.email || registration.participant_email}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                REF: {registration.id.substring(0, 18)}...
              </p>
            </div>

            {/* Simulated Vector QR Code */}
            <div className="w-24 h-24 bg-white p-2 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* SVG QR Code Pattern */}
                <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="3" />
                <rect x="10" y="10" width="15" height="15" fill="#ffffff" rx="2" />
                <rect x="14" y="14" width="7" height="7" fill="#0f172a" />

                <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="3" />
                <rect x="75" y="10" width="15" height="15" fill="#ffffff" rx="2" />
                <rect x="79" y="14" width="7" height="7" fill="#0f172a" />

                <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="3" />
                <rect x="10" y="75" width="15" height="15" fill="#ffffff" rx="2" />
                <rect x="14" y="79" width="7" height="7" fill="#0f172a" />

                {/* Data blocks */}
                <rect x="35" y="10" width="6" height="6" fill="#0f172a" />
                <rect x="45" y="15" width="6" height="6" fill="#0f172a" />
                <rect x="55" y="10" width="6" height="6" fill="#0f172a" />
                <rect x="35" y="25" width="8" height="6" fill="#0f172a" />
                <rect x="48" y="25" width="6" height="8" fill="#0f172a" />

                <rect x="35" y="45" width="12" height="12" fill="#7c3aed" rx="2" />
                <rect x="52" y="45" width="10" height="6" fill="#0f172a" />
                <rect x="68" y="45" width="8" height="8" fill="#0f172a" />

                <rect x="15" y="45" width="6" height="8" fill="#0f172a" />
                <rect x="25" y="50" width="6" height="6" fill="#0f172a" />

                <rect x="40" y="65" width="8" height="8" fill="#0f172a" />
                <rect x="55" y="65" width="12" height="6" fill="#0f172a" />
                <rect x="75" y="65" width="15" height="6" fill="#0f172a" />
                <rect x="75" y="75" width="8" height="15" fill="#0f172a" />
                <rect x="88" y="82" width="6" height="8" fill="#0f172a" />
              </svg>
              <span className="text-[8px] font-bold text-slate-800 tracking-tighter mt-0.5">
                SCAN CONTRÔLE
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / Sauvegarder en PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
