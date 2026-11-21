import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { PublicBootstrapPayload } from '../types/lab';

interface LabContextValue {
  data: PublicBootstrapPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  currentPath: string;
  navigate: (path: string) => void;
}

const LabContext = createContext<LabContextValue | null>(null);

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: "Laboratoires d'analyses médicales El Amine – Mostaganem",
    description:
      "Analyses médicales de précision, prélèvement à domicile et consultation sécurisée des résultats à Mostaganem, Algérie.",
  },
  '/laboratoire': {
    title: 'Le laboratoire – Laboratoires El Amine Mostaganem',
    description:
      "Découvrez l'histoire, la mission, les valeurs et les installations réelles des Laboratoires d'analyses médicales El Amine à Mostaganem.",
  },
  '/specialites': {
    title: 'Nos spécialités – Laboratoires El Amine Mostaganem',
    description:
      'Pôles biologiques : biochimie clinique, hématologie, hémostase, immunologie, hormonologie, microbiologie et biologie médicale.',
  },
  '/examens': {
    title: "Catalogue d'examens – Laboratoires El Amine Mostaganem",
    description:
      'Recherchez vos examens biologiques, consultez le type de prélèvement, les consignes de jeûne et les modalités de préparation.',
  },
  '/prelevement-domicile': {
    title: 'Prélèvement à domicile – Laboratoires El Amine Mostaganem',
    description:
      'Demandez un prélèvement sanguin ou biologique à domicile à Mostaganem avec l’équipe mobile des Laboratoires El Amine.',
  },
  '/contact': {
    title: 'Contact & Localisation – Laboratoires El Amine Mostaganem',
    description:
      'Coordonnées, téléphone, WhatsApp, adresse W3FF+4FG Mostaganem et carte interactive Google Maps des Laboratoires El Amine.',
  },
  '/nous-rejoindre': {
    title: 'Nous rejoindre – Laboratoires El Amine Mostaganem',
    description:
      'Postes disponibles et candidatures spontanées aux Laboratoires d’analyses médicales El Amine à Mostaganem.',
  },
  '/admin': {
    title: 'Administration – Laboratoires El Amine',
    description: 'Espace de gestion sécurisé des Laboratoires El Amine.',
  },
};

export function LabProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicBootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(
    () => window.location.pathname || '/'
  );

  const fetchBootstrap = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/public/bootstrap');
      if (!res.ok) {
        let msg = 'Erreur lors du chargement des données du laboratoire.';
        try {
          const errJson = await res.json();
          if (errJson?.error) msg = errJson.error;
        } catch {
          // Non-JSON error response
        }
        throw new Error(msg);
      }
      const json: PublicBootstrapPayload = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de contacter le serveur.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const meta = PAGE_META[currentPath] || PAGE_META['/'];
    document.title = meta.title;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute('content', meta.description);
    }
  }, [currentPath]);

  const navigate = useCallback((path: string) => {
    if (path === window.location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <LabContext.Provider
      value={{
        data,
        loading,
        error,
        refresh: fetchBootstrap,
        currentPath,
        navigate,
      }}
    >
      {children}
    </LabContext.Provider>
  );
}

export function useLab() {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab must be used inside LabProvider');
  return ctx;
}
