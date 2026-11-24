import { Router } from 'express';
import { query } from '../db.js';
import { wrap } from '../http.js';

const router = Router();

router.get('/', wrap(async (_req, res) => {
  const { rows } = await query(
    `select id, division_name, subdivision_code, zone, outage_risk_level, color_code, reliability_score,
            avg_weekly_outage_hours, recommended_ups, latitude, longitude, grid_triggers, boundary_coordinates
       from bescom_subdivisions order by division_name`);
  res.set('Cache-Control', 'public, max-age=300').json(rows);
}));

export default router;
