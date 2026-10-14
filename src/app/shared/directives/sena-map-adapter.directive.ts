import { Directive, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';

declare let L: any;

@Directive({
  selector: '[appSenaMapAdapter]',
  standalone: true
})
export class SenaMapAdapterDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private airDropLayerGroup: any = null;
  private routeUpdatedHandler = (event: Event) => this.onRouteUpdated(event as CustomEvent);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('sena:route-updated', this.routeUpdatedHandler);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('sena:route-updated', this.routeUpdatedHandler);
    }
    if (this.airDropLayerGroup) {
      try {
        this.airDropLayerGroup.clearLayers();
      } catch (e) {}
    }
  }

  private onRouteUpdated(event: CustomEvent): void {
    const geoJsonData = event.detail;
    if (!geoJsonData || typeof L === 'undefined') return;

    // Search for any active Leaflet map attached to the DOM or window
    const map = (window as any).senaMap || this.findLeafletMap();
    if (!map) return;

    if (!this.airDropLayerGroup) {
      this.airDropLayerGroup = L.layerGroup().addTo(map);
    } else {
      this.airDropLayerGroup.clearLayers();
    }

    try {
      // 1. Add GeoJSON features with distinct tactical military styling
      const geoLayer = L.geoJSON(geoJsonData, {
        style: (feature: any) => {
          const type = feature?.properties?.route_type || feature?.geometry?.type;
          if (type === 'AIR_CORRIDOR' || feature?.properties?.is_air_corridor) {
            return {
              color: '#38bdf8', // Cyan rotary flight corridor
              weight: 4,
              opacity: 0.9,
              dashArray: '8, 8'
            };
          }
          return {
            color: '#fbbf24', // Amber ground transit route
            weight: 3,
            opacity: 0.7
          };
        },
        pointToLayer: (feature: any, latlng: any) => {
          const isHelipad = feature?.properties?.node_type === 'HELIPAD' || feature?.properties?.name?.includes('Helipad');
          const markerHtml = `
            <div style="background-color: ${isHelipad ? '#0284c7' : '#ef4444'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(0,0,0,0.6);"></div>
          `;
          return L.marker(latlng, {
            icon: L.divIcon({
              className: 'tactical-airdrop-marker',
              html: markerHtml,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            })
          });
        }
      });

      this.airDropLayerGroup.addLayer(geoLayer);

      // 2. Pulse / fly to the newly plotted air corridor bounds if valid
      const bounds = geoLayer.getBounds();
      if (bounds && bounds.isValid && bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 10, duration: 1.5 });
      }
    } catch (e) {
      console.warn('[SenaMapAdapter] Could not paint dynamic GeoJSON corridor:', e);
    }
  }

  private findLeafletMap(): any {
    // Check standard container ID 'indianLogisticsMap'
    const mapEl = document.getElementById('indianLogisticsMap') as any;
    if (mapEl && mapEl._leaflet_id && (L as any).map) {
      // Traverse leaflet internal cache if available
      return (window as any).senaMap || null;
    }
    return null;
  }
}
