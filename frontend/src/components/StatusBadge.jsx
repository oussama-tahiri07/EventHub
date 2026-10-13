import React from 'react';

const statusConfig = {
  published: {
    label: 'Publié',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  draft: {
    label: 'Brouillon',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  cancelled: {
    label: 'Annulé',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  confirmed: {
    label: 'Confirmé',
    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  pending: {
    label: 'En attente',
    bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  waitlist: {
    label: 'Liste d’attente',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
  },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
