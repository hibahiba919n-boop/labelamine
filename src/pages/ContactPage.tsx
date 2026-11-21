import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { LabMap } from '../components/LabMap';

export function ContactPage() {
  const { data } = useLab();
  const general = data?.settings.general;
  const hours = data?.settings.hours;

  const [senderName, setSenderName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const whatsappDigits = (general?.whatsapp || '+213797108442').replace(
    /[^0-9]/g,
    ''
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName,
          phone,
          email,
          subject,
          message,
          website,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur lors de l'envoi du message.");
      }
      setSuccessMsg(json.message);
      setSenderName('');
      setPhone('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erreur lors de l'envoi."
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
              Contact & Accès · Mostaganem
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#173247] tracking-tight">
              Contacter les Laboratoires El Amine
            </h1>
            <p className="text-base sm:text-lg text-[#586873] leading-relaxed">
              Une question sur un examen, une préparation ou l’accès au
              laboratoire ? Écrivez-nous ou joignez directement notre accueil
              téléphonique et WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Info & Hours */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-[#DCE7EB] p-6 sm:p-7 space-y-5">
              <h2 className="font-display font-bold text-xl text-[#173247]">
                Coordonnées officielles
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#0E8F9F] shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-[#173247]">Adresse</p>
                    <p className="text-[#586873]">
                      {general?.address || 'W3FF+4FG, Mostaganem, Algérie'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#0E8F9F] shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-[#173247]">
                      Téléphone & WhatsApp
                    </p>
                    <a
                      href={`tel:${general?.phoneRaw || '+213797108442'}`}
                      className="font-mono text-[#0E8F9F] hover:underline"
                    >
                      {general?.phone || '+213 797 10 84 42'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#0E8F9F] shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-[#173247]">E-mail</p>
                    <a
                      href={`mailto:${general?.email || 'labelamine27@gmail.com'}`}
                      className="text-[#586873] hover:text-[#0E8F9F]"
                    >
                      {general?.email || 'labelamine27@gmail.com'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EEF4F6] flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0E8F9F] hover:bg-[#173247] text-white text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={
                    general?.facebookUrl ||
                    'https://www.facebook.com/lab.elamine27/reels/?locale=fr_FR'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#DCE7EB] hover:border-[#0E8F9F] text-xs font-semibold text-[#173247]"
                >
                  <span>Facebook</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={
                    general?.instagramUrl ||
                    'https://www.instagram.com/lab_elamine/'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#DCE7EB] hover:border-[#0E8F9F] text-xs font-semibold text-[#173247]"
                >
                  <span>Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCE7EB] p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0E8F9F]" />
                <h2 className="font-display font-bold text-lg text-[#173247]">
                  Horaires d’ouverture
                </h2>
              </div>
              {hours?.notice && (
                <p className="text-xs text-[#586873] leading-relaxed">
                  {hours.notice}
                </p>
              )}
              <div className="divide-y divide-[#EEF4F6]">
                {(hours?.schedule || []).map((row, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-[#173247]">{row.day}</span>
                    <span className="text-[#586873]">{row.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE7EB] p-6 sm:p-8 lg:p-10">
            <h2 className="font-display font-bold text-2xl text-[#173247] mb-2">
              Envoyer un message
            </h2>
            <p className="text-sm text-[#586873] mb-6">
              Pour consulter vos comptes rendus d’analyses, veuillez utiliser
              exclusivement la plateforme dédiée{' '}
              <a
                href={
                  general?.resultsPlatformUrl ||
                  'https://resultat.bmlabserver.com/'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0E8F9F] font-semibold underline"
              >
                Consulter mes résultats
              </a>
              .
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
                <label htmlFor="c-website">Site web</label>
                <input
                  id="c-website"
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
                    htmlFor="c-name"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    Nom complet <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    minLength={2}
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Votre nom et prénom"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="c-phone"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    Téléphone
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm font-mono text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="c-email"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    E-mail
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="c-subject"
                    className="block text-sm font-medium text-[#173247] mb-1.5"
                  >
                    Objet <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="c-subject"
                    type="text"
                    required
                    minLength={2}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Renseignement sur un examen..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="c-message"
                  className="block text-sm font-medium text-[#173247] mb-1.5"
                >
                  Message <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="c-message"
                  rows={4}
                  required
                  minLength={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE7EB] bg-[#F9FCFD] text-sm text-[#1D2933] focus:outline-none focus:border-[#0E8F9F] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#173247] hover:bg-[#0E8F9F] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </div>

        {/* Google Map */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-xl text-[#173247]">
                Carte d’accès — Mostaganem
              </h2>
              <p className="text-xs font-mono text-[#586873]">
                {general?.address || 'W3FF+4FG, Mostaganem'} ·{' '}
                {(general?.latitude || 35.9228102).toFixed(6)},{' '}
                {(general?.longitude || 0.0737185).toFixed(6)}
              </p>
            </div>
            <a
              href={
                general?.googleMapsUrl ||
                'https://www.google.com/maps/place/%D9%85%D8%AE%D8%AA%D8%A8%D8%B1+%D8%A7%D9%84%D8%AA%D8%AD%D8%A7%D9%84%D9%8A%D9%84+%D8%A7%D9%84%D8%B7%D8%A8%D9%8A%D8%A9+%D8%A7%D9%84%D8%A3%D9%85%D9%8A%D9%86/@35.9228102,0.0711436,17z'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E8F9F] hover:text-[#173247]"
            >
              <span>Ouvrir dans Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

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
      </section>
    </div>
  );
}
