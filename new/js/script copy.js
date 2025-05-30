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
let typesByYearStates = {};
let statesFilter = [];
let eventsFilter = [];

// ========== DOM Ready ==========
document.addEventListener('DOMContentLoaded', function () {
    initApp();
    const dotNav = document.querySelector('.dot-navigation');
    const heroSection = document.getElementById('section-hero');
    const dots = document.querySelectorAll('.dot');

    if (dotNav && heroSection && dots.length > 0) {
        let lastScrollY = window.scrollY;
        let currentState = 'out'; // Track current fade state to prevent flicker

        const setTransitionDelays = (direction, action) => {
            const count = dots.length;
            dots.forEach((dot, i) => {
                let delay;
                if (direction === 'down') {
                    delay = action === 'in' ? i : (count - 1 - i);
                } else {
                    delay = action === 'in' ? (count - 1 - i) : i;
                }
                dot.style.transitionDelay = `${delay * 100}ms`;
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const scrollY = window.scrollY;
                    const direction = scrollY > lastScrollY ? 'down' : 'up';
                    lastScrollY = scrollY;

                    const isVisible = entry.isIntersecting;

                    if (isVisible && currentState !== 'out') {
                        setTransitionDelays(direction, 'out');
                        dotNav.classList.add('fade-out');
                        dotNav.classList.remove('fade-in');
                        currentState = 'out';
                    } else if (!isVisible && currentState !== 'in') {
                        setTransitionDelays(direction, 'in');
                        dotNav.classList.add('fade-in');
                        dotNav.classList.remove('fade-out');
                        currentState = 'in';
                    }
                });
            },
            { threshold: 0.6 }
        );

        observer.observe(heroSection);
    }
});

// ========== Init ==========
function initApp() {
    bindUIEvents();
    loadAllData().then(() => {
        createStateAnomalyMap();
        //createCountySpikeMap();
        toy_histo();
        setupCarousel();
        initializeFilters();
        updateFilters(); // Initial plot update
        initializeYearSlider();
        bindAdditionalUIEvents();
    });

}

// ========== UI Events ==========
function bindUIEvents() {
    // Handle smooth scrolling from hero section
    document.querySelector('.scroll-indicator').addEventListener('click', function() {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    });

    // Add carousel navigation events
    document.querySelector('.prev-arrow').addEventListener('click', () => navigateCarousel(-1));
    document.querySelector('.next-arrow').addEventListener('click', () => navigateCarousel(1));
    
    // Add dot navigation
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            goToSlide(parseInt(this.getAttribute('data-index')));
        });
    });

    bindAdditionalUIEvents()
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
            countyEventCounts, typesByYearStates 
        ] = await Promise.all([
            d3.json("../data/us-states-10m.json"),
            d3.json("../data/us-counties-10m.json"),
            // d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"), 
            d3.json("../milestone2/state_data.json"),
            d3.json("../data/state_anomalies.json"),
            d3.json("../milestone2/state_event_counts.json").then(data => {
                globalMax = Math.max(...Object.values(data).map(arr => d3.max(arr, d => d.count)));
                return data;
            }),
            d3.json("../milestone2/annual_avg_by_state.json"),
            d3.json("../data/county_counts.json"),
            d3.json("../milestone2/types_by_year_states_with_totals.json")
        ]);

        const years = [...new Set(typesByYearStates.map(d => d.Year))];
        statesFilter = [...new Set(typesByYearStates.map(d => d.State))];
        eventsFilter = [...new Set(typesByYearStates.map(d => d.Event_Category))];

        // Extract states and event types from the weatherData
        const firstYear = Math.min(...years);

        // Define these globally or pass them where needed
        console.log('statesFilters:', statesFilter);
        console.log('eventsFilters:', eventsFilter);

        // Now initialize the filters
        initializeFilters();

        console.log("All data loaded");
    } catch (error) {
        console.error("Error loading data:", error);
    }
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
        .domain([4, 0, -4])
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
            .style("fill", "black")  // Consistent with other maps
            .style("font-size", "14px")
            .style("font-family", "sans-serif");

        svg.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .selectAll("text")
            .style("fill", "black")
            .style("font-size", "14px")
            .style("font-family", "sans-serif");

        // Style axis lines consistently
        svg.selectAll(".axis path, .axis line")
            .style("stroke", "black")
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
            .style("fill", "black")
            .style("font-size", "14px")
            .style("font-family", "sans-serif");

        // Add note about baseline with consistent styling, positioned above legend
        svg.append("text")
            .attr("class", "note")
            .attr("x", width - 20)
            .attr("y", height - 50)
            .style("fill", "black")  // Consistent with legend text
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
            .style("stroke", "black")
            .style("stroke-width", 0.5);

        legendSvg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, ${legendHeight})`)  // Position below legend bar
            .call(axis)
            .selectAll("text")
            .style("fill", "black")
            .style("font-size", "12px")
            .style("font-family", "sans-serif");

        // Style legend axis
        legendSvg.selectAll(".axis path, .axis line")
            .style("stroke", "black")
            .style("stroke-width", "1");

    });
}



// ========== Create County Spike Map ==========
function createCountySpikeMap() {
    console.log("Creating county spike map");
    const width = 975;
    const height = 610;
    
    // Create SVG container
    const svg = d3.select("#plot4")
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

// ========== Count yearly Events plot =========
fetch('../milestone2/events_by_year.json')
  .then(response => response.json())
  .then(data => {
    const years = Object.keys(data).sort();
    const eventCounts  = years.map(year => data[year]);
    const yearsNum = years.map(y => +y);

    // Prepare traces for Plotly inside the fetch callback
    const trace = {
      x: yearsNum,
      y: eventCounts,
      mode: 'lines',
      type: 'scatter',
      name: 'Storm Events',
      line: { color: 'steelblue', width: 2 }
    };

    const layout = {
      xaxis: {
        title: 'Year',
        dtick: 5,
        tickangle: -45
      },
      yaxis: {
        title: 'Number of Events'
      },
      shapes: [
        {
          type: 'line',
          x0: 1955,
          x1: 1955,
          y0: 0,
          y1: Math.max(...eventCounts),
          line: {
            color: 'red',
            dash: 'dash'
          }
        },
        {
          type: 'line',
          x0: 1996,
          x1: 1996,
          y0: 0,
          y1: Math.max(...eventCounts),
          line: {
            color: 'red',
            dash: 'dash'
          }
        }
      ],
      annotations: [
        {
            x: 1952,
            y: Math.max(...eventCounts)*1.1,
            text: 'Phase 1:<br>Tornadoes only',
            showarrow: false,
            arrowhead: 1,     // Arrow style
            ax: 0,            // Horizontal offset from text to arrow base
            ay: -30           // Vertical offset: negative is arrow pointing down
        },
        {
            x: 1977,
            y: Math.max(...eventCounts)*1.1,
            text: 'Phase 2:<br>Thunderstorms, Wind & Hail',
            showarrow: false,
            arrowhead: 1,     // Arrow style
            ax: 0,            // Horizontal offset from text to arrow base
            ay: -30           // Vertical offset: negative is arrow pointing down
        },
        {
            x: 2010,
            y: Math.max(...eventCounts)*1.1,
            text: 'Phase 3:<br>48 event types',
            showarrow: false,
            arrowhead: 1,     // Arrow style
            ax: 0,            // Horizontal offset from text to arrow base
            ay: -30           // Vertical offset: negative is arrow pointing down
        }
      ],
      margin: { t: 50, b: 80, l: 60, r: 30 },
      width: 540,
      height: 360
    };
    

    // Render the plot inside div#plot1
    Plotly.newPlot('plot1', [trace], layout);
  })
  .catch(error => console.error('Error loading or plotting data:', error));



// ========== Event types bar plot =========

fetch('../milestone2/combined_proportion_count.json')
  .then(response => response.json())
  .then(data => {
    const years = Object.keys(data).sort();
    const eventTypes = Object.keys(data[years[0]]);
    const counts = {};
    const proportions = {};
    eventTypes.forEach(type => {
      proportions[type] = years.map(year => data[year][type].proportion);
      counts[type] = years.map(year => data[year][type].count);
    });

    const yearsNum = years.map(y => +y);

    const customColors = [
    '#ffff99', '#1f78b4', '#a6cee3', '#b2df8a', 
    '#33a02c', '#cab2d6', '#6a3d9a', '#ff7f00',
    '#fdbf6f', '#fb9a99', '#e31a1c'
    ];

    // Prepare traces for Plotly inside the fetch callback
    const traces = eventTypes.map((eventType,i) => ({
      x: yearsNum,
      y: proportions[eventType],
      name: eventType,
      type: 'bar',
      marker: { color: customColors[i % customColors.length] },
      hovertemplate:
        `<b>${eventType}</b><br>` +
        'Year: %{x}<br>' +
        'Count: %{customdata}<br>' +
        'Proportion: %{y:.2%}<extra></extra>',
      customdata: counts[eventType]
    }));

    const layout = {
      barmode: 'stack',
      hovermode: 'closest',
      xaxis: { 
        title: 'Year', 
        tickangle: -45,
        dtick: 5,               // Ticks every 5 years
        //tickvals: yearsNum,     // Ensure ticks correspond to the years
        tickformat: 'd'         // Format ticks as integer
      },
      yaxis: { title: 'Proportion of Total Events', tickformat: ',.0%' },
      legend: { title: { text: 'Event Type' } },
      margin: { t: 50, b: 100, l: 50, r: 50 },
      width: 540,
      height: 360
    };

    // Render the plot inside div#plot4
    Plotly.newPlot('plot2', traces, layout);
  })
  .catch(error => console.error('Error loading or plotting data:', error));


fetch('../milestone2/event_deaths_top_10.json') // Adjust path if needed
  .then(response => response.json())
  .then(data => {
    // Sort data descending by cost and take top 10
    const top10 = data
      .filter(d => d.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const eventTypes = top10.map(d => d.event_type);
    const deaths = top10.map(d => d.cost); // Convert to billions

    // Create a plasma-like gradient using Plotly colors
    const plasmaColors = [
      '#0d0887', '#46039f', '#7201a8', '#9c179e',
      '#bd3786', '#d8576b', '#ed7953', '#fb9f3a',
      '#fdca26', '#f0f921'
    ];

    const trace = {
      x: eventTypes,
      y: deaths,
      type: 'bar',
      marker: { color: plasmaColors },
      text: deaths.map(v => `${v.toFixed(1)}`),
      textposition: 'outside',
      hovertemplate:
        '<b>%{x}</b><br>' +
        'Death: %{y:.1f}<extra></extra>',
      cliponaxis: false,  // <-- prevents clipping at the top
    };

    const layout = {
      //title: 'Top 10 Most Damaging Storm Event Types (1950–2020)',
      xaxis: {
        title: 'Event Type',
        tickangle: -25,
        tickfont: {
            size: 10   // <-- reduce this number to make labels smaller
        }
      },
      yaxis: {
        title: 'Total Number of Death',
        gridcolor: 'rgba(0,0,0,0.1)',
        zeroline: false
      },
      margin: { t: 50, b: 100, l: 50, r: 50 },
      width: 540,
      height: 360,
      showlegend: false,
      bargap: 0.2
    };

    Plotly.newPlot('plot3', [trace], layout);
  })
  .catch(error => console.error('Error loading or plotting damage data:', error));

  fetch('../milestone2/event_costs_top_10.json') // Adjust path if needed
  .then(response => response.json())
  .then(data => {
    // Sort data descending by cost and take top 10
    const top10 = data
      .filter(d => d.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const eventTypes = top10.map(d => d.event_type);
    const costsBillions = top10.map(d => d.cost / 1e9); // Convert to billions

    // Create a plasma-like gradient using Plotly colors
    const plasmaColors = [
      '#0d0887', '#46039f', '#7201a8', '#9c179e',
      '#bd3786', '#d8576b', '#ed7953', '#fb9f3a',
      '#fdca26', '#f0f921'
    ];

    const trace = {
      x: eventTypes,
      y: costsBillions,
      type: 'bar',
      marker: { color: plasmaColors },
      text: costsBillions.map(v => `$${v.toFixed(1)}B`),
      textposition: 'outside',
      hovertemplate:
        '<b>%{x}</b><br>' +
        'Damage: $%{y:.1f}B<extra></extra>',
      cliponaxis: false,  // <-- prevents clipping at the top
    };

    const layout = {
      //title: 'Top 10 Most Damaging Storm Event Types (1950–2020)',
      xaxis: {
        title: 'Event Type',
        tickangle: -25,
        tickfont: {
            size: 10   // <-- reduce this number to make labels smaller
        }
      },
      yaxis: {
        title: 'Total Damage',
        gridcolor: 'rgba(0,0,0,0.1)',
        zeroline: false
      },
      margin: { t: 50, b: 100, l: 50, r: 50 },
      width: 540,
      height: 360,
      showlegend: false,
      bargap: 0.2
    };

    Plotly.newPlot('plot4', [trace], layout);
  })
  .catch(error => console.error('Error loading or plotting damage data:', error));


//////////////////////////////////////////////////////////


// Sample data - replace with your actual data
const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
];

const weatherEvents = [
    'Tornado', 'Thunderstorm Wind', 'Hail', 'Flash Flood', 'Flood', 'Winter Storm', 
    'Ice Storm', 'Blizzard', 'Heavy Snow', 'Heat', 'Drought', 'Wildfire', 'Hurricane', 
    'Lightning', 'High Wind', 'Extreme Cold', 'Avalanche', 'Dust Storm'
];

const metrics = [
    'Event Count', 'Total Deaths', 'Total Damage ($)'
];

// Initialize filters
function initializeFilters() {
    // Populate states filter
    const statesContainer = document.getElementById('statesFilter');
    // Clear old filters if any
    statesContainer.innerHTML = '';
    
    statesFilter.forEach((state, index) => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        checkboxItem.innerHTML = `
            <input type="checkbox" id="state_${index}" value="${state}" checked>
            <label for="state_${index}">${state}</label>
        `;
        statesContainer.appendChild(checkboxItem);
    });

    // Populate weather events filter
    const eventsContainer = document.getElementById('eventsFilter');
    eventsContainer.innerHTML = '';
    eventsFilter.forEach((event, index) => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        checkboxItem.innerHTML = `
            <input type="checkbox" id="event_${index}" value="${event}" checked>
            <label for="event_${index}">${event}</label>
        `;
        eventsContainer.appendChild(checkboxItem);
    });
}

// Get selected filters
function getSelectedFilters() {
    const selectedStates = [];
    const selectedEvents = [];

    document.querySelectorAll('#statesFilter input[type="checkbox"]:checked').forEach(cb => {
        selectedStates.push(cb.value);
    });

    document.querySelectorAll('#eventsFilter input[type="checkbox"]:checked').forEach(cb => {
        selectedEvents.push(cb.value);
    });


    return {
        states: selectedStates,
        events: selectedEvents,
        startYear: document.getElementById('startYear').value,
        endYear: document.getElementById('endYear').value,
        plotType: document.getElementById('plotType').value,
        metric: document.getElementById('metricType').value 
    };
}


function updateFilters() {
    // Add this at the beginning of updateFilters() function
    const yearSliderGroup = document.getElementById('yearSliderGroup');
    const mapStyleGroup = document.getElementById('mapStyleGroup');

    if (filters.plotType.includes('map')) {
        if (yearSliderGroup) yearSliderGroup.style.display = 'block';
        if (mapStyleGroup && filters.plotType === 'map_county') mapStyleGroup.style.display = 'block';
    } else {
        if (yearSliderGroup) yearSliderGroup.style.display = 'none';
        if (mapStyleGroup) mapStyleGroup.style.display = 'none';
    }
  const filters = getSelectedFilters();

  const start = parseInt(filters.startYear);
  const end = parseInt(filters.endYear);
  const selectedYears = [];
  for(let y = start; y <= end; y++) selectedYears.push(y);
  
  const selectedStates = filters.states;
  const selectedEvents = filters.events;

  // Assuming typesByYearStates is globally accessible
  // If not, pass it as a parameter or get it from closure

  const traces = selectedEvents.map(event => {
    const x = [];
    const y = [];

    selectedYears.forEach(year => {
      // Filter all matching entries for year, event, and selected states
      const filteredData = typesByYearStates.filter(d =>
        d.Year === year &&
        d.Event_Category === event &&
        selectedStates.includes(d.State)
      );

      // Aggregate the counts
      let valueKey;
      switch (filters.metric) {
        case 'death':
            valueKey = 'Total_death';
        break;
        case 'economic':
            valueKey = 'Total_damage';
        break;
        default:
            valueKey = 'Count';
        break;
        }

        const totalValue = filteredData.reduce((sum, d) => sum + (d[valueKey] || 0), 0);

        x.push(year);
        y.push(totalValue);
    });

    return {
      x,
      y,
      name: event,
      type: 'scatter',
      mode: 'lines+markers'
    };
  });

  Plotly.newPlot('plotPlaceholder', traces, {
    /*title: 'Weather Events Over Time',*/
    width: 800,
    height: 500,
    xaxis: { title: 'Year' },
    yaxis: {
        title: {
            count: 'Event Count',
            death: 'Total Deaths',
            economic: 'Total Damage ($)'
        }[filters.metric],
        tickformat: filters.plotType === 'proportion' ? ',.0%' : ''
    },
    legend: { title: { text: 'Event Type' } }
  });

  // Update info box
  const plotInfo = document.getElementById('plotInfo');
  plotInfo.textContent = `${filters.plotType.charAt(0).toUpperCase() + filters.plotType.slice(1)} | ${filters.states.length} States | ${filters.events.length} Events | ${filters.startYear}-${filters.endYear}`;
}

function setDefaultSelections() {
    // Select all states by default
    const stateCheckboxes = document.querySelectorAll('#statesFilter input[type="checkbox"]');
    stateCheckboxes.forEach(cb => cb.checked = true);
    
    // Select only Tornado by default
    const eventCheckboxes = document.querySelectorAll('#eventsFilter input[type="checkbox"]');
    eventCheckboxes.forEach(cb => {
        cb.checked = cb.value === 'Tornado';
    });
    
    // Select Event Count by default
    const metricCheckboxes = document.querySelectorAll('#metricsFilter input[type="checkbox"]');
    metricCheckboxes.forEach(cb => {
        cb.checked = cb.value === 'Event Count';
    });
}

function toggleFilter(filterName) {
    const content = document.getElementById(filterName + 'Content');
    const toggle = document.getElementById(filterName + 'Toggle');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
    } else {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        toggle.classList.remove('collapsed');
    }
}

function toggleSelectAll(filterType) {
    const button = event.target;
    const container = document.getElementById(filterType + 'Filter');
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    
    // Check if all are currently selected
    const allSelected = Array.from(checkboxes).every(cb => cb.checked);
    
    // Toggle all checkboxes
    checkboxes.forEach(cb => {
        cb.checked = !allSelected;
    });
    
    // Update button text
    button.textContent = allSelected ? 'Select All' : 'Select None';
}

function resetToDefaults() {
    // Reset year range
    document.getElementById('startYear').value = '1950';
    document.getElementById('endYear').value = '2024';
    
    // Reset plot type
    document.getElementById('plotType').value = 'map_county';
    
    // Reset selections
    setDefaultSelections();
    
    // Update select all buttons
    document.querySelectorAll('.weather-select-all-btn').forEach(btn => {
        btn.textContent = 'Select All';
    });
    
    // Clear plot
    document.getElementById('plotPlaceholder').innerHTML = 'Filters reset to defaults. Click "Update Plot" to display visualization.';
}

// ========== Additional Functions to Add to Your Existing Code ==========

// Add this function to initialize year slider for maps
function initializeYearSlider() {
    const yearSlider = document.getElementById('mapYearSlider');
    const yearDisplay = document.getElementById('mapYearDisplay');
    
    if (yearSlider && weatherEventsFullData.length > 0) {
        const years = [...new Set(weatherEventsFullData.map(d => d.Year))].sort();
        yearSlider.min = years[0];
        yearSlider.max = years[years.length - 1];
        yearSlider.value = years[years.length - 1]; // Default to latest year
        
        if (yearDisplay) {
            yearDisplay.textContent = yearSlider.value;
        }
        
        yearSlider.addEventListener('input', function() {
            if (yearDisplay) {
                yearDisplay.textContent = this.value;
            }
            updateFilters(); // Update the plot when year changes
        });
    }
}

// Modified loadAllData function - add this call after loading data
// Add this line in your existing loadAllData function after all data is loaded:
// initializeYearSlider();

// Enhanced createCountyMap function with spike/choropleth toggle
function createCountyMap(filters) {
    const data = processWeatherData(filters);
    const countyAggregated = aggregateByCounty(data, filters.metric);
    const useSpikes = document.getElementById('mapStyle')?.value === 'spikes';
    
    // Clear existing plot
    document.getElementById('plotPlaceholder').innerHTML = '';
    
    const width = 975;
    const height = 610;
    
    const svg = d3.select("#plotPlaceholder")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "width: 100%; height: auto;");
    
    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(1250);
    
    const path = d3.geoPath().projection(projection);
    
    const counties = topojson.feature(countyTopo, countyTopo.objects.counties).features;
    const states = topojson.feature(countyTopo, countyTopo.objects.states).features;
    
    // Create tooltip
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
    
    // Create base map
    svg.append("path")
        .datum(topojson.feature(countyTopo, countyTopo.objects.nation))
        .attr("fill", "#f0f0f0")
        .attr("d", path);
    
    if (useSpikes) {
        // Create spike map
        const values = Array.from(countyAggregated.values()).map(d => d.value);
        const maxValue = d3.max(values) || 1;
        const lengthScale = d3.scaleLinear([0, maxValue], [0, 50]);
        
        function spike(length) {
            const width = 3;
            return `M${-width / 2},0L0,${-length}L${width / 2},0`;
        }
        
        function centroid(feature) {
            const [x, y] = path.centroid(feature);
            return isNaN(x) || isNaN(y) ? [0, 0] : [x, y];
        }
        
        // Add spikes
        svg.append("g")
            .attr("fill", "red")
            .attr("fill-opacity", 0.7)
            .attr("stroke", "red")
            .attr("stroke-width", 0.5)
            .selectAll("path")
            .data(Array.from(countyAggregated.values()).filter(d => d.value > 0))
            .join("path")
            .attr("transform", d => {
                const county = counties.find(c => c.id === d.fips);
                return county ? `translate(${centroid(county)})` : `translate(0,0)`;
            })
            .attr("d", d => spike(lengthScale(d.value)))
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`<strong>${d.county}, ${d.state}</strong><br>${getMetricTitle(filters.metric)}: ${formatValue(d.value, filters.metric)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });
            
    } else {
        // Create choropleth map
        const values = Array.from(countyAggregated.values()).map(d => d.value);
        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(values)])
            .interpolator(d3.interpolateBlues);
        
        svg.append("g")
            .selectAll("path")
            .data(counties)
            .join("path")
            .attr("fill", d => {
                const countyData = countyAggregated.get(d.id);
                return countyData && countyData.value > 0 ? colorScale(countyData.value) : "#f0f0f0";
            })
            .attr("d", path)
            .on("mouseover", function(event, d) {
                const countyData = countyAggregated.get(d.id);
                if (countyData) {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`<strong>${countyData.county}, ${countyData.state}</strong><br>${getMetricTitle(filters.metric)}: ${formatValue(countyData.value, filters.metric)}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    
                    d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
                }
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
                d3.select(this).attr("stroke", null).attr("stroke-width", 0);
            });
    }
    
    // Add state boundaries
    svg.append("path")
        .datum(topojson.mesh(countyTopo, countyTopo.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .attr("stroke-linejoin", "round")
        .attr("d", path);
}

// Enhanced aggregateByCounty function to handle FIPS correctly
function aggregateByCounty(data, metric) {
    const countyMap = new Map();
    
    data.forEach(d => {
        // Ensure FIPS codes are properly formatted (5 digits total)
        const stateFips = d.State_FIPS.toString().padStart(2, '0');
        const countyFips = d.County_FIPS.toString().padStart(5, '0');
        const countyKey = countyFips; // Use full 5-digit FIPS
        const value = getMetricValue(d, metric);
        
        if (!countyMap.has(countyKey)) {
            countyMap.set(countyKey, {
                fips: countyKey,
                state: d.State,
                county: d.County,
                value: 0
            });
        }
        const existing = countyMap.get(countyKey);
        existing.value += value;
        countyMap.set(countyKey, existing);
    });
    
    return countyMap;
}

// Enhanced processWeatherData function
function processWeatherData(filters) {
    const { states, events, startYear, endYear, metric, cumulative, mapYear } = filters;
    
    // Filter the data
    let filteredData = weatherEventsFullData.filter(d => 
        states.includes(d.State) &&
        events.includes(d.Event_Category) &&
        d.Year >= parseInt(startYear) &&
        d.Year <= parseInt(endYear)
    );

    // For maps with year slider, filter to specific year or cumulative to that year
    if (mapYear !== undefined) {
        if (cumulative) {
            filteredData = filteredData.filter(d => d.Year <= parseInt(mapYear));
        } else {
            filteredData = filteredData.filter(d => d.Year === parseInt(mapYear));
        }
    }

    return filteredData;
}

// Enhanced getSelectedFilters function
function getSelectedFilters() {
    const selectedStates = [];
    const selectedEvents = [];

    document.querySelectorAll('#statesFilter input[type="checkbox"]:checked').forEach(cb => {
        selectedStates.push(cb.value);
    });

    document.querySelectorAll('#eventsFilter input[type="checkbox"]:checked').forEach(cb => {
        selectedEvents.push(cb.value);
    });

    const filters = {
        states: selectedStates,
        events: selectedEvents,
        startYear: document.getElementById('startYear')?.value || '1950',
        endYear: document.getElementById('endYear')?.value || '2024',
        plotType: document.getElementById('plotType')?.value || 'line',
        metric: document.getElementById('metricType')?.value || 'count',
        cumulative: document.getElementById('cumulativeFilter')?.checked || false
    };
    
    // Add map year for maps with year slider
    if (filters.plotType.includes('map')) {
        filters.mapYear = document.getElementById('mapYearSlider')?.value;
    }
    
    return filters;
}

// Enhanced createHistogram function for stacked bars by event type
function createHistogram(filters) {
    const data = processWeatherData(filters);
    const { events, startYear, endYear, metric, cumulative } = filters;
    
    // Group by year and event
    const yearEventMap = new Map();
    
    data.forEach(d => {
        const key = `${d.Year}_${d.Event_Category}`;
        const value = getMetricValue(d, metric);
        
        if (!yearEventMap.has(key)) {
            yearEventMap.set(key, 0);
        }
        yearEventMap.set(key, yearEventMap.get(key) + value);
    });
    
    // Create traces for each event type
    const traces = events.map(event => {
        const x = [];
        const y = [];
        let cumulativeSum = 0;
        
        for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
            const key = `${year}_${event}`;
            const value = yearEventMap.get(key) || 0;
            
            if (cumulative) {
                cumulativeSum += value;
                y.push(cumulativeSum);
            } else {
                y.push(value);
            }
            x.push(year);
        }
        
        return {
            x,
            y,
            name: event,
            type: 'bar'
        };
    });
    
    const layout = {
        barmode: 'stack',
        xaxis: { title: 'Year' },
        yaxis: {
            title: getMetricTitle(metric, cumulative)
        },
        legend: { title: { text: 'Event Type' } },
        width: 800,
        height: 500
    };
    
    Plotly.newPlot('plotPlaceholder', traces, layout);
}

// Add event listeners for new controls
function bindAdditionalUIEvents() {
    // Map style toggle
    const mapStyleSelect = document.getElementById('mapStyle');
    if (mapStyleSelect) {
        mapStyleSelect.addEventListener('change', updateFilters);
    }
    
    // Cumulative checkbox
    const cumulativeCheckbox = document.getElementById('cumulativeFilter');
    if (cumulativeCheckbox) {
        cumulativeCheckbox.addEventListener('change', updateFilters);
    }
    
    // Metric type selector
    const metricSelect = document.getElementById('metricType');
    if (metricSelect) {
        metricSelect.addEventListener('change', updateFilters);
    }
}
