import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, ShieldAlert, Shield, Search } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../utils/errors';
import { can } from '../utils/permissions';
import { useAuthStore } from '../store/authStore';
import { useRoles } from '../hooks/useRoles';
import '../styles/pages/PageStyles.css';

// Matches the actual backend resources gated by CheckRolePermission
// (routes/api.php).
const RESOURCES = ['users', 'roles', 'companies', 'shifts'];
const ACTIONS = ['create', 'read', 'update', 'delete'];

// One entry per navigable screen — independent of the create/read/update/
// delete matrix below. 'calendar' has no CRUD actions of its own, so this is
// the only access control it gets.
const INTERFACES = ['calendar', 'users', 'roles', 'companies', 'shifts'];

// Values stay in English to match the stored access_level/permissions keys —
// these maps are for display only.
const INTERFACE_LABELS = { calendar: 'Calendrier', users: 'Employés', roles: 'Rôles', companies: 'Compagnies', shifts: 'Shifts' };
const ACTION_LABELS = { create: 'Créer', read: 'Lire', update: 'Modifier', delete: 'Supprimer' };
const ACCESS_LEVEL_LABELS = { none: 'Aucun accès', restricted: 'Accès restreint', full: 'Accès complet' };

const RolesPage = () => {
  const { user } = useAuthStore();
  const canCreate = can(user, 'roles', 'create');
  const canUpdate = can(user, 'roles', 'update');
  const canDelete = can(user, 'roles', 'delete');
  const { roles, companies, zones, agencies, loading, error, refetch, createRole, updateRole, deleteRole } = useRoles();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }, [roles, searchQuery]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', access_level: 'none', allowed_zones: [], allowed_companies: [], allowed_agencies: [], interface_access: [], permissions: {}
  });

  const openModal = (role = null) => {
    if (role) {
      setEditingId(role.id);
      setFormData({
        name: role.name,
        description: role.description || '',
        access_level: role.access_level,
        allowed_zones: role.allowed_zones || [],
        allowed_companies: role.allowed_companies || [],
        allowed_agencies: role.allowed_agencies || [],
        interface_access: role.interface_access || [],
        permissions: role.permissions || {}
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', access_level: 'none', allowed_zones: [], allowed_companies: [], allowed_agencies: [], interface_access: [], permissions: {} });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateRole(editingId, formData);
        addToast(`Rôle ${formData.name} modifié avec succès`);
      } else {
        await createRole(formData);
        addToast(`Rôle ${formData.name} créé avec succès`);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save role', error);
      addToast(getErrorMessage(error, 'Erreur lors de l\'enregistrement du rôle'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (role) => setDeleteTarget(role);
  const cancelDelete = () => { if (!isDeleting) setDeleteTarget(null); };

  const confirmDelete = async () => {
    const role = deleteTarget;
    if (!role || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteRole(role.id);
      addToast(`Rôle ${role.name} supprimé avec succès`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete role', error);
      addToast(getErrorMessage(error, 'Erreur lors de la suppression du rôle'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getLevelIcon = (level) => {
    if (level === 'full') return <ShieldCheck size={16} className="text-green-500" />;
    if (level === 'restricted') return <Shield size={16} className="text-blue-500" />;
    return <ShieldAlert size={16} className="text-red-500" />;
  };

  const toggleZone = (zone) => {
    setFormData(prev => {
      const current = prev.allowed_zones || [];
      const next = current.includes(zone) ? current.filter(z => z !== zone) : [...current, zone];
      return { ...prev, allowed_zones: next };
    });
  };

  const toggleInterface = (interfaceKey) => {
    setFormData(prev => {
      const current = prev.interface_access || [];
      const next = current.includes(interfaceKey) ? current.filter(i => i !== interfaceKey) : [...current, interfaceKey];
      return { ...prev, interface_access: next };
    });
  };

  // A role belongs to at most one company — clicking a chip replaces
  // whatever was selected instead of adding to a list; clicking the already-
  // selected one clears it back to "all companies".
  const selectCompany = (companyId) => {
    setFormData(prev => {
      const id = companyId.toString();
      const alreadySelected = (prev.allowed_companies || [])[0] === id;
      return { ...prev, allowed_companies: alreadySelected ? [] : [id] };
    });
  };

  // Same one-at-a-time behavior as selectCompany — a role belongs to at
  // most one agency.
  const selectAgency = (agencyId) => {
    setFormData(prev => {
      const id = agencyId.toString();
      const alreadySelected = (prev.allowed_agencies || [])[0] === id;
      return { ...prev, allowed_agencies: alreadySelected ? [] : [id] };
    });
  };

  const togglePermission = (resource, action) => {
    setFormData(prev => {
      const currentPerms = prev.permissions || {};
      const resourcePerms = currentPerms[resource] || [];
      
      let newResourcePerms;
      if (resourcePerms.includes(action)) {
        newResourcePerms = resourcePerms.filter(a => a !== action);
      } else {
        newResourcePerms = [...resourcePerms, action];
      }

      return {
        ...prev,
        permissions: {
          ...currentPerms,
          [resource]: newResourcePerms
        }
      };
    });
  };

  return (
    <div className="crud-page">
      <header className="page-header">
        <div>
          <h1>Rôles & Permissions</h1>
          <p className="subtitle">Gérer les niveaux d'accès et les permissions système</p>
        </div>
        {canCreate && (
          <button className="primary-btn" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Ajouter un rôle</span>
          </button>
        )}
      </header>

      <div className="table-toolbar">
        <div className="search-bar glass">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher un rôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container glass">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : error ? (
          <div className="error-state">
            <span>Échec du chargement des rôles.</span>
            <button type="button" className="btn-secondary" onClick={refetch}>Réessayer</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom du rôle</th>
                <th>Description</th>
                <th>Niveau d'accès</th>
                <th>Zones autorisées</th>
                <th>Compagnie autorisée</th>
                <th>Agence autorisée</th>
                <th>Interfaces</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(role => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                  </td>
                  <td>{role.description || '-'}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                      {getLevelIcon(role.access_level)}
                      {ACCESS_LEVEL_LABELS[role.access_level] || role.access_level}
                    </div>
                  </td>
                  <td>
                    {role.allowed_zones && role.allowed_zones.length > 0 ? role.allowed_zones.join(', ') : 'Toutes'}
                  </td>
                  <td>
                    {role.allowed_companies && role.allowed_companies.length > 0 ? (
                      companies.filter(c => role.allowed_companies.includes(c.id.toString())).map(c => c.name).join(', ') || role.allowed_companies.join(', ')
                    ) : 'Toutes'}
                  </td>
                  <td>
                    {role.allowed_agencies && role.allowed_agencies.length > 0 ? (
                      agencies.filter(a => role.allowed_agencies.includes(a.id.toString())).map(a => a.name).join(', ') || role.allowed_agencies.join(', ')
                    ) : 'Toutes'}
                  </td>
                  <td>
                    {role.interface_access && role.interface_access.length > 0
                      ? role.interface_access.map(i => INTERFACE_LABELS[i] || i).join(', ')
                      : 'Toutes'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {canUpdate && (
                        <button className="icon-btn edit" onClick={() => openModal(role)}><Edit2 size={16} /></button>
                      )}
                      {canDelete && (
                        <button
                          className="icon-btn delete"
                          onClick={() => requestDelete(role)}
                          disabled={role.users_count > 0}
                          title={role.users_count > 0 ? `Impossible de supprimer : ${role.users_count} employé(s) rattaché(s) à ce rôle` : 'Supprimer'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {!canUpdate && !canDelete && '-'}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">Aucun rôle trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Modifier le rôle' : 'Ajouter un rôle'}
        closeDisabled={isSubmitting}
      >
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Nom du rôle</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Niveau d'accès</label>
            <select
              className="form-control"
              value={formData.access_level}
              onChange={(e) => setFormData({...formData, access_level: e.target.value})}
            >
              <option value="none">Aucun accès</option>
              <option value="restricted">Accès restreint</option>
              <option value="full">Accès complet (Admin)</option>
            </select>
          </div>

          {formData.access_level !== 'none' && (
            <div className="form-group">
              <label>Interfaces et permissions</label>
              <div className="permissions-grid">
                {INTERFACES.map(key => {
                  const isFull = formData.access_level === 'full';
                  const interfaceOn = isFull || (formData.interface_access || []).includes(key);
                  const hasActions = RESOURCES.includes(key);
                  return (
                    <div key={key} className="permission-row">
                      <label className="permission-interface-toggle">
                        <input
                          type="checkbox"
                          checked={interfaceOn}
                          onChange={() => toggleInterface(key)}
                          disabled={isFull}
                        />
                        {INTERFACE_LABELS[key]}
                      </label>
                      {hasActions && (
                        <div className="permission-actions nested-actions">
                          {ACTIONS.map(action => (
                            <label key={action} className="permission-action">
                              <input
                                type="checkbox"
                                checked={formData.permissions?.[key]?.includes(action) || false}
                                onChange={() => togglePermission(key, action)}
                                disabled={isFull || !interfaceOn}
                              />
                              {ACTION_LABELS[action]}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="subtext">
                {formData.access_level === 'full'
                  ? "L'accès complet donne accès à toutes les interfaces et actions."
                  : 'Aucune interface cochée = accès à toutes les interfaces.'}
              </span>
            </div>
          )}

          {formData.access_level === 'restricted' && (
            <>
              <div className="form-group">
                <label>Zones autorisées</label>
                <div className="chip-list">
                  {zones.map(z => (
                    <button
                      type="button"
                      key={z.id}
                      className={`chip ${(formData.allowed_zones || []).includes(z.name) ? 'active' : ''}`}
                      onClick={() => toggleZone(z.name)}
                    >
                      {z.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Compagnie autorisée</label>
                  <div className="chip-list">
                    {companies.map(c => (
                      <button
                        type="button"
                        key={c.id}
                        className={`chip ${(formData.allowed_companies || [])[0] === c.id.toString() ? 'active' : ''}`}
                        onClick={() => selectCompany(c.id)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <span className="subtext">Un rôle est rattaché à une seule compagnie · aucune sélection = toutes.</span>
                </div>
                <div className="form-group">
                  <label>Agence autorisée</label>
                  <div className="chip-list">
                    {agencies.map(a => (
                      <button
                        type="button"
                        key={a.id}
                        className={`chip ${(formData.allowed_agencies || [])[0] === a.id.toString() ? 'active' : ''}`}
                        onClick={() => selectAgency(a.id)}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                  <span className="subtext">Un rôle est rattaché à une seule agence · aucune sélection = toutes.</span>
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le rôle'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer le rôle"
        message={deleteTarget ? `Êtes-vous sûr de vouloir supprimer le rôle "${deleteTarget.name}" ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default RolesPage;
