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
Climate change is probably the biggest threat ever experienced by mankind. It refers to the long-term alteration of temperatures and weather patterns in a place. Due primarily to human activities, greenhouse gases such as methane and carbon dioxide are accumulating in the atmosphere and trapping the sun's heat causing the overall temperature to rise, a phenomenon known as global warming. In recent years, the effects of Climate change have become more and more visible as the average temperature of the planet went up by [1.2 °C](https://www.un.org/en/climatechange/what-is-climate-change) since the 1800s. As the Earth warms, it disrupts natural weather systems, contributing to more frequent and more intense extreme weather events such as heatwaves, hurricanes, floods, or droughts. Warmer temperatures can lead to more water vapor in the atmosphere, making storms more powerful. Even more so, it accelerates the melting of glaciers causing the sea level to rise and increasing the risk of coastal floodings. The increasing danger of this kind of events is a serious threat to our societies and to the safety of many populations. Even though it seems nearly impossible to revert the climate change as the economics and politics of our world stand now, we can at least try to understand and perdict better the changes that are happening. This will be the goal of our project as we will try to obtain a visualisation of the extreme environmental events that happened over the last years in the United States of America. 

### The Special Case of the USA
The United States is known for experiencing a high number of extreme weather events, not only due to its vast size but also because of its unique geographical and climatic conditions. We all have in our minds cases of extreme weather events happening in the united states such as the Katrina hurricane in 2004 or even this year, with the wild fires in California intensified by exceptionally [high winds](https://www.worldweatherattribution.org/climate-change-increased-the-likelihood-of-wildfire-disaster-in-highly-exposed-los-angeles-area/). Such events cost the lives of thousands of people and brought major damages to the regions they hit but we must not forget about the many smaller size events happening very frequently and bringing their own casualties. 
Among these, tornadoes are particularly frequent, making the U.S. the most tornado-prone country in the world with around 1,200 tornadoes occuring annually. The central area consisting a line between Texas and South Dakota is especially susceptible to tornadoes due to the collision of warm, moist air from the Gulf of Mexico with cool, dry air from Canada, creating the ideal conditions for powerful thunderstorms that can generate tornadoes. Although tornadoes also occur in other countries, none experience them as frequently as the U.S.

In addition to tornadoes, the United States is also highly susceptible to hurricanes, which are particularly common along the East coast. The Atlantic hurricane season runs from June to November, with states such as Florida, Texas, and Louisiana frequently bearing the brunt of these powerful storms. Hurricanes bring destructive winds, storm surges, and heavy rainfall, often leading to widespread flooding and infrastructure damage. The Gulf of Mexico’s warm waters and the Atlantic Ocean’s climatic patterns contribute to the formation of these intense cyclones.

Beyond tornadoes and hurricanes, the U.S. also faces other extreme weather phenomena, including blizzards, wildfires, droughts, and heatwaves. The northern and northeastern states, as well as the Midwest, regularly experience severe winter storms, which can cause heavy snowfall, icy conditions, and dangerously low temperatures. Meanwhile, the western states, especially California, are frequently impacted by wildfires, which are exacerbated by prolonged droughts and high temperatures. Heatwaves, particularly in the Southwest, pose significant risks, with states like Arizona and Nevada experiencing dangerously high temperatures during the summer months.

Although extreme weather events are not exclusive to the United States, few countries provide as comprehensive and long-term datasets on these phenomena. Therefore, our analysis and visualizations will primarily focus on the U.S., where reliable data allows for a more in-depth exploration of trends, patterns, and impacts of extreme weather events over time. 

### Research questions
1. How does climate change contribute to the increasing frequency of rare weather events in the USA?
2. What are the economic and human consequences of the growing occurrence of extreme weather events?
3. How can statistical analyses of past events help us understand their causes and improve forecasting?


## Dataset
To address our research question, we need relevant data. As previously mentioned, one reason for focusing on the USA is the availability of high-quality data on extreme weather events. Thanks to the National Oceanic and Atmospheric Administration (NOAA), we have access to the [Storm Events Database](https://www.ncdc.noaa.gov/stormevents/), which provides information on:

> - The occurrence of storms and other significant weather phenomena having sufficient intensity to cause loss of life, injuries, significant property damage, and/or disruption to commerce;
> - Rare, unusual, weather phenomena that generate media attention, such as snow flurries in South Florida or the San Diego coastal area; and
> - Other significant meteorological events, such as record maximum or minimum temperatures or precipitation that occur in connection with another event.

This database spans from January 1950 to November 2024, making it particularly valuable for analyzing the impact of climate change on the frequency of extreme weather events. However, it is important to note that "_due to changes in the data collection and processing procedures over time, there are unique periods of record available depending on the event type_." Specifically, as illustrated in the image below, only tornado events were recorded between January 1950 and January 1955. From January 1955 to January 1996, data collection expanded to include tornado, thunderstorm wind, and hail events. Since January 1996, the database has documented [48 types of events](https://www.ncdc.noaa.gov/stormevents/pd01016005curr.pdf).

<p align="center">
    <img src="Images/type_of_events.png" alt="screenshot" width="750">
</p>


## Exploratory Data Analysis
The exploratory data analysis can be found in this [notebook](https://github.com/com-480-data-visualization/com-480-project-ca_roille_aux_states/blob/master/EDA.ipynb). While we won't pass over all the details, some of the numbers are:
- 1937859 unique events
- N unique type of events such as Tornado, Hail, Thunderstorm Wind or Flood
- sjsjs
- sjsjsj
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
djdjdjdjdj

### That’s all for now—looking forward to more analyses and visualizations in Milestone 2!



