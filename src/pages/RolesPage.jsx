import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../utils/errors';
import { can } from '../utils/permissions';
import { useAuthStore } from '../store/authStore';
import { useRoles } from '../hooks/useRoles';
import '../styles/pages/PageStyles.css';

// Matches the actual backend resources (routes/api.php) — there is no separate
// "shifts" model/route, shifts are fields on the users resource.
const RESOURCES = ['users', 'roles', 'companies'];
const ACTIONS = ['create', 'read', 'update', 'delete'];

// Values stay in English to match the stored access_level/permissions keys —
// these maps are for display only.
const RESOURCE_LABELS = { users: 'Employés', roles: 'Rôles', companies: 'Compagnies' };
const ACTION_LABELS = { create: 'Créer', read: 'Lire', update: 'Modifier', delete: 'Supprimer' };
const ACCESS_LEVEL_LABELS = { none: 'Aucun accès', restricted: 'Accès restreint', full: 'Accès complet' };

const RolesPage = () => {
  const { user } = useAuthStore();
  const canCreate = can(user, 'roles', 'create');
  const canUpdate = can(user, 'roles', 'update');
  const canDelete = can(user, 'roles', 'delete');
  const { roles, companies, zones, loading, createRole, updateRole, deleteRole } = useRoles();
  const { addToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', access_level: 'none', allowed_zones: [], allowed_companies: [], permissions: {}
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
        permissions: role.permissions || {}
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', access_level: 'none', allowed_zones: [], allowed_companies: [], permissions: {} });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  const requestDelete = (role) => setDeleteTarget(role);
  const cancelDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    const role = deleteTarget;
    if (!role) return;
    setDeleteTarget(null);
    try {
      await deleteRole(role.id);
      addToast(`Rôle ${role.name} supprimé avec succès`);
    } catch (error) {
      console.error('Failed to delete role', error);
      addToast(getErrorMessage(error, 'Erreur lors de la suppression du rôle'), 'error');
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

  const toggleCompany = (companyId) => {
    setFormData(prev => {
      const current = prev.allowed_companies || [];
      const id = companyId.toString();
      const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
      return { ...prev, allowed_companies: next };
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

      <div className="table-container glass">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom du rôle</th>
                <th>Description</th>
                <th>Niveau d'accès</th>
                <th>Zones autorisées</th>
                <th>Compagnies autorisées</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
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
              {roles.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">Aucun rôle trouvé</td>
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

          {formData.access_level === 'restricted' && (
            <div className="form-row-2col">
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
              <div className="form-group">
                <label>Compagnies autorisées</label>
                <div className="chip-list">
                  {companies.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      className={`chip ${(formData.allowed_companies || []).includes(c.id.toString()) ? 'active' : ''}`}
                      onClick={() => toggleCompany(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formData.access_level !== 'none' && (
            <div className="form-group">
              <label>Permissions détaillées</label>
              <div className="permissions-grid">
                {RESOURCES.map(res => (
                  <div key={res} className="permission-row">
                    <span className="permission-resource">{RESOURCE_LABELS[res]}</span>
                    <div className="permission-actions">
                      {ACTIONS.map(action => (
                        <label key={action} className="permission-action">
                          <input
                            type="checkbox"
                            checked={formData.permissions?.[res]?.includes(action) || false}
                            onChange={() => togglePermission(res, action)}
                            disabled={formData.access_level === 'full'}
                          />
                          {ACTION_LABELS[action]}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {formData.access_level === 'full' && (
                  <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
                    L'accès complet accorde automatiquement toutes les permissions.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer le rôle</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer le rôle"
        message={deleteTarget ? `Êtes-vous sûr de vouloir supprimer le rôle "${deleteTarget.name}" ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default RolesPage;
