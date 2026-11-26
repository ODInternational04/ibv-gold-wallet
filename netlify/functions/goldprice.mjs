export default async () => {
  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch('https://api.metals.live/v1/spot/gold'),
      fetch('https://api.frankfurter.app/latest?from=USD&to=ZAR'),
    ]);

    if (!goldRes.ok || !fxRes.ok) {
      return new Response(JSON.stringify({ error: 'Upstream API error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [goldData, fxData] = await Promise.all([goldRes.json(), fxRes.json()]);

    const goldUSD = Array.isArray(goldData) ? goldData[0]?.gold : goldData?.gold;
    const usdToZAR = fxData?.rates?.ZAR;

    if (!goldUSD || !usdToZAR) {
      return new Response(JSON.stringify({ error: 'Invalid price data' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ priceZAR: goldUSD * usdToZAR }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
