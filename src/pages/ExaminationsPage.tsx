import { useMemo, useState } from 'react';
import { FileSearch, Info, Phone, Search } from 'lucide-react';
import { useLab } from '../context/LabContext';

export function ExaminationsPage() {
  const { data, navigate } = useLab();
  const specialties = data?.specialties || [];
  const examinations = data?.examinations || [];
  const phone = data?.settings.general.phone || '+213 797 10 84 42';
  const phoneRaw = data?.settings.general.phoneRaw || '+213797108442';

  const initialSpec = (() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('spec');
    return s && /^\d+$/.test(s) ? Number(s) : 'all';
  })();

  const [query, setQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<number | 'all'>(initialSpec);
  const [fastingFilter, setFastingFilter] = useState<'all' | 'fasting'>('all');

  const specialtyMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const s of specialties) map[s.id] = s.name;
    return map;
  }, [specialties]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return examinations.filter((exam) => {
      if (selectedSpec !== 'all' && exam.specialtyId !== selectedSpec) return false;
      if (fastingFilter === 'fasting' && !exam.fastingRequired) return false;
      if (!q) return true;
      return (
        exam.name.toLowerCase().includes(q) ||
        exam.code.toLowerCase().includes(q) ||
        exam.sampleType.toLowerCase().includes(q) ||
        exam.preparation.toLowerCase().includes(q)
      );
    });
  }, [examinations, query, selectedSpec, fastingFilter]);

  return (
    <div className="bg-[#F5FAFB] min-h-[75vh]">
      <section className="bg-white border-b border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              Répertoire analytique
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#173247] tracking-tight">
              Catalogue d’examens médicaux
            </h1>
            <p className="text-base sm:text-lg text-[#586873] leading-relaxed">
              Consultez les modalités de prélèvement et les recommandations de
              préparation pour nos examens publiés. Les disponibilités et délais
              précis sont confirmés par le laboratoire.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 relative">
              <Search
                className="w-4 h-4 text-[#586873] absolute start-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom d'analyse, code ou prélèvement..."
                aria-label="Rechercher un examen"
                className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F5FAFB] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedSpec}
                onChange={(e) =>
                  setSelectedSpec(
                    e.target.value === 'all' ? 'all' : Number(e.target.value)
                  )
                }
                aria-label="Filtrer par spécialité"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F5FAFB] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F]"
              >
                <option value="all">Toutes les spécialités</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-1 p-1 rounded-lg bg-[#F5FAFB] border border-[#DCE7EB]">
              <button
                type="button"
                onClick={() => setFastingFilter('all')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  fastingFilter === 'all'
                    ? 'bg-white text-[#173247] shadow-xs'
                    : 'text-[#586873] hover:text-[#173247]'
                }`}
              >
                Tous ({examinations.length})
              </button>
              <button
                type="button"
                onClick={() => setFastingFilter('fasting')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  fastingFilter === 'fasting'
                    ? 'bg-white text-[#173247] shadow-xs'
                    : 'text-[#586873] hover:text-[#173247]'
                }`}
              >
                À jeun
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EEF4F6] text-xs text-[#586873]">
            <span>
              <strong className="font-mono text-[#173247]">{filtered.length}</strong>{' '}
              examen{filtered.length > 1 ? 's' : ''} affiché
              {filtered.length > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0E8F9F]" />
              En cas d’examen non listé ou d’ordonnance particulière, appelez le{' '}
              <a
                href={`tel:${phoneRaw}`}
                className="font-mono font-medium text-[#173247] hover:text-[#0E8F9F]"
              >
                {phone}
              </a>
            </span>
          </div>
        </div>

        {/* Results Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DCE7EB] p-12 text-center space-y-3">
            <FileSearch className="w-8 h-8 text-[#0E8F9F] mx-auto" />
            <h2 className="font-display font-semibold text-lg text-[#173247]">
              Aucun examen trouvé
            </h2>
            <p className="text-sm text-[#586873] max-w-md mx-auto">
              Essayez un autre mot-clé ou réinitialisez les filtres. Notre équipe
              reste joignable par téléphone pour vous orienter.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedSpec('all');
                  setFastingFilter('all');
                }}
                className="px-4 py-2 rounded-lg border border-[#DCE7EB] text-xs font-semibold text-[#173247] hover:bg-[#F5FAFB] cursor-pointer"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="px-4 py-2 rounded-lg bg-[#173247] text-white text-xs font-semibold hover:bg-[#0E8F9F] cursor-pointer"
              >
                Contacter le secrétariat
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl border border-[#DCE7EB] p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-4 text-xs text-[#586873]">
                    <span className="font-mono font-medium text-[#0E8F9F]">
                      {exam.code}
                    </span>
                    <span className="truncate">
                      {exam.specialtyId
                        ? specialtyMap[exam.specialtyId] || 'Biologie médicale'
                        : 'Biologie médicale'}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-lg text-[#173247]">
                    {exam.name}
                  </h2>
                  <p className="text-sm text-[#586873] leading-relaxed">
                    {exam.preparation}
                  </p>
                  {exam.notes && (
                    <p className="text-xs text-[#6B7B86] italic">{exam.notes}</p>
                  )}
                </div>

                <dl className="pt-4 border-t border-[#EEF4F6] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-[#6E7F8A]">Prélèvement</dt>
                    <dd className="font-medium text-[#173247] mt-0.5">
                      {exam.sampleType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6E7F8A]">Jeûne</dt>
                    <dd className="font-medium text-[#173247] mt-0.5">
                      {exam.fastingRequired ? 'Recommandé / Requis' : 'Non requis'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6E7F8A]">Délai estimé</dt>
                    <dd className="font-medium text-[#173247] mt-0.5">
                      {exam.turnaroundTime}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}

        {/* Direct Help Callout */}
        <div className="rounded-xl bg-white border border-[#DCE7EB] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-base text-[#173247]">
              Besoin de préparer un prélèvement à domicile ?
            </h3>
            <p className="text-sm text-[#586873]">
              Planifiez le passage de notre équipe à Mostaganem directement en ligne.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href={`tel:${phoneRaw}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#DCE7EB] text-xs font-semibold text-[#173247] hover:border-[#0E8F9F]"
            >
              <Phone className="w-3.5 h-3.5 text-[#0E8F9F]" />
              <span>{phone}</span>
            </a>
            <button
              type="button"
              onClick={() => navigate('/prelevement-domicile')}
              className="px-4 py-2.5 rounded-lg bg-[#0E8F9F] hover:bg-[#173247] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Prélèvement à domicile
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
