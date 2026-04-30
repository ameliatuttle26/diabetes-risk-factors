import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function GroupedBarChart({ groupBy }) {
  const svgRef = useRef();
  // age filtering: re-computing prevalence from pcp_sample (when range isn't full)
  const [prevalenceData, setPrevalenceData] = useState([]);
  const [pcpData, setPcpData] = useState([]);

  useEffect(() => {
    fetch("/data/prevalence.json")
      .then((res) => res.json())
      .then(setPrevalenceData);
  }, []);

  useEffect(() => {
    fetch("/data/pcp_sample.json")
      .then((res) => res.json())
      .then(setPcpData);
  }, []);

  useEffect(() => {
    if (!prevalenceData.length || !pcpData.length) return;

    // age filtering: when full age range selected, use precomputed prevalence
    const fullRange = ageRange[0] === 1 && ageRange[1] === 13;

    let data = prevalenceData.filter((d) => d.groupBy === groupBy);
    
    // building prevalence lookup from pcp_sample filtered to ageRange
    if (!fullRange) {
      const ageSample = pcpData.filter(
        (r) => r.Age >= ageRange[0] && r.Age <= ageRange[1]
      );
      // map groupBy var names to pcp_sample keys (should match?)
      const grouped = d3.rollup(
        ageSample, 
        (rows) => ({
          total: rows.length, 
          diabetesCount: rows.filter((r) => r.Diabetes_012 === 2).length, 
        }),
        (r) => r.Income, // income 1-8
        (r) => r[groupBy] // 0 or 1
      );
  
      data = data.map((d) => {
        const incomeGroup = grouped.get(d.income);
        if (!incomeGroup) return {...d, diabetesPrevalence: 0};
        const cell = incomeGroup.get(d.groupValue);
        if (!cell || cell.total === 0) return {...d, diabetesPrevalence: 0};
        return {
          ...d, 
          diabetesPrevalence: (cell.diabetesCount / cell.total) * 100, 
        };
      });
    }

    // heatmap linking: highlight bar if its var matches selectedVar
    const isLinked = selectedVariable && selectedVariable === groupBy;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 700;
    const height = 400;
    const margin = { top: 40, right: 170, bottom: 90, left: 70 };

    svg.attr("width", width).attr("height", height);

    const incomeLabels = [...new Set(data.map((d) => d.incomeLabel))];
    const groupLabels = [...new Set(data.map((d) => d.groupLabel))];

    const x0 = d3
      .scaleBand()
      .domain(incomeLabels)
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const x1 = d3
      .scaleBand()
      .domain(groupLabels)
      .range([0, x0.bandwidth()])
      .padding(0.08);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.diabetesPrevalence) * 1.15])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal()
      .domain(groupLabels)
      .range(["#69b3a2", "#f4a261", "#8ecae6"]);

    function formatLabel(groupBy, value) {
      if (groupBy === "PhysActivity") {
        return value === "Yes" ? "Active" : "Not Active";
      }
      if (groupBy === "Smoker") {
        return value === "Yes" ? "Smoker" : "Non-smoker";
      }
      if (groupBy === "HighBP") {
        return value === "Yes" ? "High BP" : "No High BP";
      }
      if (groupBy === "HighChol") {
        return value === "Yes" ? "High Cholesterol" : "No High Cholesterol";
      }
      if (groupBy === "DiffWalk") {
        return value === "Yes" ? "Difficulty Walking" : "No Difficulty Walking";
      }
      if (groupBy === "HeartDiseaseorAttack") {
        return value === "Yes" ? "Heart Disease/Attack" : "No Heart Disease/Attack";
      }
      if (groupBy === "Sex") {
        return value;
      }
      return value;
    }

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .attr("text-anchor", "end")
      .attr("font-size", 11);

    // Y axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}%`));

    // Y label
    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("Diabetes prevalence (%)");

    // Grouped bars
    const incomeGroups = svg
      .selectAll(".income-group")
      .data(incomeLabels)
      .join("g")
      .attr("class", "income-group")
      .attr("transform", (income) => `translate(${x0(income)},0)`);

    incomeGroups
      .selectAll("rect")
      .data((income) => data.filter((d) => d.incomeLabel === income))
      .join("rect")
      .attr("x", (d) => x1(d.groupLabel))
      .attr("y", (d) => y(d.diabetesPrevalence))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => height - margin.bottom - y(d.diabetesPrevalence))
      .attr("fill", (d) => color(d.groupLabel));

    // Title: added bold/underline and turns red if this groupBy is heatmap selected var
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 22)
      .attr("font-size", 15)
      .attr("font-weight", "bold")
      .attr("fill", isLinked ? "#c0392b" : "#222")
      .text(`Diabetes prevalence by income, grouped by ${groupBy}`);

    // age range
    if (!fullRange) {
      svg
        .append("text")
        .attr("x", margin.left)
        .attr("y", 40)
        .attr("font-size", 11)
        .attr("fill", "#888")
        .text(`Age group filter: ${ageRange[0]}-${ageRange[1]}`);
    }

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right + 25},${margin.top})`);

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -12)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text(groupBy);

    groupLabels.forEach((label, i) => {
      const row = legend
        .append("g")
        .attr("transform", `translate(0,${i * 24})`);

      row
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(label));

      row
        .append("text")
        .attr("x", 18)
        .attr("y", 10)
        .attr("font-size", 12)
        .text(formatLabel(groupBy, label));
    });
  }, [prevalenceData, pcpData, groupBy, selectedVariable, ageRange]);

  return <svg ref={svgRef}></svg>;
}
