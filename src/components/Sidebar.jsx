import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Users, Shield, Building2, LogOut, ChevronLeft, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import '../styles/components/Sidebar.css';

const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      <div className={`mobile-overlay ${isMobileOpen ? 'mobile-open' : ''}`} onClick={toggleMobile}></div>
      
      <button className="mobile-menu-btn" onClick={toggleMobile}>
        <Menu size={24} />
      </button>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <ChevronLeft size={16} />
        </button>

        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon glass">
              <img src="/miralshift-icon.png" alt="MiralShift Logo" />
            </div>
            <h2>MiralShift</h2>
          </div>
          {user && (
            <div className="user-info">
              Connecté en tant que <strong>{user.first_name} {user.last_name}</strong>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setIsMobileOpen(false)}>
            <Calendar size={20} />
            <span>Calendrier</span>
          </NavLink>
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setIsMobileOpen(false)}>
            <Users size={20} />
            <span>Employés</span>
          </NavLink>
          <NavLink to="/roles" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setIsMobileOpen(false)}>
            <Shield size={20} />
            <span>Rôles</span>
          </NavLink>
          <NavLink to="/companies" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setIsMobileOpen(false)}>
            <Building2 size={20} />
            <span>Compagnies</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
