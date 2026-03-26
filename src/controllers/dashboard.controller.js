import dashboardService from '../services/dashboard.service.js';
import { ok } from '../utils/apiResponse.js';

async function getStats(req, res) {
  const { period, startDate, endDate } = req.query;
  const filters = {};

  if (period === 'custom' && startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  } else if (period && period !== 'all') {
    const now = new Date();
    filters.endDate = now.toISOString().slice(0, 10);

    if (period === 'month') {
      filters.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else if (period === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      filters.startDate = qStart.toISOString().slice(0, 10);
    } else if (period === 'year') {
      filters.startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    }
  }

  const stats = await dashboardService.getStats(filters);
  return ok(res, stats, 'Dashboard stats fetched');
}

export { getStats };
export default { getStats };
