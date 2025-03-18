# Ca Roille aux States - A Data Disualization Project 🌪️🌀

<div align="center">

| Student's name | SCIPER | 
| -------------- | ------ |
| Timo Michoud   | 302039 |
| Luc Harrison   | 315788 |
| Corentin Genton| 301505 |

</div>


<!---
[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)
-->
## Milestone 1 (21st March, 5pm)
<!---
**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.
-->

### Problematic

Climate change is probably the biggest threat ever experience by the humankind. It refers to the long-term alteration of temperature and typical weather patterns in a place. Driven primarily by human activities, particularly the burning of fossil fuels, deforestation, and industrial processes, it leads to an increase in greenhouse gases such as carbon dioxide in the atmosphere. This traps heat and raises global temperatures, a phenomenon known as global warming. As the Earth warms, it disrupts natural weather systems, contributing to more frequent and intense extreme weather events. This includes heatwaves, hurricanes, floods, and droughts. Warmer temperatures can lead to more water vapor in the atmosphere, making storms more powerful. Sea level rise, caused by melting glaciers and thermal expansion, further exacerbates the risk of coastal flooding. The increasing frequency of these extreme events poses significant threats to ecosystems, communities, and economies worldwide. 

---

The United States is known for experiencing a high number of extreme weather events, not only due to its vast size but also because of its unique geographical and climatic conditions. Among these, tornadoes are particularly frequent, making the U.S. the most tornado-prone country in the world. On average, around 1,200 tornadoes occur annually, with most forming in Tornado Alley—a region covering parts of Texas, Oklahoma, Kansas, Nebraska, South Dakota, Iowa, and Missouri. This area is especially susceptible due to the collision of warm, moist air from the Gulf of Mexico with cool, dry air from Canada, creating the ideal conditions for powerful supercell thunderstorms that can generate tornadoes. Although tornadoes also occur in countries like Canada, Argentina, Bangladesh, and Australia, none experience them as frequently as the U.S.

In addition to tornadoes, the United States is also highly susceptible to hurricanes, which are particularly common along the Atlantic and Gulf coasts. The Atlantic hurricane season runs from June to November, with states such as Florida, Texas, and Louisiana frequently bearing the brunt of these powerful storms. Hurricanes bring destructive winds, storm surges, and heavy rainfall, often leading to widespread flooding and infrastructure damage. The Gulf of Mexico’s warm waters and the Atlantic Ocean’s climatic patterns contribute to the formation of these intense cyclones.

Beyond tornadoes and hurricanes, the U.S. also faces other extreme weather phenomena, including blizzards, wildfires, droughts, and heatwaves. The northern and northeastern states, as well as the Midwest, regularly experience severe winter storms, which can cause heavy snowfall, icy conditions, and dangerously low temperatures. Meanwhile, the western states, especially California, are frequently impacted by wildfires, which are exacerbated by prolonged droughts and high temperatures. Heatwaves, particularly in the Southwest, pose significant risks, with states like Arizona and Nevada experiencing dangerously high temperatures during the summer months.

Although extreme weather events are not exclusive to the United States, few countries provide as comprehensive and long-term datasets on these phenomena. Therefore, our analysis and visualizations will primarily focus on the U.S., where reliable data allows for a more in-depth exploration of trends, patterns, and impacts of extreme weather events over time. 

---

1. How does climate change contribute to the increasing frequency of rare weather events in the USA?
2. What are the economic and human consequences of the growing occurrence of extreme weather events?
3. How can statistical analyses of past events help us understand their causes and improve forecasting?

### Dataset
To answer our problematic we will need
For this project we will use the Storm Events Database from the National Oceanic and Atmospheric Administration (NOAA). The Storm Events Database contains the records used to create the official NOAA Storm Data publication, documenting:
- The occurrence of storms and other significant weather phenomena having sufficient intensity to cause loss of life, injuries, significant property damage, and/or disruption to commerce;
- Rare, unusual, weather phenomena that generate media attention, such as snow flurries in South Florida or the San Diego coastal area; and
- Other significant meteorological events, such as record maximum or minimum temperatures or precipitation that occur in connection with another event.
https://www.ncdc.noaa.gov/stormevents/

The database currently contains data from January 1950 to November 2024, as entered by NOAA's National Weather Service (NWS). Due to changes in the data collection and processing procedures over time, there are unique periods of record available depending on the event type. NCEI has performed data reformatting and standardization of event types but has not changed any data values for locations, fatalities, injuries, damage, narratives and any other event specific information. Please refer to the Database Details page for more information.

<p align="center">
    <img src="Images/type_of_events.png" alt="screenshot" width="700">
</p>
As we can see in the image above, the following events were recorded:
1. Tornado: From 1950 through 1954, only tornado events were recorded.

2. Tornado, Thunderstorm Wind and Hail: From 1955 through 1992, only tornado, thunderstorm wind and hail events were keyed from the paper publications into digital data. From 1993 to 1995, only tornado, thunderstorm wind and hail events have been extracted from the Unformatted Text Files.

3. All Event Types (48 from Directive 10-1605): From 1996 to present, 48 event types are recorded as defined in NWS Directive 10-1605.

### Exploratory Data Analysis

The exploratory data analysis can be found in this notebook (add link to notebook). While we won't pass over all the details, some of the numbers are:
- 1937859 unique events
- N unique type of events such as Tornado, Hail, Thunderstorm Wind or Flood
-  


### Related work

We have identified a [website](https://www.arcgis.com/apps/dashboards/2f0a9f25eea3410ca0443bdce936f8e5) that features a visualization using the same dataset as ours.
However, it does not offer a lot of possibilities in terms of visualization. Furthermore, it can quickly become unusable when selecting many events. One nice thing is that it offers some more informations about each events. 

While searching for visualizations related to weather events, we came across the following ones that caught our attention:

<p align="center">
    <img src="Images/swiss_temperature.jpg" alt="screenshot" width="700">
</p>
A compelling way to illustrate the evolution of a variable like temperature, while also accounting for geographic variation, is to visualize the map across different years or time periods. [Source](https://www.meteoswiss.admin.ch/climate/climate-change.html)
---
<p align="center">
    <img src="Images/exposure-map.svg" alt="screenshot" width="700">
</p>
---
<p align="center">
    <img src="Images/earth.png" alt="screenshot" width="700">
</p>
---
<p align="center">
    <img src="Images/region_dots.png" alt="screenshot" width="700">
</p>


[Source](https://global-flood-database.cloudtostreet.ai/)
[Source](https://earth.nullschool.net/#current/wind/surface/level/orthographic=-97.87,29.90,371)
[Source](https://interactive.carbonbrief.org/attribution-studies/index.html)
---





<!---
> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.
-->

<!---

## Milestone 2 (18th April, 5pm)

**10% of the final grade**


## Milestone 3 (30th May, 5pm)

**80% of the final grade**

-->



