import { useEffect, useState } from "react";
import { getCurrentByCity, getForecastByCity } from "./api/weather";

export default function App() {
  const [units, setUnits] = useState("metric");
  const [cityInput, setCityInput] = useState("");
  const [lastCity, setLastCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);

  async function fetchCityWeather(city, u = units) {
    setLoading(true);
    setError("");
    try {
      const [curr, days] = await Promise.all([
        getCurrentByCity(city, u),
        getForecastByCity(city, u),
      ]);

      setCurrent({
        name: `${curr.name}, ${curr.sys?.country ?? ""}`,
        temp: Math.round(curr.main.temp),
        feels: Math.round(curr.main.feels_like),
        humidity: curr.main.humidity,
        wind: Math.round(curr.wind.speed),
        desc: curr.weather?.[0]?.description ?? "",
        icon: curr.weather?.[0]?.icon ?? "",
      });

      setForecast(days);
      setLastCity(city);
    } catch (e) {
      setCurrent(null);
      setForecast([]);
      const msg = String(e?.message || e || "Something went wrong.");
      if (msg.toLowerCase().includes("city not found")) {
        setError("I couldn’t find that city. Try a different spelling.");
      } else if (msg.toLowerCase().includes("invalid api key")) {
        setError("Invalid API key. Double-check VITE_OWM_KEY in .env.local.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const trimmed = cityInput.trim();
    if (!trimmed) {
      setError("Please enter a city name.");
      return;
    }
    fetchCityWeather(trimmed);
  }

  useEffect(() => {
    if (lastCity) fetchCityWeather(lastCity, units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Weather<span>Now</span></h1>
        <button
          className="unit-toggle"
          onClick={() => setUnits(units === "metric" ? "imperial" : "metric")}
          aria-label="Toggle temperature units"
        >
          {units === "metric" ? "°C → °F" : "°F → °C"}
        </button>
      </header>

      <main className="content">
        <form className="search" onSubmit={onSubmit}>
          <input
            className="input"
            type="text"
            placeholder="Search city (e.g., Victoria)"
            aria-label="City"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Get weather"}
          </button>
        </form>

        {error && (
          <section className="current" role="alert">
            <p className="placeholder">{error}</p>
          </section>
        )}

        <section className="current">
          {!current && !error && (
            <p className="placeholder">Current weather will appear here.</p>
          )}

          {current && (
            <div
              className="current-wrap"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "14px",
                alignItems: "center",
              }}
            >
              <img
                src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
                alt={current.desc}
                width="80"
                height="80"
              />
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                  {current.name}
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>
                  {current.temp}°{units === "metric" ? "C" : "F"}
                </div>
                <div style={{ color: "var(--muted)" }}>
                  {current.desc} • Feels like {current.feels}° • Humidity {current.humidity}% • Wind {current.wind}
                  {units === "metric" ? " m/s" : " mph"}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="forecast">
          <h2>5-Day Forecast</h2>
          <div className="forecast-grid">
            {forecast.length === 0 &&
              [...Array(5)].map((_, i) => (
                <div className="card" key={i}>
                  <div className="day">Day {i + 1}</div>
                  <div className="temp">--°</div>
                  <div className="desc">—</div>
                </div>
              ))}

            {forecast.map((d, i) => (
              <div className="card" key={i}>
                <div className="day">{d.weekday}</div>
                <img
                  src={`https://openweathermap.org/img/wn/${d.icon}.png`}
                  alt={d.desc}
                  width="48"
                  height="48"
                  style={{ display: "block", margin: "6px auto" }}
                />
                <div className="temp">
                  {d.max}° / <span style={{ color: "var(--muted)" }}>{d.min}°</span>
                </div>
                <div className="desc" title={d.desc}>{d.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">Built with React + OpenWeatherMap</footer>
    </div>
  );
}
