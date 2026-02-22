// Weather API route — proxies NWS forecast for DFW area with 30-min cache

import express from 'express';

const router = express.Router();

// In-memory cache
let weatherCache = { data: null, timestamp: 0 };
const CACHE_MS = 30 * 60 * 1000; // 30 minutes

function getWeatherEmoji(forecast) {
  const f = (forecast || '').toLowerCase();
  if (f.includes('thunder') || f.includes('storm')) return '\u26C8\uFE0F';
  if (f.includes('snow') || f.includes('sleet') || f.includes('ice')) return '\uD83C\uDF28\uFE0F';
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle')) return '\uD83C\uDF27\uFE0F';
  if (f.includes('fog') || f.includes('mist') || f.includes('haz')) return '\uD83C\uDF2B\uFE0F';
  if (f.includes('cloudy') || f.includes('overcast')) return '\u2601\uFE0F';
  if (f.includes('partly')) return '\u26C5';
  if (f.includes('sunny') || f.includes('clear')) return '\u2600\uFE0F';
  if (f.includes('wind')) return '\uD83D\uDCA8';
  return '\uD83C\uDF24\uFE0F';
}

// GET /api/weather/forecast
router.get('/forecast', async (req, res) => {
  try {
    // Return cache if fresh
    if (weatherCache.data && Date.now() - weatherCache.timestamp < CACHE_MS) {
      return res.success(weatherCache.data, 'Weather forecast (cached)');
    }

    // NWS grid configuration - defaults to Fort Worth, TX (FWD/78,97)
    const nwsOffice = process.env.NWS_OFFICE || 'FWD';
    const nwsGridX = process.env.NWS_GRID_X || '78';
    const nwsGridY = process.env.NWS_GRID_Y || '97';
    
    const response = await fetch(
      `https://api.weather.gov/gridpoints/${nwsOffice}/${nwsGridX},${nwsGridY}/forecast`,
      { headers: { 'User-Agent': '(OpenSite CTL Plumbing, admin@ctlplumbing.com)' } }
    );

    if (!response.ok) throw new Error(`NWS API returned ${response.status}`);

    const nwsData = await response.json();
    const periods = nwsData.properties.periods;
    const forecast = [];
    let i = periods[0]?.isDaytime ? 0 : 1;

    while (i < periods.length - 1 && forecast.length < 7) {
      const day = periods[i];
      const night = periods[i + 1];

      if (day?.isDaytime) {
        forecast.push({
          day: new Date(day.startTime).toLocaleDateString('en-US', { weekday: 'short' }),
          date: day.startTime.split('T')[0],
          dt: new Date(day.startTime).getDate(),
          hi: day.temperature,
          lo: night?.temperature ?? null,
          forecast: day.shortForecast,
          icon: getWeatherEmoji(day.shortForecast),
          precip: day.probabilityOfPrecipitation?.value || 0,
          wind: day.windSpeed,
          windDir: day.windDirection,
        });
        i += 2;
      } else {
        i++;
      }
    }

    weatherCache = { data: forecast, timestamp: Date.now() };
    res.success(forecast, 'Weather forecast');
  } catch (error) {
    // Return stale cache rather than failing
    if (weatherCache.data) {
      return res.success(weatherCache.data, 'Weather forecast (stale cache)');
    }
    res.error('Weather data unavailable', 'WEATHER_ERROR', { message: error.message }, 502);
  }
});

export default router;
