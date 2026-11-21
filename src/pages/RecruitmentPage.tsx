import { ChangeEvent, FormEvent, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FileText,
  Upload,
} from 'lucide-react';
import { useLab } from '../context/LabContext';

export function RecruitmentPage() {
  const { data } = useLab();
  const recruitment = data?.settings.recruitment;
  const positions = data?.positions || [];

  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [positionTitle, setPositionTitle] = useState<string>(
    'Candidature spontanée'
  );
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [website, setWebsite] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (recruitment && !recruitment.enabled) {
    return (
      <div className="bg-[#F5FAFB] py-20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-3 bg-white rounded-2xl border border-[#DCE7EB] p-10">
          <h1 className="font-display font-bold text-2xl text-[#173247]">
            Recrutement actuellement suspendu
          </h1>
          <p className="text-sm text-[#586873]">
            Les Laboratoires El Amine n’acceptent pas de candidatures en ligne pour
            le moment.
          </p>
        </div>
      </div>
    );
  }

  const handleSelectPosition = (idStr: string, title: string) => {
    setSelectedPositionId(idStr);
    setPositionTitle(title);
    const formEl = document.getElementById('recruitment-form');
    formEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setCvFile(null);
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Veuillez sélectionner uniquement un fichier au format PDF.');
      e.target.value = '';
      setCvFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('La taille du CV ne doit pas dépasser 5 Mo.');
      e.target.value = '';
      setCvFile(null);
      return;
    }
    setErrorMsg(null);
    setCvFile(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!cvFile) {
      setErrorMsg('Veuillez joindre votre CV au format PDF.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('positionId', selectedPositionId);
      formData.append('positionTitle', positionTitle);
      formData.append('applicantName', applicantName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('message', message);
      formData.append('website', website);
      formData.append('cv', cvFile);

      const res = await fetch('/api/public/recruitment/apply', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur lors de l'envoi de la candidature.");
      }
      setSuccessMsg(json.message);
      setApplicantName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setCvFile(null);
      const fileInput = document.getElementById('r-cv') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur lors de la soumission.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F5FAFB]">
      <section className="bg-white border-b border-[#DCE7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E8F9F]">
              Carrières · Mostaganem
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#173247] tracking-tight">
              {recruitment?.introTitle || 'Rejoindre Laboratoires El Amine'}
            </h1>
            <p className="text-base sm:text-lg text-[#586873] leading-relaxed">
              {recruitment?.introText}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Open Positions */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-display font-bold text-xl text-[#173247]">
              Postes publiés
            </h2>
            {positions.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#DCE7EB] p-6 text-sm text-[#586873]">
                Aucun poste spécifique ouvert actuellement. Vous pouvez toutefois
                déposer une candidature spontanée via le formulaire.
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="bg-white rounded-xl border border-[#DCE7EB] p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-[#0E8F9F] font-medium">
                          {pos.department} · {pos.contractType}
                        </p>
                        <h3 className="font-display font-semibold text-base text-[#173247]">
                          {pos.title}
                        </h3>
                      </div>
                      <Briefcase className="w-4 h-4 text-[#0E8F9F] shrink-0 mt-1" />
                    </div>
                    <p className="text-sm text-[#586873] leading-relaxed">
                      {pos.description}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectPosition(String(pos.id), pos.title)
                      }
                      className="text-xs font-semibold text-[#173247] hover:text-[#0E8F9F] underline cursor-pointer"
                    >
                      Postuler à cette offre
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Form */}
          <div
            id="recruitment-form"
            className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE7EB] p-6 sm:p-8 lg:p-10"
          >
            <h2 className="font-display font-bold text-2xl text-[#173247] mb-2">
              Déposer une candidature
            </h2>
            <p className="text-sm text-[#586873] mb-6">
              Votre CV (format PDF, max 5 Mo) est transmis de manière sécurisée à
              la direction du laboratoire.
            </p>

            {successMsg && (
              <div
                role="status"
                className="mb-6 p-4 rounded-xl bg-[#EAF8F3] border border-[#BBE5D4] text-[#14533C] flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#16A34A]" />
                <p className="text-sm">{successMsg}</p>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#DC2626]" />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="hidden" aria-hidden="true">
                <label htmlFor="r-website">Site web</label>
                <input
                  id="r-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="r-position"
                  className="block text-sm font-medium text-[#173247] mb-1.5"
                >
                  Poste visé <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  id="r-position"
                  value={selectedPositionId}
                  onChange={(e) => {
                    const idVal = e.target.value;
                    setSelectedPositionId(idVal);
                    const found = positions.find((p) => String(p.id) === idVal);
                    setPositionTitle(found ? found.title : 'Candidature spontanée');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                >
                  <option value="">Candidature spontanée</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={String(pos.id)}>
                      {pos.title} ({pos.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="r-name"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    Nom complet <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="r-name"
                    type="text"
                    required
                    minLength={2}
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Nom et prénom"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="r-phone"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    Téléphone <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="r-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm font-mono text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="r-email"
                  className="block text-sm font-medium text-[#173247] mb-1.5"
                >
                  Adresse e-mail <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="r-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="r-cv"
                  className="block text-sm font-medium text-[#173247] mb-1.5"
                >
                  CV au format PDF (max 5 Mo){' '}
                  <span className="text-[#DC2626]">*</span>
                </label>
                <label
                  htmlFor="r-cv"
                  className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-lg border border-dashed border-[#B7CFD6] bg-[#F9FCFD] hover:border-[#0E8F9F] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {cvFile ? (
                      <FileText className="w-5 h-5 text-[#0E8F9F] shrink-0" />
                    ) : (
                      <Upload className="w-5 h-5 text-[#586873] shrink-0" />
                    )}
                    <span className="text-sm text-[#1D2933] truncate">
                      {cvFile
                        ? `${cvFile.name} (${Math.round(cvFile.size / 1024)} Ko)`
                        : 'Sélectionner votre fichier PDF'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#0E8F9F] shrink-0">
                    Parcourir
                  </span>
                  <input
                    id="r-cv"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <label
                  htmlFor="r-message"
                  className="block text-sm font-medium text-[#173247] mb-1.5"
                >
                  Présentation / motivation
                </label>
                <textarea
                  id="r-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expérience en biologie médicale, diplômes, disponibilités..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? 'Transmission...' : 'Envoyer ma candidature'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
