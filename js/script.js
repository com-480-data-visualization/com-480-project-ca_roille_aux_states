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
const totalSlides = 2;
let weatherEventsFullData = {};
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
        let currentState = 'out'; 

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
        temporal_hist();
        createStateAnomalyMapPlotly();
        setupCarousel();
        initializeFilters();
        updateFilters(); 
        initializeYearSlider();
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
            countyEventCounts, weatherEventsFullData 
        ] = await Promise.all([
            d3.json("/data/us-states-10m.json"),
            d3.json("/data/us-counties-10m.json"),
            d3.json("/data/state_data.json"),
            d3.json("/data/state_anomalies.json"),
            d3.json("/data/state_event_counts.json").then(data => {
                globalMax = Math.max(...Object.values(data).map(arr => d3.max(arr, d => d.count)));
                return data;
            }),
            d3.json("/data/annual_avg_by_state.json"),
            d3.json("/data/county_counts.json"),
            d3.json("/data/weather_events_full_information.json")
        ]);

        const years = [...new Set(weatherEventsFullData.map(d => d.Year))];
        statesFilter = [...new Set(weatherEventsFullData.map(d => d.State))];
        eventsFilter = [...new Set(weatherEventsFullData.map(d => d.Event_Category))];

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

function stateNameToCode(name) {
    const states = {
        "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
        "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
        "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
        "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
        "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
        "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
        "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
        "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
        "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
        "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
        "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
        "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
        "Wisconsin": "WI", "Wyoming": "WY"
    };
    return states[name];
}


function createStateAnomalyMapPlotly() {
    console.log("Creating state anomaly map with Plotly");

    // Prepare data arrays
    const states = Object.keys(stateAnomaly);
    const anomalies = [];
    const stateCodes = [];

    for (const [stateName, data] of Object.entries(stateAnomaly)) {
        const value = parseFloat(data.anomaly.replace(/,/g, ""));
        if (!isNaN(value)) {
            const code = stateNameToCode(stateName);
            if (code) {
                anomalies.push(value);
                stateCodes.push(code);
            }
        }
    }

    const trace = {
        type: "choropleth",
        locationmode: "USA-states",
        locations: stateCodes,
        z: anomalies,
        colorscale: "RdBu",
        zmin: -5.5,
        zmax: 5.5,
        colorbar: {
            title: "Anomaly (°)",
            tickvals: [-4, 0, 4],
            ticktext: ["-4°", "0°", "°"]
        },
        marker: {
            line: {
                color: "white",
                width: 1
            }
        }
    };

    const layout = {
        geo: {
            scope: "usa",
            projection: {
                type: "albers usa"
            },
            showlakes: true,
            lakecolor: "rgb(255, 255, 255)"
        },
        margin: { t: 20, b: 20, l: 20, r: 20 },
        autosize: true
    };

    Plotly.newPlot("anomaly-map-container", [trace], layout, { responsive: true });
}


// ==============================================
function temporal_hist() {
    fetch("../data/data.json")
        .then(response => response.json())
        .then(raw => {
            // Transform the nested object into a flat array
            const fullData = Object.entries(raw.data).map(([year, d]) => ({
                year: +String(year).slice(0, 4),
                anomaly: +d.anomaly
            }));

            // Prepare data for Plotly
            const years = fullData.map(d => d.year);
            const anomalies = fullData.map(d => d.anomaly);
            
            // Create color array based on anomaly values
            const colors = anomalies.map(anomaly => {
                const normalized = Math.max(0, Math.min(1, (anomaly + 2) / 4));
                return normalized;
            });

            // Prepare trace for Plotly
            const trace = {
                x: years,
                y: anomalies,
                type: 'bar',
                name: 'Temperature Anomaly',
                marker: {
                    color: colors,
                    colorscale: [
                        [0, 'rgb(33, 102, 172)'],      // Dark red (hot)
                        [0.25, 'rgb(103, 169, 207)'],  // Light red
                        [0.5, 'rgb(247, 247, 247)'],  // White (neutral)
                        [0.75, 'rgb(239, 138, 98)'], // Light blue
                        [1, 'rgb(178, 24, 43)']      // Dark blue (cold)
                    ],
                    colorbar: {
                        tickvals: [0, 0.25, 0.5, 0.75, 1],
                        ticktext: ['-2.0°F', '-1.0°F', '0.0°F', '+1.0°F', '+2.0°F'],
                        x: 1.02,  
                        len: 0.6,          
                        thickness: 15,     
                        xpad: 5   
                    },
                    line: {
                        color: 'white',
                        width: 0.5
                    }
                },
                hovertemplate: '<b>Year: %{x}</b><br>Anomaly: %{y:.2f}°F<extra></extra>'
            };

            const layout = {
                xaxis: {
                    title: 'Year',
                    dtick: 10,
                    tickangle: 0,
                    showgrid: true,
                    gridcolor: 'rgba(128, 128, 128, 0.2)',
                    gridwidth: 1
                },
                yaxis: {
                    title: 'Temperature Anomaly (°F)',
                    tickformat: '+.1f',
                    showgrid: true,
                    gridcolor: 'rgba(128, 128, 128, 0.2)',
                    gridwidth: 1,
                    range: [-2.5, 2.5],
                    zeroline: true,
                    zerolinecolor: 'rgb(51, 51, 51)',
                    zerolinewidth: 2
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
                margin: { t: 30, b: 50, l: 70, r: 90 }, 
                autosize: true,
                annotations: [
                    {
                        x: 1.1, 
                        y: 0.02,
                        xref: 'paper',
                        yref: 'paper',
                        text: '(relative to 1961-1990 average)',
                        showarrow: false,
                        font: { size: 12, color: 'black' },
                        xanchor: 'right',
                        yanchor: 'bottom'
                    }
                ],
                font: {
                    family: 'sans-serif',
                    size: 14,
                    color: 'black'
                }
            };

            
            Plotly.newPlot('histo-map-container', [trace], layout);
        })
        .catch(error => console.error('Error loading or plotting data:', error));
}

// ========== Count yearly Events plot =========
fetch('../milestone2/events_by_year.json')
  .then(response => response.json())
  .then(data => {
    const years = Object.keys(data).sort();
    const eventCounts  = years.map(year => data[year]);
    const yearsNum = years.map(y => +y);

    // Prepare traces for Plotly 
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
            arrowhead: 1,     
            ax: 0,            
            ay: -30           
        },
        {
            x: 1977,
            y: Math.max(...eventCounts)*1.1,
            text: 'Phase 2:<br>Thunderstorms, Wind & Hail',
            showarrow: false,
            arrowhead: 1,     
            ax: 0,            
            ay: -30           
        },
        {
            x: 2010,
            y: Math.max(...eventCounts)*1.1,
            text: 'Phase 3:<br>48 event types',
            showarrow: false,
            arrowhead: 1,     
            ax: 0,            
            ay: -30           
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
        dtick: 5,               
        tickformat: 'd'         
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


fetch('../milestone2/event_deaths_top_10.json') 
  .then(response => response.json())
  .then(data => {
    // Sort data descending by cost and take top 10
    const top10 = data
      .filter(d => d.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const eventTypes = top10.map(d => d.event_type);
    const deaths = top10.map(d => d.cost);

    // Create a plasma-like gradient using Plotly colors
    const plasmaColors = [
      '#0d0887', '#46039f', '#7201a8', '#9c179e',
      '#bd3786', '#d8576b', '#ed7953', '#fb9f3a',
      '#fdca26', '#f0f921'
    ];

    const trace = {
      x: eventTypes,
      y: deaths.map(v => Math.round(v)),
      type: 'bar',
      marker: { color: plasmaColors },
      text: deaths.map(v => `${v.toFixed(0)}`),
      textposition: 'outside',
      hovertemplate:
        '<b>%{x}</b><br>' +
        'Death: %{y:.0f}<extra></extra>',
      cliponaxis: false,  
    };

    const layout = {
      xaxis: {
        title: 'Event Type',
        tickangle: -25,
        tickfont: {
            size: 10   
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

  fetch('../milestone2/event_costs_top_10.json') 
  .then(response => response.json())
  .then(data => {
    // Sort data descending by cost and take top 10
    const top10 = data
      .filter(d => d.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const eventTypes = top10.map(d => d.event_type);
    const costsBillions = top10.map(d => d.cost / 1e9); 

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
      cliponaxis: false,  
    };

    const layout = {
      xaxis: {
        title: 'Event Type',
        tickangle: -25,
        tickfont: {
            size: 10   
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


// ========== Cusomizable plot =========

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

    const startYear = document.getElementById('startYear').value;
    const endYear = document.getElementById('endYear').value;
    

    return {
        states: selectedStates,
        events: selectedEvents,
        startYear: startYear,
        endYear: endYear,
        plotType: document.getElementById('plotType').value,
        metric: document.getElementById('metricType').value 
    };
}


function updateFilters() {
    const filters = getSelectedFilters();
    const yearSliderGroup = document.getElementById('yearSliderGroup');
    const mapStyleGroup = document.getElementById('mapStyleGroup');

    if (filters.plotType.includes('map')) {
        if (yearSliderGroup) yearSliderGroup.style.display = 'block';
        if (mapStyleGroup && filters.plotType === 'map_county') mapStyleGroup.style.display = 'block';
    } else {
        if (yearSliderGroup) yearSliderGroup.style.display = 'none';
        if (mapStyleGroup) mapStyleGroup.style.display = 'none';
    }

    const start = parseInt(filters.startYear);
    const end = parseInt(filters.endYear);
    if (start < 1950 || end > 2024) {
        alert('Data available only during the 1950 to 2024 period. Please Change your variables.')
        throw new Error('invalid year selection')
    }
    else if (start > end) {
        alert('Start year cannot be greater than end year. Please Change your variables.');
        throw new Error('Invalid year range');
    }
    const selectedYears = [];
    for(let y = start; y <= end; y++) selectedYears.push(y);
    
    const selectedStates = filters.states;
    const selectedEvents = filters.events;

    const plotType = filters.plotType;
    let traces = [];

    if (plotType === 'pie') {
        // Aggregate total counts for each selected event
        const eventCounts = selectedEvents.map(event => {
            let total = 0;

            selectedYears.forEach(year => {
                const filteredData = weatherEventsFullData.filter(d =>
                    d.Year === year &&
                    d.Event_Category === event &&
                    selectedStates.includes(d.State)
                );

                let valueKey = 'count';
                if (filters.metric === 'death') valueKey = 'Total_death';
                else if (filters.metric === 'economic') valueKey = 'Total_damage';

                total += filteredData.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
            });

            return { event, total };
        }).filter(d => d.total > 0); 

        traces.push({
            type: 'pie',
            labels: eventCounts.map(d => d.event),
            values: eventCounts.map(d => d.total),
            textinfo: 'label+percent',
            hoverinfo: 'label+value',
            name: 'Event Proportions'
        });
        console.log('Pie eventCounts:', eventCounts);
    } else {
        traces = selectedEvents.map(event => {
            const x = [];
            const y = [];

            selectedYears.forEach(year => {
            // Filter all matching entries for year, event, and selected states
            const filteredData = weatherEventsFullData.filter(d =>
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
                    valueKey = 'count';
                break;
                }

                const totalValue = filteredData.reduce((sum, d) => sum + (d[valueKey] || 0), 0);

                x.push(year);
                y.push(totalValue);
            });

            const trace = {
                x,
                y,
                name: event
            };

            switch (plotType) {
                case 'line':
                    trace.type = 'scatter';
                    trace.mode = 'lines+markers';
                    break;
                case 'bar':
                    trace.type = 'bar';
                    break;
            }

            return trace;
        });
    }
    const layout = {
        width: 800,
        height: 500,
        legend: { title: { text: 'Event Type' } }
    };

    if (plotType !== 'pie') {
        layout.xaxis = { title: 'Year' };
        layout.yaxis = {
            title: {
                count: 'Event Count',
                death: 'Total Deaths',
                economic: 'Total Damage ($)'
            }[filters.metric],
            tickformat: filters.plotType === 'proportion' ? ',.0%' : ''
        };
        if (plotType === 'bar') layout.barmode = 'stack';
    }

    Plotly.newPlot('plotPlaceholder', traces, layout);

    
    console.log('Filters:', filters);

  
}

function setDefaultSelections() {
    // Select all states by default
    const stateCheckboxes = document.querySelectorAll('#statesFilter input[type="checkbox"]');
    stateCheckboxes.forEach(cb => cb.checked = cb.value === 'ALABAMA');
    
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
function createBarPlot(filters) {
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

