import { useState } from "react";
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
  1: "18-24",
  2: "25-29",
  3: "30-34",
  4: "35-39",
  5: "40-44",
  6: "45-49",
  7: "50-54",
  8: "55-59",
  9: "60-64",
  10: "65-69",
  11: "70-74",
  12: "75-79",
  13: "80+",
};

export default function Home() {
  const [groupBy, setGroupBy] = useState("PhysActivity");
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [ageRange, setAgeRange] = useState([1, 13]);

  function handleHeatmapSelect(variable) {
    setSelectedVariable(variable);

    if (groupableVariables.includes(variable)) {
      setGroupBy(variable);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>Diabetes Risk Factors</h1>
        <p>
          Explore how health, lifestyle, and socioeconomic factors relate to
          diabetes risk.
        </p>
      </section>

      <section className="dashboard-top">
        <div className="card">
          <h2>Correlation Heatmap</h2>
          <Heatmap
            selectedVariable={selectedVariable}
            onSelectVariable={handleHeatmapSelect}
          />
        </div>

        <div className="card">
          <h2>Diabetes Prevalence by Income</h2>

          <div className="controls chart-controls">
            <div className="control">
              <label>Group by:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="PhysActivity">Physical Activity</option>
                <option value="Smoker">Smoking</option>
                <option value="HighBP">High Blood Pressure</option>
                <option value="HighChol">High Cholesterol</option>
                <option value="Sex">Sex</option>
                <option value="DiffWalk">Difficulty Walking</option>
                <option value="HeartDiseaseorAttack">
                  Heart Disease or Attack
                </option>
              </select>
            </div>

            <div className="control age-control">
              <label>
                Age Filter: {ageLabels[ageRange[0]]} - {ageLabels[ageRange[1]]}
              </label>

              <div className="age-sliders">
                <div>
                  <span>Min: {ageLabels[ageRange[0]]}</span>
                  <input
                    type="range"
                    min="1"
                    max="13"
                    value={ageRange[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAgeRange(([, max]) => [Math.min(val, max), max]);
                    }}
                  />
                </div>

                <div>
                  <span>Max: {ageLabels[ageRange[1]]}</span>
                  <input
                    type="range"
                    min="1"
                    max="13"
                    value={ageRange[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAgeRange(([min]) => [min, Math.max(val, min)]);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <GroupedBarChart groupBy={groupBy} ageRange={ageRange} />
        </div>
      </section>

      <section className="card full-width-card">
        <h2>Parallel Coordinates Plot</h2>
        <ParallelCoordinates ageRange={ageRange} />
      </section>
    </main>
  );
}