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
  const {
    users, roles, companies, agencies, zones, loading,
    createUser, updateUser, deleteUser,
  } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const { addToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', username: '', password: '',
    role_id: '', company_id: '', agency_id: '', dispatch_zones: [], day_off: '',
    shift_start: '', shift_end: '', start_date: ''
  });

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
        company_id: user.company_id || '',
        agency_id: user.agency_id || '',
        dispatch_zones: user.dispatch_zones || [],
        day_off: user.day_off || '',
        shift_start: user.shift_start ? user.shift_start.slice(0, 5) : '',
        shift_end: user.shift_end ? user.shift_end.slice(0, 5) : '',
        start_date: user.start_date ? user.start_date.split('T')[0] : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        first_name: '', last_name: '', phone: '', username: '', password: '',
        role_id: '', company_id: '', agency_id: '', dispatch_zones: [], day_off: '',
        shift_start: '', shift_end: '', start_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clean up empty strings to null for foreign keys
    const submitData = { ...formData };
    if (!submitData.role_id) submitData.role_id = null;
    if (!submitData.company_id) submitData.company_id = null;
    if (!submitData.agency_id) submitData.agency_id = null;

    const fullName = `${submitData.first_name} ${submitData.last_name}`.trim();

    try {
      if (editingId) {
        if (!submitData.password) delete submitData.password;
        await updateUser(editingId, submitData);
        addToast(`Employé ${fullName} modifié avec succès`);
      } else {
        await createUser(submitData);
        addToast(`Employé ${fullName} créé avec succès`);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save user', error);
      addToast(getErrorMessage(error, 'Erreur lors de l\'enregistrement de l\'employé'), 'error');
    }
  };

  const requestDelete = (user) => setDeleteTarget(user);
  const cancelDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    const user = deleteTarget;
    if (!user) return;
    setDeleteTarget(null);
    try {
      await deleteUser(user.id);
      addToast(`Employé ${user.first_name} ${user.last_name} supprimé avec succès`);
    } catch (error) {
      console.error('Failed to delete user', error);
      addToast(getErrorMessage(error, 'Erreur lors de la suppression de l\'employé'), 'error');
    }
  };

  const toggleDispatchZone = (zoneName) => {
    setFormData(prev => {
      const current = prev.dispatch_zones || [];
      const next = current.includes(zoneName) ? current.filter(z => z !== zoneName) : [...current, zoneName];
      return { ...prev, dispatch_zones: next };
    });
  };

  const selectedRole = useMemo(() => {
    return roles.find(r => r.id == formData.role_id);
  }, [formData.role_id, roles]);

  const showAuthFields = selectedRole && selectedRole.access_level !== 'none';

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
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Nom d'utilisateur</th>
                <th>Rôle</th>
                <th>Compagnie</th>
                <th>Agence</th>
                <th>Zones de dispatch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-name-cell">
                      <strong>{user.first_name} {user.last_name}</strong>
                      {user.phone && <div className="subtext">{user.phone}</div>}
                    </div>
                  </td>
                  <td>{user.username || '-'}</td>
                  <td>
                    <span className="badge">{user.role?.name || 'Aucun rôle'}</span>
                  </td>
                  <td>
                    {user.company ? (
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {user.company.logo_url ? (
                           <img src={user.company.logo_url} alt={user.company.name} style={{width: 24, height: 24, borderRadius: '50%', objectFit: 'cover'}} />
                        ) : (
                           <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'}}>
                             {user.company.logo || user.company.name.substring(0, 2).toUpperCase()}
                           </div>
                        )}
                        <span>{user.company.name}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td>{user.agency?.name || '-'}</td>
                  <td>
                    {user.dispatch_zones && user.dispatch_zones.length > 0 ? (
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                        {user.dispatch_zones.map(z => <span key={z} className="badge">{z}</span>)}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
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
                  <td colSpan="7" className="empty-state">Aucun employé trouvé</td>
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

          <div className="form-row-2col">
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel" className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label>Rôle</label>
              <select
                className="form-control" value={formData.role_id}
                onChange={(e) => setFormData({...formData, role_id: e.target.value})}
              >
                <option value="">Aucun rôle / Aucun accès</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label>Compagnie</label>
              <select
                className="form-control" value={formData.company_id}
                onChange={(e) => setFormData({...formData, company_id: e.target.value})}
              >
                <option value="">Sélectionner une compagnie</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Agence</label>
              <select
                className="form-control" value={formData.agency_id}
                onChange={(e) => setFormData({...formData, agency_id: e.target.value})}
              >
                <option value="">Sélectionner une agence</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
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
                <label>{editingId ? 'Nouveau mot de passe (laisser vide pour garder l\'actuel)' : 'Mot de passe'}</label>
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

          <div className="form-row-2col">
            <div className="form-group">
              <label>Date de début</label>
              <input
                type="date" className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Zones de dispatch</label>
              <div className="chip-list">
                {zones.map(z => (
                  <button
                    type="button"
                    key={z.id}
                    className={`chip ${(formData.dispatch_zones || []).includes(z.name) ? 'active' : ''}`}
                    onClick={() => toggleDispatchZone(z.name)}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label>Début du shift (HH:MM)</label>
              <input
                type="time" className="form-control"
                value={formData.shift_start}
                onChange={(e) => setFormData({...formData, shift_start: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Fin du shift (HH:MM)</label>
              <input 
                type="time" className="form-control"
                value={formData.shift_end}
                onChange={(e) => setFormData({...formData, shift_end: e.target.value})}
              />
            </div>
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
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer l'employé</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer l'employé"
        message={deleteTarget ? `Êtes-vous sûr de vouloir supprimer ${deleteTarget.first_name} ${deleteTarget.last_name} ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default EmployeesPage;
