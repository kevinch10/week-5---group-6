// api/health.js
// Reports whether data.gov.sg answered successfully and includes the HTTP status it returned.
// No credentials or API keys required.

const HEALTH_URL =
  'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=1';

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
    const upstreamRes = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!upstreamRes.ok) {
      const status = upstreamRes.status;
      return sendJson(res, status, {
        ok: false,
        status: 'refused',
        upstreamStatus: status,
        reason: `data.gov.sg refused the request with HTTP status ${status}.`,
      });
    }

    let data;
    try {
      data = await upstreamRes.json();
    } catch {
      return sendJson(res, 502, {
        ok: false,
        status: 'invalid_response',
        upstreamStatus: upstreamRes.status,
        reason: 'data.gov.sg returned a non-JSON body.',
      });
    }

    return sendJson(res, 200, {
      ok: true,
      status: 'ok',
      upstreamStatus: upstreamRes.status,
      totalRecords: data?.result?.total ?? null,
      message: 'data.gov.sg answered successfully.',
    });
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      status: 'unreachable',
      upstreamStatus: null,
      reason: error?.message || 'data.gov.sg is unreachable. Network connection failed.',
    });
  }
}
