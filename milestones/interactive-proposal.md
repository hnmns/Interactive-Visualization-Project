# Riley Kouns

## Description

I want to map maritime shipping channels out of the Port of Duluth-Superior to other Great Lakes destinations. Specifically, I will focus on the biggest destinations for iron ore. Users will be able to select from a handful of steel-manufacturing destinations like Gary, Indiana. The direction of shipping will be indicated by animated lake freighter icons, and the number of trips in a year will be indicated by the literal number of icons moving along the shipping route.  I want to highlight the bottleneck that is the Soo Locks in Michigan, where freighters from Lake Superior must traverse to reach the rest of the Great Lakes. I might also add the quantities of ore shipped through piling icons with some sort of scale (probably size) to compare which destinations receive the most ore each year.

I will have to figure out a plausible range of years to cover based on which data sets merge well.

## Technical Plan re: Option A/B/C/D

Option C: Geospatial

This project is necessarily geospatial, with shipping routes being central to the story, so I will likely use MapLibreGL. I want to add the ability to zoom on the Soo Locks. I would like to make animations in D3 to indicate freighter direction and volume along shipping channels.

## Mockup

![mockup](/scratch/mockup.jpg)

## Data Sources



### Data Source 1: NEI Shipping Lane Shapefiles

URL: https://www.epa.gov/air-emissions-inventories/2014-national-emissions-inventory-nei-data


This provides Rail and Commercial Marine shipping channels


### Data Source 2: US Army Corps of Engineers WCUS Trips (2023)

URL: https://ndclibrary.sec.usace.army.mil/resource?title=2023%20WCUS%20Trips%20-%20All%20Regions%20&documentId=07ddf14b-1522-4c6f-d894-40cd74d58a7f

552672 Rows, 12 Columns

This contains Waterborne Commerce of the United States data for all domestic origin-destination pairs, including the Great Lakes. It contains trip count data for maritime freight out of Duluth.


### Data Source 3: USACE WCUS Cargo Report

URL: http://cwbi-ndc-nav.s3-website-us-east-1.amazonaws.com/files/wcsc/webpub/#/report-landing/year/2019/region/3/location/3924

48 Rows, 22 Columns (Times number of years observed ~5)

This is technically the same as the previous source, just from a different part of their data dashboard, so I will include it anyway for clarity. This contains the actual tonnage of iron ore shipments.



## Questions

None at the moment. I suppose I do not fully know D3's animation capabilities, but I will learn.