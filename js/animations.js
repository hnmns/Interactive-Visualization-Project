export function animateRoute(sourceId, coords, targetIndex, routeProgress, map, speed = 1) {
    const source = map.getSource(sourceId);
    if (!source) return;

    function frame() {
        if (routeProgress.progress < targetIndex) {
            routeProgress.progress += speed;
            if (routeProgress.progress > targetIndex) {
                routeProgress.progress = targetIndex;
            }

            source.setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coords.slice(0, routeProgress.progress)
                }
            });

            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}


export function animateSooLocksPictograph(shipCount) {
    const width = 1600
    const height = 900;

    const iconSize = 8;
    const padding = 5;

    const svg = d3.select("#pictograph-locks")
        .html("")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const shipIdx = d3.range(shipCount).reverse();

    const columns = 35;
    function posGrid(i) {
        return {
            x: 280 + (i % columns) * (iconSize + padding),
            y: 20 + Math.floor(i / columns) * (iconSize + padding) + 0.35*(40 + (i % columns) * (iconSize + padding))
        };
    }

    const lockX = 0.5 * width;
    const lockY = 0.415 * height;

    function posExit(i) {
        return {
            x: 0.58*width - (i % columns) * (iconSize + padding),
            y: 500 + Math.floor(i / columns) * (iconSize + padding)
        };
    }

    
    const ships = svg.selectAll("circle")
        .data(shipIdx)
        .join("circle")
        .attr("r", 0)
        .attr("fill", "#4477aa")
        .attr("cx", d => posGrid(d).x)
        .attr("cy", d => posGrid(d).y)
        .attr("opacity", 1);

    
    ships
        // initial grid
        .transition()
        .duration(1500)
        .attr("r", iconSize / 2)

        // to lock
        .transition()
        .delay((d, i) => i * 40)
        .duration(100)
        .attr("cx", lockX - 20)
        .attr("cy", lockY)

        // through lock
        .transition()
        .duration(300)
        .attr("cx", lockX + 20)
        .attr("cy", lockY)

        // to other side
        .transition()
        .duration(100)
        .attr("cx", (d, i) => posExit(i).x)
        .attr("cy", (d, i) => posExit(i).y)
        .attr("fill", "#4477aa");
}