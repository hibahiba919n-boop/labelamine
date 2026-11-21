import {
  Activity,
  Dna,
  Droplets,
  FlaskConical,
  Microscope,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

const ICON_MAP: Record<string, typeof FlaskConical> = {
  FlaskConical,
  Droplets,
  Activity,
  ShieldCheck,
  Sparkles,
  Microscope,
  Search,
  Stethoscope,
  Dna,
};

export function SpecialtyIcon({
  name,
  className = 'w-5 h-5',
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] || FlaskConical;
  return <Icon className={className} aria-hidden="true" />;
}
