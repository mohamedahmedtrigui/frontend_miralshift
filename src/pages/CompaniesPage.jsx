import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../utils/errors';
import { can } from '../utils/permissions';
import { companyBadgeText } from '../utils/companyLogo';
import { useAuthStore } from '../store/authStore';
import { useCompanies } from '../hooks/useCompanies';
import '../styles/pages/PageStyles.css';

const CompaniesPage = () => {
  const { user } = useAuthStore();
  const canCreate = can(user, 'companies', 'create');
  const canUpdate = can(user, 'companies', 'update');
  const canDelete = can(user, 'companies', 'delete');
  const { companies, loading, error, refetch, createCompany, updateCompany, deleteCompany } = useCompanies();
  const { addToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ name: '', logo: '', color: '#3b82f6', description: '' });
  const [fileToUpload, setFileToUpload] = useState(null);

  const openModal = (company = null) => {
    setFileToUpload(null);
    if (company) {
      setEditingId(company.id);
      setFormData({ name: company.name, logo: company.logo || '', color: company.color || '#3b82f6', description: company.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', logo: '', color: '#3b82f6', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('color', formData.color);
    submitData.append('description', formData.description);
    
    if (fileToUpload) {
      submitData.append('logo', fileToUpload);
    } else if (formData.logo && !formData.logo.startsWith('logos/')) {
      // It's initials
      submitData.append('logo', formData.logo);
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCompany(editingId, submitData);
        addToast(`Compagnie ${formData.name} modifiée avec succès`);
      } else {
        await createCompany(submitData);
        addToast(`Compagnie ${formData.name} créée avec succès`);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save company', error);
      addToast(getErrorMessage(error, 'Erreur lors de l\'enregistrement de la compagnie'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (company) => setDeleteTarget(company);
  const cancelDelete = () => { if (!isDeleting) setDeleteTarget(null); };

  const confirmDelete = async () => {
    const company = deleteTarget;
    if (!company || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteCompany(company.id);
      addToast(`Compagnie ${company.name} supprimée avec succès`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete company', error);
      addToast(getErrorMessage(error, 'Erreur lors de la suppression de la compagnie'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="crud-page">
      <header className="page-header">
        <div>
          <h1>Compagnies</h1>
          <p className="subtitle">Gérer les compagnies partenaires et filiales</p>
        </div>
        {canCreate && (
          <button className="primary-btn" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Ajouter une compagnie</span>
          </button>
        )}
      </header>

      <div className="table-container glass">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : error ? (
          <div className="error-state">
            <span>Échec du chargement des compagnies.</span>
            <button type="button" className="btn-secondary" onClick={refetch}>Réessayer</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: '60px'}}>Logo</th>
                <th>Nom de la compagnie</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id}>
                  <td data-label="Logo">
                    {company.logo_url ? (
                      <div style={{width: 40, height: 40, borderRadius: 'var(--radius-md)', overflow: 'hidden'}}>
                        <img src={company.logo_url} alt={company.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      </div>
                    ) : (
                      <div className="company-logo" style={{backgroundColor: '#e2e8f0', color: '#1e293b'}}>
                        {companyBadgeText(company)}
                      </div>
                    )}
                  </td>
                  <td data-label="Nom de la compagnie">
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span
                        title={company.color}
                        style={{width: 14, height: 14, borderRadius: '50%', backgroundColor: company.color || '#3b82f6', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)'}}
                      />
                      <strong>{company.name}</strong>
                    </div>
                  </td>
                  <td data-label="Description">{company.description || '-'}</td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      {canUpdate && (
                        <button className="icon-btn edit" onClick={() => openModal(company)}><Edit2 size={16} /></button>
                      )}
                      {canDelete && (
                        <button
                          className="icon-btn delete"
                          onClick={() => requestDelete(company)}
                          disabled={company.users_count > 0}
                          title={company.users_count > 0 ? `Impossible de supprimer : ${company.users_count} employé(s) rattaché(s) à cette compagnie` : 'Supprimer'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {!canUpdate && !canDelete && '-'}
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">Aucune compagnie trouvée</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Modifier la compagnie' : 'Ajouter une compagnie'}
        closeDisabled={isSubmitting}
      >
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Nom de la compagnie</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Logo de la compagnie (Image ou 2 initiales)</label>
            <div className="logo-upload-row">
              <div style={{flex: 1}}>
                <input 
                  type="file" 
                  accept="image/*"
                  className="form-control"
                  style={{padding: '8px'}}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setFileToUpload(e.target.files[0]);
                      setFormData({...formData, logo: ''}); // Clear initials
                    }
                  }}
                />
              </div>
              <span>OU</span>
              <div style={{width: '100px'}}>
                <input
                  type="text"
                  className="form-control"
                  maxLength={2}
                  placeholder="Initiales"
                  value={formData.logo && !formData.logo.startsWith('logos/') ? formData.logo : ''}
                  onChange={(e) => {
                    setFormData({...formData, logo: e.target.value.toUpperCase()});
                    setFileToUpload(null); // Clear file
                  }}
                  disabled={!!fileToUpload}
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Couleur (utilisée pour les cartes du calendrier)</label>
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
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer la compagnie'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer la compagnie"
        message={deleteTarget ? `Êtes-vous sûr de vouloir supprimer "${deleteTarget.name}" ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default CompaniesPage;
