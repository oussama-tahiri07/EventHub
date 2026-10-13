import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, UserPlus } from 'lucide-react';

export const Sidebar = ({ onOpenRegisterModal }) => {
  const navItems = [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/events', label: 'Événements', icon: Calendar },
    { to: '/participants', label: 'Participants', icon: Users },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/40 p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        {/* Quick action button */}
        <div>
          <button
            onClick={onOpenRegisterModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouvelle Inscription</span>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Stack PERN</p>
        <p className="mt-0.5 text-[11px] text-slate-400">PostgreSQL • Express • React • Node</p>
      </div>
    </aside>
  );
};
