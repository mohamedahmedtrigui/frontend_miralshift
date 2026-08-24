import React from 'react';
import DayCard from './DayCard';
import { DAYS } from '../utils/days';

const CalendarGrid = ({ users }) => {
  return (
    <div className="calendar-grid">
      {DAYS.map(day => {
        // Filter users who work on this day (i.e. day is not their day_off)
        const workingUsers = users.filter(user => user.day_off !== day);
        const offUsers = users.filter(user => user.day_off === day);
        
        return (
          <DayCard 
            key={day} 
            dayName={day} 
            workingUsers={workingUsers} 
            offUsers={offUsers} 
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;
