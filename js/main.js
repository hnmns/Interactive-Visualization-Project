import { buildStackedCargoChart, buildInboundBarChart } from "./charts.js";
import { animateRoute, animateSooLocksPictograph } from "./animations.js";

const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-98.50, 39.50],
    zoom: 1,
    maplibreLogo: false,
    interactive: false
});


// Globals
const text_overlay_list = [
    `
    For years, seven open-pit mines in Minnesota and Michigan have accounted for 
    <strong style="color:#C46F60;">effectively<sup>1</sup> 100%</strong> of US domestic iron ore production.
    <br><br>
    98% of this tonnage will go toward making steel.
    <br><br>
    <span style="display:block; font-size:0.75em; color:#666; margin-top:0.6em;">
        <sup>1</sup>Utah intermittently appears on U.S. Geological Survey"s Mineral Commodity Summaries, with mining operations in the state being suspended as recently as 2025.
    </span>
    `,
    `
    How does the ore reach steel mills?
    <br><br>
    Rail moves <i>taconite</i> iron pellets overland from mine to port, and lake freighters as long as <strong>1000 feet</strong> carry it over water.
    <br><br>
    The <strong>Port of Duluth-Superior</strong> is a major origin for these "laker" vessels, such as the 767-foot <i>Arthur M. Anderson</i>, whose July 2021 voyage to Gary, Indiana, is shown here.
    `,
    `
    The US Army Corps of Engineers (USACE) reports tonnages by port annually<sup>2</sup>. 
    The Duluth-Superior and Two Harbors routinely lead the top three ports in tonnage, with pandemic-era shocks slowing them all.
    <br><br>
    <span style="display:block; font-size:0.75em; color:#666; margin-top:0.6em;">
        <sup>2</sup>USACE Waterborne Commerce Statistics Center, Ports and Waterways Page
    </span>
    `,
    `
    Vessels from Two Harbors, Marquette, and other non-Corps ports carry ore on a similar route down Superior.
    They have a common waypoint in <strong>Sault Ste. Marie</strong>, Michigan: <strong>The Soo Locks</strong>, a pair of massive structures 
    that allow ships to traverse the change in elevation from Lake Superior to the lower lakes.
    `,
    `
    In 2023, the Soo Locks took <strong><span style="color:#4477aa;">381</span></strong> deep-draft* ships down and 77 up. That was a low-traffic year for lockages since 2014. 
    In fact, 381 outbound lockages is a <strong>44%</strong> drop from the 2014-2022 average.
    <br><br>
    This is heavily accelerated, showing a year's worth of deep-draft traffic in one place; ships are not actually backed up this much.
    <br><br>
    It <i>seems</i> like there are fewer ships coming back, but once a ship unloads and make a return trip, 
    its apparent draft drops, so it isn't counted again.
    <br><br>
    <span style="display:block; font-size:0.75em; color:#666; margin-top:0.6em;">
        *NB: "Deep-draft" was chosen here to mean vessels with maximum below-water depth of at least 25 feet.
    </span>
    `,
    `
    Finally, at the end of this particular voyage is Gary, Indiana. 
    Gary Harbor is one of multiple named ports in the district that feed into functionally adjacent steel mills.
    <br><br>
    Indiana is the largest steel producer in the nation<sup>3</sup>.
    <br><br>
    <span style="display:block; font-size:0.75em; color:#666; margin-top:0.6em;">
        <sup>3</sup><a "href=https://indianaeconomicdigest.net/MobileContent/Most-Recent/Lake/Article/Indiana-leads-nation-in-steel-production-continuing-reign-as-top-steelmaking-state/31/198/118326">
Indiana Economic Digest, 2025</a>
    </span>
    `,
    `
    Farther down the lake system are yet more receiving ports, of which Gary was the leader in taconite in-shipments.
    On average, however, Indiana Harbor has led the pack in taking in ore since 2014.
    `,
    `
    The domestic steel supply chain largely starts and ends in a relatively concentrated corner of the country.
    <br><br>
    Disruptions to iron ore production out of Minnesota and Michigan are demonstrably a possibility.
    The two-lane-wide channel that is the <strong>Soo Locks</strong> facilitates the passage of behemoth vessels,
        but it is also a bottleneck where maintenance disruptions can cause considerable delays.
    <br><br>
    The supply chain <i>also</i> hinges on a concentrated corner of the region.
    `
]

// Real Arthur M. Anderson route from Duluth to Gary in 2021
const routeData = await (await fetch("data/geodata/arthurmanderson_Duluth_to_Gary_Line_CLEAN.geojson")).json();
let duluthGaryCoords = [];
duluthGaryCoords = routeData.features[0].geometry.coordinates;
let routeProgress = { progress: 0 }; // idx of current coordinate
// let routeProgress = 0; // This doesn"t work to share between modules

const outportCargo = await d3.csv("data/clean/cargoes/wcus_outport_cargoes.csv");
const oCargo = outportCargo.map(d => {
    return {
    "WaterwayName":d.WaterwayName,
    "CompletedYear":d.CompletedYear,
    "ShortTons":+d.ShortTons
    }
});

const inportCargo = await d3.csv("data/clean/cargoes/wcus_inport_cargoes.csv");
const iCargo = inportCargo.map(d => {
    return {
        "WaterwayName":d.WaterwayName,
        "CompletedYear":d.CompletedYear,
        "ShortTons":+d.ShortTons
    }
}).sort((a, b) => b.ShortTons - a.ShortTons); // Descending order

const sooTripsFull = await d3.csv("data/clean/trip_counts/wcus_soo_25ftplus_counts.csv");
const sooOutTrips2023 = +sooTripsFull.find(
    d => d["Up/Down"] === "Downbound/West/South" &&
    d["CompletedYear"] === "2023"
).Trips;

// AI Use (ChatGPT): "Preferred approach for scrollytelling with scrollama and maplibre events?" 
// Using Scrollama to trigger maplibre flyto() events:
// https://github.com/digidem/maplibre-storymap/tree/main
const scroller = scrollama();
map.on("load", async () => {
    // Charts

    // Prevent my layers from covering up basemap city names; bring city names up a level
    map.on("styledata", () => {
        const layers = map.getStyle().layers;

        layers.forEach(l => {
            if (l.type === "symbol") {
            try {
                map.moveLayer(l.id);
            } catch (_) {}
            }
        });
    });

    const flyto_trigger_times = [
        "moveend",
        "moveend",
        "move",
        "moveend",
        "move",
        "move",
        "move",
        "move"
    ];
    const routeCheckpoints = [
        0,
        duluthGaryCoords.length/4,
        duluthGaryCoords.length/4,
        duluthGaryCoords.length/2-200,
        duluthGaryCoords.length/2-200,
        duluthGaryCoords.length,
        duluthGaryCoords.length,
        duluthGaryCoords.length
    ].map(checkpt => Math.floor(checkpt));
    
    map.addSource("duluth-to-gary", {
        type: "geojson",
        data: { 
            type: "Feature", 
            geometry: { type: "LineString", coordinates: [] } 
        }
    });
    map.addLayer({
        id: "duluth-to-gary",
        type: "line",
        source: "duluth-to-gary",
        paint: { 
            "line-color": "#000000", 
            "line-width": 5,
            "line-dasharray": [2,2]
        }
    });


    const portData = await (await fetch("data/geodata/USACE_port_and_stat_areas.geojson")).json();
    map.addSource("USACE_Ports", {
        type: "geojson",
        data: { 
            type: "Feature", 
            geometry: { type: "Polygon", coordinates: [] } 
        }
    });
    map.addLayer({
        id: "usace-ports-fill",
        type: "fill",
        source: "USACE_Ports",
        paint: { 
            "fill-color": "#C46F60",
            "fill-opacity": 0.0
        }
    });
    map.addLayer({
        id: "usace-ports-line",
        type: "line",
        source: "USACE_Ports",
        paint: { 
            "line-color": "#000000", 
            "line-opacity": 0.0,
            "line-width": 2,
            "line-dasharray": [2, 3]
        }
    });
    map.addLayer({
        id: "usace-ports-labels",
        type: "symbol",
        source: "USACE_Ports",
        layout: {
            "text-field": ["get", "FEATURENAME"],
            "text-size": 15,
            "text-anchor": "center",
            "text-allow-overlap": false,
            "text-offset": [-5, -1],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"]
        },
        paint: {
            "text-color": "#222",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
            "text-opacity": 0.0,
        }
    });
    map.getSource("USACE_Ports").setData(portData);


    // Use Dark2 palette colors
    const portColors = {
        "Duluth-Superior, MN and WI": "#7570B3",
        "Two Harbors, MN": "#E7298A",
        "Presque Isle, MI": "#D95F02",
        "Marquette, MI": "#1b9e77",
        "Sault Ste Marie, MI": "#E0DD28",

        "default": "#4477aa" 
    };
    // Set USACE port colors to match d3 stacked bar chart later
    map.setPaintProperty("usace-ports-fill", "fill-color", [
        "match",
        ["get", "FEATURENAME"],

        "Duluth-Superior, MN and WI", `${portColors["Duluth-Superior, MN and WI"]}`,
        "Two Harbors, MN", `${portColors["Two Harbors, MN"]}`,
        "Presque Isle, MI", `${portColors["Presque Isle, MI"]}`,
        "Marquette, MI", `${portColors["Marquette, MI"]}`,
        "Sault Ste Marie, MI", `${portColors["Sault Ste Marie, MI"]}`,

        `${portColors["default"]}` // default
    ]);
    

    // Highlight Minnesota and Michigan
    const mnmiData = await (await fetch("data/geodata/minnesota_michigan_borders.geojson")).json();
    map.addSource("mnmi", {
        type: "geojson",
        data:  {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: []
            }
        }
    });
    map.addLayer({
        id: "mnmi-fill",
        type: "fill",
        source: "mnmi",
        paint: {
            "fill-color": "#C46F60",
            "fill-opacity": 0.0
        }
    });
    map.getSource("mnmi").setData(mnmiData);

    // Highlight USA, darken/fade out rest of world
    const usaData = await (await fetch("data/geodata/us_lower_48.geojson")).json();
    map.addSource("nonusa-mask", {
        type: "geojson",
        data:  {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [-180, -90],
                        [180, -90],
                        [180, 90],
                        [-180, 90],
                        [-180, -90]
                    ],
                    usaData.features[0].geometry.coordinates[0]
                ]
            }
        }
    });
    map.addLayer({
        id: "nonusa-fade",
        type: "fill",
        source: "nonusa-mask",
        paint: {
            "fill-color": "#000000",
            "fill-opacity": 0.15
        }
    });
    

    const usacanData = await (await fetch("data/geodata/usa_can_border.geojson")).json();
    map.addSource("usa_can_border",{
        type: "geojson",
        data: usacanData
    });
    map.addLayer({
        id: "usa-can-border-line",
        type: "line",
        source: "usa_can_border",
        paint: {
            "line-color": "black",
            "line-opacity": 0.0,
            "line-width": 4
        }
    })

    map.setPaintProperty("nonusa-fade", "fill-opacity-transition", { duration: 2500 });
    map.setPaintProperty("mnmi-fill", "fill-opacity-transition", { duration: 2500 });
    map.setPaintProperty("usace-ports-fill", "fill-opacity-transition", { duration: 2500 });
    map.setPaintProperty("usa-can-border-line", "line-opacity-transition", { duration: 2500 });

    scroller
        .setup({
            step: ".step", // elements that trigger scroll
            offset: 0.50,   // trigger at X% viewport height
            debug: false,
        })
        .onStepEnter((response) => {
            // Highlighting current step in the sidebar
            const step = response.element;
            for (const s of document.querySelectorAll(".step")) {
                s.classList.remove("is-active");
            }
            step.classList.add("is-active");

            // Scroll sections
            const i = response.index;

            // Map zoom+pan events
            const lng = parseFloat(step.dataset.lng);
            const lat = parseFloat(step.dataset.lat);
            const zoom = parseFloat(step.dataset.zoom);
            map.flyTo({
                center: [lng, lat],
                zoom: zoom,
                speed: 0.6,
                curve: 1.43,
                essential: true,
            });

            const text_overlay = document.getElementById("map-text-overlay");
            text_overlay.innerHTML = text_overlay_list[i];
            text_overlay.classList.add("visible");
            
            map.on(flyto_trigger_times[i], () => {
                animateRoute("duluth-to-gary", duluthGaryCoords, routeCheckpoints[i], routeProgress, map);
            })

            // Step 1: Full USA view, highlighting MN and MI, lowlight rest of world
            if (i === 0) {
                map.setPaintProperty("nonusa-fade", "fill-opacity", 0.15);
                map.setPaintProperty("mnmi-fill", "fill-opacity", 0.65);
                map.setPaintProperty("usa-can-border-line", "line-opacity", 0.0);
                map.setPaintProperty("duluth-to-gary", "line-opacity", 0.0)

                map.setPaintProperty("usace-ports-fill", "fill-opacity", 0.0)
                map.setPaintProperty("usace-ports-line", "line-opacity", 0.0)
                map.setPaintProperty("usace-ports-labels", "text-opacity", 0.0)

                document.getElementById("map-chart-overlay").classList.remove("visible");

                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("top-left");
            }
            // Step 2: Duluth and USACE port zones
            else if (i === 1) {
                map.setPaintProperty("nonusa-fade", "fill-opacity", 0.025);
                map.setPaintProperty("mnmi-fill",   "fill-opacity", 0.1);
                map.setPaintProperty("usa-can-border-line", "line-opacity", 0.35);	
                map.setPaintProperty("duluth-to-gary", "line-opacity", 1.0);

                map.setPaintProperty("usace-ports-fill", "fill-opacity", 0.75)
                map.setPaintProperty("usace-ports-line", "line-opacity", 0.5)
                map.setPaintProperty("usace-ports-labels", "text-opacity", 1.0)
                
                document.getElementById("map-chart-overlay").classList.remove("visible");
                
                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("top-left");
            }
            // Step 3: Major Outbound ports - Cargo
            else if (i === 2) {
                map.setPaintProperty("duluth-to-gary", "line-opacity", 0.0)
                // Copypaste so they still appear on refresh
                map.setPaintProperty("usace-ports-fill", "fill-opacity", 0.75)
                map.setPaintProperty("usace-ports-line", "line-opacity", 0.5)
                map.setPaintProperty("usace-ports-labels", "text-opacity", 1.0)
                
                buildStackedCargoChart(oCargo, portColors);
                document.getElementById("map-chart-overlay").classList.add("visible");
                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("bottom-left");
            }
            // Step 4: Major Outbound ports - Route
            else if (i === 3) {
                map.setPaintProperty("duluth-to-gary", "line-opacity", 1.0)

                map.setPaintProperty("usace-ports-fill", "fill-opacity", 0.75)
                map.setPaintProperty("usace-ports-line", "line-opacity", 0.5)
                map.setPaintProperty("usace-ports-labels", "text-opacity", 1.0)
                
                document.getElementById("map-chart-overlay").classList.remove("visible");
                document.getElementById("pictograph-locks").classList.remove("visible");
                
                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("bottom-middle");
            }
            // Step 5: Soo Locks
            else if (i === 4) {
                map.setPaintProperty("usace-ports-fill", "fill-opacity", 0.75)
                map.setPaintProperty("usace-ports-line", "line-opacity", 0.5)
                map.setPaintProperty("usace-ports-labels", "text-opacity", 1.0)
                
                animateSooLocksPictograph(sooOutTrips2023);
                
                document.getElementById("pictograph-locks").classList.add("visible");
                
                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("top-right");
            }
            // Step 6: Indiana Harbor
            else if (i === 5) {
                map.setPaintProperty("usace-ports-fill", "fill-opacity", 0.75)
                map.setPaintProperty("usace-ports-line", "line-opacity", 0.5)
                map.setPaintProperty("usace-ports-labels", "text-opacity", 1.0)
                document.getElementById("pictograph-locks").classList.remove("visible");
                document.getElementById("map-chart-overlay").classList.remove("visible");

                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("top-right");
            }
            // Step 7: Major Inbound ports
            else if (i === 6) {
                map.setLayoutProperty("usace-ports-labels", "text-size", 10)
                buildInboundBarChart(iCargo);
                document.getElementById("map-chart-overlay").classList.add("visible");

                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("top-right");
            }
            // Step 8: Summary
            else if (i === 7) {
                map.setLayoutProperty("usace-ports-labels", "text-size", 10)
                document.getElementById("map-chart-overlay").classList.remove("visible");

                document.getElementById("map-text-overlay").classList.remove(
                    "top-left", "top-right", "bottom-left", "bottom-middle"
                );
                text_overlay.classList.add("top-right");
            }

            
        })
        .onStepExit(() => {
            document.getElementById("map-text-overlay").classList.remove("visible");
        });


});

window.addEventListener("resize", scroller.resize);