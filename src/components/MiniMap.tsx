import { useEffect, useRef } from "react";
import * as L from "leaflet";

interface Props {
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

export default function MiniMap({ lat, lng, color, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div class="wt-pin" style="background:${color}"><div class="wt-pin-inner"></div></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -26],
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    if (label) marker.bindPopup(label);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, color, label]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full overflow-hidden rounded-xl border border-slate-800"
    />
  );
}
