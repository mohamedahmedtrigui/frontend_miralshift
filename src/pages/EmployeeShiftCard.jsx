import React from 'react';
import { Clock } from 'lucide-react';
import { companyBadgeText } from '../utils/companyLogo';

const EmployeeShiftCard = ({ user, isOff }) => {
  // Cards are themed after the employee's (first) company color so the
  // calendar reads by company at a glance; an employee with several
  // companies just anchors on the first one for this visual — day-off
  // cards are always red regardless, since that's a status, not a brand.
  // The card itself stays white inside — only the border carries the
  // company color — so the shift-color badge below isn't competing with a
  // tinted background.
  const primaryCompany = (user.companies || [])[0];
  const companyColor = primaryCompany?.color || '#3b82f6';
  const cardStyle = isOff ? undefined : {
    borderColor: companyColor,
    '--card-color': companyColor,
  };
  const companyNames = (user.companies || []).map(c => c.name).join(', ');

  return (
    <div className={`shift-card ${isOff ? 'shift-off' : ''}`} style={cardStyle}>
      <div className="shift-card-header">
        <div className="shift-user-info">
          <span className="user-name">{user.first_name} {user.last_name}</span>
          {user.agency?.name && <span className="user-agency">{user.agency.name}</span>}
        </div>
        <div className="company-logo" title={companyNames}>
          {primaryCompany?.logo_url ? (
            <img src={primaryCompany.logo_url} alt={primaryCompany.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
          ) : (
            companyBadgeText(primaryCompany)
          )}
        </div>
      </div>
      
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
      {/* Shown even when the employee has a shift, so a day off still
          reads back which shift they'd normally be on. */}
      {isOff && (
        <div className="off-text">
          <span>Repos</span>
        </div>
      )}
    </div>
  );
};

export default EmployeeShiftCard;
