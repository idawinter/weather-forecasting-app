import { useEffect, useState } from "react";
import { getCurrentByCity, getForecastByCity, getCurrentByCoords, getForecastByCoords } from "./api/weather";

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

  async function fetchByLocation(u = units) {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported on this device.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
  
      const [curr, days] = await Promise.all([
        getCurrentByCoords(lat, lon, u),
        getForecastByCoords(lat, lon, u),
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
      setLastCity(curr.name || "My Location");
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.toLowerCase().includes("permission")) {
        setError("Location permission was denied.");
      } else if (msg.toLowerCase().includes("timeout")) {
        setError("Finding your location took too long. Try again.");
      } else {
        setError(msg || "Failed to get your location.");
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

        <button
          className="btn"
          type="button"
          onClick={() => fetchByLocation()}
          disabled={loading}
          style={{ marginLeft: "8px" }}
        >
          Use my location
        </button>
      </form>

        {error && (
          <section className="current" role="alert">
            <p className="placeholder">{error}</p>
          </section>
        )}

{loading ? (
  <section className="current">
    {/* Loading skeleton for CURRENT */}
    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 14, alignItems: "center" }}>
      <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 12 }} />
      <div>
        <div className="skel-line" style={{ width: "60%" }} />
        <div className="skel-line" style={{ width: "40%", height: 22 }} />
        <div className="skel-line" style={{ width: "80%" }} />
      </div>
    </div>
  </section>
) : (
  <section className="current">
    {!current && !error && (
      <p className="placeholder">Current weather will appear here.</p>
    )}
    {current && (
      <div
        className="current-wrap fade-in"
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
)}

<section className="forecast">
  <h2>5-Day Forecast</h2>
  <div className="forecast-grid">
    {loading &&
      [...Array(5)].map((_, i) => (
        <div className="card" key={`sk-${i}`}>
          <div
            className="skeleton"
            style={{ width: 48, height: 48, margin: "6px auto", borderRadius: 10 }}
          />
          <div className="skel-line" style={{ width: "50%", margin: "6px auto" }} />
          <div className="skel-line" style={{ width: "70%", margin: "6px auto" }} />
        </div>
      ))
    }

    {!loading && forecast.length === 0 &&
      [...Array(5)].map((_, i) => (
        <div className="card" key={i}>
          <div className="day">Day {i + 1}</div>
          <div className="temp">--°</div>
          <div className="desc">—</div>
        </div>
      ))
    }

    {!loading && forecast.map((d, i) => (
      <div className="card fade-in" key={i}>
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
