import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Download,
  FileEdit,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useLab } from '../../context/LabContext';
import {
  ActivityLogItem,
  ContactMessageItem,
  Examination,
  GalleryPhoto,
  HomeSamplingRequestItem,
  JobPosition,
  RecruitmentApplicationItem,
  SiteSettingsBundle,
  Specialty,
} from '../../types/lab';
import { AdminContentTabs } from './AdminContentTabs';
import { AdminSettingsTab } from './AdminSettingsTab';

interface AdminOverviewData {
  counts: {
    samplingNew: number;
    samplingTotal: number;
    contactNew: number;
    contactTotal: number;
    recruitmentNew: number;
    recruitmentTotal: number;
    specialties: number;
    examinations: number;
  };
  recentActivity: ActivityLogItem[];
  settings: SiteSettingsBundle;
  specialties: Specialty[];
  examinations: Examination[];
  gallery: GalleryPhoto[];
  positions: JobPosition[];
}

interface AdminProfile {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
}

export function AdminDashboardPage() {
  const { navigate, refresh: refreshPublicSite } = useLab();

  // In-memory Bearer token (never persisted to localStorage/sessionStorage)
  const accessTokenRef = useRef<string | null>(null);
  const [authMode, setAuthMode] = useState<'supabase' | 'local'>(
    isSupabaseConfigured ? 'supabase' : 'local'
  );
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [showBootstrapView, setShowBootstrapView] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sign-in & First-Run Claim forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimConfirm, setClaimConfirm] = useState('');

  const [activeSection, setActiveSection] = useState<
    'overview' | 'requests' | 'content' | 'recruitment' | 'settings'
  >('overview');
  const [requestsSubTab, setRequestsSubTab] = useState<'sampling' | 'contact'>(
    'sampling'
  );
  const [statusFilter, setStatusFilter] = useState<string>('tous');

  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [samplingList, setSamplingList] = useState<HomeSamplingRequestItem[]>(
    []
  );
  const [contactList, setContactList] = useState<ContactMessageItem[]>([]);
  const [applications, setApplications] = useState<
    RecruitmentApplicationItem[]
  >([]);
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(
    null
  );

  // Notes editing buffers
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [newPosition, setNewPosition] = useState({
    title: '',
    department: '',
    contractType: 'Temps plein',
    description: '',
    isOpen: true,
  });

  const notify = useCallback((msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const getAuthHeader = useCallback(async (): Promise<
    Record<string, string>
  > => {
    if (authMode === 'supabase' && supabase) {
      const { data } = await supabase.auth.getSession();
      const freshToken = data.session?.access_token || accessTokenRef.current;
      if (!freshToken) throw new Error('Session non connectée.');
      accessTokenRef.current = freshToken;
      return { Authorization: `Bearer ${freshToken}` };
    }
    if (!accessTokenRef.current) {
      throw new Error('Session non connectée.');
    }
    return { Authorization: `Bearer ${accessTokenRef.current}` };
  }, [authMode]);

  const loadAllAdminData = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const [ovRes, sampRes, contRes, appRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
        fetch('/api/admin/requests/sampling', { headers }),
        fetch('/api/admin/requests/contact', { headers }),
        fetch('/api/admin/recruitment/applications', { headers }),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (sampRes.ok) setSamplingList(await sampRes.json());
      if (contRes.ok) setContactList(await contRes.json());
      if (appRes.ok) setApplications(await appRes.json());
      await refreshPublicSite();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Erreur de chargement admin.',
        true
      );
    }
  }, [getAuthHeader, notify, refreshPublicSite]);

  const verifyBearerAndLoad = useCallback(
    async (token: string) => {
      accessTokenRef.current = token;
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        accessTokenRef.current = null;
        setAdminProfile(null);
        setAuthError(json.error || 'Accès non autorisé.');
        return false;
      }
      setAdminProfile(json.user);
      setNeedsBootstrap(false);
      setShowBootstrapView(false);
      await loadAllAdminData();
      return true;
    },
    [loadAllAdminData]
  );

  useEffect(() => {
    let active = true;
    let unsubAuth: (() => void) | undefined;

    async function initAuth() {
      try {
        const res = await fetch('/api/auth/config');
        const cfg = (await res.json()) as {
          mode: 'supabase' | 'local';
          needsBootstrap: boolean;
        };
        if (!active) return;

        const effectiveMode =
          cfg.mode === 'supabase' && isSupabaseConfigured
            ? 'supabase'
            : 'local';
        setAuthMode(effectiveMode);
        setNeedsBootstrap(cfg.needsBootstrap);
        setShowBootstrapView(cfg.needsBootstrap);

        if (effectiveMode === 'supabase' && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token && active) {
            await verifyBearerAndLoad(data.session.access_token);
          }

          const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
              if (!active) return;
              if (session?.access_token) {
                await verifyBearerAndLoad(session.access_token);
              } else {
                accessTokenRef.current = null;
                setAdminProfile(null);
              }
            }
          );
          unsubAuth = () => listener.subscription.unsubscribe();
        }
      } catch {
        if (active) {
          setAuthError(
            "Impossible de vérifier la configuration d'authentification."
          );
        }
      } finally {
        if (active) setAuthChecking(false);
      }
    }

    initAuth();
    return () => {
      active = false;
      if (unsubAuth) unsubAuth();
    };
  }, [verifyBearerAndLoad]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      if (authMode === 'supabase' && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });
        if (error || !data.session?.access_token) {
          throw new Error(
            error?.message || 'Adresse e-mail ou mot de passe incorrect.'
          );
        }
        await verifyBearerAndLoad(data.session.access_token);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginEmail.trim(),
            password: loginPassword,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.token) {
          throw new Error(
            json.error || 'Adresse e-mail ou mot de passe incorrect.'
          );
        }
        await verifyBearerAndLoad(json.token);
      }
      setLoginPassword('');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Échec de la connexion.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleBootstrapClaim = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (claimPassword.length < 8) {
      setAuthError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (claimPassword !== claimConfirm) {
      setAuthError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: claimName.trim(),
          email: claimEmail.trim(),
          password: claimPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Impossible d'initialiser le compte.");
      }

      if (json.mode === 'supabase' && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: claimEmail.trim(),
          password: claimPassword,
        });
        if (error || !data.session?.access_token) {
          throw new Error(
            error?.message || 'Compte créé, mais connexion automatique échouée.'
          );
        }
        await verifyBearerAndLoad(data.session.access_token);
      } else if (json.token) {
        await verifyBearerAndLoad(json.token);
      }

      setClaimPassword('');
      setClaimConfirm('');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Erreur lors de l'initialisation."
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (authMode === 'supabase' && supabase) {
      await supabase.auth.signOut();
    }
    accessTokenRef.current = null;
    setAdminProfile(null);
    setOverview(null);
  };

  const updateSamplingRequest = async (
    id: number,
    status: string,
    notesKey: string,
    fallbackNotes: string
  ) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/requests/sampling/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          internalNotes: noteDrafts[notesKey] ?? fallbackNotes,
        }),
      });
      if (!res.ok) throw new Error('Mise à jour échouée.');
      await loadAllAdminData();
      notify('Demande mise à jour.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const updateContactMessage = async (
    id: number,
    status: string,
    notesKey: string,
    fallbackNotes: string
  ) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/requests/contact/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          internalNotes: noteDrafts[notesKey] ?? fallbackNotes,
        }),
      });
      if (!res.ok) throw new Error('Mise à jour échouée.');
      await loadAllAdminData();
      notify('Message mis à jour.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const updateApplicationStatus = async (
    id: number,
    status: string,
    notesKey: string,
    fallbackNotes: string
  ) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/recruitment/applications/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          internalNotes: noteDrafts[notesKey] ?? fallbackNotes,
        }),
      });
      if (!res.ok) throw new Error('Mise à jour échouée.');
      await loadAllAdminData();
      notify('Candidature mise à jour.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const downloadCv = async (appId: number, filename: string) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/recruitment/applications/${appId}/cv`, {
        headers,
      });
      if (!res.ok) throw new Error('Téléchargement refusé.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'cv_candidat.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const toggleRecruitmentEnabled = async () => {
    if (!overview) return;
    try {
      const headers = await getAuthHeader();
      const next = {
        ...overview.settings.recruitment,
        enabled: !overview.settings.recruitment.enabled,
      };
      const res = await fetch('/api/admin/settings/recruitment', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error('Modification impossible.');
      await loadAllAdminData();
      notify(
        next.enabled
          ? 'Page « Nous rejoindre » activée.'
          : 'Page « Nous rejoindre » désactivée.'
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const handleAddPosition = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/admin/recruitment/positions', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(newPosition),
      });
      if (!res.ok) throw new Error('Création impossible.');
      setNewPosition({
        title: '',
        department: '',
        contractType: 'Temps plein',
        description: '',
        isOpen: true,
      });
      await loadAllAdminData();
      notify('Poste publié.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  const deletePosition = async (id: number) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/admin/recruitment/positions/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Suppression impossible.');
      await loadAllAdminData();
      notify('Poste supprimé.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur.', true);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F5FAFB] flex items-center justify-center p-6">
        <p className="text-sm text-[#586873]">
          Vérification de la session administrateur...
        </p>
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <div className="min-h-screen bg-[#F5FAFB] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#DCE7EB] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/lab_logo_49732066.jfif"
              alt="Logo Laboratoires El Amine"
              className="w-11 h-11 rounded-lg border border-[#DCE7EB] object-cover"
            />
            <div>
              <h1 className="font-display font-bold text-lg text-[#173247]">
                Administration El Amine
              </h1>
              <p className="text-xs text-[#586873]">
                {showBootstrapView && needsBootstrap
                  ? 'Initialisation du premier Super Administrateur'
                  : 'Accès réservé à la direction'}
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{authError}</span>
            </div>
          )}

          {showBootstrapView && needsBootstrap ? (
            <form onSubmit={handleBootstrapClaim} className="space-y-4">
              <p className="text-xs text-[#586873] leading-relaxed">
                Aucun compte administrateur n’est encore configuré. Créez le
                premier compte Super Administrateur pour sécuriser cet espace.
              </p>

              <div>
                <label className="block text-xs font-medium text-[#173247] mb-1">
                  Nom affiché
                </label>
                <input
                  type="text"
                  required
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="Dr. Direction El Amine"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#173247] mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  placeholder="labelamine27@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#173247] mb-1">
                  Mot de passe (min. 8 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={claimPassword}
                  onChange={(e) => setClaimPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#173247] mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={claimConfirm}
                  onChange={(e) => setClaimConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] disabled:opacity-60 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {authSubmitting
                    ? 'Initialisation...'
                    : 'Créer et activer le compte'}
                </span>
              </button>

              {authMode === 'supabase' && (
                <button
                  type="button"
                  onClick={() => setShowBootstrapView(false)}
                  className="w-full py-2 text-xs font-medium text-[#586873] hover:text-[#173247] cursor-pointer"
                >
                  Déjà créé dans Supabase ? Se connecter
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-sm text-[#586873] leading-relaxed">
                Connectez-vous avec vos identifiants administrateur pour gérer
                les demandes de prélèvement, les messages, le catalogue
                d’examens et les paramètres du site.
              </p>

              <div>
                <label className="block text-xs font-medium text-[#173247] mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@labelamine.dz"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#173247] mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {authSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>

              {needsBootstrap && (
                <button
                  type="button"
                  onClick={() => setShowBootstrapView(true)}
                  className="w-full py-2 text-xs font-medium text-[#0E8F9F] hover:text-[#173247] cursor-pointer"
                >
                  Premier accès ? Initialiser le compte Super Administrateur
                </button>
              )}
            </form>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 text-xs font-medium text-[#0E8F9F] hover:text-[#173247] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au site public</span>
          </button>
        </div>
      </div>
    );
  }

  const navLinks = [
    { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'requests', label: 'Demandes & Messages', icon: Inbox },
    { id: 'content', label: 'Gestion du contenu', icon: FileEdit },
    { id: 'recruitment', label: 'Recrutement', icon: Briefcase },
    { id: 'settings', label: 'Paramètres & Comptes', icon: Settings },
  ] as const;

  const filteredSampling = samplingList.filter(
    (item) => statusFilter === 'tous' || item.status === statusFilter
  );
  const filteredContact = contactList.filter(
    (item) => statusFilter === 'tous' || item.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-[#F5FAFB] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-e border-[#DCE7EB] shrink-0 flex flex-col justify-between">
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/lab_logo_49732066.jfif"
              alt="Logo El Amine"
              className="w-9 h-9 rounded-md border border-[#DCE7EB] object-cover"
            />
            <div className="min-w-0">
              <p className="font-display font-bold text-sm text-[#173247] truncate">
                El Amine Admin
              </p>
              <p className="text-xs text-[#586873] font-mono truncate">
                {adminProfile.role}
              </p>
            </div>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#EBF8FA] text-[#0E8F9F] font-semibold'
                      : 'text-[#425461] hover:bg-[#F5FAFB] hover:text-[#173247]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-5 border-t border-[#DCE7EB] space-y-3">
          <div className="text-xs">
            <p className="font-medium text-[#173247] truncate">
              {adminProfile.displayName || adminProfile.email}
            </p>
            <p className="text-[#586873] truncate">{adminProfile.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2 px-3 rounded-lg border border-[#DCE7EB] text-xs font-medium text-[#173247] hover:bg-[#F5FAFB] cursor-pointer"
            >
              Site public
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Se déconnecter"
              className="p-2 rounded-lg border border-[#DCE7EB] text-[#586873] hover:text-[#DC2626] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-[#DCE7EB] px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-[#586873]">
            Administration <span aria-hidden="true">/</span>{' '}
            <span className="font-semibold text-[#173247]">
              {navLinks.find((n) => n.id === activeSection)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-medium text-[#0E8F9F]"
            >
              Site public
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-medium text-[#DC2626]"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-6xl w-full space-y-6">
          {toast && (
            <div
              role="status"
              className={`p-3.5 rounded-xl border text-sm flex items-center gap-2 ${
                toast.isError
                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  : 'bg-[#EAF8F3] border-[#BBE5D4] text-[#14533C]'
              }`}
            >
              {toast.isError ? (
                <AlertCircle className="w-4 h-4 text-[#DC2626]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              )}
              <span>{toast.msg}</span>
            </div>
          )}

          {/* 1. Overview */}
          {activeSection === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-1">
                  <p className="text-xs text-[#586873]">
                    Prélèvements à domicile (nouveaux)
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#173247]">
                    {overview.counts.samplingNew}{' '}
                    <span className="text-xs font-normal text-[#586873]">
                      / {overview.counts.samplingTotal} total
                    </span>
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-1">
                  <p className="text-xs text-[#586873]">
                    Messages de contact (nouveaux)
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#173247]">
                    {overview.counts.contactNew}{' '}
                    <span className="text-xs font-normal text-[#586873]">
                      / {overview.counts.contactTotal} total
                    </span>
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-1">
                  <p className="text-xs text-[#586873]">
                    Candidatures reçues
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#173247]">
                    {overview.counts.recruitmentNew}{' '}
                    <span className="text-xs font-normal text-[#586873]">
                      / {overview.counts.recruitmentTotal} total
                    </span>
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-1">
                  <p className="text-xs text-[#586873]">
                    Spécialités & Examens
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#0E8F9F]">
                    {overview.counts.specialties} · {overview.counts.examinations}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#DCE7EB] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#DCE7EB]">
                  <h2 className="font-display font-bold text-base text-[#173247]">
                    Activité récente
                  </h2>
                </div>
                {overview.recentActivity.length === 0 ? (
                  <p className="p-6 text-sm text-[#586873]">
                    Aucune activité récente enregistrée.
                  </p>
                ) : (
                  <div className="divide-y divide-[#EEF4F6]">
                    {overview.recentActivity.map((act) => (
                      <div
                        key={act.id}
                        className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                      >
                        <div>
                          <p className="text-[#173247] font-medium">
                            {act.summary}
                          </p>
                          <p className="text-xs text-[#586873]">
                            {act.type} · {act.actor || 'Système'}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-[#586873] shrink-0">
                          {new Date(act.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Requests Management */}
          {activeSection === 'requests' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-1 p-1 rounded-lg bg-[#EDF4F6] border border-[#DCE7EB]">
                  <button
                    type="button"
                    onClick={() => {
                      setRequestsSubTab('sampling');
                      setStatusFilter('tous');
                    }}
                    className={`px-4 py-2 rounded-md text-xs font-medium cursor-pointer ${
                      requestsSubTab === 'sampling'
                        ? 'bg-white text-[#173247] shadow-xs'
                        : 'text-[#586873]'
                    }`}
                  >
                    Prélèvements à domicile ({samplingList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestsSubTab('contact');
                      setStatusFilter('tous');
                    }}
                    className={`px-4 py-2 rounded-md text-xs font-medium cursor-pointer ${
                      requestsSubTab === 'contact'
                        ? 'bg-white text-[#173247] shadow-xs'
                        : 'text-[#586873]'
                    }`}
                  >
                    Messages de contact ({contactList.length})
                  </button>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#DCE7EB] bg-white text-xs font-medium text-[#173247]"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="nouveau">Nouveau</option>
                  {requestsSubTab === 'sampling' ? (
                    <>
                      <option value="en_cours">En cours</option>
                      <option value="confirmé">Confirmé</option>
                    </>
                  ) : (
                    <option value="traité">Traité</option>
                  )}
                  <option value="archivé">Archivé</option>
                </select>
              </div>

              {requestsSubTab === 'sampling' && (
                <div className="space-y-4">
                  {filteredSampling.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE7EB] p-8 text-center text-sm text-[#586873]">
                      Aucune demande de prélèvement à domicile dans cette vue.
                    </div>
                  ) : (
                    filteredSampling.map((item) => {
                      const key = `s-${item.id}`;
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-display font-bold text-base text-[#173247]">
                                {item.patientName}{' '}
                                <span className="font-mono text-xs text-[#0E8F9F] ms-2">
                                  {item.phone}
                                </span>
                              </p>
                              <p className="text-xs text-[#586873]">
                                Date souhaitée : {item.requestedDate} ·{' '}
                                {item.preferredTime}
                              </p>
                            </div>
                            <span className="text-xs font-mono font-semibold text-[#173247]">
                              Statut : {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-[#1D2933]">
                            <strong>Adresse :</strong> {item.address}
                          </p>
                          {item.additionalInfo && (
                            <p className="text-xs text-[#586873]">
                              <strong>Notes patient :</strong>{' '}
                              {item.additionalInfo}
                            </p>
                          )}
                          <div className="pt-3 border-t border-[#EEF4F6] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <input
                              type="text"
                              placeholder="Notes internes secrétariat..."
                              value={noteDrafts[key] ?? item.internalNotes ?? ''}
                              onChange={(e) =>
                                setNoteDrafts({
                                  ...noteDrafts,
                                  [key]: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 rounded-lg border border-[#DCE7EB] text-xs"
                            />
                            <select
                              value={item.status}
                              onChange={(e) =>
                                updateSamplingRequest(
                                  item.id,
                                  e.target.value,
                                  key,
                                  item.internalNotes || ''
                                )
                              }
                              className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-xs font-medium"
                            >
                              <option value="nouveau">Nouveau</option>
                              <option value="en_cours">En cours</option>
                              <option value="confirmé">Confirmé</option>
                              <option value="archivé">Archivé</option>
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                updateSamplingRequest(
                                  item.id,
                                  item.status,
                                  key,
                                  item.internalNotes || ''
                                )
                              }
                              className="px-3.5 py-2 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
                            >
                              Sauvegarder note
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {requestsSubTab === 'contact' && (
                <div className="space-y-4">
                  {filteredContact.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE7EB] p-8 text-center text-sm text-[#586873]">
                      Aucun message de contact dans cette vue.
                    </div>
                  ) : (
                    filteredContact.map((msg) => {
                      const key = `c-${msg.id}`;
                      return (
                        <div
                          key={msg.id}
                          className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-display font-bold text-base text-[#173247]">
                                {msg.subject}
                              </p>
                              <p className="text-xs text-[#586873]">
                                {msg.senderName} · {msg.phone || 'Sans tél'} ·{' '}
                                {msg.email || 'Sans e-mail'}
                              </p>
                            </div>
                            <span className="text-xs font-mono font-semibold text-[#173247]">
                              Statut : {msg.status}
                            </span>
                          </div>
                          <p className="text-sm text-[#1D2933] leading-relaxed">
                            {msg.message}
                          </p>
                          <div className="pt-3 border-t border-[#EEF4F6] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <input
                              type="text"
                              placeholder="Notes internes..."
                              value={noteDrafts[key] ?? msg.internalNotes ?? ''}
                              onChange={(e) =>
                                setNoteDrafts({
                                  ...noteDrafts,
                                  [key]: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 rounded-lg border border-[#DCE7EB] text-xs"
                            />
                            <select
                              value={msg.status}
                              onChange={(e) =>
                                updateContactMessage(
                                  msg.id,
                                  e.target.value,
                                  key,
                                  msg.internalNotes || ''
                                )
                              }
                              className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-xs font-medium"
                            >
                              <option value="nouveau">Nouveau</option>
                              <option value="traité">Traité</option>
                              <option value="archivé">Archivé</option>
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                updateContactMessage(
                                  msg.id,
                                  msg.status,
                                  key,
                                  msg.internalNotes || ''
                                )
                              }
                              className="px-3.5 py-2 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
                            >
                              Sauvegarder note
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Content Management */}
          {activeSection === 'content' && overview && (
            <AdminContentTabs
              getAuthHeader={getAuthHeader}
              homepage={overview.settings.homepage}
              about={overview.settings.about}
              specialties={overview.specialties}
              examinations={overview.examinations}
              gallery={overview.gallery}
              onReload={loadAllAdminData}
              notify={notify}
            />
          )}

          {/* 4. Recruitment Management */}
          {activeSection === 'recruitment' && overview && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#DCE7EB] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-base text-[#173247]">
                    Statut de la page « Nous rejoindre »
                  </h2>
                  <p className="text-xs text-[#586873]">
                    Activez ou suspendez la réception des candidatures sur le
                    site public.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleRecruitmentEnabled}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    overview.settings.recruitment.enabled
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#EDF4F6] text-[#173247] border border-[#DCE7EB]'
                  }`}
                >
                  {overview.settings.recruitment.enabled
                    ? 'Module activé'
                    : 'Module désactivé'}
                </button>
              </div>

              {/* Applications list */}
              <div className="bg-white rounded-xl border border-[#DCE7EB] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#DCE7EB]">
                  <h3 className="font-display font-bold text-base text-[#173247]">
                    Candidatures reçues ({applications.length})
                  </h3>
                </div>
                {applications.length === 0 ? (
                  <p className="p-6 text-sm text-[#586873]">
                    Aucune candidature reçue pour le moment.
                  </p>
                ) : (
                  <div className="divide-y divide-[#EEF4F6]">
                    {applications.map((appRow) => {
                      const key = `r-${appRow.id}`;
                      return (
                        <div key={appRow.id} className="p-5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="font-display font-semibold text-base text-[#173247]">
                                {appRow.applicantName} ·{' '}
                                <span className="text-sm font-normal text-[#0E8F9F]">
                                  {appRow.positionTitle}
                                </span>
                              </p>
                              <p className="text-xs text-[#586873]">
                                {appRow.email} · {appRow.phone} ·{' '}
                                <span className="font-mono">
                                  {Math.round(appRow.cvSize / 1024)} Ko
                                </span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                downloadCv(appRow.id, appRow.cvFilename)
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DCE7EB] hover:border-[#0E8F9F] text-xs font-semibold text-[#173247] shrink-0 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#0E8F9F]" />
                              <span>Télécharger CV (PDF)</span>
                            </button>
                          </div>
                          {appRow.message && (
                            <p className="text-xs text-[#586873]">
                              {appRow.message}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <input
                              type="text"
                              placeholder="Notes RH internes..."
                              value={
                                noteDrafts[key] ?? appRow.internalNotes ?? ''
                              }
                              onChange={(e) =>
                                setNoteDrafts({
                                  ...noteDrafts,
                                  [key]: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 rounded-lg border border-[#DCE7EB] text-xs"
                            />
                            <select
                              value={appRow.status}
                              onChange={(e) =>
                                updateApplicationStatus(
                                  appRow.id,
                                  e.target.value,
                                  key,
                                  appRow.internalNotes || ''
                                )
                              }
                              className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-xs font-medium"
                            >
                              <option value="reçu">Reçu</option>
                              <option value="présélectionné">
                                Présélectionné
                              </option>
                              <option value="entretien">Entretien</option>
                              <option value="archivé">Archivé</option>
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                updateApplicationStatus(
                                  appRow.id,
                                  appRow.status,
                                  key,
                                  appRow.internalNotes || ''
                                )
                              }
                              className="px-3.5 py-2 rounded-lg bg-[#173247] text-white text-xs font-semibold cursor-pointer"
                            >
                              Sauvegarder
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Positions CRUD */}
              <div className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-4">
                <h3 className="font-display font-bold text-base text-[#173247]">
                  Postes ouverts ({overview.positions.length})
                </h3>
                <div className="divide-y divide-[#EEF4F6]">
                  {overview.positions.map((pos) => (
                    <div
                      key={pos.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#173247]">
                          {pos.title}
                        </p>
                        <p className="text-xs text-[#586873]">
                          {pos.department} · {pos.contractType}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePosition(pos.id)}
                        className="p-2 rounded-lg border border-[#DCE7EB] text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleAddPosition}
                  className="pt-4 border-t border-[#EEF4F6] space-y-3"
                >
                  <p className="text-xs font-semibold text-[#173247]">
                    Publier un nouveau poste
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Intitulé du poste"
                      value={newPosition.title}
                      onChange={(e) =>
                        setNewPosition({ ...newPosition, title: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Service"
                      value={newPosition.department}
                      onChange={(e) =>
                        setNewPosition({
                          ...newPosition,
                          department: e.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Type (Temps plein...)"
                      value={newPosition.contractType}
                      onChange={(e) =>
                        setNewPosition({
                          ...newPosition,
                          contractType: e.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
                    />
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Description du poste"
                    value={newPosition.description}
                    onChange={(e) =>
                      setNewPosition({
                        ...newPosition,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#DCE7EB] text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publier le poste</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 5. Settings & RBAC */}
          {activeSection === 'settings' && overview && (
            <AdminSettingsTab
              getAuthHeader={getAuthHeader}
              general={overview.settings.general}
              hours={overview.settings.hours}
              currentAdminRole={adminProfile.role}
              onReload={loadAllAdminData}
              notify={notify}
            />
          )}
        </main>
      </div>
    </div>
  );
}
