
import React from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  user: any;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, user, onLogout }) => {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-paper/[0.06] flex flex-col justify-between bg-ink p-6 overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-grow" onClick={() => onViewChange('home')}>
          <div className="flex flex-col">
            <h1 className="text-paper text-lg font-heading tracking-[0.08em] leading-tight">Anime<span className="text-primary">Verse</span></h1>
            <p className="text-muted font-mono text-[12px] tracking-[0.3em] uppercase">アニメバース</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          <NavItem 
            icon="house" 
            label="Home" 
            active={activeView === 'home'} 
            onClick={() => onViewChange('home')}
          />
          <NavItem 
            icon="trending_up" 
            label="Top Charts" 
            active={activeView === 'charts'} 
            onClick={() => onViewChange('charts')}
          />
          <NavItem 
            icon="auto_stories" 
            label="My Library" 
            active={activeView === 'library'} 
            onClick={() => onViewChange('library')}
          />
        </nav>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <NavItem icon="settings" label="Settings" />
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3 py-3 bg-surface-dark border border-paper/[0.06]">
              <div 
                className="size-10 rounded-full bg-cover bg-center border-2 border-primary" 
                style={{ backgroundImage: `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username})` }}
              />
              <div className="flex flex-col overflow-hidden">
                <p className="text-xs font-bold text-paper truncate">{user.username}</p>
                <p className="font-mono text-[12px] text-muted tracking-wider uppercase">Standard Member</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 transition-all font-mono text-[12px] tracking-wider uppercase"
            >
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onViewChange('login')}
            className="w-full py-4 bg-primary text-paper font-mono text-[12px] tracking-[0.2em] uppercase hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 cursor-grow transition-all relative overflow-hidden ${
      active 
        ? 'bg-primary text-paper' 
        : 'text-muted hover:bg-paper/[0.03] hover:text-paper'
    }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-paper" />}
    <span className={`material-symbols-outlined ${active ? 'fill-1' : ''}`}>{icon}</span>
    <p className="font-mono text-[12px] tracking-[0.15em] uppercase">{label}</p>
  </div>
);

export default Sidebar;
