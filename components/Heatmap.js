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

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const variables = [...new Set(data.map((d) => d.x))];

    const width = 850;
    const height = 850;
    const margin = { top: 170, right: 40, bottom: 40, left: 170 };

    svg.attr("width", width).attr("height", height);

    const x = d3
      .scaleBand()
      .domain(variables)
      .range([margin.left, width - margin.right])
      .padding(0.03);

    const y = d3
      .scaleBand()
      .domain(variables)
      .range([margin.top, height - margin.bottom])
      .padding(0.03);

    const color = d3
      .scaleDiverging()
      .domain([-1, 0, 1])
      .interpolator(d3.interpolateRdBu);

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 30)
      .attr("font-size", 16)
      .attr("font-weight", "bold")
      .text("Correlation Matrix of Diabetes Risk Factors");

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 50)
      .attr("font-size", 12)
      .attr("fill", "#666")
      .text("Darker red/blue indicates stronger positive or negative correlation.");

    svg
      .selectAll(".cell")
      .data(data)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => x(d.x))
      .attr("y", (d) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", (d) => color(d.value))
      .attr("stroke", (d) =>
        d.x === selectedVariable || d.y === selectedVariable ? "#111" : "white"
      )
      .attr("stroke-width", (d) =>
        d.x === selectedVariable || d.y === selectedVariable ? 1.5 : 0.5
      )
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        if (onSelectVariable) onSelectVariable(d.x);
      });

    svg
      .append("g")
      .selectAll(".x-label")
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
      .text((d) => d);

    svg
      .append("g")
      .selectAll(".y-label")
      .data(variables)
      .join("text")
      .attr("class", "y-label")
      .attr("x", margin.left - 8)
      .attr("y", (d) => y(d) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 10)
      .attr("font-weight", (d) => d === selectedVariable ? "bold" : "normal")
      .text((d) => d);
  }, [data, selectedVariable, onSelectVariable]);

  return <svg ref={svgRef}></svg>;
}