// ========== Global State ==========
let stateDetails = {};
let stateAnomaly = {};
let eventDataByState = {};
let globalMax = 0;
let tempDataByState = {};
let svg, g, path, projection;
let usStatesData, usCountiesData;
let activeState = null;
let activeStateName = "";
let countyEventCounts = [];
let currentSlideIndex = 0;
const totalSlides = 3;

// ========== DOM Ready ==========
document.addEventListener('DOMContentLoaded', function () {
    initApp();
});

// ========== Init ==========
function initApp() {
    bindUIEvents();
    loadAllData().then(() => {
        //createStateAnomalyMap();
        createCountiesMap();
        createCountySpikeMap();
        createClimateDivisionAnomalyMap();
        toy_histo();
        setupCarousel();
    });

}

// ========== UI Events ==========
function bindUIEvents() {
    // Add carousel navigation events
    document.querySelector('.prev-arrow').addEventListener('click', () => navigateCarousel(-1));
    document.querySelector('.next-arrow').addEventListener('click', () => navigateCarousel(1));
    
    // Add dot navigation
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            goToSlide(parseInt(this.getAttribute('data-index')));
        });
    });
}

// ========== Carousel Navigation ==========
function setupCarousel() {
    // Initialize the carousel at slide 0
    goToSlide(0);
}

function navigateCarousel(direction) {
    let newIndex = currentSlideIndex + direction;
    
    // Handle wrap-around
    if (newIndex >= totalSlides) {
        newIndex = 0;
    } else if (newIndex < 0) {
        newIndex = totalSlides - 1;
    }
    
    goToSlide(newIndex);
}

function goToSlide(index) {
    // Update current index
    currentSlideIndex = index;
    
    // Update text content
    document.querySelectorAll('.text-content').forEach((content, i) => {
        content.classList.toggle('active', i === index);
    });
    
    // Update map content
    document.querySelectorAll('.map-content').forEach((content, i) => {
        content.classList.toggle('active', i === index);
    });
    
    // Update dots
    document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// ========== Data Loading ==========
async function loadAllData() {
    try {
        [stateTopo, countyTopo, stateDetails, stateAnomaly, eventDataByState, tempDataByState,
            countyEventCounts
        ] = await Promise.all([
            d3.json("../data/us-states-10m.json"),
            d3.json("../data/us-counties-10m.json"),
            // d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"), 
            d3.json("../milestone2/state_data.json"),
            d3.json("../milestone2/anomaly_by_state.json"),
            d3.json("../milestone2/state_event_counts.json").then(data => {
                globalMax = Math.max(...Object.values(data).map(arr => d3.max(arr, d => d.count)));
                return data;
            }),
            d3.json("../milestone2/annual_avg_by_state.json"),
            d3.json("../data/county_counts.json")
        ]);
        console.log("All data loaded");
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

/*

d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then(us => {
  const counties = topojson.feature(us, us.objects.counties).features;

  svg.selectAll("path")
     .data(counties)
     .enter()
     .append("path")
     .attr("d", path)
     .attr("fill", d => colorScale(yourData[d.id] || 0));
});
*/

function createClimateDivisionAnomalyMap() {
    console.log("Creating climate division anomaly map");

    const width = 975;
    const height = 610;

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,0.15)")
        .style("pointer-events", "none")
        .style("font-family", "sans-serif")
        .style("font-size", "14px");

    const svg = d3.select("#anomaly-map-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height + 100)
        .attr("viewBox", [0, 0, width, height + 300])
        .attr("style", "width: 100%; height: auto;");

    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(1250);

    const path = d3.geoPath().projection(projection);

    function makeClimateDivisionId(stateFips, divisionNumber) {
        const stateStr = stateFips.toString().padStart(2, '0');
        const divisionStr = divisionNumber.toString().padStart(2, '0');
        return stateStr + divisionStr;
    }

    Promise.all([
        d3.json("../data/divisions.json"),
        d3.json("../data/division_anomalies.json")
    ]).then(([topoData, anomalyData]) => {
        const divisions = topojson.feature(topoData, topoData.objects["GIS.OFFICIAL_CLIM_DIVISIONS"]).features;

        divisions.forEach(d => {
            // Récupérer state FIPS et division number dans les propriétés
            const stateFips = d.properties.STATE_FIPS || d.properties.STATE_CODE;  // selon ta structure
            const divisionNum = d.properties.CD_2DIG || d.properties.DIVISION;    // selon ta structure

            // Calculer l'ID complet
            const fullId = makeClimateDivisionId(stateFips, divisionNum);

            // Récupérer la valeur anomaly avec l'ID calculé
            d.properties.anomaly = anomalyData[fullId] || 0;
            d.properties.hasData = anomalyData[fullId] !== undefined;
        });

        const colorScale = d3.scaleDiverging()
            .domain([5.5, 0, -5.5])
            .interpolator(d3.interpolateRdBu);

        svg.append("g")
            .selectAll("path")
            .data(divisions)
            .join("path")
            .attr("fill", d => d.properties.hasData ? colorScale(+d.properties.anomaly) : "#ccc")
            .attr("d", path)
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(
                    `Division ${d.id}<br>` +
                    (d.properties.hasData
                        ? `Anomaly: ${(+d.properties.anomaly).toFixed(2)}°`
                        : `No data`)
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");

                d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
                d3.select(this).attr("stroke", null).attr("stroke-width", 0);
            });

        svg.append("path")
            .datum(topojson.mesh(topoData, topoData.objects["GIS.OFFICIAL_CLIM_DIVISIONS"], (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-linejoin", "round")
            .attr("d", path);

        // Legend
        const legendWidth = 300;
        const legendHeight = 10;
        const legendDomain = d3.range(-5.5, 5.6, 0.1);
        const legendSvg = svg.append("g")
            .attr("transform", `translate(${width - legendWidth - 50}, ${height - 5})`);

        const legendScale = d3.scaleLinear()
            .domain([-5.5, 5.5])
            .range([0, legendWidth]);

        const axis = d3.axisBottom(legendScale)
            .tickValues([-5.5, 0, 5.5])
            .tickFormat(d => `${d.toFixed(1)}°`);

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        linearGradient.selectAll("stop")
            .data(legendDomain)
            .join("stop")
            .attr("offset", d => `${legendScale(d) / legendWidth * 100}%`)
            .attr("stop-color", d => colorScale(d));

        legendSvg.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        legendSvg.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(axis);

        legendSvg.append("rect")
            .attr("x", -80)
            .attr("y", -5)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", "#ccc");

        legendSvg.append("text")
            .attr("x", -60)
            .attr("y", 5)
            .text("No data")
            .style("font-size", "12px")
            .style("alignment-baseline", "middle");
    });
}

// ========== Create Counties Map ==========
function createCountiesMap(){
    console.log("Creating simple state map");

    const width = 975;
    const height = 610;

    const svg = d3.select("#counties-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "width: 100%; height: auto;");

    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(1250);

    const path = d3.geoPath().projection(projection);

    // Assuming you have the TopoJSON data for counties
    const counties = topojson.feature(countyTopo, countyTopo.objects.counties).features;

    svg.append("g")
        .selectAll("path")
        .data(counties)
        .join("path")
        .attr("fill", "none")  // No fill, only borders
        .attr("stroke", "#000000") // Black stroke color for county boundaries
        .attr("d", path);

    // State boundaries (Optional, you can remove this if you don't need state boundaries)
    svg.append("path")
        .datum(topojson.mesh(countyTopo, countyTopo.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "#000000") // Black stroke color for state boundaries
        .attr("stroke-linejoin", "round")
        .attr("d", path);
}

// ========== Create Anomaly Map ==========
function createStateAnomalyMap() {
    console.log("Creating state anomaly map");

    const width = 975;
    const height = 610;

    // Create tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,0.15)")
        .style("pointer-events", "none")
        .style("font-family", "sans-serif")
        .style("font-size", "14px");

    const svg = d3.select("#anomaly-map-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height+100)
        .attr("viewBox", [0, 0, width, height+300])
        .attr("style", "width: 100%; height: auto;");

    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(1250);

    const path = d3.geoPath().projection(projection);

    const states = topojson.feature(stateTopo, stateTopo.objects.states).features;

    const data = states.map(state => {
        const stateName = state.properties.name;
        // Check if we have data for this state
        if (stateAnomaly[stateName]?.anomaly) {
            const anomalyStr = stateAnomaly[stateName].anomaly;
            const anomaly = parseFloat(anomalyStr.replace(/,/g, ""));
            return { 
                ...state, 
                anomaly: isNaN(anomaly) ? 0 : anomaly, 
                hasData: !isNaN(anomaly) 
            };
        } else {
            // Mark states with no data
            return { ...state, anomaly: 0, hasData: false };
        }
    });

    // Filter out null values for calculating domain
    const dataWithValues = data.filter(d => d.hasData);
    const maxAnomaly = d3.max(dataWithValues, d => d.anomaly);
    const minAnomaly = d3.min(dataWithValues, d => d.anomaly);


    const colorScale = d3.scaleDiverging()
        .domain([5.5, 0, -5.5])
        .interpolator(d3.interpolateRdBu);

    /*
    const color = d3.scaleSequential()
        .domain([0, maxAnomaly]) // [low anomaly, high anomaly]
        .interpolator(d3.interpolateReds)      // diverging color scale
        .clamp(true);
    */
    svg.append("g")
        .selectAll("path")
        .data(data)
        .join("path")
        .attr("fill", d => colorScale(+d.anomaly))
        .attr("d", path)
        .append("title")
        .text(d => `${d.properties.name}\nAnomaly: ${d.anomaly.toFixed(2)}°`);

    svg.append("g")
        .selectAll("path")
        .data(data)
        .join("path")
        .attr("fill", d => d.hasData ? colorScale(d.anomaly) : "#cccccc") // Grey for missing data
        .attr("d", path)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
                
            // Different tooltip content based on data availability
            if (d.hasData) {
                tooltip.html(`<strong>${d.properties.name}</strong><br>Anomaly: ${d.anomaly.toFixed(2)}°`);
            } else {
                tooltip.html(`<strong>${d.properties.name}</strong><br>No data available`);
            }
            
            tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            
            // Highlight the hovered state
            d3.select(this)
                .attr("stroke", "#000000")
                .attr("stroke-width", 2);
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            
            // Make sure to explicitly set stroke to null or an empty string
            d3.select(this)
                .attr("stroke", null)
                .attr("stroke-width", 0);  // Set to 0 instead of null
        });
        

    // State boundaries
    svg.append("path")
        .datum(topojson.mesh(stateTopo, stateTopo.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

    // Legend
    const legendWidth = 300;
    const legendHeight = 10;
    
    const legendDomain = d3.range(-5.5, 5.6, 0.1);

    const legendSvg = svg.append("g")
        .attr("transform", `translate(${width - legendWidth - 50}, ${height-5})`);
    

    const legendScale = d3.scaleLinear()
        .domain([-5.5, 5.5])
        .range([0, legendWidth]);




/*     const legendScale = d3.scaleLinear()
        .domain([4, 0])
        .range([0, legendWidth]); */

    const axis = d3.axisBottom(legendScale)
        .tickValues([-5.5, 0, 5.5])
        .tickFormat(d => `${d.toFixed(1)}°`);

    // Gradient
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");
    
    linearGradient.selectAll("stop")
        .data(legendDomain)
        .join("stop")
        .attr("offset", d => `${legendScale(d) / legendWidth * 100}%`)
        .attr("stop-color", d => colorScale(d));

    /* linearGradient.selectAll("stop")
        .data(d3.ticks(0, 1, 10))
        .join("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => colorScale(colorScale.domain()[0] + d * (colorScale.domain()[1] - colorScale.domain()[0])));
 */
    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    legendSvg.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(axis);

        // Add "No Data" indicator to legend
    legendSvg.append("rect")
        .attr("x", -80)
        .attr("y", -5)
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", "#cccccc");
        
    legendSvg.append("text")
        .attr("x", -60)
        .attr("y", 5)
        .text("No data")
        .style("font-size", "12px")
        .style("alignment-baseline", "middle");

}


// ==============================================
function toy_histo() {
    d3.json("../data/data.json").then(raw => {
        // Transform the nested object into a flat array
        const fullData = Object.entries(raw.data).map(([year, d]) => ({
            year: +String(year).slice(0, 4),
            anomaly: +d.anomaly
        }));

        const margin = {top: 60, right: 80, bottom: 60, left: 80};
        const width = 975 - margin.left - margin.right;  // Match other maps width
        const height = 450 - margin.bottom - margin.top;

        // Create tooltip with consistent styling
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "0 0 10px rgba(0,0,0,0.15)")
            .style("pointer-events", "none")
            .style("font-family", "sans-serif")
            .style("font-size", "14px");

        const svg = d3.select("#histo-map-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
            .attr("style", "width: 100%; height: auto; display: block; margin: 0 auto;")  // Center the SVG
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(fullData, d => d.year))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([-2.5, 2.5])
            .range([height, 0]);

        // Use the same diverging color scale as the anomaly map
        const colorScale = d3.scaleDiverging()
            .domain([2, 0, -2])  // Adjusted domain for histogram data
            .interpolator(d3.interpolateRdBu);

        console.log(colorScale(-2));
        // Add horizontal grid lines with consistent styling
        const yTicks = yScale.ticks(5);
        svg.selectAll(".grid-line")
            .data(yTicks)
            .enter()
            .append("line")
            .attr("class", "grid-line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", d => yScale(d))
            .attr("y2", d => yScale(d))
            .style("stroke", "#ddd")  // Lighter grid lines
            .style("stroke-width", "0.5")
            .style("stroke-dasharray", "2,2");
        
        // Add baseline at y = 0 with consistent styling
        svg.append("line")
            .attr("class", "baseline")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .style("stroke", "#333")  // Darker baseline
            .style("stroke-width", "2");

        // Create bars
        const barWidth = width / fullData.length * 0.8;
        
        svg.selectAll(".bar")
            .data(fullData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.year) - barWidth/2)
            .attr("y", d => d.anomaly >= 0 ? yScale(d.anomaly) : yScale(0))
            .attr("width", barWidth)
            .attr("height", d => Math.abs(yScale(d.anomaly) - yScale(0)))
            .attr("fill", d => colorScale(d.anomaly))
            .attr("stroke", "white")  // Add white stroke like state boundaries
            .attr("stroke-width", 0.25)
            .style("cursor", "pointer")  // Add cursor pointer for consistency
            .on("mouseover", function(event, d) {
                // Highlight bar on hover
                d3.select(this)
                    .attr("stroke-width", 1);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`<strong>Year: ${d.year}</strong><br/>Anomaly: ${d.anomaly > 0 ? '+' : ''}${d.anomaly.toFixed(2)}°F`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                // Remove highlight
                d3.select(this)
                    .attr("stroke-width", 0.25);
                
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add axes with consistent styling
        const xAxis = d3.axisBottom(xScale)
            .ticks(10)
            //.tickValues([1895, 1950, 2000])
            .tickFormat(d => String(d).slice(0, 4));
            
        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(d => d > 0 ? `+${d}°F` : `${d}°F`);

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("fill", "#333")  // Consistent with other maps
            .style("font-size", "14px")
            .style("font-family", "sans-serif");

        svg.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .selectAll("text")
            .style("fill", "#333")
            .style("font-size", "14px")
            .style("font-family", "sans-serif");

        // Style axis lines consistently
        svg.selectAll(".axis path, .axis line")
            .style("stroke", "#333")
            .style("stroke-width", "1");

        // Add right y-axis with Celsius (consistent with other maps)
        const yAxisRight = d3.axisRight(yScale)
            .ticks(5)
            .tickFormat(d => {
                const celsius = (d * 5/9).toFixed(1);
                return celsius > 0 ? `+${celsius}°C` : `${celsius}°C`;
            });

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${width},0)`)
            .call(yAxisRight)
            .selectAll("text")
            .style("fill", "#333")
            .style("font-size", "14px")
            .style("font-family", "sans-serif");

        // Add note about baseline with consistent styling, positioned above legend
        svg.append("text")
            .attr("class", "note")
            .attr("x", width - 20)
            .attr("y", height - 50)
            .style("fill", "#777")  // Consistent with legend text
            .style("font-size", "12px")
            .style("text-anchor", "end")
            .style("font-family", "sans-serif")
            .text("(relative to 1961-1990 average)");

        // Add a legend positioned outside the chart area
        const legendWidth = 300;
        const legendHeight = 10;

        // Position legend below the chart, similar to anomaly map
        const legendSvg = svg.append("g")
            .attr("transform", `translate(${width - legendWidth - 20}, ${height - 33})`);  // Position at top right

        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([0, legendWidth]);

        const legendAxisScale = d3.scaleLinear()
            .domain([-2, 2])  // left → right
            .range([0, legendWidth]);

        const axis = d3.axisBottom(legendAxisScale)
            .ticks(2)
            .tickFormat(d => `${d.toFixed(1)}°F`);

        /* const axis = d3.axisBottom(legendScale)  // Use bottom axis like anomaly map
            .ticks(3)
            .tickFormat(d => `${(d).toFixed(1)}°F`);
 */
        // Gradient for legend
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "histo-legend-gradient")
            .attr("x1", "100%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        // Create gradient stops
        const gradientData = d3.range(0, 1.1, 0.1);
        linearGradient.selectAll("stop")
            .data(gradientData)
            .enter()
            .append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => {
                const value = colorScale.domain()[0] + (d) * (colorScale.domain()[2] - colorScale.domain()[0]);
                return colorScale(value);
            });

        legendSvg.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#histo-legend-gradient)")
            .style("stroke", "#333")
            .style("stroke-width", 0.5);

        legendSvg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, ${legendHeight})`)  // Position below legend bar
            .call(axis)
            .selectAll("text")
            .style("fill", "#333")
            .style("font-size", "12px")
            .style("font-family", "sans-serif");

        // Style legend axis
        legendSvg.selectAll(".axis path, .axis line")
            .style("stroke", "#333")
            .style("stroke-width", "1");

    });
}



// ========== Create County Spike Map ==========
function createCountySpikeMap() {
    console.log("Creating county spike map");
    const width = 975;
    const height = 610;
    
    // Create SVG container
    const svg = d3.select("#spike-map-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "width: 100%; height: auto;");
    
    // Setup projection
    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(1250);
    
    const path = d3.geoPath().projection(projection);
    
    // Extract features
    const counties = topojson.feature(countyTopo, countyTopo.objects.counties).features;
    const states = topojson.feature(countyTopo, countyTopo.objects.states).features;

    // ----------------------------------------------------------------------
    function extractAndSaveAlaska() {
    const states = topojson.feature(countyTopo, countyTopo.objects.states).features;
    const alaska = states.find(d => d.properties.name === 'Alaska');
    
    if (alaska) {
        const alaskaGeojson = {
            type: "FeatureCollection",
            features: [alaska]
        };
        
        // Create and download the file
        const dataStr = JSON.stringify(alaskaGeojson, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'alaska_reference.geojson';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Alaska reference file downloaded!');
    }
    }
   
    // ----------------------------------------------------------------------
    
    // Create map for lookup
    const countyMap = new Map(counties.map(county => [county.id, county]));
    
    // Process the data to include geometry
    const data = countyEventCounts.map(d => ({
        ...d,
        county: countyMap.get(d.fips)
    }))
    .filter(d => d.county) // Remove entries without matching geometry
    .sort((a, b) => d3.descending(a.count, b.count));
    
    // Construct the length scale
    const maxCount = d3.max(data, d => d.count);
    const length = d3.scaleLinear([0, maxCount], [0, 75]); // Adjust max spike height as needed
    
    // Create the cartographic background layers
    svg.append("path")
        .datum(topojson.feature(countyTopo, countyTopo.objects.nation))
        .attr("fill", "#ddd")
        .attr("d", path);
    
    svg.append("path")
        .datum(topojson.mesh(countyTopo, countyTopo.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path);
    
    // Helper function to create spike shape
    function spike(length) {
        const width = 5;
        //(length, width = 7) => 
        return `M${-width / 2},0L0,${-length}L${width / 2},0`
        //return `M0,0L0,${-length}L${length/10},0Z`; // Simple triangular spike
    }
    
    // Helper function to get centroid
    function centroid(feature) {
        const [x, y] = path.centroid(feature);
        return isNaN(x) || isNaN(y) ? [0, 0] : [x, y];
    }
    
    // Create the legend
    const legend = svg.append("g")
        .attr("fill", "#777")
        .attr("transform", `translate(${width - 100}, ${height - 20})`)
        .attr("text-anchor", "middle")
        .style("font", "10px sans-serif")
        .selectAll()
        .data(length.ticks(4).slice(1))
        .join("g")
        .attr("transform", (d, i) => `translate(${20 * i},0)`);
    
    legend.append("path")
        .attr("fill", "red")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "red")
        .attr("stroke-width", 0.5)
        .attr("d", d => spike(length(d)));
    
    legend.append("text")
        .attr("dy", "1em")
        .text(length.tickFormat(4, "s"));
    
    // Add a spike for each county, with a title (tooltip)
    const format = d3.format(",.0f");
    svg.append("g")
        .attr("fill", "red")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "red")
        .attr("stroke-width", 0.5)
        .selectAll()
        .data(data)
        .join("path")
        .attr("transform", d => `translate(${centroid(d.county)})`)
        .attr("d", d => spike(length(d.count)))
        .append("title")
        .text(d => `${d.county.properties.name || "Unknown County"}, ${d.fips}
Events: ${format(d.count)}`);
    
    return svg.node();
}



// ========== Initialize Map =========


function initMap() {
    const width = 975;
    const height = 610;
    
    console.log("Initializing map with dimensions:", width, "x", height);
    
    // Create SVG element
    svg = d3.select("#map-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "width: 100%; height: auto;");
    
    // Add a "Back to US" button (hidden initially)
    d3.select("#map-container")
        .append("button")
        .attr("id", "back-button")
        .text("↩ Back to US Map")
        .style("position", "absolute")
        .style("top", "10px")
        .style("left", "10px")
        .style("display", "none")
        .style("padding", "8px 12px")
        .style("background-color", "#f8f9fa")
        .style("border", "1px solid #ced4da")
        .style("border-radius", "4px")
        .style("cursor", "pointer")
        .style("font-family", "sans-serif")
        .style("font-size", "14px")
        .style("z-index", "100")
        .on("click", resetMap)
        .on("mouseover", function() {
            d3.select(this).style("background-color", "#e9ecef");
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "#f8f9fa");
        });
    
    // Set up projection and path generator
    projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(1250);
    
    path = d3.geoPath().projection(projection);
    
    // Create main group for map elements
    g = svg.append("g");
    
    console.log("Loading TopoJSON data");
    
    // Load all necessary data
    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
        d3.json("us-counties-10m.json"),
        d3.json("county_counts.json")
    ]).then(([states, counties, eventCounts]) => {
        console.log("Data loaded successfully");
        
        usStatesData = states;
        usCountiesData = counties;
        countyEventCounts = eventCounts;
        
        // Draw the US states map with spikes
        drawStatesMap();
        addStateSpikes();
    }).catch(error => {
        console.error("Error loading map data:", error);
        d3.select("#map-container")
            .append("div")
            .style("color", "red")
            .style("text-align", "center")
            .style("padding", "20px")
            .html("<h3>Error loading map data</h3><p>" + error.message + "</p>" +
                  "<p>Make sure your TopoJSON files are accessible.</p>");
    });
}

// ========== Draw States Map ==========
function drawStatesMap() {
    console.log("Drawing states map");
    
    // Extract states features
    const states = topojson.feature(usStatesData, usStatesData.objects.states).features;
    
    // Create a tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "6px 10px")
        .style("pointer-events", "none")
        .style("font-family", "sans-serif")
        .style("font-size", "12px")
        .style("box-shadow", "0 0 5px rgba(0,0,0,0.1)");
    
    // Draw states
    g.selectAll("path.state")
        .data(states)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", "#ddd")
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // Highlight state on hover
            d3.select(this)
                .attr("fill", "#aaa");
            
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            tooltip.html(d.properties.name)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Remove highlight if not the active state
            if (this !== activeState) {
                d3.select(this)
                    .attr("fill", "#ddd");
            }
            
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(event, d) {
            console.log("State clicked:", d);
            // Zoom to the clicked state
            zoomToState(d, this);
        });
        
    console.log("States map drawn successfully");
}

// ========== Add State Spikes ==========
function addStateSpikes() {
    console.log("Adding spikes to map");
    
    // Helper function to create spike shape
    function spike(length) {
        const width = 5;
        //(length, width = 7) => 
        return `M${-width / 2},0L0,${-length}L${width / 2},0`
        //return `M0,0L0,${-length}L${length/10},0Z`; // Simple triangular spike
    }
    
    // Helper function to get centroid
    function centroid(feature) {
        const [x, y] = path.centroid(feature);
        return isNaN(x) || isNaN(y) ? [0, 0] : [x, y];
    }
    
    // Extract county features and create a map for lookup
    const counties = topojson.feature(usCountiesData, usCountiesData.objects.counties).features;
    const countyMap = new Map(counties.map(county => [county.id, county]));
    
    // Process the data to include geometry
    const data = countyEventCounts
        .filter(d => d.fips && d.count) // Ensure valid data
        .map(d => ({
            ...d,
            county: countyMap.get(d.fips)
        }))
        .filter(d => d.county) // Remove entries without matching geometry
        .sort((a, b) => d3.descending(a.count, b.count));
    
    // Construct the length scale
    const maxCount = d3.max(data, d => d.count);
    const length = d3.scaleLinear([0, maxCount], [0, 60]); // Adjust max spike height as needed
    
    // Create the legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("fill", "#777")
        .attr("transform", `translate(${svg.attr("width") - 120}, ${svg.attr("height") - 20})`)
        .attr("text-anchor", "middle")
        .style("font", "10px sans-serif");
    
    legend.selectAll("g")
        .data(length.ticks(4).slice(1))
        .join("g")
        .attr("transform", (d, i) => `translate(${20 * i},0)`)
        .call(g => {
            g.append("path")
                .attr("fill", "red")
                .attr("fill-opacity", 0.5)
                .attr("stroke", "red")
                .attr("stroke-width", 0.5)
                .attr("d", d => spike(length(d)));
                
            g.append("text")
                .attr("dy", "1em")
                .text(length.tickFormat(4, "s"));
        });
    
    // Add a spike for each county
    const format = d3.format(",.0f");
    g.append("g")
        .attr("class", "spikes")
        .attr("fill", "red")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "red")
        .attr("stroke-width", 0.5)
        .selectAll("path")
        .data(data)
        .join("path")
        .attr("transform", d => `translate(${centroid(d.county)})`)
        .attr("d", d => spike(length(d.count)))
        .append("title")
        .text(d => {
            const countyName = d.county.properties.name || "Unknown County";
            const state = usStatesData.objects.states.geometries.find(s => s.id === d.fips.substring(0, 2));
            const stateName = state ? state.properties.name : "Unknown State";
            return `${countyName}, ${stateName}\nEvents: ${format(d.count)}`;
        });
        
    console.log("Spikes added successfully");
}

// ========== Zoom to State ==========
function zoomToState(state, element) {
    console.log("Zooming to state:", state.properties.name, "ID:", state.id);
    
    // Hide all spikes before zoom
    g.select(".spikes").style("visibility", "hidden");
    
    // Clean up any existing county elements from previous state
    g.selectAll(".county").remove();
    g.selectAll(".county-spike").remove();
    
    // Set this state as active
    activeState = element;
    activeStateName = state.properties.name;
    
    // Get the bounding box of the state
    const bounds = path.bounds(state);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    
    // Calculate appropriate zoom scale with some padding
    const scale = 0.8 / Math.max(dx / svg.attr("width"), dy / svg.attr("height"));
    const translate = [svg.attr("width") / 2 - scale * x, svg.attr("height") / 2 - scale * y];
    
    // Apply the zoom transition
    g.transition()
        .duration(750)
        .attr("transform", `translate(${translate}) scale(${scale})`)
        .on("end", function() {
            // Draw counties and county-level spikes after zoom completes
            drawCountiesWithSpikes(state.id);
        });
    
    // Show the back button
    d3.select("#back-button")
        .style("display", "block");
    
    // Highlight the active state
    d3.selectAll(".state")
        .attr("fill", "#ddd");
    
    d3.select(activeState)
        .attr("fill", "#aaa");
}

// ========== Draw Counties With Spikes ==========
function drawCountiesWithSpikes(stateId) {
    console.log("Drawing counties with spikes for state ID:", stateId);

    // Clean up before drawing new counties
    g.selectAll(".county").remove();
    g.selectAll(".county-spike").remove();
    
    // Helper function for spike
    function spike(length) {
        const width = 3;
        //(length, width = 7) => 
        return `M${-width / 2},0L0,${-length}L${width / 2},0`
        //return `M0,0L0,${-length}L${length/10},0Z`; // Simple triangular spike
    }
    
    // Helper function to get centroid
    function centroid(feature) {
        const [x, y] = path.centroid(feature);
        return isNaN(x) || isNaN(y) ? [0, 0] : [x, y];
    }

    const countiesObject = usCountiesData.objects.counties;
    if (!countiesObject) return;

    const allCounties = topojson.feature(usCountiesData, countiesObject).features;
    const stateFIPS = String(stateId).padStart(2, '0');

    const counties = allCounties.filter(county => county.id?.startsWith(stateFIPS));
    console.log(`Found ${counties.length} counties for ${activeStateName}`);

    // Draw county boundaries
    g.selectAll(".county")
        .data(counties)
        .enter()
        .append("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", "transparent")
        .attr("stroke", "#555")
        .attr("stroke-width", 0.3);
    
    // Filter event counts for this state
    const stateEventData = countyEventCounts
        .filter(d => d.fips && d.fips.startsWith(stateFIPS))
        .map(d => {
            const county = counties.find(c => c.id === d.fips);
            return {
                ...d,
                county: county
            };
        })
        .filter(d => d.county);
    
    console.log(`Found ${stateEventData.length} counties with event data for ${activeStateName}`);
    
    // Scale for spike height
    const maxCount = d3.max(stateEventData, d => d.count) || 0;
    const length = d3.scaleLinear([0, maxCount], [0, 40]); // Smaller spikes at zoomed level
    
    // Add spikes for counties
    const format = d3.format(",.0f");
    g.selectAll(".county-spike")
        .data(stateEventData)
        .enter()
        .append("path")
        .attr("class", "county-spike")
        .attr("transform", d => `translate(${centroid(d.county)})`)
        .attr("d", d => spike(length(d.count)))
        .attr("fill", "red")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "red")
        .attr("stroke-width", 0.5)
        .append("title")
        .text(d => `${d.county.properties.name}, ${activeStateName}\nEvents: ${format(d.count)}`);

    legend.selectAll("g")
        .data(length.ticks(4).slice(1))
        .join("g")
        .attr("transform", (d, i) => `translate(${20 * i},0)`)
        .call(g => {
            g.append("path")
                .attr("fill", "red")
                .attr("fill-opacity", 0.5)
                .attr("stroke", "red")
                .attr("stroke-width", 0.5)
                .attr("d", d => spike(length(d)));
                
            g.append("text")
                .attr("dy", "1em")
                .text(length.tickFormat(4, "s"));
        });
}

// ========== Reset Map ==========
function resetMap() {
    console.log("Resetting map view");
    
    // Reset the transform
    g.transition()
        .duration(750)
        .attr("transform", "translate(0,0) scale(1)")
        .on("end", function() {
            // Show all spikes after zoom out completes
            g.select(".spikes").style("visibility", "visible");
        });
    
    // Reset active state
    activeState = null;
    
    // Hide back button
    d3.select("#back-button")
        .style("display", "none");
    
    // Reset state colors
    d3.selectAll(".state")
        .attr("fill", "#ddd");
    
    // Remove counties and county-level spikes
    g.selectAll(".county").remove();
    g.selectAll(".county-spike").remove();
}

//////////////////////////////////////////////////////////


// ========== Handle Temperature Unit Toggle ==========
function handleUnitToggle() {
    const selectedUnit = this.value;
    const activeState = document.querySelector(".state.active");
    if (activeState) {
        const stateName = activeState.__data__.properties.name.toUpperCase();
        drawStateTempChart(stateName, tempDataByState, selectedUnit);
    }
}
