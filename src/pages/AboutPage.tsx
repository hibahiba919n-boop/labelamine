import { ArrowRight } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { SmartImage } from '../components/SmartImage';

export function AboutPage() {
  const { data, navigate } = useLab();
  const about = data?.settings.about;

  return (
    <div className="bg-[#F5FAFB]">
      {/* Page Header */}
      <section className="bg-white border-b border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              Présentation · Mostaganem
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#173247] tracking-tight text-balance">
              {about?.headline || 'À propos des Laboratoires El Amine'}
            </h1>
            <p className="text-base sm:text-lg text-[#586873] leading-relaxed">
              {about?.lead ||
                "Un établissement de biologie médicale implanté à Mostaganem, guidé par l'exigence de fiabilité diagnostique et le respect du patient."}
            </p>
          </div>
        </div>
      </section>

      {/* Authentic History & Inauguration */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              Repère historique vérifié
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#173247]">
              {about?.historyTitle || 'Inauguration et ancrage à Mostaganem'}
            </h2>
            <p className="text-base text-[#586873] leading-relaxed">
              {about?.historyText}
            </p>
            <div className="p-5 rounded-xl bg-white border border-[#DCE7EB] space-y-2">
              <p className="text-sm font-semibold text-[#173247]">
                {about?.missionTitle || 'Notre mission et nos valeurs'}
              </p>
              <p className="text-sm text-[#586873] leading-relaxed">
                {about?.missionText}
              </p>
              {about?.visionText && (
                <p className="text-sm text-[#586873] leading-relaxed pt-2 border-t border-[#EEF4F6]">
                  {about.visionText}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-[#DCE7EB] bg-white flex flex-col">
              <div className="aspect-[4/3] overflow-hidden">
                <SmartImage
                  src="/assets/aistudio/labamin5_93928b1f.jfif"
                  alt="Plaque inaugurale officielle des Laboratoires El Amine du 4 juillet 2021"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="p-3 text-xs text-[#586873]">
                Plaque commémorative de l’inauguration officielle du 04 juillet 2021.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#DCE7EB] bg-white flex flex-col">
              <div className="aspect-[4/3] overflow-hidden">
                <SmartImage
                  src="/assets/aistudio/labamin4_6c39a0ed.jfif"
                  alt="Façade des Laboratoires d'analyses médicales El Amine à Mostaganem"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="p-3 text-xs text-[#586873]">
                Façade principale du laboratoire à Mostaganem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white border-y border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl space-y-2 mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              Principes de pratique
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#173247]">
              Nos valeurs fondamentales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(about?.values || []).map((val, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-[#F9FCFD] border border-[#DCE7EB] space-y-2"
              >
                <span className="font-mono text-xs font-medium text-[#0E8F9F]">
                  0{idx + 1}.
                </span>
                <h3 className="font-display font-semibold text-lg text-[#173247]">
                  {val.title}
                </h3>
                <p className="text-sm text-[#586873] leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentic Facilities & Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="space-y-3 max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
            Installations & Équipe
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#173247]">
            Salles de prélèvement et mobilisation sur le terrain
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl overflow-hidden border border-[#DCE7EB] bg-white">
            <div className="aspect-[4/3] overflow-hidden">
              <SmartImage
                src="/assets/aistudio/labamin_86331eca.webp"
                alt="Salle de prélèvement avec fauteuil médical jaune"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-1">
              <h3 className="font-display font-semibold text-sm text-[#173247]">
                Salle de prélèvement — Espace 1
              </h3>
              <p className="text-xs text-[#586873]">
                Fauteuil ergonomique de prélèvement et chariot de soins stérile.
              </p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#DCE7EB] bg-white">
            <div className="aspect-[4/3] overflow-hidden">
              <SmartImage
                src="/assets/aistudio/labamin9_699d9337.webp"
                alt="Salle de prélèvement avec fauteuil médical orange et tensiomètre"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-1">
              <h3 className="font-display font-semibold text-sm text-[#173247]">
                Salle de prélèvement — Espace 2
              </h3>
              <p className="text-xs text-[#586873]">
                Espace équipé de tensiomètre, balance médicale et matériel dédié.
              </p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#DCE7EB] bg-white">
            <div className="aspect-[4/3] overflow-hidden">
              <SmartImage
                src="/assets/aistudio/labamin1_a1013821.jfif"
                alt="Équipe du laboratoire El Amine en mission de dépistage"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-1">
              <h3 className="font-display font-semibold text-sm text-[#173247]">
                Équipe sur le terrain
              </h3>
              <p className="text-xs text-[#586873]">
                Mobilisation des équipes El Amine lors des campagnes de dépistage.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => navigate('/prelevement-domicile')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>Demander un prélèvement à domicile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#DCE7EB] bg-white hover:border-[#0E8F9F] text-[#173247] text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>Nous contacter</span>
          </button>
        </div>
      </section>
    </div>
  );
}
