"use client";

import { useEffect, useRef, useState } from "react";
import type { Circle, LayerGroup, Map as LeafletMap, Marker, Polyline } from "leaflet";
import type { Worksite } from "@/lib/geo";
import type { LivePerson } from "@/lib/live";

type Props = {
  worksite: Worksite | null;
  people: LivePerson[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

export function LiveMap({ worksite, people, selectedId, onSelect, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const trailRef = useRef<Polyline | null>(null);
  const siteRef = useRef<Circle | null>(null);
  const overlayRef = useRef<LayerGroup | null>(null);
  const fittedRef = useRef(false);
  const followRef = useRef(true);
  const lastSelectedRef = useRef<string | null | undefined>(undefined);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const L = leaflet.default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 20,
      }).addTo(map);
      overlayRef.current = L.layerGroup().addTo(map);
      map.on("dragstart", () => {
        followRef.current = false;
      });
      map.setView(
        worksite
          ? [worksite.latitude, worksite.longitude]
          : [26.615, -80.07],
        13,
      );
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    void import("leaflet").then((leaflet) => {
      const L = leaflet.default;
      if (worksite) {
        if (!siteRef.current) {
          siteRef.current = L.circle([worksite.latitude, worksite.longitude], {
            radius: worksite.radiusMeters,
            color: "#86efac",
            weight: 1,
            fillColor: "#86efac",
            fillOpacity: 0.12,
          }).addTo(overlay);
        } else {
          siteRef.current.setLatLng([worksite.latitude, worksite.longitude]);
          siteRef.current.setRadius(worksite.radiusMeters);
        }
      } else if (siteRef.current) {
        overlay.removeLayer(siteRef.current);
        siteRef.current = null;
      }

      const seen = new Set<string>();
      for (const person of people) {
        if (person.latitude == null || person.longitude == null) continue;
        seen.add(person.id);
        const selected = person.id === selectedId;
        const color = person.outsideSite ? "#f87171" : "#86efac";
        const html = `<div style="
          min-width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;
          background:${color};color:#0a0a0a;font:700 11px ui-sans-serif,system-ui;
          box-shadow:0 0 0 ${selected ? "4px" : "2px"} rgba(255,255,255,${selected ? "0.45" : "0.15"});
        ">${initials(person.name)}</div>`;
        const icon = L.divIcon({
          className: "",
          html,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const existing = markersRef.current.get(person.id);
        if (existing) {
          existing.setLatLng([person.latitude, person.longitude]);
          existing.setIcon(icon);
        } else {
          const marker = L.marker([person.latitude, person.longitude], { icon }).addTo(overlay);
          marker.on("click", () => onSelectRef.current?.(person.id));
          markersRef.current.set(person.id, marker);
        }
      }

      for (const [id, marker] of markersRef.current) {
        if (!seen.has(id)) {
          overlay.removeLayer(marker);
          markersRef.current.delete(id);
        }
      }

      const selected = people.find((person) => person.id === selectedId);
      const trail = selected?.trail ?? [];
      if (trail.length > 1) {
        const latlngs = trail.map((point) => [point.latitude, point.longitude] as [number, number]);
        if (!trailRef.current) {
          trailRef.current = L.polyline(latlngs, {
            color: "#60a5fa",
            weight: 3,
            opacity: 0.85,
          }).addTo(overlay);
        } else {
          trailRef.current.setLatLngs(latlngs);
        }
      } else if (trailRef.current) {
        overlay.removeLayer(trailRef.current);
        trailRef.current = null;
      }

      const points: [number, number][] = [];
      if (worksite) points.push([worksite.latitude, worksite.longitude]);
      for (const person of people) {
        if (person.latitude != null && person.longitude != null) {
          points.push([person.latitude, person.longitude]);
        }
      }

      if (selectedId && selectedId !== lastSelectedRef.current) {
        followRef.current = true;
      }
      if (!fittedRef.current && points.length > 0) {
        map.fitBounds(L.latLngBounds(points).pad(0.35), { maxZoom: 16 });
        fittedRef.current = true;
      } else if (
        followRef.current &&
        selected?.latitude != null &&
        selected.longitude != null
      ) {
        map.panTo([selected.latitude, selected.longitude], {
          animate: true,
          duration: 0.35,
        });
      }
      lastSelectedRef.current = selectedId;
    });
  }, [people, worksite, selectedId, ready]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      trailRef.current = null;
      siteRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={className ?? "h-80 w-full overflow-hidden rounded-xl"} />;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
