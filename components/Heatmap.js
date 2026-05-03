import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function Heatmap({ selectedVariable, onSelectVariable }) {
  const svgRef = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/data/correlation_matrix.json")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const groupableVariables = [
      "PhysActivity", "Smoker", "HighBP", "HighChol",
      "Sex", "DiffWalk", "HeartDiseaseorAttack"
      ];

    const displayNames = {
      HighBP: "High Blood Pressure",
      HighChol: "High Cholesterol",
      BMI: "BMI",
      Smoker: "Smoker",
      Stroke: "Stroke",
      HeartDiseaseorAttack: "Heart Disease",
      PhysActivity: "Physical Activity",
      Fruits: "Fruits",
      Veggies: "Vegetables",
      HvyAlcoholConsump: "Heavy Alcohol Use",
      AnyHealthcare: "Has Healthcare",
      NoDocbcCost: "No Doctor (Due to Cost)",
      GenHlth: "General Health",
      MentHlth: "Mental Health Days",
      PhysHlth: "Physical Health Days",
      DiffWalk: "Difficulty Walking",
      Sex: "Sex",
      Age: "Age",
      Education: "Education",
      Income: "Income",
      Diabetes_012: "Diabetes Status",
    };
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    d3.select("body").selectAll(".heatmap-tooltip").remove();

    const variables = [...new Set(data.map((d) => d.x))];

    const width = 550;
    const height = 602;
    const margin = { top: 180, right: 40, bottom: 40, left: 170 };

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", "100%").attr("preserveAspectRatio", "xMidYMid meet");

    const x = d3.scaleBand().domain(variables).range([margin.left, width - margin.right]).padding(0.03);
    const y = d3.scaleBand().domain(variables).range([margin.top, height - margin.bottom]).padding(0.03);

    const color = d3.scaleSequential().domain([0, 1]).interpolator(d3.interpolateYlOrRd);

    // ── Selected variable highlight bands ──
    if (selectedVariable) {
      // Column band
      svg.append("rect")
        .attr("x", x(selectedVariable))
        .attr("y", margin.top)
        .attr("width", x.bandwidth())
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "none")
        .attr("stroke", "#c0392b")
        .attr("stroke-width", 2.5)
        .attr("rx", 2)
        .style("pointer-events", "none");

      // Row band
      svg.append("rect")
        .attr("x", margin.left)
        .attr("y", y(selectedVariable))
        .attr("width", width - margin.left - margin.right)
        .attr("height", y.bandwidth())
        .attr("fill", "none")
        .attr("stroke", "#c0392b")
        .attr("stroke-width", 2.5)
        .attr("rx", 2)
        .style("pointer-events", "none");
    }

    // ── Tooltip ──
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "heatmap-tooltip")
      .style("position", "absolute")
      .style("background", "#fffaf8")
      .style("padding", "8px 12px")
      .style("border", "1px solid #e8e2da")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("color", "#1c1917")
      .style("pointer-events", "none")
      .style("box-shadow", "0 4px 16px rgba(100,70,50,0.12)")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("line-height", "1.5");

    // ── Base cells ──
    svg.selectAll(".cell")
      .data(data)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => x(d.x))
      .attr("y", (d) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", (d) => color(Math.abs(d.value)))
      .attr("stroke", (d) =>
        (d.x === selectedVariable || d.y === selectedVariable) ? "#c0392b" : "#bbb"
      )
      .attr("stroke-width", (d) =>
        (d.x === selectedVariable || d.y === selectedVariable) ? 1.5 : 0.5
      );

    // ── Hover rect ──
    const hoverRect = svg.append("rect")
      .attr("class", "hover-rect")
      .attr("width", x.bandwidth() + 6)
      .attr("height", y.bandwidth() + 6)
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 2.5)
      .attr("rx", 3)
      .style("pointer-events", "none")
      .style("opacity", 0);

    // ── Invisible interaction layer ──
    svg.selectAll(".hover-target")
      .data(data)
      .join("rect")
      .attr("class", "hover-target")
      .attr("x", (d) => x(d.x))
      .attr("y", (d) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", "transparent")
      .attr("cursor", (d) => groupableVariables.includes(d.x) ? "pointer" : "default")
      .on("mouseover", function (event, d) {
        hoverRect
          .attr("x", x(d.x) - 3)
          .attr("y", y(d.y) - 3)
          .style("opacity", 1);

        const strength = Math.abs(d.value);
        const strengthLabel = strength > 0.2 ? "Strong" : strength > 0.1 ? "Moderate" : "Weak";

        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight:700;margin-bottom:4px">${displayNames[d.x] ?? d.x} × ${displayNames[d.y] ?? d.y}</div>
            <div>Correlation: <strong>${d.value.toFixed(3)}</strong></div>
            <div style="color:#888;font-size:11px">${strengthLabel} association</div>
            ${groupableVariables.includes(d.x) ? '<div style="color:#c0392b;font-size:11px;margin-top:4px">Click to group bar chart by this variable</div>' : d.x !== d.y ? '<div style="color:#a8a09a;font-size:11px;margin-top:4px">Not available as a bar chart grouping</div>' : ""}
          `)
          .style("left", event.pageX + 14 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 14 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        hoverRect.style("opacity", 0);
        tooltip.style("opacity", 0);
      })
      .on("click", function (event, d) {
        if (onSelectVariable && groupableVariables.includes(d.x)) {
          onSelectVariable(d.x);
        } 
      });

    // ── X labels ──
    svg.append("g").selectAll(".x-label")
      .data(variables)
      .join("text")
      .attr("class", "x-label")
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("y", margin.top - 8)
      .attr("text-anchor", "start")
      .attr("transform", (d) => {
        const xPos = x(d) + x.bandwidth() / 2;
        const yPos = margin.top - 8;
        return `rotate(-55, ${xPos}, ${yPos})`;
      })
      .attr("font-size", 10)
      .attr("font-weight", (d) => d === selectedVariable ? "bold" : "normal")
      .attr("fill", (d) => d === selectedVariable ? "#c0392b" : "#333")
      .text((d) => displayNames[d] ?? d);

    // ── Y labels ──
    svg.append("g").selectAll(".y-label")
      .data(variables)
      .join("text")
      .attr("class", "y-label")
      .attr("x", margin.left - 8)
      .attr("y", (d) => y(d) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 10)
      .attr("font-weight", (d) => d === selectedVariable ? "bold" : "normal")
      .attr("fill", (d) => d === selectedVariable ? "#c0392b" : "#333")
      .text((d) => displayNames[d] ?? d);

    // ── Color legend ──
    const legendW = 120, legendH = 10;
    const legendX = margin.left;
    const legendY = height - 20;  

    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "heatmap-legend-grad");
    grad.append("stop").attr("offset", "0%").attr("stop-color", color(0));
    grad.append("stop").attr("offset", "100%").attr("stop-color", color(1));

    svg.append("rect")
      .attr("x", legendX).attr("y", legendY)
      .attr("width", legendW).attr("height", legendH)
      .attr("rx", 3)
      .style("fill", "url(#heatmap-legend-grad)");

    svg.append("text").attr("x", legendX).attr("y", legendY - 4)
      .attr("font-size", 9).attr("fill", "#6b6560").text("Low correlation");
    svg.append("text").attr("x", legendX + legendW).attr("y", legendY - 4)
      .attr("font-size", 9).attr("fill", "#6b6560").attr("text-anchor", "end").text("High");

  }, [data, selectedVariable, onSelectVariable]);

  return <svg ref={svgRef}></svg>;
}