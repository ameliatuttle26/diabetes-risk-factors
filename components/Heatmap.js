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

    d3.select("body").selectAll(".heatmap-tooltip").remove();

    const variables = [...new Set(data.map((d) => d.x))];

    const width = 550;
    const height = 550;
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
      .scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateYlOrRd);

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
      .text("Darker cells indicate stronger correlation.");

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "heatmap-tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
      .style("opacity", 0);

    // Base heatmap cells. These never change on hover.
    svg
      .selectAll(".cell")
      .data(data)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => x(d.x))
      .attr("y", (d) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", (d) => color(Math.abs(d.value)))
      .attr("stroke", "#bbb")
      .attr("stroke-width", 1);

    // Floating overlay rectangle. This is the only rectangle that changes on hover.
    const hoverRect = svg
      .append("rect")
      .attr("class", "hover-rect")
      .attr("width", x.bandwidth() + 6)
      .attr("height", y.bandwidth() + 6)
      .attr("fill", "none")
      .attr("stroke", "#111")
      .attr("stroke-width", 3)
      .attr("rx", 3)
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Invisible hover layer.
    svg
      .selectAll(".hover-target")
      .data(data)
      .join("rect")
      .attr("class", "hover-target")
      .attr("x", (d) => x(d.x))
      .attr("y", (d) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", "transparent")
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        hoverRect
          .attr("x", x(d.x) - 3)
          .attr("y", y(d.y) - 3)
          .style("opacity", 1);

        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.x}</strong> vs <strong>${d.y}</strong><br/>
            Correlation: ${d.value.toFixed(3)}
          `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mousemove", function (event, d) {
        hoverRect
          .attr("x", x(d.x) - 3)
          .attr("y", y(d.y) - 3);

        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        hoverRect.style("opacity", 0);
        tooltip.style("opacity", 0);
      })
      .on("click", function (event, d) {
        if (onSelectVariable) {
          onSelectVariable(d.x);
        }
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
      .attr("font-weight", (d) => (d === selectedVariable ? "bold" : "normal"))
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
      .attr("font-weight", (d) => (d === selectedVariable ? "bold" : "normal"))
      .text((d) => d);
  }, [data, selectedVariable, onSelectVariable]);

  return <svg ref={svgRef}></svg>;
}