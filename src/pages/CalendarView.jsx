import React, { useState } from 'react';
import CalendarGrid from './CalendarGrid';
import '../styles/pages/Calendar.css';
import { Search, Building, MapPin } from 'lucide-react';
import { useCalendarUsers } from '../hooks/useCalendarUsers';

const CalendarView = () => {
  const { users, agencies, zones, companies, shifts, loading, error } = useCalendarUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState(''); // '' = All agencies
  const [selectedCompanyId, setSelectedCompanyId] = useState(''); // '' = All companies

  const filteredUsers = users.filter(user => {
    if (searchQuery && !`${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedZone && !(user.dispatch_zones || []).includes(selectedZone)) {
      return false;
    }
    if (selectedAgencyId && user.agency_id?.toString() !== selectedAgencyId) {
      return false;
    }
    if (selectedCompanyId && user.company_id?.toString() !== selectedCompanyId) {
      return false;
    }
    return true;
  });

  return (
    <div className="calendar-page">
      <header className="page-header">
        <div>
          <h3>Planning Hebdomadaire</h3>
        </div>
      </header>

      {shifts.length > 0 && (
        <div className="shift-legend glass">
          {shifts.map(shift => (
            <div key={shift.id} className="shift-legend-item">
              <span className="shift-color-dot" style={{ backgroundColor: shift.color }} />
              <span>{shift.name} ({shift.start_time} - {shift.end_time})</span>
            </div>
          ))}
        </div>
      )}

      <div className="header-actions">
        {companies.length > 0 && (
          <div className="company-toggle-container glass">
            <Building size={16} className="text-secondary" />
            {companies.length > 4 ? (
              <select
                className="company-select"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">Toutes les compagnies</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div className="company-toggle">
                <button
                  className={`company-btn ${selectedCompanyId === '' ? 'active' : ''}`}
                  onClick={() => setSelectedCompanyId('')}
                >
                  Toutes
                </button>
                {companies.map(c => (
                  <button
                    key={c.id}
                    className={`company-btn ${selectedCompanyId === c.id.toString() ? 'active' : ''}`}
                    onClick={() => setSelectedCompanyId(c.id.toString())}
                  >
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} style={{width: 16, height: 16, borderRadius: '50%', objectFit: 'cover'}} />
                    ) : null}
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <select
          className="filter-btn glass"
          style={{border: 'none', outline: 'none', background: 'transparent', padding: '0.5rem', borderRadius: 'var(--radius-md)', minWidth: '120px'}}
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          <option value="">Toutes les zones</option>
          {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
        </select>

        {agencies.length > 0 && (
          <div className="company-toggle-container glass">
            <MapPin size={16} className="text-secondary" />
            <select
              className="company-select"
              value={selectedAgencyId}
              onChange={(e) => setSelectedAgencyId(e.target.value)}
            >
              <option value="">Toutes les agences</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        <div className="search-bar glass">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="calendar-container">
        {loading ? (
          <div style={{textAlign: 'center', marginTop: '2rem'}}>Chargement du planning...</div>
        ) : error ? (
          <div style={{textAlign: 'center', marginTop: '2rem', color: '#ef4444'}}>
            Échec du chargement du planning. Réessayez plus tard.
          </div>
        ) : (
          <CalendarGrid users={filteredUsers} />
        )}
      </div>
    </div>
  );
};

export default CalendarView;
