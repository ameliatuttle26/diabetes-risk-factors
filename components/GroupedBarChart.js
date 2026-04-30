import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function GroupedBarChart({ groupBy, ageRange }) {
  const svgRef = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/data/prevalence.json")
      .then((res) => res.json())
      .then((json) => {
        const filtered = json.filter((d) => {
          const matchesGroup = d.groupBy === groupBy;

          if (!ageRange || d.age === undefined) {
            return matchesGroup;
          }

          const matchesAge =
            d.age >= ageRange[0] && d.age <= ageRange[1];

          return matchesGroup && matchesAge;
        });

        setData(filtered);
      });
  }, [groupBy, ageRange]);

  useEffect(() => {
    if (!data.length) return;

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

    // Title
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 22)
      .attr("font-size", 15)
      .attr("font-weight", "bold")
      .text(`Diabetes prevalence by income, grouped by ${groupBy}`);

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
  }, [data, groupBy]);

  return <svg ref={svgRef}></svg>;
}