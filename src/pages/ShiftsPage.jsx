import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../utils/errors';
import { can } from '../utils/permissions';
import { useAuthStore } from '../store/authStore';
import { useShifts } from '../hooks/useShifts';
import '../styles/pages/PageStyles.css';

const ShiftsPage = () => {
  const { user } = useAuthStore();
  const canCreate = can(user, 'shifts', 'create');
  const canUpdate = can(user, 'shifts', 'update');
  const canDelete = can(user, 'shifts', 'delete');
  const { shifts, companies, agencies, loading, createShift, updateShift, deleteShift } = useShifts();
  const { addToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', company_id: '', agency_id: '', start_time: '', end_time: '', color: '#3b82f6'
  });

  const openModal = (shift = null) => {
    if (shift) {
      setEditingId(shift.id);
      setFormData({
        name: shift.name,
        company_id: shift.company_id || '',
        agency_id: shift.agency_id || '',
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        color: shift.color || '#3b82f6',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', company_id: '', agency_id: '', start_time: '', end_time: '', color: '#3b82f6' });
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
        await updateShift(editingId, formData);
        addToast(`Shift ${formData.name} modifié avec succès`);
      } else {
        await createShift(formData);
        addToast(`Shift ${formData.name} créé avec succès`);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save shift', error);
      addToast(getErrorMessage(error, 'Erreur lors de l\'enregistrement du shift'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (shift) => setDeleteTarget(shift);
  const cancelDelete = () => { if (!isDeleting) setDeleteTarget(null); };

  const confirmDelete = async () => {
    const shift = deleteTarget;
    if (!shift || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteShift(shift.id);
      addToast(`Shift ${shift.name} supprimé avec succès`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete shift', error);
      addToast(getErrorMessage(error, 'Erreur lors de la suppression du shift'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="crud-page">
      <header className="page-header">
        <div>
          <h1>Configuration des shifts</h1>
          <p className="subtitle">Gérer les créneaux horaires par compagnie et agence</p>
        </div>
        {canCreate && (
          <button className="primary-btn" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Ajouter un shift</span>
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
                <th>Nom</th>
                <th>Compagnie</th>
                <th>Agence</th>
                <th>Horaires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(shift => (
                <tr key={shift.id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span
                        title={shift.color}
                        style={{width: 14, height: 14, borderRadius: '50%', backgroundColor: shift.color || '#3b82f6', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)'}}
                      />
                      <strong>{shift.name}</strong>
                    </div>
                  </td>
                  <td>{shift.company?.name || '-'}</td>
                  <td>{shift.agency?.name || '-'}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <Clock size={14} />
                      <span>{shift.start_time} - {shift.end_time}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {canUpdate && (
                        <button className="icon-btn edit" onClick={() => openModal(shift)}><Edit2 size={16} /></button>
                      )}
                      {canDelete && (
                        <button
                          className="icon-btn delete"
                          onClick={() => requestDelete(shift)}
                          disabled={shift.users_count > 0}
                          title={shift.users_count > 0 ? `Impossible de supprimer : ${shift.users_count} employé(s) rattaché(s) à ce shift` : 'Supprimer'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {!canUpdate && !canDelete && '-'}
                    </div>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">Aucun shift trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Modifier le shift' : 'Ajouter un shift'}
        closeDisabled={isSubmitting}
      >
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Nom du shift</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label>Compagnie</label>
              <select
                className="form-control" value={formData.company_id}
                onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                required
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
                required
              >
                <option value="">Sélectionner une agence</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label>Début (HH:MM)</label>
              <input
                type="time" className="form-control"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Fin (HH:MM)</label>
              <input
                type="time" className="form-control"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Couleur</label>
            <div className="color-picker-row">
              <input
                type="color"
                className="color-input"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
              <span className="subtext">{formData.color}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le shift'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer le shift"
        message={deleteTarget ? `Êtes-vous sûr de vouloir supprimer le shift "${deleteTarget.name}" ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default ShiftsPage;
