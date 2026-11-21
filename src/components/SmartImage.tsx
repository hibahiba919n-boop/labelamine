import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fallbackTitle?: string;
}

export function SmartImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
  fallbackTitle,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full min-h-[180px] flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#EAF6F8] to-[#DCEEF2] text-[#173247] p-6 text-center"
      >
        <div className="w-11 h-11 rounded-lg bg-white border border-[#CFE4EA] flex items-center justify-center text-[#0E8F9F]">
          <FlaskConical className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-[#586873] max-w-[220px]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
