import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'purple', subtitle }) => {
  const colorMap = {
    purple: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
    rose: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30',
  };

  const currentTheme = colorMap[color] || colorMap.purple;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3.5 rounded-xl bg-gradient-to-br ${currentTheme} border`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
