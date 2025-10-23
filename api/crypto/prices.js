export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use CoinGecko API for real-time crypto prices
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,ripple&vs_currencies=aud',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match our expected format
    const prices = {
      bitcoin: { aud: data.bitcoin?.aud || 95000 },
      ethereum: { aud: data.ethereum?.aud || 3500 },
      tether: { aud: data.tether?.aud || 1.5 },
      'usd-coin': { aud: data['usd-coin']?.aud || 1.5 },
      ripple: { aud: data.ripple?.aud || 0.8 },
    };

    return res.status(200).json(prices);

  } catch (error) {
    console.error('Crypto prices API error:', error);
    
    // Return fallback prices if API fails
    const fallbackPrices = {
      bitcoin: { aud: 95000 },
      ethereum: { aud: 3500 },
      tether: { aud: 1.5 },
      'usd-coin': { aud: 1.5 },
      ripple: { aud: 0.8 },
    };

    return res.status(200).json(fallbackPrices);
  }
}
