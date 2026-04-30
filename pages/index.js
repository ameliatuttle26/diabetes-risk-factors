import { useState } from "react";
import GroupedBarChart from "../components/GroupedBarChart";
import Heatmap from "../components/Heatmap";
import ParallelCoordinates from "../components/ParallelCoordinates";

export default function Home() {
  const [groupBy, setGroupBy] = useState("PhysActivity");
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [ageRange, setAgeRange] = useState([1, 13]);

  return (
    <main className="container">
      <section className="hero">
        <h1>Diabetes Risk Factors</h1>
        <p>
          Explore how health, lifestyle, and socioeconomic factors relate to diabetes risk.
        </p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Correlation Heatmap</h2>
          <Heatmap
            selectedVariable={selectedVariable}
            onSelectVariable={setSelectedVariable}
          />
        </div>

        <div className="card">
          <h2>Diabetes Prevalence by Income</h2>

          <div className="controls chart-controls">
            <div className="control">
              <label>Group by:</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="PhysActivity">Physical Activity</option>
                <option value="Smoker">Smoking</option>
                <option value="HighBP">High Blood Pressure</option>
                <option value="HighChol">High Cholesterol</option>
                <option value="Sex">Sex</option>
                <option value="DiffWalk">Difficulty Walking</option>
                <option value="HeartDiseaseorAttack">Heart Disease or Attack</option>
              </select>
            </div>

            <div className="control">
              <label>
                Age Filter: {ageRange[0]} -{ageRange[1]}&nbsp;
                <span style = {{color: "#888", fontWeight: "normal",  fontSize: 12}}>
                  (1 = 18-24, 13 = 80+)
                </span>
              </label>
              <div style = {{display: "flex", gap: "8px", alignItems: "center"}}>
                <span style = {{fontSize: 12, color: "#888"}}>Min</span>
                <input
                  type = "range"
                  min = "1"
                  max = "13"
                  value = {ageRange[0]}
                  onChange = {(e) => {
                    const val = Number(e.target.value);
                    setAgeRange(([, max]) => [Math.min(val, max), max]);
                  }}
                />
                <span style = {{fontSize: 12, color: "#888"}}>Max</span>
                <input
                  type = "range"
                  min = "1"
                  max = "13"
                  value = {ageRange[1]}
                  onChange = {(e) => {
                    const val = Number(e.target.value);
                    setAgeRange(([min]) => [min, Math.max(val, min)]);
                  }}
                />
              </div>
            </div>
          </div>

          <GroupedBarChart groupBy={groupBy}
            groupBy = {groupBy}
            selectedVariable = {selectedVariable}
            ageRange = {ageRange}
          />
        </div>

        <div className="card">
          <h2>Parallel Coordinates Plot</h2>
          <ParallelCoordinates ageRange = {ageRange} />
        </div>
      </section>
    </main>
  );
}
