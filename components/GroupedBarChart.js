import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function GroupedBarChart({ groupBy, selectedVariable, ageRange }) {
  const svgRef = useRef();
  const prevGroupByRef = useRef(null);
  const [prevalenceData, setPrevalenceData] = useState([]);
  const [pcpData, setPcpData] = useState([]);

  useEffect(() => {
    fetch("/data/prevalence.json").then((res) => res.json()).then(setPrevalenceData);
  }, []);

  useEffect(() => {
    fetch("/data/pcp_sample.json").then((res) => res.json()).then(setPcpData);
  }, []);

  useEffect(() => {
    if (!prevalenceData.length || !pcpData.length) return;

    const groupByChanged = prevGroupByRef.current !== groupBy;
    prevGroupByRef.current = groupBy;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    d3.select("body").selectAll(".bar-tooltip").remove();

    const fullRange = ageRange[0] === 1 && ageRange[1] === 13;
    let data = prevalenceData.filter((d) => d.groupBy === groupBy);

    if (!fullRange) {
      const ageSample = pcpData.filter(
        (r) => r.Age >= ageRange[0] && r.Age <= ageRange[1]
      );
      const grouped = d3.rollup(
        ageSample,
        (rows) => ({
          total: rows.length,
          diabetesCount: rows.filter((r) => r.Diabetes_012 === 2).length,
        }),
        (r) => r.Income,
        (r) => r[groupBy]
      );
      data = data.map((d) => {
        const incomeGroup = grouped.get(d.income);
        if (!incomeGroup) return { ...d, diabetesPrevalence: 0 };
        const cell = incomeGroup.get(d.groupValue);
        if (!cell || cell.total === 0) return { ...d, diabetesPrevalence: 0 };
        return { ...d, diabetesPrevalence: (cell.diabetesCount / cell.total) * 100 };
      });
    }

    const isLinked = selectedVariable && selectedVariable === groupBy;

    const width = 680;
    const height = 450;
    const margin = { top: 50, right: 160, bottom: 90, left: 70 };

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "auto")
      .attr("preserveAspectRatio", "xMidYMid meet");

    const incomeLabels = [...new Set(data.map((d) => d.incomeLabel))];
    const groupLabels = [...new Set(data.map((d) => d.groupLabel))];

    const x0 = d3.scaleBand().domain(incomeLabels).range([margin.left, width - margin.right]).padding(0.25);
    const x1 = d3.scaleBand().domain(groupLabels).range([0, x0.bandwidth()]).padding(0.08);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.diabetesPrevalence) * 1.18 || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(groupLabels)
      .range(isLinked ? ["#c0392b", "#2980b9", "#27ae60"] : ["#69b3a2", "#f4a261", "#8ecae6"]);

    const ageLabels = {
      1:"18–24",2:"25–29",3:"30–34",4:"35–39",5:"40–44",6:"45–49",
      7:"50–54",8:"55–59",9:"60–64",10:"65–69",11:"70–74",12:"75–79",13:"80+",
    };

    const formatLabel = (gb, value) => {
      const map = {
        PhysActivity: { Yes: "Active", No: "Inactive" },
        Smoker: { Yes: "Smoker", No: "Non-smoker" },
        HighBP: { Yes: "High BP", No: "Normal BP" },
        HighChol: { Yes: "High Chol.", No: "Normal Chol." },
        DiffWalk: { Yes: "Diff. Walking", No: "No Diff. Walking" },
        HeartDiseaseorAttack: { Yes: "Heart Disease", No: "No Heart Disease" },
        Sex: { Male: "Male", Female: "Female" },
      };
      return map[gb]?.[value] ?? value;
    };

    // ── Tooltip ──
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "bar-tooltip")
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
      .style("line-height", "1.6");

    // ── Gridlines ──
    svg.append("g")
      .attr("class", "gridlines")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat("")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "#f0ebe4")
        .attr("stroke-dasharray", "3,3")
      );

    // ── Axes ──
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
      .attr("font-size", 10)
      .attr("dy", "0.5em")
      .attr("dx", "-0.5em");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}%`))
      .call(g => g.select(".domain").remove());

    // ── Y-axis label ──
    svg.append("text")
      .attr("x", -(height / 2))
      .attr("y", 18)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "#6b6560")
      .text("Diabetes prevalence (%)");

    // ── Bars with animation ──
    const incomeGroups = svg.selectAll(".income-group")
      .data(incomeLabels)
      .join("g")
      .attr("class", "income-group")
      .attr("transform", (income) => `translate(${x0(income)},0)`);

    incomeGroups.selectAll("rect")
      .data((income) => data.filter((d) => d.incomeLabel === income))
      .join("rect")
      .attr("x", (d) => x1(d.groupLabel))
      .attr("width", x1.bandwidth())
      .attr("y", (d) => groupByChanged ? height - margin.bottom : y(d.diabetesPrevalence))
      .attr("height", (d) => groupByChanged ? 0 : height - margin.bottom - y(d.diabetesPrevalence))
      .attr("fill", (d) => color(d.groupLabel))
      .attr("rx", 2)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.85);
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight:700;margin-bottom:4px">${d.incomeLabel}</div>
            <div>${formatLabel(groupBy, d.groupLabel)}</div>
            <div>Prevalence: <strong>${d.diabetesPrevalence.toFixed(1)}%</strong></div>
            <div style="color:#888;font-size:10px">n = ${d.total?.toLocaleString() ?? "—"}</div>
          `)
          .style("left", event.pageX + 14 + "px")
          .style("top", event.pageY - 40 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 14 + "px")
          .style("top", event.pageY - 40 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 0);
      })
      .call((sel) => {
        if (groupByChanged) {
          sel.transition()
            .duration(600)
            .ease(d3.easeCubicOut)
            .delay((d, i) => i * 40)
            .attr("y", (d) => y(d.diabetesPrevalence))
            .attr("height", (d) => height - margin.bottom - y(d.diabetesPrevalence));
        }
      });

    // ── Title ──
    const displayNames = {
      PhysActivity: "Physical Activity",
      Smoker: "Smoking Status",
      HighBP: "Blood Pressure",
      HighChol: "Cholesterol",
      Sex: "Sex",
      DiffWalk: "Difficulty Walking",
      HeartDiseaseorAttack: "Heart Disease",
    };


    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 22)
      .attr("font-size", 13)
      .attr("font-weight", "bold")
      .attr("fill", isLinked ? "#c0392b" : "#222")
      .text(`Diabetes prevalence by income, grouped by ${displayNames[groupBy] ?? groupBy}`);

    if (!fullRange) {
      svg.append("text")
        .attr("x", margin.left)
        .attr("y", 38)
        .attr("font-size", 10)
        .attr("fill", "#6b6560")
        .text(`Age filter: ${ageLabels[ageRange[0]]} – ${ageLabels[ageRange[1]]}`);
    }

    // ── Legend ──
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20},${margin.top})`);

    legend.append("text")
      .attr("x", 0).attr("y", -10)
      .attr("font-size", 11).attr("font-weight", "bold").attr("fill", "#1c1917")
      .text(displayNames[groupBy] ?? groupBy);;

    groupLabels.forEach((label, i) => {
      const row = legend.append("g").attr("transform", `translate(0,${i * 26})`);
      row.append("rect").attr("width", 13).attr("height", 13).attr("rx", 3).attr("fill", color(label));
      row.append("text")
        .attr("x", 19).attr("y", 11)
        .attr("font-size", 11).attr("fill", "#1c1917")
        .text(formatLabel(groupBy, label));
    });

  }, [prevalenceData, pcpData, groupBy, selectedVariable, ageRange]);

  return <svg ref={svgRef}></svg>;
}