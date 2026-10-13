import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Sparkles, BookOpen } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
            EventHub
          </span>
          {/* <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 block -mt-1">
            Tython Edition
          </span> */}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Swagger Docs Link 
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition"
          title="Consulter la documentation OpenAPI / Swagger"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Docs API</span>
        </a>*/}

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <div className="flex items-center justify-end gap-1">
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                    user.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              {user.role === 'admin' ? (
                <Shield className="w-4 h-4 text-purple-400" />
              ) : (
                <User className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <button
              onClick={logout}
              title="Déconnexion"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
