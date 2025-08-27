import { useState } from "react";

export default function App() {
  const [units, setUnits] = useState("metric"); // 'metric' or 'imperial'

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
        <form className="search" onSubmit={(e) => e.preventDefault()}>
          <input
            className="input"
            type="text"
            placeholder="Search city (e.g., Victoria)"
            aria-label="City"
          />
          <button className="btn" type="submit">Get weather</button>
        </form>

        <section className="current">
          <p className="placeholder">Current weather will appear here.</p>
        </section>

        <section className="forecast">
          <h2>5-Day Forecast</h2>
          <div className="forecast-grid">
            {[...Array(5)].map((_, i) => (
              <div className="card" key={i} aria-label={`Forecast day ${i + 1}`}>
                <div className="day">Day {i + 1}</div>
                <div className="temp">--°</div>
                <div className="desc">—</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">Built with React + OpenWeatherMap</footer>
    </div>
  );
}
