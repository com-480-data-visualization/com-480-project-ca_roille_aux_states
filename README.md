# Ça roille aux states - A data visualization project 🌪️🌀

<div align="center">

| Student's name | SCIPER  |  
| -------------- | ------  |  
| Timo Michoud   | 302039  |  
| Luc Harrison   | 315788  |  
| Corentin Genton| 301505  |  

</div>


## Problematic
### Climate Change Problem 
Climate change is the biggest threat ever experienced by mankind. It refers to the long-term alteration of temperatures and weather patterns and its effects have become more visible as the average temperature of the planet went up by [1.2 °C](https://www.un.org/en/climatechange/what-is-climate-change) since the 1800s. As the Earth warms, it disrupts natural weather systems, contributing to more frequent and extreme weather events. The increasing danger of these events is a serious threat to the safety of many populations. Although addressing climate change requires significant economic and political shifts, we can also focus on better understanding the changes already occurring. The goal of our project is to identify trends and visualize extreme weather events that have taken place, while also assessing their human and economic impacts.

### The Case of the USA
The United States experiences a high number of extreme weather events due to its size and diverse geographical and climatic conditions. From hurricanes to tornadoes, these events cause significant human and economic losses. Some, like the recent California wildfires intensified by [high winds](https://www.worldweatherattribution.org/climate-change-increased-the-likelihood-of-wildfire-disaster-in-highly-exposed-los-angeles-area/), leave lasting impacts on communities. The U.S. is also impacted by blizzards, wildfires or droughts. Understanding where these events occur most frequently and the underlying climatic conditions that contribute to them will be part of our analysis. Although extreme weather events happen worldwide, the U.S. provides some of the most comprehensive and long-term datasets on these phenomena. This allows us to explore trends and impacts in depth, identifying where extreme weather is most prevalent and the factors that drive these events.

### Research questions
1. How does climate change contribute to the increasing frequency of extreme weather events in the USA?
2. What are the economic and human consequences of the growing occurrence of extreme weather events?
3. How can statistical analyses of past extreme weather events help predict future occurrences ?

## Dataset
To address our research question, we need relevant data. As previously mentioned, one reason for focusing on the USA is the availability of high-quality data on extreme weather events. Thanks to the National Oceanic and Atmospheric Administration (NOAA), we have access to the [Storm Events Database](https://www.ncdc.noaa.gov/stormevents/), which provides information on:

> - The occurrence of storms and other significant weather phenomena having sufficient intensity to cause loss of life, injuries, significant property damage, and/or disruption to commerce;
> - Rare, unusual, weather phenomena that generate media attention, such as snow flurries in South Florida or the San Diego coastal area; and
> - Other significant meteorological events, such as record maximum or minimum temperatures or precipitation that occur in connection with another event.

This database spans from January 1950 to November 2024, making it particularly valuable for analyzing the impact of climate change on the frequency of extreme weather events. 


## Exploratory Data Analysis
The exploratory data analysis can be found in this [notebook](https://github.com/com-480-data-visualization/com-480-project-ca_roille_aux_states/blob/master/EDA.ipynb). While we won't pass over all the details, some of the numbers are:
- 1'941'100 unique events
- 48 unique type of events such as Tornado, Hail, Thunderstorm Wind or Flood
  
### Historical Data Collection Evolution

It is important to note that "_due to changes in the data collection and processing procedures over time_" from the NAOO, "_there are unique periods of record available depending on the event type_" in our dataset. Specifically, as illustrated in the image below, we have the following three distinct phases:

1. **1950-1954:** Only tornado events were recorded
2. **1955-1995:** Expanded to include tornados, thunderstorm wind, and hail
3. **1996-present:** Further expanded to include [48 different types of events](https://www.ncdc.noaa.gov/stormevents/pd01016005curr.pdf).

<p align="center">
    <img src="Images/type_of_events.png" alt="screenshot" width="750">
</p>

This explains the dramatic increase in recorded events after 1995, which reflects changes in data collection rather than necessarily an increase in severe weather.

### Seasonal Patterns

Our analysis reveals clear seasonal patterns, where we observe how certain event types vary throughout the year. For instance, thunderstorm-related events predominantly occur during summer months, while winter storms are concentrated in December through February. These temporal patterns provide critical insights into the seasonal vulnerability of different regions to specific hazards.

Do not hesitate to check our first analysis of this dataset directly on the notebook. 


## Related work
### Using Storm Events Database
Few studies have been conducted (or at least identified by us) to explore and visualize the Storm Events Database. We found two Kaggle Notebooks  ([first](https://www.kaggle.com/code/kerneler/starter-noaa-storm-events-database-ead6826c-e) and [second](https://www.kaggle.com/code/wumanandpat/exploration-of-storm-events-database)) that propose data pre-processing along with initial analyses and visualizations. Additionally, we identified a [website](https://www.arcgis.com/apps/dashboards/2f0a9f25eea3410ca0443bdce936f8e5) that provides a visualization based on the same dataset. However, this website offers limited customization options for visualizations and can become difficult to use when selecting multiple events. Another relevant resource is a [package](https://github.com/geanders/noaastormevents) available on GitHub, which allows for exploring the Storm Events Database with advanced visualizations using the R programming language.

### General weather visualizations
Weather and climate change events offer opportunities for highly interactive and impactful visualizations. These visual representations can serve as inspiration for our own project. Below are some compelling examples that could be reproduced or adapted. One classic approach in climate change visualization is illustrating temperature trends over time for a specific location—Switzerland, for instance. This method effectively conveys the evolution of a variable while incorporating geographic variation by displaying maps across different years or time periods ([source of image](https://www.meteoswiss.admin.ch/climate/climate-change.html)). 

<p align="center">
    <img src="Images/swiss_temperature.jpg" alt="screenshot" width="700">
</p>

Weather data is frequently visualized on an interactive digital globe, enabling users to explore different regions, zoom in on specific locations, and analyze parameters like temperature, wind speed, and precipitation. By rotating the globe and selecting specific areas, users can easily compare weather conditions across various locations and timeframes. This approach enhances accessibility and engagement, making it especially useful for meteorologists, researchers, and the general public interested in real-time weather patterns and climate trends. Although we don’t have global data in our dataset, we could adapt this type of visualization to suit our needs ([source of image](https://earth.nullschool.net/#current/wind/surface/level/orthographic=-97.87,29.90,371)). 

<p align="center">
    <img src="Images/earth.png" alt="screenshot" width="700">
</p>

The following two images illustrate different approaches to visualizing geographical data, particularly related to climate and environmental events. The first image presents a global map with data points indicating the number of people affected by flooding. This map-based visualization provides a clear spatial representation of the distribution and intensity of events across different regions, making it easier to identify geographical patterns and areas of high impact.

The second image, on the other hand, organizes data into a structured regional breakdown, displaying the number of recorded events by category—such as heatwaves, floods, droughts, and wildfires—using color-coded dots. This method allows for a more precise numerical comparison across regions while maintaining an intuitive visual representation.

Both approaches have their advantages: maps excel at showcasing spatial trends and regional disparities, while structured breakdowns enable detailed analysis of event frequency and type distribution. Depending on the objective, we might choose a map for a broad geographical overview or a categorized display for an in-depth examination of regional variations. ([source of first image]((https://global-flood-database.cloudtostreet.ai/)), [source of second image]((https://interactive.carbonbrief.org/attribution-studies/index.html))). 
<p align="center">
    <img src="Images/exposure-map.svg" alt="screenshot" width="700">
</p>

<p align="center">
    <img src="Images/region_dots.png" alt="screenshot" width="700">
</p>

### What unique contributions will we bring?
As we have observed, our dataset currently lacks comprehensive visual representations. Our objective is to create insightful and impactful visualizations that not only enhance the understanding of the data but also highlight meaningful connections with pressing global issues, such as climate change. By designing clear, engaging, and data-driven visuals, we aim to make complex information more accessible and actionable. These visualizations will help uncover trends, reveal correlations, and provide valuable insights that can contribute to informed discussions and decision-making.

### That’s all for now—looking forward to more analysis and visualizations in Milestone 2!



