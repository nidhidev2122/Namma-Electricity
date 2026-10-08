import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSubdivisions } from '../api.js';
import { useApp } from '../ctx.jsx';
import { Card, RiskBadge } from './Common.jsx';
import { nextTuesday } from '../utils.js';

export default function MapView() {
  const { areaId, setAreaId } = useApp();
  const [areas, setAreas] = useState([]);
  const mapEl = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => { getSubdivisions().then(setAreas); }, []);

  useEffect(() => {
    if (map.current) return;
    map.current = L.map(mapEl.current, { zoomControl: true }).setView([12.9716, 77.5946], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current.remove(); map.current = null; };
  }, []);

  // Redraw the circles whenever the data or the selection changes
  useEffect(() => {
    if (!layer.current) return;
    layer.current.clearLayers();
    areas.forEach(a => {
      const picked = a.id === areaId;
      L.circle([a.latitude, a.longitude], {
        radius: 1800,
        color: a.color_code,
        fillColor: a.color_code,
        fillOpacity: picked ? 0.55 : 0.35,
        weight: picked ? 4 : 1.5
      }).on('click', () => setAreaId(a.id)).bindTooltip(a.division_name).addTo(layer.current);
    });
  }, [areas, areaId, setAreaId]);

  const area = areas.find(a => a.id === areaId);
  const tue = nextTuesday().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="stack">
      <div className="map-wrap"><div ref={mapEl} className="map" /></div>
      <div className="legend">
        <span><i style={{ background: '#EF4444' }} /> Over 5 h/week</span>
        <span><i style={{ background: '#F59E0B' }} /> 2 to 5 h/week</span>
        <span><i style={{ background: '#10B981' }} /> Under 2 h/week</span>
      </div>
      {area && (
        <Card title={`${area.division_name} · ${area.subdivision_code}`}>
          <RiskBadge level={area.outage_risk_level} />
          <dl className="facts">
            <div><dt>Avg outage</dt><dd>{area.avg_weekly_outage_hours} h/week</dd></div>
            <div><dt>Reliability</dt><dd>{area.reliability_score}/100</dd></div>
            <div><dt>Zone</dt><dd>{area.zone}</dd></div>
            <div><dt>Next Tuesday</dt><dd>{tue}</dd></div>
          </dl>
          <p><b>Main triggers:</b> {area.grid_triggers}</p>
          <p><b>Suggested backup:</b> {area.recommended_ups}</p>
        </Card>
      )}
    </div>
  );
}
