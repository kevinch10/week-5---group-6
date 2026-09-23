// api/hdb.js
// Calls data.gov.sg HDB resale flat prices dataset (resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc)
// Returns only the fields needed by the HDB Resale Price Explorer screen.
// No credentials or API keys required.

const DATASTORE_RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const BASE_API_URL = 'https://data.gov.sg/api/action/datastore_search';

function sendJson(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  try {
    // Parse query params safely in both Vercel and standard Node / Connect environments
    let townParam = '';
    let flatTypeParam = '';

    if (req.query) {
      townParam = req.query.town || '';
      flatTypeParam = req.query.flat_type || req.query.flatType || '';
    }

    if (req.url) {
      try {
        const parsed = new URL(req.url, 'http://localhost');
        if (!townParam) townParam = parsed.searchParams.get('town') || '';
        if (!flatTypeParam) {
          flatTypeParam =
            parsed.searchParams.get('flat_type') || parsed.searchParams.get('flatType') || '';
        }
      } catch {
        // url parse fallback
      }
    }

    // Build filter object using explicit field names
    const filters = {};
    if (townParam && townParam !== 'ALL') {
      filters.town = townParam.toUpperCase().trim();
    }
    if (flatTypeParam && flatTypeParam !== 'ALL') {
      filters.flat_type = flatTypeParam.toUpperCase().trim();
    }

    // Prepare upstream URL with limit=10000 and URL-encoded filters
    let requestUrl = `${BASE_API_URL}?resource_id=${DATASTORE_RESOURCE_ID}&limit=10000`;
    if (Object.keys(filters).length > 0) {
      requestUrl += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    }

    // Initial upstream fetch
    const upstreamRes = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    // Check response.ok before attempting to read body
    if (!upstreamRes.ok) {
      const status = upstreamRes.status;
      return sendJson(res, status, {
        ok: false,
        status: 'refused',
        upstreamStatus: status,
        reason: `data.gov.sg refused the request with HTTP status ${status}.`,
      });
    }

    let upstreamData;
    try {
      upstreamData = await upstreamRes.json();
    } catch {
      return sendJson(res, 502, {
        ok: false,
        status: 'invalid_response',
        upstreamStatus: upstreamRes.status,
        reason: 'data.gov.sg returned a non-JSON or invalid body.',
      });
    }

    if (!upstreamData?.success) {
      return sendJson(res, 502, {
        ok: false,
        status: 'refused',
        upstreamStatus: 502,
        reason: 'data.gov.sg reported that the query could not be completed.',
      });
    }

    const total = Number(upstreamData.result?.total) || 0;
    let rawRecords = Array.isArray(upstreamData.result?.records)
      ? upstreamData.result.records
      : [];

    // Paginate using offset in batches of 10000 if result.total exceeds single-request count
    // If filters are active (e.g. town or town+flat_type), collect all matching records.
    // If completely unfiltered (240k records across Singapore), cap pagination to avoid serverless gateway timeout.
    const maxPaginationLimit = Object.keys(filters).length > 0 ? total : Math.min(total, 30000);
    let offset = rawRecords.length;

    while (rawRecords.length < total && offset < maxPaginationLimit) {
      const pageUrl = `${requestUrl}&offset=${offset}`;
      const pageRes = await fetch(pageUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!pageRes.ok) break;

      let pageData;
      try {
        pageData = await pageRes.json();
      } catch {
        break;
      }

      const pageRecords = Array.isArray(pageData?.result?.records) ? pageData.result.records : [];
      if (pageRecords.length === 0) break;

      rawRecords = rawRecords.concat(pageRecords);
      offset += pageRecords.length;
    }

    // Convert numeric fields immediately after upstream response arrives
    // Calculate price_per_sqm only after resale_price and floor_area_sqm are numbers
    // Return only the fields needed by the UI
    const cleanRecords = rawRecords.map((row) => {
      const resale_price = Number(row.resale_price) || 0;
      const floor_area_sqm = Number(row.floor_area_sqm) || 0;
      const lease_commence_date = Number(row.lease_commence_date) || 0;
      const price_per_sqm =
        floor_area_sqm > 0 && resale_price > 0
          ? Math.round(resale_price / floor_area_sqm)
          : 0;

      return {
        month: row.month,
        town: row.town,
        flat_type: row.flat_type,
        block: row.block,
        street_name: row.street_name,
        storey_range: row.storey_range,
        floor_area_sqm: floor_area_sqm,
        flat_model: row.flat_model,
        lease_commence_date: lease_commence_date,
        remaining_lease: row.remaining_lease,
        resale_price: resale_price,
        price_per_sqm: price_per_sqm,
      };
    });

    return sendJson(res, 200, {
      ok: true,
      status: 'ok',
      total,
      returned: cleanRecords.length,
      records: cleanRecords,
    });
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      status: 'unreachable',
      upstreamStatus: null,
      reason: error?.message || 'data.gov.sg is unreachable. Network request failed.',
    });
  }
}
