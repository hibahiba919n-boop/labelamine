import { useCallback, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { ExternalLink } from 'lucide-react';

interface LabMapProps {
  labName: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  phone: string;
}

function LabMarkerAndWindow({
  labName,
  address,
  latitude,
  longitude,
  googleMapsUrl,
  phone,
}: LabMapProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);

  const handleToggle = useCallback(() => {
    setInfoWindowOpen((prev) => !prev);
  }, []);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: latitude, lng: longitude }}
        onClick={handleToggle}
        title={labName}
      >
        <Pin background="#0E8F9F" borderColor="#173247" glyphColor="#FFFFFF" />
      </AdvancedMarker>

      {infoWindowOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={() => setInfoWindowOpen(false)}
        >
          <div className="p-1 text-[#1D2933] space-y-1.5">
            <p className="font-semibold text-sm text-[#173247] leading-snug">
              {labName}
            </p>
            <p className="text-xs text-[#586873]">{address}</p>
            <p className="text-xs font-mono text-[#0E8F9F]">{phone}</p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#173247] hover:text-[#0E8F9F] pt-1"
            >
              Ouvrir dans Google Maps
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function LabMap(props: LabMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  if (!apiKey) {
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
      `${props.latitude},${props.longitude}`
    )}&z=16&output=embed&hl=fr`;

    return (
      <div className="relative w-full h-[380px] md:h-[440px] rounded-xl overflow-hidden border border-[#DCE7EB] bg-[#EDF5F7]">
        <iframe
          title={`Carte Google Maps — ${props.labName}`}
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full border-0"
          allowFullScreen
        />
        <div className="absolute bottom-3 start-3 end-3 sm:end-auto sm:max-w-xs bg-white/95 backdrop-blur-sm border border-[#DCE7EB] rounded-lg p-3 shadow-sm flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-xs text-[#173247] truncate">
              {props.labName}
            </p>
            <p className="text-[11px] text-[#586873] truncate">{props.address}</p>
          </div>
          <a
            href={props.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#173247] hover:bg-[#0E8F9F] text-white text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            <span>Itinéraire</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[380px] md:h-[440px] rounded-xl overflow-hidden border border-[#DCE7EB] bg-[#EDF5F7]">
      <APIProvider
        apiKey={apiKey}
        libraries={['marker']}
        language="fr"
        region="DZ"
      >
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: props.latitude, lng: props.longitude }}
          defaultZoom={16}
          gestureHandling="cooperative"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <LabMarkerAndWindow {...props} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
