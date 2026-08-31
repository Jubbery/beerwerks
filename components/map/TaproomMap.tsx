'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { BUSINESS } from '@/lib/constants';
import styles from './TaproomMap.module.css';
import 'leaflet/dist/leaflet.css';

/**
 * The taproom map.
 *
 * Leaflet touches `window` at import time, so this is a client component and
 * the library is imported dynamically inside the effect rather than at module
 * scope.
 */
export function TaproomMap() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const el = container.current;
    if (!el || map.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.isConnected || map.current) return;

      // scrollWheelZoom off: the map sits mid-page and must not swallow the
      // page scroll as the reader passes over it.
      const instance = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView(
        [...BUSINESS.coordinates],
        16,
      );
      map.current = instance;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(instance);

      // Grayscale the TILE PANE only. Filtering the whole container would
      // desaturate the marker too, and the marker is the one spot of colour.
      const pane = instance.getPane('tilePane');
      if (pane) pane.style.filter = 'grayscale(1) contrast(1.05)';

      // A square in the brand red, not Leaflet's default teardrop pin. The
      // colour is read from the token so it cannot drift from the stylesheet.
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ae1800';

      L.marker([...BUSINESS.coordinates], {
        title: BUSINESS.name,
        icon: L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;background:${accent};border:2px solid #0d0c0c"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      })
        .addTo(instance)
        .bindPopup(
          `<span class="${styles.popupTitle}">${BUSINESS.name}</span><br>${BUSINESS.street}, ${BUSINESS.cityStateZip}`,
        )
        .openPopup();

      // The container is measured late — without this the tiles lay out
      // against a zero-height box and the map renders as a grey band.
      requestAnimationFrame(() => instance.invalidateSize());
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className={styles.frame}>
      <div
        ref={container}
        className={styles.map}
        role="application"
        aria-label={`Map of ${BUSINESS.street}, ${BUSINESS.cityStateZip}`}
      />
    </div>
  );
}
