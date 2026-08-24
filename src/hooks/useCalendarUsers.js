import { useState, useEffect, useMemo } from 'react';
import * as calendarService from '../services/calendarService';
import { useReferenceStore } from '../store/referenceStore';

export function useCalendarUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { agencies, fetchAgencies } = useReferenceStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [usersData] = await Promise.all([calendarService.getAll(), fetchAgencies()]);
        if (!cancelled) setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch calendar:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchAgencies]);

  // Companies shown here are derived from the users actually on the
  // calendar, not the full reference list — no separate fetch needed.
  const companies = useMemo(() => {
    const seen = new Set();
    const list = [];
    users.forEach(user => {
      if (user.company && !seen.has(user.company.id)) {
        seen.add(user.company.id);
        list.push(user.company);
      }
    });
    return list;
  }, [users]);

  return { users, agencies: agencies || [], companies, loading };
}
