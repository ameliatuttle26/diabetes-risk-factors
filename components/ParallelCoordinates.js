import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function ParallelCoordinates({ ageRange }) {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const dimensions = ["BMI", "Income", "HighBP", "PhysActivity", "Age"];
    const statuses = ["No diabetes", "Prediabetes", "Diabetes"];

    const data = d3.range(80).map(() => ({
      BMI: 15 + Math.random() * 40,
      Income: 1 + Math.random() * 7,
      HighBP: Math.round(Math.random()),
      PhysActivity: Math.round(Math.random()),
      Age: 1 + Math.random() * 12,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }));

    const width = 800;
    const height = 420;
    const margin = { top: 40, right: 50, bottom: 40, left: 50 };

    svg.attr("width", width).attr("height", height);

    const x = d3.scalePoint()
      .domain(dimensions)
      .range([margin.left, width - margin.right]);

    const y = {};
    dimensions.forEach(dim => {
      y[dim] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[dim]))
        .range([height - margin.bottom, margin.top]);
    });

    const color = d3.scaleOrdinal()
      .domain(statuses)
      .range(["#4ade80", "#facc15", "#f87171"]);

    function path(d) {
      return d3.line()(dimensions.map(dim => [x(dim), y[dim](d[dim])]));
    }

    svg.selectAll("path")
      .data(data)
      .join("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", d => color(d.status))
      .attr("stroke-width", 1.2)
      .attr("opacity", 0.45);

    dimensions.forEach(dim => {
      svg.append("g")
        .attr("transform", `translate(${x(dim)},0)`)
        .call(d3.axisLeft(y[dim]));

      svg.append("text")
        .attr("x", x(dim))
        .attr("y", margin.top - 15)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text(dim);
    });
  }, [ageRange]);

  return <svg ref={ref}></svg>;
}
