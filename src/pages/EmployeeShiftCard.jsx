import React from 'react';
import { Clock } from 'lucide-react';
import { companyBadgeText } from '../utils/companyLogo';

const EmployeeShiftCard = ({ user, isOff }) => {
  // Cards are themed after the employee's company color so the calendar
  // reads by company at a glance; day-off cards are always red regardless
  // of company, since that's a status, not a brand. The card itself stays
  // white inside — only the border carries the company color — so the
  // shift-color badge below isn't competing with a tinted background.
  const companyColor = user.company?.color || '#3b82f6';
  const cardStyle = isOff ? undefined : {
    borderColor: companyColor,
    '--card-color': companyColor,
  };

  return (
    <div className={`shift-card ${isOff ? 'shift-off' : ''}`} style={cardStyle}>
      <div className="shift-card-header">
        <div className="shift-user-info">
          <span className="user-name">{user.first_name} {user.last_name}</span>
          {user.agency?.name && <span className="user-agency">{user.agency.name}</span>}
        </div>
        <div className="company-logo" title={user.company?.name}>
          {user.company?.logo_url ? (
            <img src={user.company.logo_url} alt={user.company.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
          ) : (
            companyBadgeText(user.company)
          )}
        </div>
      </div>
      
      {!isOff && (
        <div className="shift-time">
          {user.shift ? (
            <span
              className="shift-time-badge"
              style={{ backgroundColor: user.shift.color || 'var(--accent-primary)' }}
            >
              {user.shift.name} · {user.shift.start_time} - {user.shift.end_time}
            </span>
          ) : (
            <span className="shift-time-empty">
              <Clock size={14} />
              Aucun shift assigné
            </span>
          )}
        </div>
      )}
      {isOff && (
        <div className="shift-time off-text">
          <span>Repos</span>
        </div>
      )}
    </div>
  );
};

export default EmployeeShiftCard;
