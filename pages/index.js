export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <h1>Diabetes Risk Factors</h1>
        <p>
          Explore how health, lifestyle, and socioeconomic factors relate to diabetes risk.
        </p>
      </section>

      <section className="controls">
        <div className="control">
          <label>Group by:</label>
          <select>
            <option>Physical Activity</option>
            <option>Smoking</option>
            <option>High Blood Pressure</option>
          </select>
        </div>

        <div className="control">
          <label>Age Filter:</label>
          <input type="range" min="1" max="13" />
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Correlation Heatmap</h2>
          <div className="placeholder heatmap">Heatmap will go here</div>
        </div>

        <div className="card">
          <h2>Diabetes Prevalence by Income</h2>
          <div className="placeholder bar">Bar chart will go here</div>
        </div>
      </section>

      <section className="card">
        <h2>Parallel Coordinates Plot</h2>
        <div className="placeholder pcp">PCP will go here</div>
      </section>
    </main>
  );
}
