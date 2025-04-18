// Main map visualization script
document.addEventListener('DOMContentLoaded', function() {
    console.log("Script loaded");
    
    // Handle smooth scrolling from hero section
    document.querySelector('.scroll-indicator').addEventListener('click', function() {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    });
    
    // Sample state data with capitals and populations
    let stateDetails = {};
    d3.json("milestone2/state_data.json")
        .then(data => {
            stateDetails = data;
            console.log("State data loaded:", stateDetails);
    });

    let stateAnomaly = {};
    d3.json("milestone2/anomaly_by_state.json")
        .then(data => {
            stateAnomaly = data;
            console.log("State data loaded:", stateAnomaly);
    });

    // state data per year
    let eventDataByState = {}; // Global to hold the event counts per state
    let globalMax = 0;

    d3.json("milestone2/state_event_counts.json").then(data => {
        eventDataByState = data;
        console.log("Event data loaded:", eventDataByState);
        
        for (const state in eventDataByState) {
            const maxForState = d3.max(eventDataByState[state], d => d.count);
            if (maxForState > globalMax) globalMax = maxForState;
        }
    }).catch(error => {
        console.error("Error loading event data:", error);
        // Create fallback event data if needed
    });

    let tempDataByState = {}; // temperature data per state
    
    // Try to load temperature data, with fallback
    d3.json("milestone2/annual_avg_by_state.json")
        .then(data => {
            tempDataByState = data;
            console.log("Temperature data loaded:", tempDataByState);
    });

    const rgbColors = [
        [5, 48, 97], [6, 49, 98], [7, 51, 100], [8, 53, 102], [9, 55, 104],
        [11, 57, 106], [12, 59, 108], [13, 61, 110], [14, 63, 112], [15, 65, 114],
        [17, 67, 116], [18, 69, 118], [19, 71, 120], [20, 73, 121], [22, 75, 123],
        [23, 77, 125], [24, 79, 127], [25, 81, 129], [26, 82, 131], [28, 84, 133],
        [29, 86, 135], [30, 88, 137], [31, 90, 139], [32, 92, 141], [34, 94, 143],
        [35, 96, 145], [36, 98, 146], [37, 100, 148], [39, 102, 150], [40, 104, 152],
        [41, 106, 154], [42, 108, 156], [43, 110, 158], [45, 112, 160], [46, 113, 162],
        [47, 115, 164], [48, 117, 166], [49, 119, 168], [51, 121, 170], [52, 123, 171],
        [53, 125, 173], [54, 127, 175], [56, 129, 177], [57, 131, 179], [58, 133, 181],
        [59, 135, 183], [60, 137, 185], [62, 139, 187], [63, 141, 189], [64, 143, 191],
        [65, 145, 193], [67, 147, 195], [69, 148, 195], [71, 149, 196], [74, 150, 197],
        [76, 152, 197], [78, 153, 198], [81, 155, 199], [83, 156, 199], [86, 157, 200],
        [88, 159, 201], [90, 160, 202], [93, 161, 202],
        [95, 163, 203],
        [97, 164, 204],
        [100, 165, 204],
        [102, 166, 205],
        [105, 168, 206],
        [107, 169, 207],
        [109, 171, 207],
        [112, 172, 208],
        [114, 173, 209],
        [116, 175, 209],
        [119, 176, 210],
        [121, 177, 211],
        [124, 179, 211],
        [126, 180, 212],
        [128, 181, 213],
        [131, 183, 214],
        [133, 184, 214],
        [135, 185, 215],
        [138, 187, 216],
        [140, 188, 216],
        [143, 189, 217],
        [145, 191, 218],
        [147, 192, 219],
        [150, 193, 219],
        [152, 195, 220],
        [155, 196, 221],
        [157, 197, 221],
        [159, 198, 222],
        [162, 200, 223],
        [164, 201, 223],
        [166, 203, 224],
        [169, 204, 225],
        [171, 205, 226],
        [174, 207, 226],
        [176, 208, 227],
        [178, 209, 228],
        [181, 211, 228],
        [183, 212, 229],
        [185, 213, 230],
        [188, 214, 230],
        [190, 216, 231],
        [193, 217, 232],
        [195, 219, 233],
        [197, 220, 233],
        [200, 221, 234],
        [202, 223, 235],
        [204, 224, 235],
        [207, 225, 236],
        [209, 227, 237],
        [212, 228, 238],
        [214, 229, 238],
        [216, 230, 239],
        [219, 232, 240],
        [221, 233, 240],
        [224, 235, 241],
        [226, 236, 242],
        [228, 237, 243],
        [231, 239, 243],
        [233, 240, 244],
        [235, 241, 245],
        [238, 243, 245],
        [240, 244, 246],
        [243, 245, 247],
        [245, 246, 247],
        [247, 248, 248],
        [248, 248, 247],
        [248, 246, 245],
        [247, 243, 243],
        [247, 242, 241],
        [246, 240, 238],
        [246, 238, 236],
        [246, 235, 234],
        [245, 234, 232],
        [245, 232, 229],
        [244, 230, 227],
        [244, 227, 225],
        [243, 226, 223],
        [243, 224, 220],
        [242, 222, 218],
        [242, 220, 216],
        [241, 218, 214],
        [241, 216, 211],
        [240, 214, 209],
        [240, 211, 207],
        [240, 210, 205],
        [239, 208, 202],
        [239, 206, 200],
        [238, 203, 198],
        [238, 202, 196],
        [237, 200, 193],
        [237, 198, 191],
        [236, 195, 189],
        [236, 194, 187],
        [235, 192, 184],
        [235, 190, 182],
        [235, 187, 180],
        [234, 186, 178],
        [234, 184, 175],
        [233, 181, 173],
        [233, 179, 171],
        [232, 178, 169],
        [232, 176, 166],
        [231, 174, 164],
        [231, 172, 162],
        [230, 170, 160],
        [230, 168, 157],
        [230, 166, 155],
        [229, 163, 153],
        [229, 162, 151],
        [228, 160, 148],
        [228, 158, 146],
        [227, 156, 144],
        [227, 154, 142],
        [226, 152, 139],
        [226, 149, 137],
        [225, 147, 135],
        [225, 146, 133],
        [224, 144, 130],
        [224, 142, 128],
        [224, 140, 126],
        [223, 138, 124],
        [223, 135, 121],
        [222, 134, 119],
        [222, 132, 117],
        [221, 130, 115],
        [221, 128, 112],
        [220, 125, 110],
        [220, 124, 108],
        [219, 121, 106],
        [219, 120, 103],
        [219, 118, 101],
        [218, 115, 99],
        [218, 113, 97],
        [217, 112, 94],
        [217, 110, 92],
        [216, 108, 90],
        [216, 105, 88],
        [215, 104, 85],
        [215, 102, 83],
        [214, 100, 81],
        [214, 97, 79],
        [214, 96, 76],
        [211, 94, 76],
        [209, 92, 75],
        [207, 90, 74],
        [205, 88, 73],
        [203, 86, 72],
        [200, 84, 71],
        [198, 82, 70],
        [196, 80, 69],
        [194, 79, 68],
        [192, 77, 67],
        [190, 75, 67],
        [187, 73, 66],
        [185, 71, 65],
        [183, 69, 64],
        [181, 67, 63],
        [179, 65, 62],
        [177, 64, 61],
        [174, 62, 60],
        [172, 60, 59],
        [170, 58, 58],
        [168, 56, 58],
        [166, 54, 57],
        [163, 52, 56],
        [161, 50, 55],
        [159, 48, 54],
        [157, 47, 53],
        [155, 45, 52],
        [153, 43, 51],
        [150, 41, 50],
        [148, 39, 49],
        [146, 37, 49],
        [144, 35, 48],
        [142, 33, 47],
        [140, 32, 46],
        [137, 30, 45],
        [135, 28, 44],
        [133, 26, 43],
        [131, 24, 42],
        [129, 22, 41],
        [126, 20, 40],
        [124, 18, 40],
        [122, 16, 39],
        [120, 15, 38],
        [118, 13, 37],
        [116, 11, 36],
        [113, 9, 35],
        [111, 7, 34],
        [109, 5, 33],
        [107, 3, 32],
        [105, 1, 31],
        [103, 0, 31]
    ];

    const colorHexes = rgbColors.map(([r, g, b]) => d3.rgb(r, g, b).formatHex());

    // Create the SVG element - increase these values for a bigger map
    const width = 1200; // Increased from 960
    const height = 800; // Increased from 600
    const svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("margin", "0 auto"); // Center the SVG horizontally
    
    // Add a group element for the map
    const g = svg.append("g");
    
    // Define projection and path generator
    // Define projection and path generator
    const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1250); // Increased from 1000 to make states bigger
    
    const path = d3.geoPath()
        .projection(projection);
    
    // Load the TopoJSON data
    d3.json("us-states-10m.json")
        .then(function(us) {
            console.log("Data loaded successfully:", us);
            
            // Extract the states features
            const states = topojson.feature(us, us.objects.states).features;
            
            // Draw the states
            g.selectAll("path")
                .data(states)
                .enter()
                .append("path")
                .attr("class", "state")
                .attr("d", path)
                .on("click", function(event, d) {
                    // Remove active class from all states
                    d3.selectAll(".state").classed("active", false);
                    
                    // Add active class to clicked state
                    d3.select(this).classed("active", true);
                    
                    // Get state name
                    const stateName = d.properties.name || "Unknown State";
                    
                    // Update info panel
                    updateInfoPanel(stateName);
                    drawStateTempChart(stateName.toUpperCase(), tempDataByState);
                    updateStateChart(stateName.toUpperCase());

                    
                });
            
            // Add state borders
            g.append("path")
                .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
                .attr("fill", "none")
                .attr("stroke", "#fff")
                .attr("stroke-width", "0.5")
                .attr("d", path);

            // Add lightning flash effect on the map
            setupLightningEffect(svg);
        })
        .catch(function(error) {
            console.error("Error loading the map data:", error);
            document.getElementById("map-container").innerHTML = 
                "<p>Error loading map data. Please check console for details.</p>";
        });
        
    // Function to update the info panel
    function updateInfoPanel(stateName) {
        const infoPanel = document.getElementById("state-info");
        const stateNameElement = document.getElementById("state-name");
        const stateCapitalElement = document.getElementById("state-capital");
        const statePopulationElement = document.getElementById("state-population");
        
        // Get state details (capital and population)
        const details = stateDetails[stateName] || { capital: "Unknown", population: "Unknown" };
        
        // Update the info panel
        stateNameElement.textContent = stateName;
        stateCapitalElement.textContent = "Capital: " + details.capital;
        statePopulationElement.textContent = "Population: " + details.population;
        
        // Show the info panel
        infoPanel.style.display = "block";
    }
    
    // Function to create spike map
    // Add this function to your script.js file to create a state-level spike map

    function createStateSpikeMap() {
        console.log("Creating state spike map");
        
        // Define dimensions for the spike map
        const width = 975;
        const height = 610;
        
        // Create the SVG element for spike map
        const svg = d3.select("#spike-map-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "width: 100%; height: auto;");
        
        // Define projection for the US map
        const projection = d3.geoAlbersUsa()
            .translate([width / 2, height / 2])
            .scale(1250);
        
        // Define path generator
        const path = d3.geoPath()
            .projection(projection);
        
        // Function to create spike shape
        function spike(length, baseWidth = 3) {
            // Only show spikes above a minimum threshold
            if (length < 0.5) return "M0,0"; // Flat line for very small values
            
            // Use a more controlled width calculation
            const width = Math.max(1, Math.log(length) * baseWidth / 5);
            return `M${-width / 2},0L0,${-length}L${width / 2},0`;
        }

        
        // Load US state data and population data
        Promise.all([
            d3.json("us-states-10m.json"),
            d3.json("milestone2/state_data.json") // This contains your state population data
        ]).then(([us, stateDetails]) => {
            console.log("Data loaded for spike map:", us, stateDetails);
            
            // Extract states features
            const states = topojson.feature(us, us.objects.states).features;
            
            // Prepare data with population values and state geometries
            const data = states.map(state => {
                const stateName = state.properties.name;
                const details = stateDetails[stateName] || { population: "0" };
                // Parse population, removing commas
                const population = parseInt(details.population.replace(/,/g, ''), 10) || 0;
                
                return {
                    state,
                    stateName,
                    population
                };
            }).filter(d => d.population > 0);
            
            // Draw the nation background
            svg.append("path")
                .datum(topojson.feature(us, us.objects.nation))
                .attr("fill", "#ddd")
                .attr("d", path);
                
            // Draw state boundaries
            svg.append("path")
                .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
                .attr("fill", "none")
                .attr("stroke", "white")
                .attr("stroke-linejoin", "round")
                .attr("d", path);
            
            // Create a scale for spike height based on population
            const maxPopulation = d3.max(data, d => d.population);
            const length = d3.scaleLinear()
                .domain([0, maxPopulation])
                .range([0, 200]); // Maximum spike height
            
            // Create legend
            const legend = svg.append("g")
                .attr("fill", "#777")
                .attr("transform", "translate(886,592)")
                .attr("text-anchor", "middle")
                .style("font", "10px sans-serif")
                .selectAll()
                .data(length.ticks(4).slice(1))
                .join("g")
                .attr("transform", (d, i) => `translate(${20 * i},0)`);

            legend.append("path")
                .attr("fill", "#4CAF50")
                .attr("fill-opacity", 0.5)
                .attr("stroke", "#4CAF50")
                .attr("stroke-width", 0.5)
                .attr("d", d => spike(length(d)));

            legend.append("text")
                .attr("dy", "1em")
                .text(length.tickFormat(4, "s"));

            
            // Function to get state centroid
            
            function centroid(state) {
                const [x, y] = path.centroid(state);
                return isNaN(x) || isNaN(y) ? [0, 0] : [x, y];
            }
            /*
            function centroid(state) {
                const path = d3.geoPath();
                return state => path.centroid(state);
            }
            */
            
            // Format number for tooltips
            const format = d3.format(",.0f");
            
            // Create spikes for each state
            svg.append("g")
                .attr("fill", "#4CAF50")
                .attr("fill-opacity", 0.5)
                .attr("stroke", "#4CAF50")
                .attr("stroke-width", 0.8)
                .selectAll("path")
                .data(data)
                .join("path")
                .attr("transform", d => `translate(${centroid(d.state)})`)
                .attr("d", d => spike(length(d.population)))
                .append("title")
                .text(d => `${d.stateName}\nPopulation: ${format(d.population)}`);
                
        }).catch(error => {
            console.error("Error creating spike map:", error);
            document.getElementById("spike-map-container").innerHTML = 
                "<p>Error loading spike map data. Please check console for details.</p>";
        });
    }
    createStateSpikeMap();


    function createStateAnomalyMap() {
        console.log("Creating state anomaly map");
    
        const width = 975;
        const height = 610;
    
        const svg = d3.select("#anomaly-map-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "width: 100%; height: auto;");
    
        const projection = d3.geoAlbersUsa()
            .translate([width / 2, height / 2])
            .scale(1250);
    
        const path = d3.geoPath().projection(projection);
    
        Promise.all([
            d3.json("us-states-10m.json"),
            d3.json("milestone2/anomaly_by_state.json")
        ]).then(([us, stateAnomaly]) => {
            console.log("Data loaded:", us, stateAnomaly);
    
            const states = topojson.feature(us, us.objects.states).features;
    
            const data = states.map(state => {
                const stateName = state.properties.name;
                const anomalyStr = stateAnomaly[stateName]?.anomaly || "0";
                const anomaly = parseFloat(anomalyStr.replace(/,/g, "")) || 0;
                return { ...state, anomaly };
            });
    
            const maxAnomaly = d3.max(data, d => d.anomaly);
            const minAnomaly = d3.min(data, d => d.anomaly);
            const colorScale = d3.scaleSequential()
                .domain([minAnomaly, maxAnomaly])
                .interpolator(d3.scaleLinear()
                    .domain(d3.range(0, 1, 1 / colorHexes.length))
                    .range(colorHexes)
                    .interpolate(d3.interpolateRgb)
                );


            const color = d3.scaleSequential()
                .domain([0, maxAnomaly]) // [low anomaly, high anomaly]
                .interpolator(d3.interpolateReds)      // diverging color scale
                .clamp(true);
    
            svg.append("g")
                .selectAll("path")
                .data(data)
                .join("path")
                .attr("fill", d => colorScale(+d.anomaly))
                .attr("d", path)
                .append("title")
                .text(d => `${d.properties.name}\nAnomaly: ${d.anomaly.toFixed(2)}°`);
    
            // State boundaries
            svg.append("path")
                .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
                .attr("fill", "none")
                .attr("stroke", "#fff")
                .attr("stroke-linejoin", "round")
                .attr("d", path);
    
            // Legend
            const legendWidth = 300;
            const legendHeight = 10;
    
            const legendSvg = svg.append("g")
                .attr("transform", `translate(${width - legendWidth - 50}, ${height - 40})`);
    
            const legendScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([0, legendWidth]);
    
            const axis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickFormat(d => `${d.toFixed(1)}°`);
    
            // Gradient
            const defs = svg.append("defs");
            const linearGradient = defs.append("linearGradient")
                .attr("id", "legend-gradient");
    
            linearGradient.selectAll("stop")
                .data(d3.ticks(0, 1, 10))
                .join("stop")
                .attr("offset", d => `${d * 100}%`)
                .attr("stop-color", d => colorScale(colorScale.domain()[0] + d * (colorScale.domain()[1] - colorScale.domain()[0])));
    
            legendSvg.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legend-gradient)");
    
            legendSvg.append("g")
                .attr("transform", `translate(0, ${legendHeight})`)
                .call(axis);
    
        }).catch(error => {
            console.error("Error creating anomaly map:", error);
            document.getElementById("spike-map-container").innerHTML = 
                "<p>Error loading data. See console for details.</p>";
        });
    }
    createStateAnomalyMap();    

    function drawStateTempChart(stateName, tempDataByState, unit = "F") {
        // --- 1. Data Preparation ---
        const rawData = tempDataByState[stateName];
        const containerSelector = "#state-temp-chart-container";
        const container = d3.select(containerSelector);

        // --- 2. Clear Previous Chart ---
        container.html(""); // Clear previous SVG content

        // --- 3. Check for Valid Data ---
        if (!rawData || rawData.length === 0) {
            console.warn(`No temperature data found for state: ${stateName}`);
            container.append("p")
                .attr("class", "no-data-message")
                .text(`No temperature data available for ${stateName}.`);
            return; // Stop execution if no data
        }
        
        // Ensure data is properly formatted with numbers
        const tempData = rawData.map(d => {
            const year = typeof d.year === 'number' ? d.year : +d.year;
            const valueF = typeof d.value === 'number' ? d.value : +d.value;
            const value = unit === "C" ? (valueF - 32) * 5 / 9 : valueF;
            return { year, value };
        }).sort((a, b) => a.year - b.year);

        // --- 4. Chart Setup ---
        const width = 800;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 50, left: 60 }; // Increased bottom/left margin for labels

        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`) // Make it responsive (optional but good)
            .attr("style", "max-width: 100%; height: auto; margin: 0 auto; display: block;"); // Better responsive style

        // --- 5. Scales ---
        const x = d3.scaleLinear()
            // Use d3.extent which returns [min, max]
            .domain(d3.extent(tempData, d => d.year))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            // Pad the domain slightly based on data range
            .domain(d3.extent(tempData, d => d.value))
            .nice() // Adjust domain to nice round values
            .range([height - margin.bottom, margin.top]); // Y-axis is inverted in SVG

        // --- 6. Axes ---
        const xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(Math.min(tempData.length, 10))) // Format as integer, limit ticks
            .call(g => g.select(".domain").remove()) // Optional: remove axis line
            .call(g => g.selectAll(".tick line").attr("stroke-opacity", 0.2)); // Optional: lighter ticks

        const yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove()) // Optional: remove axis line
            .call(g => g.selectAll(".tick line").attr("stroke-opacity", 0.2)) // Optional: lighter ticks
            .call(g => g.append("text") // Y-axis label (moved here)
                .attr("x", -margin.left)
                .attr("y", margin.top - 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                //.text("↑ Average Temperature (°F)")); // Add label directly
                .text(unit === "C" ? "↑ Average Temperature (°C)" : "↑ Average Temperature (°F)"));


        svg.append("g").call(xAxis);
        svg.append("g").call(yAxis);

        // --- 7. Scatter Points ---
        svg.append("g") // Group for points
            .attr("class", "scatter-points")
            .selectAll(".dot") // Use class selector
            .data(tempData)
            .enter()
            .append("circle")
            .attr("class", "dot") // Assign class
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 3.5) // Slightly larger radius
            .attr("fill", "#d6112f")
            .attr("opacity", 0.8); // Slight transparency

        // --- 8. Smoothed Trend Line ---
        /*
        const trendLine = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.value))
            .curve(d3.curveNatural); // Natural smooth interpolation

        
        */
        const loess = d3.regressionLoess()
            .x(d => d.year)
            .y(d => d.value)
            .bandwidth(0.3); // Optional: adjust for smoothing

        const loessData = loess(tempData); // Compute regression
        console.log("LOESS function:", d3.regressionLoess);

        svg.append("path")
            .datum(loessData) // loessData is array of [x, y]
            .attr("fill", "none")
            .attr("stroke", "#2196F3")
            .attr("stroke-width", 2)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("class", "trend-line") // Optional class for CSS
            .attr("d", d3.line()
                .x(d => x(d[0])) // x = year
                .y(d => y(d[1])) // y = predicted value
            );


        // --- 9. Labels ---
        // X-axis Label
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom / 3) // Adjust position
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .style("font-size", "12px")
            .text("Year");

        // Chart Title (Optional)
        svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`Average Temperature Trend for ${stateName}`);


        // --- Optional: Add Tooltips ---
        const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "5px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px");

        


        svg.selectAll(".dot")
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                    .html(`Year: ${d.year}<br/>Temp: ${d.value.toFixed(1)}°${unit}`);
            d3.select(event.currentTarget).attr("r", 5).attr("opacity", 1); // Highlight point
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px") // Position tooltip near cursor
                    .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", (event) => {
            tooltip.style("visibility", "hidden");
            d3.select(event.currentTarget).attr("r", 3.5).attr("opacity", 0.8); // Restore point
        });
    }
    
    function updateStateChart(stateName) {
        const chartData = eventDataByState[stateName];

        // Clear existing chart
        d3.select("#state-chart-container").html("");
        d3.select("#chart-title").text("");

        if (!chartData) {
            d3.select("#chart-title").text("No storm data available for " + stateName);
            return;
        }

        d3.select("#chart-title").text("Informations about " + stateName);

        const width = 800;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };

        const svg = d3.select("#state-chart-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const x = d3.scaleBand()
            .domain(d3.range(1950,2025,1))//chartData.map(d => d.year))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, globalMax])
            .range([height - margin.bottom, margin.top])
            .nice();

        svg.append("g")
            .selectAll("rect")
            .data(chartData)
            .enter()
            .append("rect")
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.count))
            .attr("height", d => y(0) - y(d.count))
            .attr("width", x.bandwidth())
            .attr("fill", "#2196F3");

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickValues(d3.range(1950,2025,5)));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 5)
            .attr("text-anchor", "middle")
            .text("Year");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .text("Storm Count");
    }    
    
    // Click on map background to hide info panel
    svg.on("click", function(event) {
        if (event.target === this) {
            document.getElementById("state-info").style.display = "none";
            d3.selectAll(".state").classed("active", false);
        }
    });

    // Function to add lightning flash effect to match the video background
    function setupLightningEffect(svg) {
        // Create a full-map overlay for lightning
        const lightningOverlay = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "white")
            .attr("opacity", 0)
            .style("pointer-events", "none");
        
        // Function to create a lightning flash
        function createLightningFlash() {
            // Random timing for natural effect
            const randomDelay = Math.floor(Math.random() * 10000) + 5000; // 5-15s delay
            
            setTimeout(() => {
                // Flash intensity
                const flashIntensity = Math.random() * 0.3 + 0.1; // 0.1-0.4 opacity
                
                // Create the flash
                lightningOverlay
                    .attr("opacity", 0)
                    .transition()
                    .duration(50) // Quick flash up
                    .attr("opacity", flashIntensity)
                    .transition()
                    .duration(100)
                    .attr("opacity", flashIntensity/2)
                    .transition()
                    .duration(50)
                    .attr("opacity", flashIntensity*0.8)
                    .transition()
                    .duration(100)
                    .attr("opacity", 0)
                    .on("end", createLightningFlash); // Loop the effect
            }, randomDelay);
        }
        
        // Start the lightning effect
        createLightningFlash();
    }

    // Scroll reveal functionality
    const revealElements = document.querySelectorAll('.reveal-text');
    
    // Function to check if element is in viewport
    function checkScroll() {
        console.log("Checking scroll, found " + revealElements.length + " elements");
        revealElements.forEach(element => {
            // Get element position relative to viewport
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150; // How many pixels of the element should be visible
            
            // If element is in viewport
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('active');
                console.log("Element revealed", element);
            } else {
                element.classList.remove('active');
            }
        });
    }
    
    // Add event listener for scroll
    window.addEventListener('scroll', checkScroll);
    
    // Check once on load (for elements that are
    // Check once on load (for elements that are already visible)
    checkScroll();
    
    // Force a check after a short delay (helps with initial rendering)
    setTimeout(checkScroll, 500);
    
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const heroSection = document.querySelector('.hero-section');
        const heroContent = document.querySelector('.hero-content');
        
        // Only apply effects if we're near the hero section
        if (scrollPosition < window.innerHeight) {
            // Move background slightly slower than scroll for parallax
            document.querySelector('.hero-background').style.transform = 
                `translateY(${scrollPosition * 0.3}px)`;
            
            // Fade out content as user scrolls down
            heroContent.style.opacity = 1 - (scrollPosition / (window.innerHeight * 0.7));
        }
    });

    
});


document.getElementById("btn-states").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("btn-country").classList.remove("active");

    // Show state view elements with proper display properties
    document.getElementById("map-container").style.display = "flex";  // Change to flex
    document.getElementById("state-info").style.display = "none";
    document.getElementById("state-chart-container").style.display = "flex";  // Change to flex
    document.getElementById("state-temp-chart-container").style.display = "flex"; 
    document.getElementById("chart-title").style.display = "block";
    document.getElementById("country-view").style.display = "none";
});

document.getElementById("btn-country").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("btn-states").classList.remove("active");

    document.getElementById("map-container").style.display = "none";
    document.getElementById("state-chart-container").style.display = "none";
    document.getElementById("state-temp-chart-container").style.display = "none"; 
    document.getElementById("chart-title").style.display = "none";
    document.getElementById("country-view").style.display = "block";
});

// Global function to get the currently selected state name
function getCurrentStateName() {
    const activeState = document.querySelector('.state.active');
    if (activeState) {
        // This assumes you have state data accessible
        // You may need to adapt this based on how state data is stored
        return activeState.__data__.properties.name.toUpperCase();
    }
    return null;
}

// Temperature unit toggle handler
document.getElementById("unit-toggle").addEventListener("change", function () {
    const selectedUnit = this.value;
    const stateName = getCurrentStateName();
    if (stateName && window.tempDataByState) {
        drawStateTempChart(stateName, window.tempDataByState, selectedUnit);
    }
});

// Add CSS for the spike map container
document.head.insertAdjacentHTML('beforeend', `
    <style>
        #spike-map-container {
            flex: 0 0 65%;
            height: 500px;
            margin-right: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .state-boundary {
            pointer-events: none;
        }
        
        .spike-point {
            cursor: pointer;
        }
    </style>
`);