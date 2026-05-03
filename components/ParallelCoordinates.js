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
    d3.select("body").selectAll(".pcp-tooltip").remove();

    // Mutable — order changes when user drags
    let dimensions = ["GenHlth", "BMI", "Age", "Income", "Education", "PhysHlth"];

    const ageLabels = {
      1:"18–24",2:"25–29",3:"30–34",4:"35–39",5:"40–44",6:"45–49",
      7:"50–54",8:"55–59",9:"60–64",10:"65–69",11:"70–74",12:"75–79",13:"80+",
    };
    const incomeLabels = {
      1:"<$10k",2:"$10–15k",3:"$15–20k",4:"$20–25k",
      5:"$25–35k",6:"$35–50k",7:"$50–75k",8:"$75k+",
    };
    const genHlthLabels = { 1:"Excellent",2:"Very Good",3:"Good",4:"Fair",5:"Poor" };

    const data = rawData.filter(
      (d) => d.Age >= ageRange[0] && d.Age <= ageRange[1]
    );

    const width = 1060;
    const height = 520;
    const margin = { top: 80, right: 170, bottom: 55, left: 50 };

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "auto")
      .attr("preserveAspectRatio", "xMidYMid meet");

    const x = d3.scalePoint()
      .domain(dimensions)
      .range([margin.left, width - margin.right]);


    const y = {};
    dimensions.forEach((dim) => {
      const extent = d3.extent(data, (d) => Number(d[dim]));
      y[dim] = d3.scaleLinear()
        .domain(extent)
        .nice()
        .range([height - margin.bottom, margin.top]);
    });

    const statuses = ["No Diabetes", "Prediabetes", "Diabetes"];
    const color = d3.scaleOrdinal()
      .domain(statuses)
      .range(["#14b8a6", "#7c3aed", "#f97316"]);

    // Tracks live pixel x of whichever axis is being dragged
    const dragging = {};
    let rafPending = false;

    function position(dim) {
      return dragging[dim] != null ? dragging[dim] : x(dim);
    }

    function path(d) {
      return d3.line()(
        [...dimensions]
          .sort((a, b) => position(a) - position(b))
          .map((dim) => [position(dim), y[dim](Number(d[dim]))])
      );
    }

    // Brush selections persist by dimension name through reorders
    const brushSelections = {};
    dimensions.forEach((dim) => { brushSelections[dim] = null; });

    const hiddenStatuses = new Set();

    // ── Tooltip ──
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "pcp-tooltip")
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
      .style("line-height", "1.6")
      .style("transition", "opacity 0.15s ease");

    // ── Lines ──
    const linesGroup = svg.append("g").attr("class", "lines");

    // Draw order: No Diabetes (bottom) → Diabetes → Prediabetes (top)
    // so rarer classes aren't buried under the majority group
    const drawOrder = { "No Diabetes": 0, "Diabetes": 1, "Prediabetes": 2 };
    const sortedData = [...data].sort((a, b) =>
      (drawOrder[a.diabetes_label] ?? 0) - (drawOrder[b.diabetes_label] ?? 0)
    );

    // Base opacity per class — rarer classes slightly more prominent
    const baseOpacity = { "No Diabetes": 0.4, "Diabetes": 0.4, "Prediabetes": 0.4 };

    const lines = linesGroup.selectAll(".pcp-line")
      .data(sortedData)
      .join("path")
      .attr("class", "pcp-line")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", (d) => color(d.diabetes_label))
      .attr("stroke-width", 1)
      .attr("opacity", (d) => baseOpacity[d.diabetes_label] ?? 0.25)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).raise()
          .transition().duration(120).ease(d3.easeCubicOut)
          .attr("stroke-width", 2.5).attr("opacity", 1);
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight:700;color:${color(d.diabetes_label)};margin-bottom:4px">${d.diabetes_label}</div>
            <div>General Health: <strong>${genHlthLabels[d.GenHlth] ?? d.GenHlth}</strong></div>
            <div>BMI: <strong>${d.BMI}</strong></div>
            <div>Age: <strong>${ageLabels[d.Age] ?? d.Age}</strong></div>
            <div>Income: <strong>${incomeLabels[d.Income] ?? d.Income}</strong></div>
            <div>Education Level: <strong>${["", "No school", "Elementary", "Some HS", "HS Grad", "Some College", "College Grad"][d.Education] ?? d.Education}</strong></div>
            <div>Physical Health Days: <strong>${d.PhysHlth}</strong></div>
          `)
          .style("left", event.pageX + 14 + "px")
          .style("top", event.pageY - 60 + "px");
      })
      .on("mousemove", function (event) {
        tooltip.style("left", event.pageX + 14 + "px").style("top", event.pageY - 60 + "px");
      })
      .on("mouseout", function () {
        updateLineVisibility();
        tooltip.style("opacity", 0);
      });

    function updateLineVisibility(animate = true) {
      const activeBrushes = Object.entries(brushSelections).filter(([, sel]) => sel !== null);
      const sel = animate
        ? lines.transition().duration(200).ease(d3.easeCubicOut)
        : lines;
      sel
        .style("pointer-events", (d) => hiddenStatuses.has(d.diabetes_label) ? "none" : "auto")
        .attr("opacity", (d) => {
          if (hiddenStatuses.has(d.diabetes_label)) return 0;
          if (activeBrushes.length === 0) return baseOpacity[d.diabetes_label] ?? 0.25;
          const passes = activeBrushes.every(([dim, [lo, hi]]) => {
            const val = y[dim](Number(d[dim]));
            return val >= lo && val <= hi;
          });
          return passes ? 0.85 : 0.03;
        })
        .attr("stroke-width", (d) => {
          if (activeBrushes.length === 0) return 1;
          const passes = activeBrushes.every(([dim, [lo, hi]]) => {
            const val = y[dim](Number(d[dim]));
            return val >= lo && val <= hi;
          });
          return passes ? 1.5 : 0.5;
        });
    }

    // ── Axes ──
    const axesGroup = svg.append("g").attr("class", "axes");
    const axisGroups = {};
    const brushes = {};
    const brushGs = {};
    const labels = {};

    dimensions.forEach((dim) => {
      const axisG = axesGroup.append("g")
        .attr("class", `axis axis-${dim}`)
        .attr("transform", `translate(${x(dim)},0)`);

      axisGroups[dim] = axisG;

      axisG.call(
        d3.axisLeft(y[dim]).ticks(5).tickFormat((val) => {
          if (dim === "Age") return ageLabels[Math.round(val)] || val;
          if (dim === "Income") return incomeLabels[Math.round(val)] || val;
          if (dim === "GenHlth") return genHlthLabels[Math.round(val)] || val;
          if (dim === "Education") return ["", "No school", "Elementary", "Some HS", "HS Grad", "Some College", "College Grad"][Math.round(val)] || val;
          return val;
        })
      );
      axisG.selectAll("text").attr("font-size", 9);

      // Label — this is the drag handle
      const label = axisG.append("text")
        .attr("class", "axis-label")
        .attr("y", margin.top - 18)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("font-weight", "bold")
        .attr("fill", "#1c1917")
        .attr("cursor", "default")
        .text({
        GenHlth: "General Health",
        BMI: "BMI",
        Age: "Age",
        Income: "Income",
        Education: "Education",
        PhysHlth: "Physical Health Days",
      }[dim] ?? dim);

      labels[dim] = label;

      // ── Drag on wide invisible rect covering full axis height ──
      const drag = d3.drag()
        .subject(function () {
          // Start drag from current axis position
          return { x: x(dim) };
        })
        .on("start", function () {
          dragging[dim] = x(dim);
          label.attr("fill", "#c1513f");
          axisG.select(".axis-drag-handle").attr("cursor", "grabbing");
          // Use a class to suppress pointer events — avoids per-node style recalc
          axisG.classed("dragging", true);
          d3.select(axisG.node()).raise();
        })
        .on("drag", function (event) {
          dragging[dim] = Math.max(margin.left, Math.min(width - margin.right, event.x));
          // Move axis group immediately — this is just a CSS transform, very cheap
          axisG.attr("transform", `translate(${dragging[dim]},0)`);
          // Throttle line redraws to one per animation frame
          // x.domain([...dimensions].sort((a, b) => position(a) - position(b)));
          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
              lines.attr("d", path);
              rafPending = false;
            });
          }
        })
        .on("end", function () {
          // Capture final order BEFORE deleting dragging, while pixel position still known
          const finalOrder = [...dimensions].sort((a, b) => position(a) - position(b));

          delete dragging[dim];
          axisG.select(".axis-drag-handle").attr("cursor", "grab");
          axisG.classed("dragging", false);

          // Commit new order
          dimensions.length = 0;
          finalOrder.forEach(d => dimensions.push(d));
          x.domain(dimensions);

          // Reset all label colors
          dimensions.forEach((d) => {
            labels[d].attr("fill", brushSelections[d] ? "#c1513f" : "#1c1917");
          });

          // Snap everything to final positions
          dimensions.forEach((d) => {
            axisGroups[d].transition().duration(320).ease(d3.easeCubicOut)
              .attr("transform", `translate(${x(d)},0)`);
          });
          lines.transition().duration(320).ease(d3.easeCubicOut).attr("d", path);
        });

      // ── Bottom drag handle — clear of brush, pushed well below axis end ──
      const handleG = axisG.append("g")
        .attr("class", "axis-drag-handle")
        .attr("transform", `translate(0, ${height - margin.bottom + 18})`)
        .attr("cursor", "grab")
        .call(drag);

      // Tiny pill
      handleG.append("rect")
        .attr("x", -9)
        .attr("y", -5)
        .attr("width", 18)
        .attr("height", 10)
        .attr("rx", 5)
        .attr("fill", "#ffffff")
        .attr("stroke", "#cdc5bb")
        .attr("stroke-width", 0.75);

      // Two tiny dots
      [-2.5, 2.5].forEach(offset => {
        handleG.append("circle")
          .attr("cx", offset)
          .attr("cy", 0)
          .attr("r", 1.2)
          .attr("fill", "#c8c4bb");
      });

      // ── Brush on the axis track ──
      const brush = d3.brushY()
        .extent([[-12, margin.top], [12, height - margin.bottom]])
        .on("brush", function ({ selection }) {
          if (selection) {
            brushSelections[dim] = selection;
            label.attr("fill", "#c1513f");
          }
          updateLineVisibility();
        })
        .on("end", function ({ selection }) {
          if (!selection) {
            brushSelections[dim] = null;
            // Only reset to default if not dragging
            if (dragging[dim] == null) label.attr("fill", "#1c1917");
            updateLineVisibility();
          }
        });

      brushes[dim] = brush;

      const brushG = axisG.append("g")
        .attr("class", "brush")
        .call(brush);

      brushGs[dim] = brushG;

      brushG.selectAll(".selection")
        .attr("fill", "#c1513f")
        .attr("fill-opacity", 0.15)
        .attr("stroke", "#c1513f")
        .attr("stroke-width", 1.5);

      // Click label to reset just this axis's brush
      // d3.drag captures click, so we use the drag "end" with near-zero movement
    });

    // ── Legend ──
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 50},${margin.top+40})`)

    legend.append("text")
      .attr("x", 0).attr("y", -14)
      .attr("font-size", 11).attr("font-weight", "bold").attr("fill", "#1c1917")
      .text("Diabetes Status");

    statuses.forEach((status, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0,${i * 26})`)
        .attr("cursor", "pointer")
        .on("click", function () {
          if (hiddenStatuses.has(status)) {
            hiddenStatuses.delete(status);
          } else {
            hiddenStatuses.add(status);
          }
          const isHidden = hiddenStatuses.has(status);
          row.select(".legend-line").attr("stroke", isHidden ? "#cdc5bb" : color(status));
          row.select(".legend-label")
            .attr("fill", isHidden ? "#a8a09a" : "#1c1917")
            .attr("text-decoration", isHidden ? "line-through" : "none");
          row.select(".legend-dot")
            .text(isHidden ? "○" : "●")
            .attr("fill", isHidden ? "#cdc5bb" : color(status));
          updateLineVisibility();
        });

      row.append("text")
        .attr("class", "legend-dot")
        .attr("x", -10).attr("y", 10)
        .attr("font-size", 9).attr("text-anchor", "middle")
        .attr("fill", color(status))
        .text("●");

      row.append("line")
        .attr("class", "legend-line")
        .attr("x1", 0).attr("y1", 6).attr("x2", 22).attr("y2", 6)
        .attr("stroke", color(status)).attr("stroke-width", 3);

      row.append("text")
        .attr("class", "legend-label")
        .attr("x", 28).attr("y", 10)
        .attr("font-size", 11).attr("fill", "#1c1917")
        .text(status);

      row.append("title").text("Click to show/hide");
    });

    // Single reorder hint centered below the chart
    svg.append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#a8a09a")
      .text("drag ·· to reorder axes");

    legend.append("text")
      .attr("x", 0)
      .attr("y", statuses.length * 26 + 10)
      .attr("font-size", 10)
      .attr("fill", "#a8a09a")
      .text(`${data.length.toLocaleString()} respondents shown`);

  }, [rawData, ageRange]);

  return <svg ref={ref}></svg>;
}