import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { SmartImage } from '../components/SmartImage';
import { SpecialtyIcon } from '../components/SpecialtyIcon';

export function SpecialtiesPage() {
  const { data, navigate } = useLab();
  const specialties = data?.specialties || [];
  const examinations = data?.examinations || [];

  const examsBySpec = useMemo(() => {
    const grouped: Record<number, typeof examinations> = {};
    for (const exam of examinations) {
      if (exam.specialtyId) {
        if (!grouped[exam.specialtyId]) grouped[exam.specialtyId] = [];
        grouped[exam.specialtyId].push(exam);
      }
    }
    return grouped;
  }, [examinations]);

  return (
    <div className="bg-[#F5FAFB]">
      <section className="bg-white border-b border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              Départements techniques
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#173247] tracking-tight text-balance">
              Nos spécialités de biologie médicale
            </h1>
            <p className="text-base sm:text-lg text-[#586873] leading-relaxed">
              Présentation des pôles analytiques gérés par le laboratoire. La liste
              des départements publiés et des examens associés est administrée en
              temps réel par la direction du laboratoire.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {specialties.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-[#DCE7EB] text-center space-y-3">
            <p className="font-display font-semibold text-lg text-[#173247]">
              Aucune spécialité publiée pour le moment.
            </p>
            <p className="text-sm text-[#586873]">
              Contactez le secrétariat au +213 797 10 84 42 pour tout renseignement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {specialties.map((spec) => {
              const linkedExams = examsBySpec[spec.id] || [];
              return (
                <article
                  key={spec.id}
                  className="rounded-2xl bg-white border border-[#DCE7EB] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {spec.imageUrl && (
                      <div className="h-48 overflow-hidden bg-[#EAF4F6] border-b border-[#DCE7EB]">
                        <SmartImage
                          src={spec.imageUrl}
                          alt={`Illustration clinique — ${spec.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 sm:p-7 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#EBF8FA] border border-[#CFE9EE] flex items-center justify-center text-[#0E8F9F] shrink-0">
                          <SpecialtyIcon name={spec.iconName} className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-xl text-[#173247]">
                            {spec.name}
                          </h2>
                          <p className="text-xs text-[#586873]">
                            {linkedExams.length} examen
                            {linkedExams.length > 1 ? 's' : ''} référencé
                            {linkedExams.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-[#586873] leading-relaxed">
                        {spec.fullDescription}
                      </p>

                      {linkedExams.length > 0 && (
                        <div className="pt-3 border-t border-[#EEF4F6] space-y-2">
                          <p className="text-xs font-semibold text-[#173247]">
                            Exemples d’analyses associées
                          </p>
                          <ul className="space-y-1.5">
                            {linkedExams.slice(0, 4).map((exam) => (
                              <li
                                key={exam.id}
                                className="flex items-center justify-between gap-3 text-xs text-[#586873]"
                              >
                                <span className="truncate text-[#1D2933] font-medium">
                                  {exam.name}
                                </span>
                                <span className="font-mono text-[#0E8F9F] shrink-0">
                                  {exam.code}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 sm:px-7 py-4 bg-[#F9FCFD] border-t border-[#EEF4F6] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/examens?spec=${spec.id}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E8F9F] hover:text-[#173247] transition-colors cursor-pointer"
                    >
                      <span>Voir dans le catalogue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/contact')}
                      className="text-xs font-medium text-[#586873] hover:text-[#173247] cursor-pointer"
                    >
                      Demander un renseignement
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
