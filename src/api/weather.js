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
