import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { SmartImage } from '../components/SmartImage';

export function HomeSamplingPage() {
  const { data } = useLab();
  const phone = data?.settings.general.phone || '+213 797 10 84 42';
  const phoneRaw = data?.settings.general.phoneRaw || '+213797108442';

  const [patientName, setPatientName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [address, setAddress] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('Matin (07h30 - 10h30)');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const todayIso = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/home-sampling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          phone: phoneInput,
          address,
          requestedDate,
          preferredTime,
          additionalInfo,
          website,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Impossible d'envoyer la demande.");
      }
      setSuccessMsg(json.message);
      setPatientName('');
      setPhoneInput('');
      setAddress('');
      setRequestedDate('');
      setAdditionalInfo('');
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
              Service à domicile · Mostaganem
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#173247] tracking-tight text-balance">
              Demande de prélèvement à domicile
            </h1>
            <p className="text-base sm:text-lg text-[#586873] leading-relaxed">
              Réalisez vos analyses médicales sans quitter votre domicile à
              Mostaganem. Remplissez ce formulaire pour transmettre votre demande
              au secrétariat du laboratoire.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Guidance & Visual */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl overflow-hidden border border-[#DCE7EB] bg-white">
              <div className="aspect-[4/3] overflow-hidden bg-[#EAF4F6]">
                <SmartImage
                  src="/src/assets/images/home_sampling_service_1795208039816.jpg"
                  alt="Matériel stérile et caisson isotherme pour prélèvement à domicile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <h2 className="font-display font-semibold text-lg text-[#173247]">
                  Comment fonctionne le service ?
                </h2>
                <ul className="space-y-3 text-sm text-[#586873]">
                  <li className="flex items-start gap-2.5">
                    <Home className="w-4 h-4 text-[#0E8F9F] shrink-0 mt-0.5" />
                    <span>
                      Vous transmettez votre adresse et vos disponibilités via le
                      formulaire ci-contre.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#0E8F9F] shrink-0 mt-0.5" />
                    <span>
                      Le secrétariat vous rappelle pour confirmer l’horaire de passage
                      et vérifier les consignes (jeûne, ordonnance).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#0E8F9F] shrink-0 mt-0.5" />
                    <span>
                      Les échantillons sont acheminés en enceinte isotherme vers le
                      laboratoire.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#DCE7EB] p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0E8F9F]">
                Information importante
              </p>
              <p className="text-sm text-[#586873] leading-relaxed">
                L’envoi du formulaire crée une <strong className="text-[#173247]">demande de prise en charge</strong> et non une confirmation automatique de rendez-vous. Pour toute urgence, appelez directement le{' '}
                <a
                  href={`tel:${phoneRaw}`}
                  className="font-mono font-semibold text-[#173247] hover:text-[#0E8F9F]"
                >
                  {phone}
                </a>
                .
              </p>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE7EB] p-6 sm:p-8 lg:p-10">
            <h2 className="font-display font-bold text-2xl text-[#173247] mb-2">
              Coordonnées du patient
            </h2>
            <p className="text-sm text-[#586873] mb-6">
              Vos informations servent uniquement à organiser votre prélèvement à
              domicile. Ne transmettez pas de dossiers médicaux sensibles ici.
            </p>

            {successMsg && (
              <div
                role="status"
                className="mb-6 p-4 rounded-xl bg-[#EAF8F3] border border-[#BBE5D4] text-[#14533C] flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#16A34A]" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold">Demande enregistrée</p>
                  <p>{successMsg}</p>
                </div>
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
              {/* Honeypot anti-spam field */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="hs-website">Site web</label>
                <input
                  id="hs-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="hs-name"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    Nom complet du patient <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="hs-name"
                    type="text"
                    required
                    minLength={2}
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Ex. Mohamed Benali"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hs-phone"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    Téléphone <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="hs-phone"
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Ex. 0797 10 84 42"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm font-mono text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="hs-address"
                  className="block text-sm font-medium text-[#173247] mb-1.5"
                >
                  Adresse complète à Mostaganem{' '}
                  <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="hs-address"
                  type="text"
                  required
                  minLength={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier, rue, bâtiment, étage, repère éventuel"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="hs-date"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0E8F9F]" />
                      Date souhaitée <span className="text-[#DC2626]">*</span>
                    </span>
                  </label>
                  <input
                    id="hs-date"
                    type="date"
                    required
                    min={todayIso}
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hs-time"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0E8F9F]" />
                      Créneau souhaité <span className="text-[#DC2626]">*</span>
                    </span>
                  </label>
                  <select
                    id="hs-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  >
                    <option value="Tôt le matin (07h30 - 09h00) — À jeun">
                      Tôt le matin (07h30 - 09h00) — À jeun
                    </option>
                    <option value="Matin (07h30 - 10h30)">
                      Matin (07h30 - 10h30)
                    </option>
                    <option value="Fin de matinée (10h30 - 12h30)">
                      Fin de matinée (10h30 - 12h30)
                    </option>
                    <option value="Après-midi (13h30 - 16h30)">
                      Après-midi (13h30 - 16h30)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="hs-notes"
                  className="block text-sm font-medium text-[#173247] mb-1.5"
                >
                  Informations complémentaires (facultatif)
                </label>
                <textarea
                  id="hs-notes"
                  rows={3}
                  maxLength={1000}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Précisions d'accès, patient à mobilité réduite, enfant..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Envoi en cours...'
                  : 'Envoyer la demande de prélèvement'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
