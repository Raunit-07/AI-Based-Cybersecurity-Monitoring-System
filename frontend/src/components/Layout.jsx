import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Activity, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Layout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  ];

  return (
    <div className="flex h-screen bg-background text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-gray-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-wider">THREAT<span className="text-primary">OPS</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-gray-400 truncate">{user?.email}</span>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
