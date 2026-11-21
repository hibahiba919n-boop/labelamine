import { useEffect, useState } from 'react';
import { LabProvider, useLab } from './context/LabContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SpecialtiesPage } from './pages/SpecialtiesPage';
import { ExaminationsPage } from './pages/ExaminationsPage';
import { HomeSamplingPage } from './pages/HomeSamplingPage';
import { ContactPage } from './pages/ContactPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

function AppShell() {
  const { currentPath, loading, error, refresh, navigate } = useLab();
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  if (currentPath === '/admin') {
    return <AdminDashboardPage />;
  }

  const renderPage = () => {
    if (loading && !error) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
          <div className="h-10 w-2/3 max-w-lg rounded-lg bg-[#E4EFF2] animate-pulse" />
          <div className="h-5 w-1/2 max-w-md rounded-lg bg-[#EBF4F6] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="h-44 rounded-xl bg-white border border-[#DCE7EB]" />
            <div className="h-44 rounded-xl bg-white border border-[#DCE7EB]" />
            <div className="h-44 rounded-xl bg-white border border-[#DCE7EB]" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="font-display font-bold text-2xl text-[#173247]">
            Chargement momentanément indisponible
          </h1>
          <p className="text-sm text-[#586873]">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="px-5 py-2.5 rounded-lg bg-[#173247] text-white text-sm font-semibold cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      );
    }

    switch (currentPath) {
      case '/':
        return <HomePage />;
      case '/laboratoire':
        return <AboutPage />;
      case '/specialites':
        return <SpecialtiesPage />;
      case '/examens':
        return <ExaminationsPage />;
      case '/prelevement-domicile':
        return <HomeSamplingPage />;
      case '/contact':
        return <ContactPage />;
      case '/nous-rejoindre':
        return <RecruitmentPage />;
      default:
        return (
          <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
            <p className="text-xs font-mono text-[#0E8F9F]">404</p>
            <h1 className="font-display font-bold text-3xl text-[#173247]">
              Page introuvable
            </h1>
            <p className="text-sm text-[#586873]">
              La page demandée n’existe pas ou a été déplacée.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-lg bg-[#173247] text-white text-sm font-semibold cursor-pointer"
            >
              Retour à l’accueil
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFB]">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LabProvider>
      <AppShell />
    </LabProvider>
  );
}
