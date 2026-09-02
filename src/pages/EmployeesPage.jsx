import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../utils/errors';
import { can } from '../utils/permissions';
import { useAuthStore } from '../store/authStore';
import { useEmployees } from '../hooks/useEmployees';
import { DAYS, DAY_LABELS } from '../utils/days';
import '../styles/pages/PageStyles.css';

const EmployeesPage = () => {
  const { user: currentUser } = useAuthStore();
  const canCreate = can(currentUser, 'users', 'create');
  const canUpdate = can(currentUser, 'users', 'update');
  const canDelete = can(currentUser, 'users', 'delete');
  const canCreateShift = can(currentUser, 'shifts', 'create');
  const {
    users, roles, companies, agencies, zones, shifts, loading, error, refetch,
    createUser, updateUser, deleteUser, createShift,
  } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const { addToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', username: '', password: '',
    role_id: '', company_ids: [], agency_id: '', dispatch_zones: [], day_off: '',
    shift_id: '', start_date: ''
  });

  // Inline "create a shift" mini-form shown next to the Shift select when
  // the picked company/agency combo has none yet.
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [shiftFormData, setShiftFormData] = useState({ name: '', start_time: '', end_time: '', color: '#3b82f6' });
  const resetShiftForm = () => {
    setShowShiftForm(false);
    setShiftFormData({ name: '', start_time: '', end_time: '', color: '#3b82f6' });
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        username: user.username || '',
        password: '',
        role_id: user.role_id || '',
        company_ids: user.company_ids || [],
        agency_id: user.agency_id || '',
        dispatch_zones: user.dispatch_zones || [],
        day_off: user.day_off || '',
        shift_id: user.shift_id || '',
        start_date: user.start_date ? user.start_date.split('T')[0] : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        first_name: '', last_name: '', phone: '', username: '', password: '',
        role_id: '', company_ids: [], agency_id: '', dispatch_zones: [], day_off: '',
        shift_id: '', start_date: ''
      });
    }
    resetShiftForm();
    setIsModalOpen(true);
  };

  const closeModal = () => { resetShiftForm(); setIsModalOpen(false); };

  const handleCreateShift = async () => {
    if (isCreatingShift) return;
    if (!shiftFormData.name || !shiftFormData.start_time || !shiftFormData.end_time) {
      addToast('Renseignez le nom, l\'heure de début et de fin du shift', 'error');
      return;
    }
    setIsCreatingShift(true);
    try {
      const shift = await createShift({
        name: shiftFormData.name,
        company_ids: formData.company_ids,
        agency_id: formData.agency_id,
        start_time: shiftFormData.start_time,
        end_time: shiftFormData.end_time,
        color: shiftFormData.color,
      });
      addToast(`Shift ${shift.name} créé avec succès`);
      setFormData(prev => ({ ...prev, shift_id: shift.id.toString() }));
      resetShiftForm();
    } catch (error) {
      console.error('Failed to create shift', error);
      addToast(getErrorMessage(error, 'Erreur lors de la création du shift'), 'error');
    } finally {
      setIsCreatingShift(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // guard against a double-click firing this twice

    // Clean up empty strings to null for foreign keys
    const submitData = { ...formData };
    if (!submitData.role_id) submitData.role_id = null;
    if (!submitData.agency_id) submitData.agency_id = null;
    if (!submitData.shift_id) submitData.shift_id = null;

    const fullName = `${submitData.first_name} ${submitData.last_name}`.trim();

    setIsSubmitting(true);
    try {
      if (editingId) {
        if (!submitData.password) delete submitData.password;
        await updateUser(editingId, submitData);
        addToast(`Employé ${fullName} modifié avec succès`);
      } else {
        await createUser(submitData);
        addToast(`Employé ${fullName} créé avec succès`);
      }
      closeModal(); // only close once the request actually succeeded
    } catch (error) {
      console.error('Failed to save user', error);
      addToast(getErrorMessage(error, 'Erreur lors de l\'enregistrement de l\'employé'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (user) => setDeleteTarget(user);
  const cancelDelete = () => { if (!isDeleting) setDeleteTarget(null); };

  const confirmDelete = async () => {
    const user = deleteTarget;
    if (!user || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUser(user.id);
      addToast(`Employé ${user.first_name} ${user.last_name} supprimé avec succès`);
      setDeleteTarget(null); // only close once the delete actually succeeded
    } catch (error) {
      console.error('Failed to delete user', error);
      addToast(getErrorMessage(error, 'Erreur lors de la suppression de l\'employé'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedRole = useMemo(() => {
    return roles.find(r => r.id == formData.role_id);
  }, [formData.role_id, roles]);

  const showAuthFields = selectedRole && selectedRole.access_level !== 'none';

  // A restricted role carries its own companies/zones/agency directly — an
  // employee under it belongs to ALL of the role's companies at once (a
  // role can now allow several), so there's nothing left for the admin to
  // pick; the field is always locked, same as Agency/Zones already are.
  const roleLocksCompanies = selectedRole?.access_level === 'restricted';
  const roleLimitsZones = selectedRole?.access_level === 'restricted' && selectedRole.allowed_zones?.length > 0;
  const roleLimitsAgency = selectedRole?.access_level === 'restricted' && selectedRole.allowed_agencies?.length > 0;

  // This read-only display always reflects the employee's actual stored
  // values (formData), not the role's — the role only DRIVES formData (via
  // handleRoleChange, on picking/switching a role). Deriving straight from
  // the role instead would show the wrong thing whenever editing an existing
  // employee whose companies/agency/zones no longer match a role that was
  // edited after they were assigned.
  const selectedCompanies = useMemo(() => {
    return companies.filter(c => (formData.company_ids || []).includes(c.id.toString()));
  }, [companies, formData.company_ids]);

  const matchingAgency = useMemo(() => {
    return agencies.find(a => a.id.toString() === formData.agency_id?.toString()) || null;
  }, [agencies, formData.agency_id]);

  const roleZones = useMemo(() => {
    return zones.filter(z => (formData.dispatch_zones || []).includes(z.name));
  }, [zones, formData.dispatch_zones]);

  // Picking a restricted role adopts its companies/zones/agency directly
  // instead of just narrowing choices — there's nothing left for the admin
  // to pick.
  const handleRoleChange = (roleId) => {
    const role = roles.find(r => r.id.toString() === roleId);
    setFormData(prev => {
      const next = { ...prev, role_id: roleId };
      if (role?.access_level === 'restricted') {
        const allowedCompanies = role.allowed_companies || [];
        next.company_ids = [...allowedCompanies];
        next.shift_id = '';
        if (role.allowed_zones?.length > 0) {
          next.dispatch_zones = [...role.allowed_zones];
        }
        if (role.allowed_agencies?.length > 0) {
          const roleAgencyId = role.allowed_agencies[0];
          if (roleAgencyId !== prev.agency_id?.toString()) {
            next.agency_id = roleAgencyId;
            next.shift_id = '';
          }
        }
      }
      return next;
    });
    resetShiftForm();
  };

  // Free multi-select toggle, only used when the role doesn't already lock
  // this field (see roleLocksCompanies above).
  const toggleEmployeeCompany = (companyId) => {
    setFormData(prev => {
      const id = companyId.toString();
      const current = prev.company_ids || [];
      const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
      return { ...prev, company_ids: next, shift_id: '' };
    });
    resetShiftForm();
  };

  // A shift can belong to several companies but always exactly one agency —
  // only offer the ones that share at least one company with the employee
  // and match the agency exactly, so an employee can't end up scheduled on
  // a shift belonging to an unrelated agency.
  const availableShifts = useMemo(() => {
    if (!(formData.company_ids || []).length || !formData.agency_id) return [];
    return shifts.filter(s =>
      (s.company_ids || []).some(id => formData.company_ids.includes(id)) &&
      s.agency_id?.toString() === formData.agency_id.toString()
    );
  }, [shifts, formData.company_ids, formData.agency_id]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="crud-page">
      <header className="page-header">
        <div>
          <h1>Employés</h1>
          <p className="subtitle">Gérer tous les dispatchers et le personnel</p>
        </div>
        {canCreate && (
          <button className="primary-btn" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Ajouter un employé</span>
          </button>
        )}
      </header>

      <div className="table-toolbar">
        <div className="search-bar glass">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container glass">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : error ? (
          <div className="error-state">
            <span>Échec du chargement des employés.</span>
            <button type="button" className="btn-secondary" onClick={refetch}>Réessayer</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                {/* <th>Nom d'utilisateur</th> */}
                <th>Rôle</th>
                <th>Compagnie</th>
                <th>Agence</th>
                <th>Shift</th>
                <th>Zones de dispatch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user.id}>
                  <td data-label="Nom">
                    <div className="user-name-cell">
                      <strong>{user.first_name} {user.last_name}</strong>
                      {user.phone && <div className="subtext">{user.phone}</div>}
                    </div>
                  </td>
                  {/* <td data-label="Nom d'utilisateur">{user.username || '-'}</td> */}
                  <td data-label="Rôle">
                    <span className="badge">{user.role?.name || 'Aucun rôle'}</span>
                  </td>
                  <td data-label="Compagnie">
                    {user.companies && user.companies.length > 0 ? (
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                        {user.companies.map(c => <span key={c.id} className="badge">{c.name}</span>)}
                      </div>
                    ) : '-'}
                  </td>
                  <td data-label="Agence">{user.agency?.name || '-'}</td>
                  <td data-label="Shift">
                    {user.shift ? (
                      <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <span style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: user.shift.color || '#3b82f6', flexShrink: 0}} />
                        <span>{user.shift.name} ({user.shift.start_time} - {user.shift.end_time})</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td data-label="Zones de dispatch">
                    {user.dispatch_zones && user.dispatch_zones.length > 0 ? (
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                        {user.dispatch_zones.map(z => <span key={z} className="badge">{z}</span>)}
                      </div>
                    ) : '-'}
                  </td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      {user.role?.access_level !== 'full' && canUpdate && (
                        <button className="icon-btn edit" onClick={() => openModal(user)}><Edit2 size={16} /></button>
                      )}
                      {user.role?.access_level !== 'full' && canDelete && (
                        <button className="icon-btn delete" onClick={() => requestDelete(user)}><Trash2 size={16} /></button>
                      )}
                      {(user.role?.access_level === 'full' || (!canUpdate && !canDelete)) && '-'}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">Aucun employé trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredUsers.length > 0 && (
        <div className="pagination">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="pagination-info">Page {safePage} sur {totalPages}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? "Modifier l'employé" : 'Ajouter un employé'}
        closeDisabled={isSubmitting}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="crud-form" autoComplete="off">
          {/* Workaround for browser autofill */}
          <input type="text" style={{display: 'none'}} autoComplete="username" />
          <input type="password" style={{display: 'none'}} autoComplete="new-password" />

          <div className="form-row-2col">
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text" className="form-control"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})} required
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input 
                type="text" className="form-control"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})} required 
                autoComplete="off"
              />
            </div>
          </div>

          {/* <div className="form-row-2col">
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel" className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                autoComplete="off"
              />
            </div>
          </div> */}
          <div className="form-group">
            <label>Rôle</label>
            <select
              className="form-control" value={formData.role_id}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="">Aucun rôle / Aucun accès</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label>Compagnie</label>
              {roleLocksCompanies ? (
                <div className="chip-list read-only">
                  {selectedCompanies.length > 0 ? selectedCompanies.map(c => (
                    <span key={c.id} className="chip active">{c.name}</span>
                  )) : <span className="subtext">-</span>}
                </div>
              ) : (
                <div className="chip-list">
                  {companies.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      className={`chip ${(formData.company_ids || []).includes(c.id.toString()) ? 'active' : ''}`}
                      onClick={() => toggleEmployeeCompany(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {roleLocksCompanies ? (
                <span className="subtext">Définie par le rôle "{selectedRole.name}"</span>
              ) : (
                <span className="subtext">Sélectionnez une ou plusieurs compagnies</span>
              )}
            </div>
            <div className="form-group">
              <label>Agence</label>
              {roleLimitsAgency ? (
                <div className="readonly-field">
                  <span>{matchingAgency.name}</span>
                </div>
              ) : (
                <select
                  className="form-control" value={formData.agency_id}
                  onChange={(e) => { setFormData({...formData, agency_id: e.target.value, shift_id: ''}); resetShiftForm(); }}
                >
                  <option value="">Sélectionner une agence</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              {roleLimitsAgency && (
                <span className="subtext">Définie par le rôle "{selectedRole.name}"</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Shift</label>
            <select
              className="form-control" value={formData.shift_id}
              onChange={(e) => setFormData({...formData, shift_id: e.target.value})}
              disabled={!(formData.company_ids || []).length || !formData.agency_id}
            >
              <option value="">
                {(!(formData.company_ids || []).length || !formData.agency_id)
                  ? 'Sélectionnez une compagnie et une agence d\'abord'
                  : availableShifts.length === 0
                    ? 'Aucun shift configuré pour cette compagnie/agence'
                    : 'Aucun shift'}
              </option>
              {availableShifts.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>
              ))}
            </select>
            {(formData.company_ids || []).length > 0 && formData.agency_id && availableShifts.length === 0 && !canCreateShift && (
              <span className="subtext">Configurez un shift pour cette compagnie/agence dans "Shifts" pour pouvoir en assigner un ici.</span>
            )}
            {canCreateShift && (formData.company_ids || []).length > 0 && formData.agency_id && availableShifts.length === 0 && !showShiftForm && (
              <button type="button" className="btn-secondary" style={{marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px'}} onClick={() => setShowShiftForm(true)}>
                <Plus size={14} />
                <span>Créer un shift pour cette compagnie/agence</span>
              </button>
            )}
            {showShiftForm && (
              <div style={{marginTop: '8px', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)'}}>
                <div className="form-group" style={{marginBottom: '0.5rem'}}>
                  <label>Nom du shift</label>
                  <input
                    type="text" className="form-control"
                    value={shiftFormData.name}
                    onChange={(e) => setShiftFormData({...shiftFormData, name: e.target.value})}
                  />
                </div>
                <div className="form-row-2col">
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <label>Début (HH:MM)</label>
                    <input
                      type="time" className="form-control"
                      value={shiftFormData.start_time}
                      onChange={(e) => setShiftFormData({...shiftFormData, start_time: e.target.value})}
                    />
                  </div>
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <label>Fin (HH:MM)</label>
                    <input
                      type="time" className="form-control"
                      value={shiftFormData.end_time}
                      onChange={(e) => setShiftFormData({...shiftFormData, end_time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group" style={{marginBottom: '0.75rem'}}>
                  <label>Couleur</label>
                  <div className="color-picker-row">
                    <input
                      type="color" className="color-input"
                      value={shiftFormData.color}
                      onChange={(e) => setShiftFormData({...shiftFormData, color: e.target.value})}
                    />
                    <span className="subtext">{shiftFormData.color}</span>
                  </div>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button type="button" className="btn-secondary" onClick={resetShiftForm} disabled={isCreatingShift}>Annuler</button>
                  <button type="button" className="btn-primary" onClick={handleCreateShift} disabled={isCreatingShift}>
                    {isCreatingShift ? 'Création...' : 'Créer le shift'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {showAuthFields && (
            <div className="form-row-2col" style={{background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>Nom d'utilisateur</label>
                <input
                  type="text" className="form-control"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  autoComplete="new-password"
                  required={showAuthFields}
                />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>{editingId ? 'Nouveau mot de passe ' : 'Mot de passe'}</label>
                <input 
                  type="password" className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={showAuthFields && !editingId}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* <div className="form-row-2col">
            <div className="form-group">
              <label>Date de début</label>
              <input
                type="date" className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
          </div> */}
          <div className="form-group">
            <label>Zones de dispatch</label>
            {roleLimitsZones ? (
              <div className="chip-list read-only">
                {roleZones.map(z => (
                  <span key={z.id} className="chip active">{z.name}</span>
                ))}
              </div>
            ) : (
              <select
                multiple
                className="form-control multi-select"
                value={formData.dispatch_zones || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFormData({...formData, dispatch_zones: selected});
                }}
              >
                {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
              </select>
            )}
            <span className="subtext">
              {roleLimitsZones
                ? `Définies par le rôle "${selectedRole.name}"`
                : 'Ctrl/Cmd + clic pour sélectionner plusieurs zones'}
            </span>
          </div>

          <div className="form-group">
            <label>Jour de repos</label>
            <select
              className="form-control" value={formData.day_off}
              onChange={(e) => setFormData({...formData, day_off: e.target.value})}
            >
              <option value="">Sélectionner un jour de repos</option>
              {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : "Enregistrer l'employé"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer l'employé"
        message={deleteTarget ? `Êtes-vous sûr de vouloir supprimer ${deleteTarget.first_name} ${deleteTarget.last_name} ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default EmployeesPage;
