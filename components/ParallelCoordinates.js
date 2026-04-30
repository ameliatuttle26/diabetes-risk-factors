import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function ParallelCoordinates({ ageRange }) {
  const ref = useRef();
  const [rawData, setRawData] = useState([]);

  useEffect(() => {
    fetch("/data/pcp_sample.json")
      .then((res) => res.json())
      .then((json) => setRawData(json));
  }, []);

  useEffect(() => {
    if (!rawData.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const dimensions = ["BMI", "Age", "Income", "GenHlth", "PhysHlth", "MentHlth"];

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

    const incomeLabels = {
      1: "<10k",
      2: "10-15k",
      3: "15-20k",
      4: "20-25k",
      5: "25-35k",
      6: "35-50k",
      7: "50-75k",
      8: "75k+",
    };

    const data = rawData.filter(
      (d) => d.Age >= ageRange[0] && d.Age <= ageRange[1]
    );

    const width = 1000;
    const height = 600;
    const margin = { top: 100, right: 160, bottom: 40, left: 60 };

    svg.attr("width", width).attr("height", height);

    const x = d3
      .scalePoint()
      .domain(dimensions)
      .range([margin.left, width - margin.right]);

    const y = {};
    dimensions.forEach((dim) => {
      y[dim] = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => Number(d[dim])))
        .nice()
        .range([height - margin.bottom, margin.top]);
    });

    const statuses = ["No Diabetes", "Prediabetes", "Diabetes"];

    const color = d3
      .scaleOrdinal()
      .domain(statuses)
      .range([
        "#14b8a6", // teal
        "#7c3aed", // purple
        "#f97316", // orange
      ]);

    function path(d) {
      return d3.line()(
        dimensions.map((dim) => [x(dim), y[dim](Number(d[dim]))])
      );
    }

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 25)
      .attr("font-size", 16)
      .attr("font-weight", "bold")
      .text("Parallel Coordinates Plot");

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 43)
      .attr("font-size", 12)
      .attr("fill", "#666")
      .text("Each line represents one respondent. Color shows diabetes status.");

    svg
      .selectAll(".pcp-line")
      .data(data)
      .join("path")
      .attr("class", "pcp-line")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", (d) => color(d.diabetes_label))
      .attr("stroke-width", 1.1)
      .attr("opacity", 0.35);

    dimensions.forEach((dim) => {
      svg
        .append("g")
        .attr("transform", `translate(${x(dim)},0)`)
        .call(
          d3.axisLeft(y[dim]).tickFormat((d) => {
            if (dim === "Age") return ageLabels[Math.round(d)] || d;
            if (dim === "Income") return incomeLabels[Math.round(d)] || d;
            return d;
          })
        );

      svg
        .append("text")
        .attr("x", x(dim))
        .attr("y", margin.top - 15)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("font-weight", "bold")
        .text(dim);
    });

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right + 35},${margin.top})`);

    statuses.forEach((status, i) => {
      const row = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 24})`);

      row
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(status));

      row
        .append("text")
        .attr("x", 18)
        .attr("y", 10)
        .attr("font-size", 12)
        .text(status);
    });
  }, [rawData, ageRange]);

  return <svg ref={ref}></svg>;
}