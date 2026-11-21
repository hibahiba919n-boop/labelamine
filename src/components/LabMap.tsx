import { useCallback, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin } from 'lucide-react';

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
    return (
      <div className="w-full h-[380px] md:h-[440px] rounded-xl border border-[#DCE7EB] bg-[#EDF5F7] flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white border border-[#DCE7EB] flex items-center justify-center text-[#0E8F9F]">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="font-semibold text-[#173247]">{props.labName}</p>
          <p className="text-sm text-[#586873]">{props.address}</p>
          <p className="text-xs font-mono text-[#586873]">
            {props.latitude.toFixed(6)}, {props.longitude.toFixed(6)}
          </p>
        </div>
        <a
          href={props.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173247] text-white text-sm font-medium hover:bg-[#0E8F9F] transition-colors"
        >
          Voir l’itinéraire sur Google Maps
          <ExternalLink className="w-4 h-4" />
        </a>
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
