// Main map visualization script
document.addEventListener('DOMContentLoaded', function() {
    console.log("Script loaded");
    // Sample state data with capitals and populations
    const stateDetails = {
        "Alabama": { capital: "Montgomery", population: "4.9 million" },
        "Alaska": { capital: "Juneau", population: "0.7 million" },
        "Arizona": { capital: "Phoenix", population: "7.3 million" },
        "Arkansas": { capital: "Little Rock", population: "3.0 million" },
        "California": { capital: "Sacramento", population: "39.5 million" },
        "Colorado": { capital: "Denver", population: "5.8 million" },
        "Connecticut": { capital: "Hartford", population: "3.6 million" },
        "Delaware": { capital: "Dover", population: "1.0 million" },
        "Florida": { capital: "Tallahassee", population: "21.5 million" },
        "Georgia": { capital: "Atlanta", population: "10.6 million" },
        "Hawaii": { capital: "Honolulu", population: "1.4 million" },
        "Idaho": { capital: "Boise", population: "1.8 million" },
        "Illinois": { capital: "Springfield", population: "12.7 million" },
        "Indiana": { capital: "Indianapolis", population: "6.7 million" },
        "Iowa": { capital: "Des Moines", population: "3.2 million" },
        "Kansas": { capital: "Topeka", population: "2.9 million" },
        "Kentucky": { capital: "Frankfort", population: "4.5 million" },
        "Louisiana": { capital: "Baton Rouge", population: "4.6 million" },
        "Maine": { capital: "Augusta", population: "1.3 million" },
        "Maryland": { capital: "Annapolis", population: "6.0 million" },
        "Massachusetts": { capital: "Boston", population: "6.9 million" },
        "Michigan": { capital: "Lansing", population: "10.0 million" },
        "Minnesota": { capital: "St. Paul", population: "5.6 million" },
        "Mississippi": { capital: "Jackson", population: "3.0 million" },
        "Missouri": { capital: "Jefferson City", population: "6.1 million" },
        "Montana": { capital: "Helena", population: "1.1 million" },
        "Nebraska": { capital: "Lincoln", population: "1.9 million" },
        "Nevada": { capital: "Carson City", population: "3.1 million" },
        "New Hampshire": { capital: "Concord", population: "1.4 million" },
        "New Jersey": { capital: "Trenton", population: "8.9 million" },
        "New Mexico": { capital: "Santa Fe", population: "2.1 million" },
        "New York": { capital: "Albany", population: "19.5 million" },
        "North Carolina": { capital: "Raleigh", population: "10.5 million" },
        "North Dakota": { capital: "Bismarck", population: "0.8 million" },
        "Ohio": { capital: "Columbus", population: "11.7 million" },
        "Oklahoma": { capital: "Oklahoma City", population: "4.0 million" },
        "Oregon": { capital: "Salem", population: "4.2 million" },
        "Pennsylvania": { capital: "Harrisburg", population: "12.8 million" },
        "Rhode Island": { capital: "Providence", population: "1.1 million" },
        "South Carolina": { capital: "Columbia", population: "5.1 million" },
        "South Dakota": { capital: "Pierre", population: "0.9 million" },
        "Tennessee": { capital: "Nashville", population: "6.9 million" },
        "Texas": { capital: "Austin", population: "29.0 million" },
        "Utah": { capital: "Salt Lake City", population: "3.2 million" },
        "Vermont": { capital: "Montpelier", population: "0.6 million" },
        "Virginia": { capital: "Richmond", population: "8.5 million" },
        "Washington": { capital: "Olympia", population: "7.6 million" },
        "West Virginia": { capital: "Charleston", population: "1.8 million" },
        "Wisconsin": { capital: "Madison", population: "5.8 million" },
        "Wyoming": { capital: "Cheyenne", population: "0.6 million" }
    };

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
    });


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

    function updateStateChart(stateName) {
        const chartData = eventDataByState[stateName];

        // Clear existing chart
        d3.select("#state-chart-container").html("");
        d3.select("#chart-title").text("");

        if (!chartData) {
            d3.select("#chart-title").text("No storm data available for " + stateName);
            return;
        }

        d3.select("#chart-title").text("Storm Events in " + stateName);

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
    
    // Check once on load (for elements that are already visible)
    checkScroll();
    
    // Force a check after a short delay (helps with initial rendering)
    setTimeout(checkScroll, 500);
});


document.getElementById("btn-states").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("btn-country").classList.remove("active");

    document.getElementById("map-container").style.display = "block";
    document.getElementById("state-info").style.display = "none";
    document.getElementById("state-chart-container").style.display = "block";
    document.getElementById("chart-title").style.display = "block";
    document.getElementById("country-view").style.display = "none";
});

document.getElementById("btn-country").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("btn-states").classList.remove("active");

    document.getElementById("map-container").style.display = "none";
    document.getElementById("state-chart-container").style.display = "none";
    document.getElementById("chart-title").style.display = "none";
    document.getElementById("country-view").style.display = "block";
});

