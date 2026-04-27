import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Heatmap({ onSelectVariable }) {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const variables = [
      "HighBP", "HighChol", "BMI", "Smoker", "Stroke",
      "HeartDiseaseorAttack", "PhysActivity", "Fruits",
      "Veggies", "HvyAlcoholConsump", "AnyHealthcare",
      "NoDocbcCost", "GenHlth", "MentHlth", "PhysHlth",
      "DiffWalk", "Sex", "Age", "Education", "Income"
    ];

    const data = variables.map((v, i) => ({
      variable: v,
      value: Math.random() * 0.6,
      index: i
    }));

    const width = 700;
    const height = 400;
    const margin = { top: 20, right: 40, bottom: 80, left: 160 };

    svg.attr("width", width).attr("height", height);

    const x = d3.scaleLinear()
      .domain([0, 0.6])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.variable))
      .range([margin.top, height - margin.bottom])
      .padding(0.15);

    const color = d3.scaleSequential(d3.interpolateReds)
      .domain([0, 0.6]);

    svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", margin.left)
      .attr("y", d => y(d.variable))
      .attr("width", d => x(d.value) - margin.left)
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.value))
      .attr("cursor", "pointer")
      .on("click", (event, d) => onSelectVariable(d.variable));

    svg.selectAll("text.label")
      .data(data)
      .join("text")
      .attr("class", "label")
      .attr("x", margin.left - 10)
      .attr("y", d => y(d.variable) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .text(d => d.variable);

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", height - 35)
      .text("Correlation with diabetes status");
  }, [onSelectVariable]);

  return <svg ref={ref}></svg>;
}
