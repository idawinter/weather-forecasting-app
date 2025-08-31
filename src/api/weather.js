// src/api/weather.js

export async function getCurrentByCity(city, units = "metric") {
  const key = import.meta.env.VITE_OWM_KEY;
  if (!key) throw new Error("Missing OpenWeatherMap API key.");

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", city);
  url.searchParams.set("units", units);
  url.searchParams.set("appid", key);

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message ? data.message : res.statusText;
    throw new Error(msg || "Failed to fetch weather.");
  }
  return data;
}

/**
 * 5-day / 3-hour forecast summarized to 5 daily cards
 * - Uses a midday slot for icon/description when possible
 * - Computes min/max temps per day
 */
export async function getForecastByCity(city, units = "metric") {
  const key = import.meta.env.VITE_OWM_KEY;
  if (!key) throw new Error("Missing OpenWeatherMap API key.");

  const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
  url.searchParams.set("q", city);
  url.searchParams.set("units", units);
  url.searchParams.set("appid", key);

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message ? data.message : res.statusText;
    throw new Error(msg || "Failed to fetch forecast.");
  }

  return summarizeToFiveDays(data);
}

// Get current weather by coordinates
export async function getCurrentByCoords(lat, lon, units = "metric") {
  const key = import.meta.env.VITE_OWM_KEY;
  if (!key) throw new Error("Missing OpenWeatherMap API key.");
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("units", units);
  url.searchParams.set("appid", key);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || res.statusText || "Failed to fetch weather.");
  return data;
}

// Get 5-day forecast by coordinates
export async function getForecastByCoords(lat, lon, units = "metric") {
  const key = import.meta.env.VITE_OWM_KEY;
  if (!key) throw new Error("Missing OpenWeatherMap API key.");
  const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("units", units);
  url.searchParams.set("appid", key);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || res.statusText || "Failed to fetch forecast.");
  return summarizeToFiveDays(data);
}

function summarizeToFiveDays(data) {
  const tzOffsetSec = data.city?.timezone ?? 0; // seconds
  const byDate = new Map();

  for (const item of data.list || []) {
    const localMs = (item.dt + tzOffsetSec) * 1000;
    const d = new Date(localMs);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push({ ...item, _localDate: d });
  }

  const days = [];
  for (const [dateKey, slots] of byDate.entries()) {
    const noonSlot =
      slots.find(s => {
        const h = s._localDate.getUTCHours();
        return h >= 11 && h <= 14;
      }) || slots[Math.floor(slots.length / 2)];

    let min = Infinity, max = -Infinity;
    for (const s of slots) {
      min = Math.min(min, s.main.temp_min);
      max = Math.max(max, s.main.temp_max);
    }

    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(noonSlot._localDate);
    days.push({
      dateKey,
      weekday,
      min: Math.round(min),
      max: Math.round(max),
      desc: noonSlot.weather?.[0]?.description ?? "",
      icon: noonSlot.weather?.[0]?.icon ?? "01d",
    });
  }

  days.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));
  return days.slice(0, 5);
}
