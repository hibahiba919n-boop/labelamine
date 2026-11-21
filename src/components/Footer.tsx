import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { useLab } from '../context/LabContext';

export function Footer() {
  const { data, navigate } = useLab();
  const general = data?.settings.general;
  const hours = data?.settings.hours;
  const recruitmentEnabled = data?.settings.recruitment.enabled ?? true;

  const links = [
    { label: 'Accueil', path: '/' },
    { label: 'Le laboratoire', path: '/laboratoire' },
    { label: 'Nos spécialités', path: '/specialites' },
    { label: "Catalogue d'examens", path: '/examens' },
    { label: 'Prélèvement à domicile', path: '/prelevement-domicile' },
    { label: 'Contact & Accès', path: '/contact' },
    ...(recruitmentEnabled
      ? [{ label: 'Nous rejoindre', path: '/nous-rejoindre' }]
      : []),
  ];

  return (
    <footer className="bg-[#173247] text-white border-t border-[#234763]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/lab_logo_49732066.jfif"
                alt="Logo Laboratoires d'analyses médicales El Amine"
                className="w-11 h-11 rounded-lg bg-white p-0.5 object-cover"
              />
              <div>
                <p className="font-display font-bold text-base text-white">
                  {general?.labName || "Laboratoires d'analyses médicales El Amine"}
                </p>
                <p className="text-xs text-[#9CC1D2]">Mostaganem, Algérie</p>
              </div>
            </div>
            <p className="text-sm text-[#C7DCE6] leading-relaxed max-w-sm">
              Laboratoire de biologie médicale engagé pour la précision analytique,
              la qualité d’accueil et la confidentialité de vos dossiers médicaux.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a
                href={
                  general?.facebookUrl ||
                  'https://www.facebook.com/lab.elamine27/reels/?locale=fr_FR'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#43CFE0] hover:text-white transition-colors"
              >
                Facebook
              </a>
              <span aria-hidden="true" className="text-[#4B6C84]">
                ·
              </span>
              <a
                href={
                  general?.instagramUrl ||
                  'https://www.instagram.com/lab_elamine/'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#43CFE0] hover:text-white transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8FB6C8]">
              Navigation
            </h3>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.path}>
                  <a
                    href={l.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(l.path);
                    }}
                    className="text-sm text-[#D5E6EE] hover:text-[#43CFE0] transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/admin');
                  }}
                  className="text-sm text-[#8FB6C8] hover:text-white transition-colors"
                >
                  Administration
                </a>
              </li>
            </ul>
          </div>

          {/* Coordonnées & Horaires */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8FB6C8]">
              Coordonnées
            </h3>
            <div className="space-y-2.5 text-sm text-[#D5E6EE]">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#43CFE0] shrink-0 mt-0.5" />
                <span>{general?.address || 'W3FF+4FG, Mostaganem, Algérie'}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#43CFE0] shrink-0" />
                <a
                  href={`tel:${general?.phoneRaw || '+213797108442'}`}
                  className="font-mono hover:text-[#43CFE0] transition-colors"
                >
                  {general?.phone || '+213 797 10 84 42'}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#43CFE0] shrink-0" />
                <a
                  href={`mailto:${general?.email || 'labelamine27@gmail.com'}`}
                  className="hover:text-[#43CFE0] transition-colors break-all"
                >
                  {general?.email || 'labelamine27@gmail.com'}
                </a>
              </p>
            </div>
            {hours?.schedule && (
              <div className="pt-2 border-t border-[#254A67] space-y-1">
                <p className="text-xs font-medium text-[#8FB6C8]">Horaires</p>
                {hours.schedule.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 text-xs text-[#C7DCE6]"
                  >
                    <span>{row.day}</span>
                    <span className="text-end text-[#9CC1D2]">{row.hours}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* External Results Platform */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8FB6C8]">
              Résultats patients
            </h3>
            <p className="text-xs text-[#C7DCE6] leading-relaxed">
              Les comptes rendus d’analyses sont accessibles uniquement sur la
              plateforme externe dédiée BM Lab Server.
            </p>
            <a
              href={
                general?.resultsPlatformUrl ||
                'https://resultat.bmlabserver.com/'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#43CFE0] text-[#173247] text-xs font-bold hover:bg-white transition-colors"
            >
              <span>Consulter mes résultats</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#254A67] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CC1D2]">
          <p>
            © {new Date().getFullYear()}{' '}
            {general?.labName || "Laboratoires d'analyses médicales El Amine"}.
            Tous droits réservés.
          </p>
          <p>Mostaganem, Algérie · W3FF+4FG</p>
        </div>
      </div>
    </footer>
  );
}
