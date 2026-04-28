import { useState } from "react";
import GroupedBarChart from "../components/GroupedBarChart";
import Heatmap from "../components/Heatmap";

export default function Home() {
  const [groupBy, setGroupBy] = useState("PhysActivity");
  const [selectedVariable, setSelectedVariable] = useState(null);

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
              <label>Age Filter:</label>
              <input type="range" min="1" max="13" />
            </div>
          </div>

          <GroupedBarChart groupBy={groupBy} />
        </div>

        <div className="card">
          <h2>Parallel Coordinates Plot</h2>
          <div className="placeholder pcp">PCP will go here</div>
        </div>
      </section>
    </main>
  );
}