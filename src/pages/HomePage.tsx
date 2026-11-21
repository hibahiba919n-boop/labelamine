import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { SmartImage } from '../components/SmartImage';
import { SpecialtyIcon } from '../components/SpecialtyIcon';
import { LabMap } from '../components/LabMap';
import { GalleryPhoto } from '../types/lab';

export function HomePage() {
  const { data, navigate } = useLab();
  const [quickQuery, setQuickQuery] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  const settings = data?.settings;
  const general = settings?.general;
  const homepage = settings?.homepage;
  const specialties = data?.specialties || [];
  const examinations = data?.examinations || [];
  const gallery = data?.gallery || [];

  const filteredExams = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    const list = q
      ? examinations.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.code.toLowerCase().includes(q) ||
            e.sampleType.toLowerCase().includes(q)
        )
      : examinations;
    return list.slice(0, 6);
  }, [examinations, quickQuery]);

  const specialtyMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const s of specialties) {
      map[s.id] = s.name;
    }
    return map;
  }, [specialties]);

  const resultsUrl =
    general?.resultsPlatformUrl || 'https://resultat.bmlabserver.com/';
  const whatsappDigits = (general?.whatsapp || '+213797108442').replace(
    /[^0-9]/g,
    ''
  );

  return (
    <div className="bg-[#F5FAFB]">
      {/* 1. Cinematic Medical Laboratory Hero */}
      <section className="bg-white border-b border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
                {homepage?.heroKicker || 'Biologie médicale · Mostaganem'}
              </p>

              <h1 className="font-display font-bold text-[clamp(2.15rem,4vw,3.5rem)] leading-[1.08] tracking-tight text-[#173247] text-balance max-w-2xl">
                {homepage?.heroTitle ||
                  'Votre santé mérite une attention particulière.'}
              </h1>

              <p className="text-base sm:text-lg text-[#586873] leading-relaxed max-w-xl">
                {homepage?.heroSubtitle ||
                  "Les Laboratoires d'analyses médicales El Amine vous accompagnent avec professionnalisme et engagement pour vos analyses médicales à Mostaganem."}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Nous contacter</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/nous-rejoindre')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#EBF8FA] hover:bg-[#DDF3F6] border border-[#BCE8EE] text-[#173247] text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Nous rejoindre</span>
                  <Briefcase className="w-4 h-4 text-[#0E8F9F]" aria-hidden="true" />
                </button>
              </div>

              <div className="pt-4 border-t border-[#E8F0F2] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#586873]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0E8F9F]" />
                  {general?.address || 'W3FF+4FG, Mostaganem, Algérie'}
                </span>
                <span aria-hidden="true">·</span>
                <a
                  href={`tel:${general?.phoneRaw || '+213797108442'}`}
                  className="inline-flex items-center gap-1.5 font-mono text-[#173247] hover:text-[#0E8F9F]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0E8F9F]" />
                  {general?.phone || '+213 797 10 84 42'}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col"
            >
              <div className="relative flex-1 min-h-[280px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-[#DCE7EB] bg-[#EAF4F6]">
                <SmartImage
                  src={
                    homepage?.heroImageUrl ||
                    '/src/assets/images/hero_clinical_lab_1795208041572.jpg'
                  }
                  alt="Environnement de laboratoire d'analyses médicales moderne"
                  loading="eager"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#173247]/80 via-[#173247]/35 to-transparent p-5">
                  <p className="text-xs text-white/90">
                    Illustration d’un plateau technique de biologie médicale ·
                    Prise en charge sur site et à domicile à Mostaganem
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 4-Column Anchor Strip Below Hero Split */}
          <div className="mt-12 pt-8 border-t border-[#DCE7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-[#586873]">Ouverture officielle</p>
              <p className="mt-1 font-display font-semibold text-base text-[#173247]">
                4 juillet 2021 · Mostaganem
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#586873]">Service mobile</p>
              <p className="mt-1 font-display font-semibold text-base text-[#173247]">
                Prélèvement à domicile
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#586873]">Résultats patients</p>
              <p className="mt-1 font-display font-semibold text-base text-[#173247]">
                Portail BM Lab Server
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#586873]">Téléphone & WhatsApp</p>
              <p className="mt-1 font-mono font-semibold text-base text-[#0E8F9F]">
                {general?.phone || '+213 797 10 84 42'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Introduction to Laboratoires El Amine (with Real Exterior Photo) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-5">
            <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-[#DCE7EB] bg-white">
              <SmartImage
                src="/assets/aistudio/labamin4_6c39a0ed.jfif"
                alt="Façade réelle des Laboratoires d'analyses médicales El Amine à Mostaganem"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2.5 text-xs text-[#586873]">
              Photographie réelle de l’établissement · W3FF+4FG, Mostaganem
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              Le laboratoire
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-[#173247] tracking-tight text-balance">
              {homepage?.introTitle ||
                'Une prise en charge biologique rigoureuse et humaine.'}
            </h2>
            <p className="text-base text-[#586873] leading-relaxed">
              {homepage?.introBody ||
                "Inauguré le 4 juillet 2021 à Mostaganem, notre laboratoire met la précision analytique et le confort du patient au cœur de chaque étape, du prélèvement jusqu'à la remise sécurisée de vos résultats."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-[#DCE7EB]">
                <p className="text-sm font-semibold text-[#173247]">
                  Salles de prélèvement dédiées
                </p>
                <p className="mt-1 text-xs text-[#586873] leading-relaxed">
                  Espaces climatisés et calmes pour un accueil respectueux et confidentiel.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#DCE7EB]">
                <p className="text-sm font-semibold text-[#173247]">
                  Écoute & orientation claire
                </p>
                <p className="mt-1 text-xs text-[#586873] leading-relaxed">
                  Consignes pré-analytiques précises avant votre visite ou prélèvement à domicile.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/laboratoire')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0E8F9F] hover:text-[#173247] transition-colors cursor-pointer"
              >
                <span>Découvrir l’histoire et les installations du laboratoire</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Laboratory Specialties */}
      <section className="bg-white border-y border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
                Départements techniques
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-[#173247] tracking-tight">
                Nos pôles de biologie médicale
              </h2>
              <p className="text-sm sm:text-base text-[#586873]">
                Organisation des pôles biologiques couvrant les besoins courants
                et spécialisés prescrits par votre médecin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/specialites')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#DCE7EB] hover:border-[#0E8F9F] text-sm font-semibold text-[#173247] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Toutes nos spécialités</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialties.slice(0, 6).map((spec) => (
              <div
                key={spec.id}
                onClick={() => navigate('/examens')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate('/examens');
                }}
                className="group p-6 rounded-xl bg-[#F9FCFD] hover:bg-white border border-[#DCE7EB] hover:border-[#43CFE0] transition-colors duration-150 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#DCE7EB] flex items-center justify-center text-[#0E8F9F] group-hover:bg-[#0E8F9F] group-hover:text-white transition-colors">
                    <SpecialtyIcon name={spec.iconName} className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-[#173247]">
                    {spec.name}
                  </h3>
                  <p className="text-sm text-[#586873] leading-relaxed">
                    {spec.shortDescription}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E8F9F] group-hover:text-[#173247]">
                  <span>Consulter les examens associés</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Our Laboratory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
                Engagements qualité
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-[#173247] tracking-tight text-balance">
                Pourquoi faire confiance aux Laboratoires El Amine
              </h2>
            </div>

            <div className="divide-y divide-[#DCE7EB] border-y border-[#DCE7EB]">
              {(homepage?.whyChooseItems || []).map((item) => (
                <div
                  key={item.number}
                  className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start"
                >
                  <span className="sm:col-span-2 font-mono text-sm font-medium text-[#0E8F9F]">
                    {item.number}.
                  </span>
                  <div className="sm:col-span-10 space-y-1">
                    <h3 className="font-display font-semibold text-base text-[#173247]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#586873] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex-1 min-h-[280px] rounded-2xl overflow-hidden border border-[#DCE7EB] bg-white">
              <SmartImage
                src="/assets/aistudio/labamin_86331eca.webp"
                alt="Salle de prélèvement réelle aux Laboratoires El Amine"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-[#586873]">
              Salle de prélèvement réelle au sein du laboratoire à Mostaganem.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Examination Catalogue Preview */}
      <section className="bg-white border-y border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
                Préparation aux analyses
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#173247] tracking-tight">
                Aperçu du catalogue d’examens
              </h2>
              <p className="text-sm sm:text-base text-[#586873]">
                Vérifiez le type de prélèvement et les consignes de jeûne avant
                votre passage au laboratoire.
              </p>
            </div>

            <div className="w-full lg:w-96 relative">
              <Search
                className="w-4 h-4 text-[#586873] absolute start-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Rechercher un examen (ex: Glycémie, NFS)..."
                aria-label="Rechercher un examen biologique"
                className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F5FAFB] text-sm text-[#1D2933] placeholder:text-[#788894] focus:outline-none focus:border-[#0E8F9F] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {filteredExams.length === 0 ? (
            <div className="p-8 rounded-xl border border-[#DCE7EB] bg-[#F5FAFB] text-center space-y-2">
              <FileSearch className="w-6 h-6 text-[#0E8F9F] mx-auto" />
              <p className="text-sm font-medium text-[#173247]">
                Aucun examen correspondant à « {quickQuery} ».
              </p>
              <p className="text-xs text-[#586873]">
                Contactez le secrétariat au {general?.phone || '+213 797 10 84 42'} pour
                toute analyse spécifique.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-5 rounded-xl bg-white border border-[#DCE7EB] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#586873]">
                      <span className="font-mono font-medium text-[#0E8F9F]">
                        {exam.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">
                        {exam.specialtyId
                          ? specialtyMap[exam.specialtyId] || 'Biologie médicale'
                          : 'Biologie médicale'}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-base text-[#173247]">
                      {exam.name}
                    </h3>
                    <p className="text-xs text-[#586873] leading-relaxed">
                      {exam.preparation}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EEF4F6] flex flex-wrap items-center gap-2 text-xs text-[#586873]">
                    <span>{exam.sampleType}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        exam.fastingRequired
                          ? 'font-medium text-[#173247]'
                          : 'text-[#586873]'
                      }
                    >
                      {exam.fastingRequired ? 'À jeun requis' : 'Sans jeûne obligatoire'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => navigate('/examens')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Consulter le catalogue complet ({examinations.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Home Sampling Service */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="rounded-2xl bg-white border border-[#DCE7EB] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-center space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              <Home className="w-4 h-4" />
              <span>Service de proximité</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#173247] tracking-tight text-balance">
              Prélèvement à domicile à Mostaganem
            </h2>
            <p className="text-sm sm:text-base text-[#586873] leading-relaxed">
              Vous ne pouvez pas vous déplacer ? Demandez l’intervention d’un(e)
              préleveur(se) à votre domicile. L’envoi du formulaire constitue une
              demande de prise en charge, confirmée par notre secrétariat par téléphone.
            </p>
            <ul className="space-y-2.5 text-sm text-[#1D2933]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0E8F9F] shrink-0" />
                <span>Matériel stérile à usage unique et transport isotherme</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0E8F9F] shrink-0" />
                <span>Adapté aux personnes âgées, alitées ou enfants</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0E8F9F] shrink-0" />
                <span>Résultats consultables en ligne dès validation</span>
              </li>
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/prelevement-domicile')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0E8F9F] hover:bg-[#173247] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>Demander un prélèvement à domicile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[280px] lg:min-h-[380px] bg-[#EAF4F6]">
            <SmartImage
              src="/src/assets/images/home_sampling_service_1795208039816.jpg"
              alt="Trousse de prélèvement biologique à domicile et caisson isotherme"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 7. Authentic Laboratory Photography Gallery */}
      {gallery.length > 0 && (
        <section className="bg-white border-y border-[#DCE7EB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="space-y-2 mb-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
                Photographies du laboratoire
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#173247] tracking-tight">
                Découvrir nos espaces à Mostaganem
              </h2>
              <p className="text-sm text-[#586873]">
                Vues authentiques de la façade, des salles de prélèvement et des
                moments marquants des Laboratoires El Amine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxPhoto(photo)}
                  className="group text-start rounded-xl overflow-hidden border border-[#DCE7EB] bg-[#F9FCFD] hover:border-[#43CFE0] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E8F9F]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#EAF4F6]">
                    <SmartImage
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-xs text-[#0E8F9F] font-medium">
                      {photo.isAuthentic ? 'Photo réelle du laboratoire' : 'Illustration'}
                    </p>
                    <h3 className="font-display font-semibold text-sm text-[#173247]">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-[#586873] line-clamp-2">
                      {photo.caption}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Dedicated Patient Results Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20">
        <div className="rounded-2xl bg-[#173247] text-white p-8 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#43CFE0]">
              Plateforme dédiée aux patients
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-balance">
              {homepage?.resultsBannerTitle ||
                'Consultez vos résultats en toute confidentialité'}
            </h2>
            <p className="text-sm sm:text-base text-[#C7DCE6] leading-relaxed">
              {homepage?.resultsBannerText ||
                "Vos comptes rendus d'analyses sont hébergés exclusivement sur notre serveur externe sécurisé BM Lab Server. Aucun dossier médical n'est stocké sur ce site vitrine."}
            </p>
          </div>
          <div className="shrink-0">
            <a
              href={resultsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-lg bg-[#43CFE0] hover:bg-white text-[#173247] text-sm font-bold transition-colors whitespace-nowrap"
            >
              <span>Consulter mes résultats</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* 9. Location & Direct Contact */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DCE7EB] p-7 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
                Localisation & Accès
              </p>
              <h2 className="font-display font-bold text-2xl text-[#173247]">
                Nous trouver à Mostaganem
              </h2>
              <div className="space-y-3 text-sm text-[#586873] pt-2">
                <p>
                  <strong className="text-[#173247] font-semibold block">
                    Adresse
                  </strong>
                  {general?.address || 'W3FF+4FG, Mostaganem, Algérie'}
                </p>
                <p>
                  <strong className="text-[#173247] font-semibold block">
                    Téléphone & WhatsApp
                  </strong>
                  <a
                    href={`tel:${general?.phoneRaw || '+213797108442'}`}
                    className="font-mono text-[#0E8F9F] hover:underline"
                  >
                    {general?.phone || '+213 797 10 84 42'}
                  </a>
                </p>
                <p>
                  <strong className="text-[#173247] font-semibold block">
                    E-mail
                  </strong>
                  <a
                    href={`mailto:${general?.email || 'labelamine27@gmail.com'}`}
                    className="text-[#173247] hover:text-[#0E8F9F]"
                  >
                    {general?.email || 'labelamine27@gmail.com'}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-[#EEF4F6]">
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0E8F9F] hover:bg-[#173247] text-white text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Écrire sur WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#DCE7EB] hover:border-[#0E8F9F] text-[#173247] text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Formulaire de contact</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <LabMap
              labName={
                general?.labName || "Laboratoires d'analyses médicales El Amine"
              }
              address={general?.address || 'W3FF+4FG, Mostaganem, Algérie'}
              latitude={general?.latitude || 35.9228102}
              longitude={general?.longitude || 0.0737185}
              googleMapsUrl={
                general?.googleMapsUrl ||
                'https://www.google.com/maps/place/%D9%85%D8%AE%D8%AA%D8%A8%D8%B1+%D8%A7%D9%84%D8%AA%D8%AD%D8%A7%D9%84%D9%8A%D9%84+%D8%A7%D9%84%D8%B7%D8%A8%D9%8A%D8%A9+%D8%A7%D9%84%D8%A3%D9%85%D9%8A%D9%86/@35.9228102,0.0711436,17z'
              }
              phone={general?.phone || '+213 797 10 84 42'}
            />
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Real Laboratory Photos */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxPhoto.title}
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-[#173247]/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden border border-[#DCE7EB]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE7EB]">
              <div>
                <p className="text-xs font-medium text-[#0E8F9F]">
                  {lightboxPhoto.isAuthentic
                    ? 'Photographie réelle · Laboratoires El Amine'
                    : 'Visuel illustratif'}
                </p>
                <h3 className="font-display font-semibold text-base text-[#173247]">
                  {lightboxPhoto.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                aria-label="Fermer l’aperçu"
                className="w-10 h-10 rounded-lg border border-[#DCE7EB] flex items-center justify-center text-[#173247] hover:bg-[#F5FAFB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] bg-[#F5FAFB] flex items-center justify-center overflow-hidden">
              <SmartImage
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="px-5 py-3 bg-white border-t border-[#DCE7EB] text-sm text-[#586873]">
              {lightboxPhoto.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
