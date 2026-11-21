import { FormEvent, useEffect, useState } from 'react';
import { Plus, Save, Shield, Trash2 } from 'lucide-react';
import {
  AdminUserItem,
  GeneralSettings,
  HoursSettings,
} from '../../types/lab';

interface AdminSettingsTabProps {
  getAuthHeader: () => Promise<Record<string, string>>;
  general: GeneralSettings;
  hours: HoursSettings;
  currentAdminRole: string;
  onReload: () => Promise<void>;
  notify: (msg: string, isError?: boolean) => void;
}

export function AdminSettingsTab({
  getAuthHeader,
  general,
  hours,
  currentAdminRole,
  onReload,
  notify,
}: AdminSettingsTabProps) {
  const [genForm, setGenForm] = useState<GeneralSettings>(general);
  const [hoursForm, setHoursForm] = useState<HoursSettings>(hours);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'super_admin'>('admin');
  const [saving, setSaving] = useState(false);

  const loadAdminUsers = async () => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/admin/users', { headers });
      if (res.ok) {
        setAdminUsers(await res.json());
      }
    } catch {
      // ignore silently
    }
  };

  useEffect(() => {
    loadAdminUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveKey = async (key: 'general' | 'hours', payload: unknown) => {
    setSaving(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur de sauvegarde.');
      await onReload();
      notify('Paramètres enregistrés.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          displayName: newUserName,
          role: newUserRole,
          password: newUserPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action refusée.');
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      await loadAdminUsers();
      notify('Compte administrateur configuré.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const toggleUserActive = async (u: AdminUserItem) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Mise à jour impossible.');
      await loadAdminUsers();
      notify('Statut du compte mis à jour.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const deleteAdminUser = async (id: number) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Suppression impossible.');
      await loadAdminUsers();
      notify('Compte retiré.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  return (
    <div className="space-y-8">
      {/* General Contact & Social Info */}
      <div className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-5">
        <h2 className="font-display font-bold text-lg text-[#173247]">
          Informations générales, coordonnées & réseaux sociaux
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Nom officiel du laboratoire
            </label>
            <input
              type="text"
              value={genForm.labName}
              onChange={(e) => setGenForm({ ...genForm, labName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Adresse complète
            </label>
            <input
              type="text"
              value={genForm.address}
              onChange={(e) => setGenForm({ ...genForm, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Téléphone affiché
            </label>
            <input
              type="text"
              value={genForm.phone}
              onChange={(e) => setGenForm({ ...genForm, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Numéro brut WhatsApp / tel:
            </label>
            <input
              type="text"
              value={genForm.whatsapp}
              onChange={(e) =>
                setGenForm({
                  ...genForm,
                  whatsapp: e.target.value,
                  phoneRaw: e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              E-mail officiel
            </label>
            <input
              type="email"
              value={genForm.email}
              onChange={(e) => setGenForm({ ...genForm, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Plateforme externe de résultats (BM Lab Server)
            </label>
            <input
              type="url"
              value={genForm.resultsPlatformUrl}
              onChange={(e) =>
                setGenForm({ ...genForm, resultsPlatformUrl: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Lien Facebook
            </label>
            <input
              type="url"
              value={genForm.facebookUrl}
              onChange={(e) =>
                setGenForm({ ...genForm, facebookUrl: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Lien Instagram
            </label>
            <input
              type="url"
              value={genForm.instagramUrl}
              onChange={(e) =>
                setGenForm({ ...genForm, instagramUrl: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => saveKey('general', genForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les coordonnées</span>
        </button>
      </div>

      {/* Opening Hours */}
      <div className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-5">
        <h2 className="font-display font-bold text-lg text-[#173247]">
          Horaires d’ouverture
        </h2>
        <div>
          <label className="block text-xs font-medium text-[#586873] mb-1">
            Message d’information sur les horaires
          </label>
          <input
            type="text"
            value={hoursForm.notice}
            onChange={(e) =>
              setHoursForm({ ...hoursForm, notice: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
          />
        </div>
        <div className="space-y-3">
          {hoursForm.schedule.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={row.day}
                onChange={(e) => {
                  const next = [...hoursForm.schedule];
                  next[idx] = { ...next[idx], day: e.target.value };
                  setHoursForm({ ...hoursForm, schedule: next });
                }}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm font-medium"
              />
              <input
                type="text"
                value={row.hours}
                onChange={(e) => {
                  const next = [...hoursForm.schedule];
                  next[idx] = { ...next[idx], hours: e.target.value };
                  setHoursForm({ ...hoursForm, schedule: next });
                }}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => saveKey('hours', hoursForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les horaires</span>
        </button>
      </div>

      {/* Admin Accounts & Roles */}
      <div className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0E8F9F]" />
          <h2 className="font-display font-bold text-lg text-[#173247]">
            Comptes administrateurs et rôles
          </h2>
        </div>

        <div className="divide-y divide-[#EEF4F6] border-y border-[#EEF4F6]">
          {adminUsers.map((u) => (
            <div
              key={u.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#173247]">
                  {u.displayName || u.email}
                </p>
                <p className="text-xs text-[#586873]">
                  {u.email} · <span className="font-mono">{u.role}</span> ·{' '}
                  <span className={u.isActive ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                    {u.isActive ? 'Actif' : 'Désactivé'}
                  </span>
                </p>
              </div>
              {currentAdminRole === 'super_admin' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleUserActive(u)}
                    className="px-3 py-1.5 rounded-lg border border-[#DCE7EB] text-xs font-medium text-[#173247] hover:border-[#0E8F9F] cursor-pointer"
                  >
                    {u.isActive ? 'Désactiver' : 'Réactiver'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAdminUser(u.id)}
                    aria-label={`Supprimer ${u.email}`}
                    className="p-1.5 rounded-lg border border-[#DCE7EB] text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {currentAdminRole === 'super_admin' && (
          <form onSubmit={handleAddAdmin} className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-[#173247]">
              Ajouter ou autoriser un compte administrateur
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="email"
                required
                placeholder="Adresse e-mail professionnelle"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
              <input
                type="text"
                required
                placeholder="Nom affiché"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
              <input
                type="password"
                minLength={8}
                placeholder="Mot de passe (min. 8 car.)"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
              <select
                value={newUserRole}
                onChange={(e) =>
                  setNewUserRole(
                    e.target.value as 'admin' | 'editor' | 'super_admin'
                  )
                }
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              >
                <option value="admin">Administrateur</option>
                <option value="editor">Éditeur contenu</option>
                <option value="super_admin">Super Administrateur</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter cet accès</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
