import React from 'react';
import EmployeeShiftCard from './EmployeeShiftCard';
import { DAY_LABELS } from '../utils/days';

const DayCard = ({ dayName, workingUsers, offUsers }) => {
  // Sort users by shift start time — users without a shift assigned sort last.
  const sortedUsers = [...workingUsers].sort((a, b) =>
    (a.shift?.start_time || '99:99').localeCompare(b.shift?.start_time || '99:99')
  );

  return (
    <div className="day-card glass">
      <div className="day-header">
        <h3>{DAY_LABELS[dayName] || dayName}</h3>
        <span className="count-badge">{workingUsers.length}</span>
      </div>
      
      <div className="day-content">
        {sortedUsers.map(user => (
          <EmployeeShiftCard key={user.id} user={user} isOff={false} />
        ))}
        {offUsers.map(user => (
          <EmployeeShiftCard key={user.id} user={user} isOff={true} />
        ))}
        {sortedUsers.length === 0 && offUsers.length === 0 && (
          <div className="empty-state">Aucun shift assigné</div>
        )}
      </div>
    </div>
  );
};

export default DayCard;
