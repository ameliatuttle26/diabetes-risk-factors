import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function GroupedBarChart({ selectedVariable, groupBy, ageRange }) {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const income = ["<$10k", "$10-15k", "$15-20k", "$20-25k", "$25-35k", "$35-50k", "$50-75k", "$75k+"];
    const groups = ["No", "Yes"];

    const data = income.flatMap(i =>
      groups.map(g => ({
        income: i,
        group: g,
        prevalence: Math.random() * 35
      }))
    );

    const width = 700;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 80, left: 70 };

    svg.attr("width", width).attr("height", height);

    const x0 = d3.scaleBand()
      .domain(income)
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(groups)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, 40])
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(groups)
      .range(["#69b3a2", "#f4a261"]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .attr("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg.selectAll("g.bar-group")
      .data(income)
      .join("g")
      .attr("transform", d => `translate(${x0(d)},0)`)
      .selectAll("rect")
      .data(i => data.filter(d => d.income === i))
      .join("rect")
      .attr("x", d => x1(d.group))
      .attr("y", d => y(d.prevalence))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - margin.bottom - y(d.prevalence))
      .attr("fill", d => color(d.group));

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 20)
      .text(`Grouped by ${groupBy}; selected from heatmap: ${selectedVariable}`);
  }, [selectedVariable, groupBy, ageRange]);

  return <svg ref={ref}></svg>;
}
