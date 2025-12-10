// Stretch goal: Make this reactive
export function buildStackedCargoChart(dataCargo, portColors){
    // Ensure chart container is empty
    d3.select("#map-chart-overlay").html("");
    
    let width = 400;
    let height = 300;
    let margin = 40;
    let barwidth = 20;

    // Fluid SVG size, fit to its container
    let div_chart = d3
        .select("#map-chart-overlay")
        .append("svg")
        .attr("viewBox", `${-20} ${-20} ${width+2*margin} ${height+2*margin}`)
        .style("width", "100%")
        .style("height", "auto")
        .style("background-color", "#ffffff00");

    // https://observablehq.com/@d3/stacked-bar-chart/2
    const keys = Array.from(new Set(dataCargo.map(d => d.WaterwayName)));
    // Reformat data to have entries like: {CompletedYear: {CompletedYear: [WaterwayName,CompletedYear,ShortTons]} }
    const indexed = d3.index(
        dataCargo,
        d => d.CompletedYear,
        d => d.WaterwayName
    );

    const series = d3.stack()
        .keys(keys)
        .value(([, map], key) => map.get(key)?.ShortTons || 0)
        (indexed);

    const xScale = d3.scaleBand(
        Array.from(indexed.keys()),
        [0, width]
    ).padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(series[series.length - 1], d => d[1])])
        .nice()
        .range([height, 0]);

    
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(keys.map(k => portColors[k] || portColors.default));

    div_chart.append("g")
        .attr("transform", `translate(${margin},0)`)
        .selectAll("g")
        .data(series)
        .join("g")
            .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("x", d => xScale(d.data[0]))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth());

    // x Axis
    div_chart.append("g")
    .attr("transform", `translate(${margin},${yScale(margin)})`)
    .call(d3.axisBottom(xScale).tickSize(3))
    .style("font-size", "10pt")
    .call(g => g.append("text")
        .attr("transform", `translate(${width/2},${margin})`)
        .text("Outbound Iron Ore Cargoes in Great Lakes Corps Ports")
        .attr("fill", "black")
        .style("font-size", "12pt")
        .style("font-weight", "bold")
    );

    // y Axis
    div_chart.append("g")
        .attr("transform", `translate(${margin},${0})`)
        .call(d3.axisLeft(yScale)
            .tickSize(3)
            .tickFormat(d3.format(".2s")))
        .style("font-size", "10pt")
        .call(g => g.append("text")
            .attr("transform", `translate(${-margin},${(height-2*margin)/2})rotate(-90)`)
            .text("Tonnage (short tons)")
            .attr("fill", "black")
            .style("font-size", "12pt")
        );
}


export function buildInboundBarChart(data) {
    // Clear out previous chart
    d3.select("#map-chart-overlay").html("");

    const latest = d3.max(data, d => +d.CompletedYear);
    const filtered = data.filter(d => +d.CompletedYear === latest);

    const margin = {top: 20, right: 20, bottom: 90, left: 100};
    const width = 420;
    const height = 260;

    const svg = d3.select("#map-chart-overlay")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "auto")
        .style("background", "#ffffffdd");

    const xScale = d3.scaleBand()
        .domain(filtered.map(d => d.WaterwayName))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => +d.ShortTons)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(
            d3.axisLeft(yScale)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat("")
        )
        .attr("stroke-opacity", 0.2);

    svg.selectAll("rect")
        .data(filtered)
        .join("rect")
        .attr("x", d => xScale(d.WaterwayName))
        .attr("y", d => yScale(+d.ShortTons))
        .attr("width", xScale.bandwidth())
        .attr("height", d => yScale(0) - yScale(+d.ShortTons))
        .attr("fill", "#4477aa");

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end")
        .style("font-size", "9px");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));

        
    svg.append("text")
        .attr("x", margin.left / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90, ${margin.left / 2}, ${height / 2})`)
        .style("font-size", "14px")
        .text("Tonnage (Short tons)");


    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top - 6)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`Inbound Iron Ore (Latest Year: ${latest})`);

}