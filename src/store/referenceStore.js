import { create } from 'zustand';
import * as companyService from '../services/companyService';
import * as agencyService from '../services/agencyService';
import * as zoneService from '../services/zoneService';
import * as roleService from '../services/roleService';
import * as shiftService from '../services/shiftService';

// Companies/agencies/zones/roles are looked up constantly (dropdowns, chip
// lists) across Employees/Roles/Companies but change rarely. Without this,
// every page visit re-fetched all four from scratch even when nothing
// changed. Pages that manage one of these lists directly (e.g. Companies
// managing companies) still force a fresh fetch on mount and push their
// result back in here, so every other page's cache stays correct without
// an extra round-trip.
export const useReferenceStore = create((set, get) => ({
  companies: null,
  agencies: null,
  zones: null,
  roles: null,
  shifts: null,

  fetchCompanies: async (force = false) => {
    if (!force && get().companies) return get().companies;
    const data = await companyService.getAll();
    set({ companies: data });
    return data;
  },
  setCompanies: (data) => set({ companies: data }),

  fetchAgencies: async (force = false) => {
    if (!force && get().agencies) return get().agencies;
    const data = await agencyService.getAll();
    set({ agencies: data });
    return data;
  },
  setAgencies: (data) => set({ agencies: data }),

  fetchZones: async (force = false) => {
    if (!force && get().zones) return get().zones;
    const data = await zoneService.getAll();
    set({ zones: data });
    return data;
  },
  setZones: (data) => set({ zones: data }),

  fetchRoles: async (force = false) => {
    if (!force && get().roles) return get().roles;
    const data = await roleService.getAll();
    set({ roles: data });
    return data;
  },
  setRoles: (data) => set({ roles: data }),

  fetchShifts: async (force = false) => {
    if (!force && get().shifts) return get().shifts;
    const data = await shiftService.getAll();
    set({ shifts: data });
    return data;
  },
  setShifts: (data) => set({ shifts: data }),
}));
