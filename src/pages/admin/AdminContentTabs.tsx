import { FormEvent, useState } from 'react';
import { Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import {
  AboutSettings,
  Examination,
  GalleryPhoto,
  HomepageSettings,
  Specialty,
} from '../../types/lab';

interface AdminContentTabsProps {
  getAuthHeader: () => Promise<Record<string, string>>;
  homepage: HomepageSettings;
  about: AboutSettings;
  specialties: Specialty[];
  examinations: Examination[];
  gallery: GalleryPhoto[];
  onReload: () => Promise<void>;
  notify: (msg: string, isError?: boolean) => void;
}

export function AdminContentTabs({
  getAuthHeader,
  homepage,
  about,
  specialties,
  examinations,
  gallery,
  onReload,
  notify,
}: AdminContentTabsProps) {
  const [subTab, setSubTab] = useState<
    'homepage' | 'about' | 'specialties' | 'examinations' | 'gallery'
  >('specialties');

  // Homepage & About state
  const [hpForm, setHpForm] = useState<HomepageSettings>(homepage);
  const [aboutForm, setAboutForm] = useState<AboutSettings>(about);
  const [saving, setSaving] = useState(false);

  // New specialty state
  const [newSpec, setNewSpec] = useState({
    name: '',
    slug: '',
    shortDescription: '',
    fullDescription: '',
    iconName: 'FlaskConical',
    imageUrl: '/src/assets/images/specialty_biochemistry_lab_1795208040675.jpg',
    isPublished: true,
    sortOrder: specialties.length + 1,
  });

  // New examination state
  const [newExam, setNewExam] = useState({
    specialtyId: specialties[0]?.id ? String(specialties[0].id) : '',
    code: '',
    name: '',
    sampleType: 'Sang veineux (tube sec)',
    preparation: '',
    fastingRequired: false,
    turnaroundTime: 'Délai confirmé à l’accueil',
    notes: '',
    isPublished: true,
  });

  // New gallery photo state
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    caption: '',
    category: 'installations',
    imageUrl: '/assets/aistudio/labamin4_6c39a0ed.jfif',
    isAuthentic: true,
    isPublished: true,
    sortOrder: gallery.length + 1,
  });

  const saveSettingsKey = async (key: 'homepage' | 'about', payload: unknown) => {
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
      notify('Contenu enregistré et publié.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur de sauvegarde.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialty = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeader();
      const slug =
        newSpec.slug.trim() ||
        newSpec.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const res = await fetch('/api/admin/specialties', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSpec, slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Création impossible.');
      setNewSpec({
        name: '',
        slug: '',
        shortDescription: '',
        fullDescription: '',
        iconName: 'FlaskConical',
        imageUrl: '/src/assets/images/specialty_biochemistry_lab_1795208040675.jpg',
        isPublished: true,
        sortOrder: specialties.length + 2,
      });
      await onReload();
      notify('Spécialité ajoutée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const toggleSpecialtyPublish = async (spec: Specialty) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/specialties/${spec.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !spec.isPublished }),
      });
      if (!res.ok) throw new Error('Mise à jour impossible.');
      await onReload();
      notify(
        spec.isPublished ? 'Spécialité masquée du site.' : 'Spécialité publiée.'
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const deleteSpecialty = async (id: number) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/specialties/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Suppression impossible.');
      await onReload();
      notify('Spécialité supprimée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const handleAddExam = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/admin/examinations', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExam,
          specialtyId: newExam.specialtyId ? Number(newExam.specialtyId) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Création impossible.');
      setNewExam({
        specialtyId: specialties[0]?.id ? String(specialties[0].id) : '',
        code: '',
        name: '',
        sampleType: 'Sang veineux (tube sec)',
        preparation: '',
        fastingRequired: false,
        turnaroundTime: 'Délai confirmé à l’accueil',
        notes: '',
        isPublished: true,
      });
      await onReload();
      notify('Examen ajouté au catalogue.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const toggleExamPublish = async (exam: Examination) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/examinations/${exam.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !exam.isPublished }),
      });
      if (!res.ok) throw new Error('Mise à jour impossible.');
      await onReload();
      notify(exam.isPublished ? 'Examen masqué.' : 'Examen publié.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const deleteExam = async (id: number) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/examinations/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Suppression impossible.');
      await onReload();
      notify('Examen supprimé.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const handleAddPhoto = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ajout impossible.');
      setNewPhoto({
        title: '',
        caption: '',
        category: 'installations',
        imageUrl: '/assets/aistudio/labamin4_6c39a0ed.jfif',
        isAuthentic: true,
        isPublished: true,
        sortOrder: gallery.length + 2,
      });
      await onReload();
      notify('Photographie ajoutée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const togglePhotoPublish = async (photo: GalleryPhoto) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/gallery/${photo.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !photo.isPublished }),
      });
      if (!res.ok) throw new Error('Mise à jour impossible.');
      await onReload();
      notify('Visibilité de la photo mise à jour.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const deletePhoto = async (id: number) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Suppression impossible.');
      await onReload();
      notify('Photographie supprimée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-[#EDF4F6] border border-[#DCE7EB] w-fit">
        {(
          [
            ['specialties', 'Spécialités'],
            ['examinations', "Catalogue d'examens"],
            ['gallery', 'Photographies'],
            ['homepage', 'Accueil'],
            ['about', 'À propos'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              subTab === key
                ? 'bg-white text-[#173247] shadow-xs'
                : 'text-[#586873] hover:text-[#173247]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Homepage editor */}
      {subTab === 'homepage' && (
        <div className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-5">
          <h2 className="font-display font-bold text-lg text-[#173247]">
            Contenu de la page d’accueil
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#586873] mb-1">
                Surtitre Hero
              </label>
              <input
                type="text"
                value={hpForm.heroKicker}
                onChange={(e) =>
                  setHpForm({ ...hpForm, heroKicker: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#586873] mb-1">
                Titre principal Hero
              </label>
              <input
                type="text"
                value={hpForm.heroTitle}
                onChange={(e) =>
                  setHpForm({ ...hpForm, heroTitle: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Paragraphe Hero
            </label>
            <textarea
              rows={2}
              value={hpForm.heroSubtitle}
              onChange={(e) =>
                setHpForm({ ...hpForm, heroSubtitle: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Titre section introduction
            </label>
            <input
              type="text"
              value={hpForm.introTitle}
              onChange={(e) =>
                setHpForm({ ...hpForm, introTitle: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Texte d’introduction
            </label>
            <textarea
              rows={3}
              value={hpForm.introBody}
              onChange={(e) =>
                setHpForm({ ...hpForm, introBody: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveSettingsKey('homepage', hpForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la page d’accueil</span>
          </button>
        </div>
      )}

      {/* About editor */}
      {subTab === 'about' && (
        <div className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-5">
          <h2 className="font-display font-bold text-lg text-[#173247]">
            Contenu de la page « Le laboratoire »
          </h2>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Titre principal
            </label>
            <input
              type="text"
              value={aboutForm.headline}
              onChange={(e) =>
                setAboutForm({ ...aboutForm, headline: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Chapô de présentation
            </label>
            <textarea
              rows={2}
              value={aboutForm.lead}
              onChange={(e) =>
                setAboutForm({ ...aboutForm, lead: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Historique & inauguration
            </label>
            <textarea
              rows={3}
              value={aboutForm.historyText}
              onChange={(e) =>
                setAboutForm({ ...aboutForm, historyText: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#586873] mb-1">
              Mission
            </label>
            <textarea
              rows={2}
              value={aboutForm.missionText}
              onChange={(e) =>
                setAboutForm({ ...aboutForm, missionText: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveSettingsKey('about', aboutForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la page À propos</span>
          </button>
        </div>
      )}

      {/* Specialties CRUD */}
      {subTab === 'specialties' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#DCE7EB] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DCE7EB] flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-[#173247]">
                Départements techniques ({specialties.length})
              </h2>
              <span className="text-xs text-[#586873]">
                Masquez ou publiez uniquement les pôles confirmés par le laboratoire
              </span>
            </div>
            <div className="divide-y divide-[#EEF4F6]">
              {specialties.map((s) => (
                <div
                  key={s.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#173247]">
                        {s.name}
                      </span>
                      <span aria-hidden="true" className="text-[#94A3B8]">
                        ·
                      </span>
                      <span className="text-xs font-mono text-[#586873]">
                        {s.slug}
                      </span>
                      <span aria-hidden="true" className="text-[#94A3B8]">
                        ·
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          s.isPublished ? 'text-[#16A34A]' : 'text-[#D97706]'
                        }`}
                      >
                        {s.isPublished ? '● Publié' : '○ Masqué'}
                      </span>
                    </div>
                    <p className="text-xs text-[#586873]">{s.shortDescription}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSpecialtyPublish(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE7EB] text-xs font-medium text-[#173247] hover:border-[#0E8F9F] cursor-pointer"
                    >
                      {s.isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Masquer</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publier</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSpecialty(s.id)}
                      aria-label={`Supprimer ${s.name}`}
                      className="p-2 rounded-lg border border-[#DCE7EB] text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleAddSpecialty}
            className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-4"
          >
            <h3 className="font-display font-semibold text-base text-[#173247]">
              Ajouter une spécialité
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Nom du département (ex. Biochimie clinique)"
                value={newSpec.name}
                onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
              <select
                value={newSpec.iconName}
                onChange={(e) =>
                  setNewSpec({ ...newSpec, iconName: e.target.value })
                }
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              >
                <option value="FlaskConical">Icône Chimie / Flacon</option>
                <option value="Droplets">Icône Hématologie</option>
                <option value="Microscope">Icône Microbiologie</option>
                <option value="Dna">Icône Biologie moléculaire</option>
                <option value="Activity">Icône Hémostase</option>
                <option value="ShieldCheck">Icône Immunologie</option>
              </select>
            </div>
            <input
              type="text"
              required
              placeholder="Résumé court"
              value={newSpec.shortDescription}
              onChange={(e) =>
                setNewSpec({ ...newSpec, shortDescription: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
            <textarea
              rows={2}
              required
              placeholder="Description détaillée"
              value={newSpec.fullDescription}
              onChange={(e) =>
                setNewSpec({ ...newSpec, fullDescription: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter la spécialité</span>
            </button>
          </form>
        </div>
      )}

      {/* Examinations CRUD */}
      {subTab === 'examinations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#DCE7EB] overflow-x-auto">
            <div className="px-6 py-4 border-b border-[#DCE7EB]">
              <h2 className="font-display font-bold text-base text-[#173247]">
                Catalogue des examens ({examinations.length})
              </h2>
            </div>
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DCE7EB] bg-[#F9FCFD] text-xs text-[#586873]">
                  <th className="py-3 px-4 font-medium text-start">Code</th>
                  <th className="py-3 px-4 font-medium text-start">Examen</th>
                  <th className="py-3 px-4 font-medium text-start">Prélèvement</th>
                  <th className="py-3 px-4 font-medium text-start">Jeûne</th>
                  <th className="py-3 px-4 font-medium text-start">Statut</th>
                  <th className="py-3 px-4 font-medium text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF4F6]">
                {examinations.map((exam) => (
                  <tr key={exam.id} className="hover:bg-[#F9FCFD]">
                    <td className="py-3 px-4 font-mono text-xs text-[#0E8F9F]">
                      {exam.code}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#173247]">
                      {exam.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#586873]">
                      {exam.sampleType}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#586873]">
                      {exam.fastingRequired ? 'Oui' : 'Non'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span
                        className={
                          exam.isPublished ? 'text-[#16A34A]' : 'text-[#D97706]'
                        }
                      >
                        {exam.isPublished ? '● Publié' : '○ Masqué'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleExamPublish(exam)}
                        className="px-2.5 py-1 rounded border border-[#DCE7EB] text-xs text-[#173247] hover:border-[#0E8F9F] cursor-pointer"
                      >
                        {exam.isPublished ? 'Masquer' : 'Publier'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExam(exam.id)}
                        aria-label={`Supprimer ${exam.name}`}
                        className="p-1.5 rounded border border-[#DCE7EB] text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer align-middle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={handleAddExam}
            className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-4"
          >
            <h3 className="font-display font-semibold text-base text-[#173247]">
              Ajouter un examen au catalogue
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                placeholder="Code (ex. BIO-FER)"
                value={newExam.code}
                onChange={(e) => setNewExam({ ...newExam, code: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm font-mono"
              />
              <input
                type="text"
                required
                placeholder="Nom de l'examen"
                value={newExam.name}
                onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm sm:col-span-2"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                value={newExam.specialtyId}
                onChange={(e) =>
                  setNewExam({ ...newExam, specialtyId: e.target.value })
                }
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              >
                <option value="">Sans spécialité</option>
                {specialties.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Type de prélèvement"
                value={newExam.sampleType}
                onChange={(e) =>
                  setNewExam({ ...newExam, sampleType: e.target.value })
                }
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
              <input
                type="text"
                required
                placeholder="Délai estimé"
                value={newExam.turnaroundTime}
                onChange={(e) =>
                  setNewExam({ ...newExam, turnaroundTime: e.target.value })
                }
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
            </div>
            <textarea
              rows={2}
              required
              placeholder="Consignes de préparation pré-analytique"
              value={newExam.preparation}
              onChange={(e) =>
                setNewExam({ ...newExam, preparation: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-[#173247] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newExam.fastingRequired}
                  onChange={(e) =>
                    setNewExam({ ...newExam, fastingRequired: e.target.checked })
                  }
                />
                <span>Jeûne requis / recommandé</span>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter l’examen</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery CRUD */}
      {subTab === 'gallery' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-xl border border-[#DCE7EB] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-40 object-cover border-b border-[#DCE7EB]"
                  />
                  <div className="p-4 space-y-1">
                    <p className="text-xs text-[#0E8F9F]">
                      {photo.isAuthentic ? 'Photo réelle' : 'Illustration'} ·{' '}
                      {photo.isPublished ? 'Publiée' : 'Masquée'}
                    </p>
                    <p className="font-semibold text-sm text-[#173247]">
                      {photo.title}
                    </p>
                    <p className="text-xs text-[#586873]">{photo.caption}</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-[#EEF4F6] flex justify-between">
                  <button
                    type="button"
                    onClick={() => togglePhotoPublish(photo)}
                    className="text-xs font-medium text-[#173247] hover:text-[#0E8F9F] cursor-pointer"
                  >
                    {photo.isPublished ? 'Masquer' : 'Publier'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo.id)}
                    className="text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddPhoto}
            className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-4"
          >
            <h3 className="font-display font-semibold text-base text-[#173247]">
              Ajouter une photographie à la galerie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Titre"
                value={newPhoto.title}
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, title: e.target.value })
                }
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
              />
              <input
                type="text"
                required
                placeholder="Chemin local (/assets/...) ou URL https://"
                value={newPhoto.imageUrl}
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, imageUrl: e.target.value })
                }
                className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm font-mono"
              />
            </div>
            <input
              type="text"
              required
              placeholder="Légende"
              value={newPhoto.caption}
              onChange={(e) =>
                setNewPhoto({ ...newPhoto, caption: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
            />
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-[#173247] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPhoto.isAuthentic}
                  onChange={(e) =>
                    setNewPhoto({ ...newPhoto, isAuthentic: e.target.checked })
                  }
                />
                <span>Photographie réelle du laboratoire El Amine</span>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter la photo</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
