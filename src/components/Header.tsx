import { useState } from 'react';
import { ExternalLink, Menu, Phone, X } from 'lucide-react';
import { useLab } from '../context/LabContext';

export function Header() {
  const { data, currentPath, navigate } = useLab();
  const [mobileOpen, setMobileOpen] = useState(false);

  const resultsUrl =
    data?.settings.general.resultsPlatformUrl ||
    'https://resultat.bmlabserver.com/';
  const phone = data?.settings.general.phone || '+213 797 10 84 42';
  const phoneRaw = data?.settings.general.phoneRaw || '+213797108442';
  const recruitmentEnabled = data?.settings.recruitment.enabled ?? true;

  const navItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Le laboratoire', path: '/laboratoire' },
    { label: 'Nos spécialités', path: '/specialites' },
    { label: 'Examens', path: '/examens' },
    { label: 'Prélèvement à domicile', path: '/prelevement-domicile' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark & Official Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('/');
          }}
          className="flex items-center gap-3 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E8F9F] rounded-lg py-1"
        >
          <img
            src="/assets/aistudio/lab_logo_49732066.jfif"
            alt="Logo Laboratoires d'analyses médicales El Amine"
            className="w-10 h-10 object-cover rounded-md border border-[#E6F0F3]"
          />
          <span className="font-display font-bold text-[15px] sm:text-base tracking-tight text-[#173247] whitespace-nowrap shrink-0">
            Laboratoire El Amine
          </span>
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Navigation principale"
          className="hidden lg:flex items-center gap-6"
        >
          {navItems.map((item) => {
            const active = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.path);
                }}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E8F9F] rounded ${
                  active
                    ? 'text-[#0E8F9F]'
                    : 'text-[#425461] hover:text-[#173247]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#0E8F9F]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={resultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43CFE0]"
          >
            <span>Consulter mes résultats</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#DCE7EB] text-[#173247] hover:bg-[#F5FAFB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E8F9F]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dedicated Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#DCE7EB] bg-white px-4 py-5 space-y-4">
          <a
            href={resultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0E8F9F] text-white text-sm font-semibold hover:bg-[#173247] transition-colors"
          >
            <span>Consulter mes résultats</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>

          <nav aria-label="Navigation mobile" className="grid grid-cols-1 divide-y divide-[#EEF4F6]">
            {navItems.map((item) => {
              const active = currentPath === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.path);
                  }}
                  className={`min-h-[44px] flex items-center justify-between py-2.5 text-sm font-medium ${
                    active ? 'text-[#0E8F9F] font-semibold' : 'text-[#1D2933]'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="text-xs text-[#0E8F9F]">Actif</span>}
                </a>
              );
            })}
            {recruitmentEnabled && (
              <a
                href="/nous-rejoindre"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/nous-rejoindre');
                }}
                className={`min-h-[44px] flex items-center justify-between py-2.5 text-sm font-medium ${
                  currentPath === '/nous-rejoindre'
                    ? 'text-[#0E8F9F] font-semibold'
                    : 'text-[#1D2933]'
                }`}
              >
                <span>Nous rejoindre</span>
              </a>
            )}
          </nav>

          <div className="pt-2 border-t border-[#DCE7EB] flex items-center justify-between text-xs text-[#586873]">
            <span>Mostaganem, Algérie</span>
            <a
              href={`tel:${phoneRaw}`}
              className="inline-flex items-center gap-1.5 font-mono font-medium text-[#173247]"
            >
              <Phone className="w-3.5 h-3.5 text-[#0E8F9F]" />
              {phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
