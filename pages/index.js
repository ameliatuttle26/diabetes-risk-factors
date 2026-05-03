import { useState, useEffect, useRef } from "react";
import GroupedBarChart from "../components/GroupedBarChart";
import Heatmap from "../components/Heatmap";
import ParallelCoordinates from "../components/ParallelCoordinates";

const groupableVariables = [
  "PhysActivity",
  "Smoker",
  "HighBP",
  "HighChol",
  "Sex",
  "DiffWalk",
  "HeartDiseaseorAttack",
];

const ageLabels = {
  1: "18–24", 2: "25–29", 3: "30–34", 4: "35–39", 5: "40–44",
  6: "45–49", 7: "50–54", 8: "55–59", 9: "60–64", 10: "65–69",
  11: "70–74", 12: "75–79", 13: "80+",
};

const variableDisplayNames = {
  PhysActivity: "Physical Activity",
  Smoker: "Smoking",
  HighBP: "High Blood Pressure",
  HighChol: "High Cholesterol",
  Sex: "Sex",
  DiffWalk: "Difficulty Walking",
  HeartDiseaseorAttack: "Heart Disease / Attack",
};

export default function Home() {
  const [groupBy, setGroupBy] = useState("PhysActivity");
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [ageRange, setAgeRange] = useState([1, 13]);
  const [toast, setToast] = useState(null);       // { variable, visible }
  const toastTimerRef = useRef(null);

  const isFiltered = ageRange[0] !== 1 || ageRange[1] !== 13;
  const isLinked = selectedVariable && groupableVariables.includes(selectedVariable);

  function handleHeatmapSelect(variable) {
    setSelectedVariable(variable);
    if (groupableVariables.includes(variable)) {
      setGroupBy(variable);
      // Show toast, clear any existing timer
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ variable, visible: true });
      toastTimerRef.current = setTimeout(() => {
        setToast((t) => t ? { ...t, visible: false } : null);
      }, 3000);
    }
  }

  function resetFilters() {
    setAgeRange([1, 13]);
    setSelectedVariable(null);
    setGroupBy("PhysActivity");
  }

  return (
    <main className="container">

      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-eyebrow">CDC BRFSS 2015 · 253,680 Respondents</div>
        <h1>Understanding <em>Diabetes Risk</em><br />Across America</h1>
        <p className="hero-desc">
          In 2015, 30.3 million Americans had diabetes, a number that has since grown to 40 million by 2026.
          This interactive dashboard explores the CDC BRFSS 2015 data to understand how lifestyle, physiology,
          and income shape diabetes risk, and which combinations of factors matter most.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>30.3M</strong>
            <span>Americans with diabetes</span>
          </div>
          <div className="hero-stat">
            <strong>~24%</strong>
            <span>Prevalence in lowest-income group</span>
          </div>
          <div className="hero-stat">
            <strong>3×</strong>
            <span>Higher risk: low vs. high income</span>
          </div>
        </div>
      </header>

      {/* ── Section 1: Heatmap + Bar Chart ── */}
      <section className="narrative-section">
        <div className="section-header">
          <div className="section-number">1</div>
          <div className="section-header-text">
            <h2>Which factors correlate most with diabetes?</h2>
            <p>
              The heatmap shows pairwise correlations across all health variables.
              <strong> Click applicable cells</strong> to automatically group the bar chart by that variable.
            </p>
          </div>
        </div>

        <div className="charts-area">
          <div className="dashboard-top">
          {/* Heatmap */}
          <div className="card heatmap-card">
            <div className="card-header">
              <h2>Correlation Heatmap</h2>
              <span className="card-hint">Click a cell → updates bar chart</span>
            </div>
            <Heatmap
              selectedVariable={selectedVariable}
              onSelectVariable={handleHeatmapSelect}
            />
          </div>

          {/* Bar Chart — toast overlays this card only */}
          <div className="card bar-chart-card">
            {/* ── Overlay toast ── */}
            {toast && (
              <div className={`link-toast ${toast.visible ? "link-toast--in" : "link-toast--out"}`}>
                <span className="link-toast-icon"></span>
                <div className="link-toast-body">
                  <span className="link-toast-label">Linked from Heatmap</span>
                  Bar chart updated to <strong>{variableDisplayNames[toast.variable] || toast.variable}</strong>.
                  Notice how this variable stratifies diabetes risk across income brackets.
                </div>
                <button className="link-toast-close" onClick={() => setToast(null)}>✕</button>
              </div>
            )}
            <div className="card-header">
              <h2>Diabetes Prevalence by Income</h2>
              {isLinked && (
                <span className="linked-badge">
                  ↳ Linked: {variableDisplayNames[selectedVariable] || selectedVariable}
                </span>
              )}
            </div>

            <div className="controls chart-controls">
              <div className="control">
                <label htmlFor="groupby-select">Group by:</label>
                <select
                  id="groupby-select"
                  value={groupBy}
                  onChange={(e) => {
                    setGroupBy(e.target.value);
                    setSelectedVariable(e.target.value);
                  }}
                >
                  <option value="PhysActivity">Physical Activity</option>
                  <option value="Smoker">Smoking</option>
                  <option value="HighBP">High Blood Pressure</option>
                  <option value="HighChol">High Cholesterol</option>
                  <option value="Sex">Sex</option>
                  <option value="DiffWalk">Difficulty Walking</option>
                  <option value="HeartDiseaseorAttack">Heart Disease or Attack</option>
                </select>
              </div>

              <div className="control age-control">
                <label>
                  Age Range: <strong>{ageLabels[ageRange[0]]} – {ageLabels[ageRange[1]]}</strong>
                  {isFiltered && (
                    <button className="reset-btn" onClick={resetFilters}>Reset</button>
                  )}
                </label>
                <div className="age-sliders">
                  <div>
                    <span>Min</span>
                    <input
                      type="range" min="1" max="13" value={ageRange[0]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAgeRange(([, max]) => [Math.min(val, max), max]);
                      }}
                    />
                  </div>
                  <div>
                    <span>Max</span>
                    <input
                      type="range" min="1" max="13" value={ageRange[1]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAgeRange(([min]) => [min, Math.max(val, min)]);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <GroupedBarChart
              groupBy={groupBy}
              selectedVariable={selectedVariable}
              ageRange={ageRange}
            />
          </div>
        </div>{/* end dashboard-top */}
        </div>{/* end charts-area */}
      </section>

      {/* ── Section 2: PCP ── */}
      <section className="narrative-section">
        <div className="section-header">
          <div className="section-number">2</div>
          <div className="section-header-text">
            <h2>How do multiple risk factors combine?</h2>
            <p>
              Each line is one survey respondent, colored by diabetes status.
              Explore how combinations of risk factors cluster across diabetes groups —
              for example, isolating high-BMI, low-income individuals. The age filter above applies here too.
            </p>
          </div>
        </div>

        <div className="card full-width-card">
          <div className="card-header">
            <h2>Parallel Coordinates Explorer</h2>
            <span className="card-hint">Drag ·· handles to reorder axes · Click legend to filter by class</span>
          </div>
          {isFiltered && (
            <div className="filter-badge">
              Age filter active: {ageLabels[ageRange[0]]} – {ageLabels[ageRange[1]]}
            </div>
          )}
          <ParallelCoordinates ageRange={ageRange} />
        </div>
      </section>

      <footer className="page-footer">
        <p>Data: CDC Behavioral Risk Factor Surveillance System (BRFSS) 2015 · <a href="https://www.kaggle.com/datasets/alexteboul/diabetes-health-indicators-dataset" target="_blank" rel="noreferrer">Kaggle Dataset</a></p>
        <p>Amelia Tuttle &amp; Zoey Zhang · NYU Shanghai Information Visualization - Spring 2026</p>
      </footer>
    </main>
  );
}