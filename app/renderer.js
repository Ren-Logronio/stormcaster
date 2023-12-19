
const { dialog, BrowserView } = require('@electron/remote');
const fs = require('fs');
const dfd = require('danfojs');
const uuid = require('uuid');
const DataTable = require('datatables.net-dt')
const Plotly = require('plotly.js-dist');
const sk = require('scikitjs');
const leaflet = require('leaflet'); require('./src/scripts/leaflet-heat.js');
const { RandomForestClassifier, RandomForestRegression } = require('ml-random-forest');
const regression = require('ml-regression');
const SimpleLinearRegression = regression.SLR;
const PolynomialRegression = regression.PolynomialRegression; 
const csv = require('csv-parser');
const DecisionTree = require('decision-tree');
const lodash = require('lodash');
const jsonfile = require('jsonfile');
// const tf = require('@tensorflow/tfjs-node');

const fakeLoadTime = 0.001;

const heatMapLayer = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 3,
    minZoom: 3,
    edgeBufferTiles: 5,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const stormPathMapLayer = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 3,
    edgeBufferTiles: 5,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const stormGenesisMapLayer = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 3,
    edgeBufferTiles: 5,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const individualStormPathMapLayer = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 3,
    edgeBufferTiles: 5,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

mapHook.individualStormPathMapDivision = document.createElement("div");
mapHook.individualStormPathMapDivision.classList.add("map");
mapHook.individualStormPathMap = leaflet.map(mapHook.individualStormPathMapDivision);
mapHook.stormPathByGroupMapDivision = document.createElement("div");
mapHook.stormPathByGroupMapDivision.classList.add("map");
mapHook.stormPathByGroupMap = leaflet.map(mapHook.stormPathByGroupMapDivision);
mapHook.stormGenesisMapDivision = document.createElement("div");
mapHook.stormGenesisMapDivision.classList.add("map");
mapHook.stormGenesisMap = leaflet.map(mapHook.stormGenesisMapDivision);
mapHook.heatMapDivision = document.createElement("div");
mapHook.heatMapDivision.classList.add("map");
mapHook.heatMap = leaflet.map(mapHook.heatMapDivision, { zoomControl: false });
mapHook.maps.push(mapHook.heatMap);
mapHook.maps.push(mapHook.individualStormPathMap);
mapHook.maps.push(mapHook.stormPathByGroupMap);
mapHook.maps.push(mapHook.stormGenesisMap);
individualStormPathMapLayer.addTo(mapHook.individualStormPathMap);
stormPathMapLayer.addTo(mapHook.stormPathByGroupMap);
stormGenesisMapLayer.addTo(mapHook.stormGenesisMap);
heatMapLayer.addTo(mapHook.heatMap);

const openFileDialog = () => {
    if(conditionHook.isFileDialogOpen) return;
    const options = {
        title: 'Select CSV File',
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    };
    conditionHook.isFileDialogOpen = true;

    // Showing the file dialog
    dialog.showOpenDialog(options).then(result => {
        conditionHook.isFileDialogOpen = false;
        if (!result.canceled) {
            const filePath = result.filePaths[0];
            // Do something with the selected file path, e.g., read the file
            openCSVFile(filePath)
        }
    }).catch(err => {
        elementHook.errorText = err.stack;
    });
}

const openCSVFile = (filePath) => {
    // JUMP TO 2ND (CURRATE) SLIDE
    jumpSlide(2);
    // A LOT OF CODE YOU DO NOTE NEED TO KNOW
    conditionHook = { ...conditionHook, isFileLoaded: true }
    elementHook.nextSlidebutton.classList.add('disabled');
    elementHook.previousSlidebutton.classList.add('disabled');
    elementHook.dropBox.classList.add('disabled');
    conditionHook.filePath = filePath;
    // A LOT OF CODE YOU DO NOTE NEED TO KNOW
    dfd.readCSV(filePath).then(async (df) => {
        
        // WAIT FOR THE TRANSITION
        await new Promise(resolve => setTimeout(resolve, 2000));

        // CURRATE STAGE
        elementHook.currationText.innerHTML = "Removing NaN Values...";
        await new Promise(resolve => setTimeout(resolve, fakeLoadTime * 1000));
            // DATA CLEANSING
            replaceDataFrameValues('NA', 0, df);
            df.fillNa({ value: 0 }, inplace=true);
            df.dropNa({axis: 0, inplace: true});
            // HOOKING DATAFRAME GLOBALLY
            dataFrameHook = {...dataFrameHook, df: df,};

        // DESCRIBE STAGE
        elementHook.currationText.innerHTML = "Creating Tables and Graphs...";
        await new Promise(resolve => setTimeout(resolve, fakeLoadTime * 1000));
            // GENERATING DESCIPRTIVE ANALYSIS
            await generateDescriptives(df);
            dataFrameHook = {...dataFrameHook, describe: df.describe(), types: df.ctypes,};

        // PREDICTIVE STAGE
        elementHook.currationText.innerHTML = "Training Models...";
        await new Promise(resolve => setTimeout(resolve, fakeLoadTime * 1000));
            // GENERATING PREDICTIVE ANALYSIS
            await generatePredictives(df);
            // dataFrameHook = {...dataFrameHook, describe: df.describe(), types: df.ctypes,};

        // TRANSITION TO DESCRIBE
        jumpSlide(3);
        setTimeout(function () {
            mapHook.individualStormPathMap.invalidateSize(true);
        }, 1000);
        elementHook.nextSlidebutton.classList.remove('disabled');
    }).catch(err => {
        conditionHook.isFileLoaded = false;
        conditionHook = {...conditionHook, currateError: true};
        elementHook.previousSlidebutton.classList.remove('disabled');
        elementHook.loadingIcon.classList.add('d-none');
        elementHook.errorIcon.classList.remove('d-none');
        elementHook.currationText.innerHTML = 'Failed to fully process';
        elementHook.errorText.innerHTML = err.stack.replace(/\n/g, '<br>');
    });
}

const generateDescriptives = async (df) => {
     // DESCRIBE
     {
        const { table, id } = plotTable(df.describe());
        elementHook.describeTable.innerHTML = "";
        elementHook.describeTable.appendChild(table);
        new DataTable(`#${id}`, {
            searching: false,
            paging: false,
            info: false
        });
    }
    // TYPES
    {
        const { table, id } = plotTable(df.ctypes);
        elementHook.typesTable.innerHTML = "";
        elementHook.typesTable.appendChild(table);
        new DataTable(`#${id}`, {
            searching: false,
            paging: false,
            info: false
        });
    }
    // NUMBER OF STORMS BY STATUS
    {
        // elementHook.numberOfStormsContainer
        var dfGroupedByStatus = df.groupby(['STATUS']);
        var data = {
            labels: [],
            values: [],
        };
        Object.entries(dfGroupedByStatus.colDict).forEach(function ([key, value]) {
            var uniqueValues = new Set();
            result = value['ID'].map(item => {
                if (!uniqueValues.has(item)) {
                    uniqueValues.add(item);
                    return item;
                    }
                return null; // return null for duplicate values
            });
            result = result.filter(item => item !== null);
            data.labels.push(key);
            data.values.push(result.length);
        });
        const sortedData = data.labels.map((label, index) => ({
            label,
            value: data.values[index]
        })).sort((a, b) => a.value - b.value);
        const trace = {
            x: sortedData.map(item => item.label),
            y: sortedData.map(item => item.value),
            type: 'bar',
            marker: {
              color: 'blue' // You can customize the color if needed
            }
        };
        const layout = {
            xaxis: {
              title: 'Status'
            },
            yaxis: {
              title: 'Number of Storms'
            }
        };
        const plotData = [trace];
        Plotly.newPlot(elementHook.numberOfStormsStatusContainer, plotData, layout);

    }
    {
        const dfWithModifiedType = df.asType("CATEGORY","string");
        const modifiedDfGroupedByCategory = dfWithModifiedType.groupby(['CATEGORY']);
        var data = {
            labels: [],
            values: [],
        };
        Object.entries(modifiedDfGroupedByCategory.colDict).forEach(function ([key, value]) {
            var uniqueValues = new Set();
            result = value['ID'].map(item => {
                if (!uniqueValues.has(item)) {
                    uniqueValues.add(item);
                    return item;
                    }
                return null; // return null for duplicate values
            });
            result = result.filter(item => item !== null);
            if(key != '0') {
                data.labels.push(key.toString());
                data.values.push(result.length);
            }
        });
        const sortedData = data.labels.map((label, index) => ({
            label,
            value: data.values[index]
        })).sort((a, b) => a.value - b.value);
        const trace = {
            x: sortedData.map(item => item.label),
            y: sortedData.map(item => item.value),
            type: 'bar',
            marker: {
              color: 'blue' // You can customize the color if needed
            }
        };
        console.log(sortedData);
        const layout = {
            xaxis: {
              title: 'Category',
            },
            yaxis: {
              title: 'Number of Storms'
            }
        };
        const plotData = [trace];
        Plotly.newPlot(elementHook.numberOfStormsCategoryContainer, plotData, layout);
    }
    // HurrSeasonalityByYear
    {
        const dfGroupedByCategory = df.groupby(['YEAR']);
        var data = {
            labels: [],
            values: [],
        };
        Object.entries(dfGroupedByCategory.colDict).forEach(function ([key, value]) {
            var uniqueValues = new Set();
            result = value['ID'].map(item => {
                if (!uniqueValues.has(item)) {
                    uniqueValues.add(item);
                    return item;
                    }
                return null; // return null for duplicate values
            });
            result = result.filter(item => item !== null);
            if(key != '0') {
                data.labels.push(key);
                data.values.push(result.length);
            }
        });
        /*
        const sortedData = data.labels.map((label, index) => ({
            label,
            value: data.values[index]
        })).sort((a, b) => a.value - b.value);
        */
        const trace = {
            x: data.labels.map(String),
            y: data.values,
            type: 'bar',
            marker: {
              color: 'blue' // You can customize the color if needed
            }
        };
        const layout = {
            xaxis: {
              title: 'Year',
            },
            yaxis: {
              title: 'Number of Storms'
            }
        };
        const plotData = [trace];
        Plotly.newPlot(elementHook.numberOfStormsYearContainer, plotData, layout);
    }
    // BY MONTH
    {
        const dfGroupedByCategory = df.groupby(['MONTH']);
        var data = {
            labels: [],
            values: [],
        };
        Object.entries(dfGroupedByCategory.colDict).forEach(function ([key, value]) {
            var uniqueValues = new Set();
            result = value['ID'].map(item => {
                if (!uniqueValues.has(item)) {
                    uniqueValues.add(item);
                    return item;
                    }
                return null; // return null for duplicate values
            });
            result = result.filter(item => item !== null);
            if(key != '0') {
                data.labels.push(new Date(Date.UTC(2000, key - 1, 1)).toLocaleString('en-US', { month: 'long' }));
                data.values.push(result.length);
            }
        });
        const trace = {
            x: data.labels,
            y: data.values,
            type: 'bar',
            marker: {
              color: 'blue' // You can customize the color if needed
            }
        };
        const layout = {
            xaxis: {
              title: 'Month'
            },
            yaxis: {
              title: 'Number of Storms'
            }
        };
        const plotData = [trace];
        Plotly.newPlot(elementHook.numberOfStormsMonthContainer, plotData, layout);
    }
    // HurrCyclicality
    {
        const dfGroupedByCategory = df.groupby(['YEAR']);
        var data = {
            labels: [],
            values: [],
            movingAverage: [],
        };
        Object.entries(dfGroupedByCategory.colDict).forEach(function ([key, value]) {
            var uniqueValues = new Set();
            result = value['ID'].map(item => {
                if (!uniqueValues.has(item)) {
                    uniqueValues.add(item);
                    return item;
                    }
                return null; // return null for duplicate values
            });
            result = result.filter(item => item !== null);
            if(key != '0') {
                data.labels.push(key);
                data.values.push(result.length);
            }
        });
        for (let i = 0; i < data.values.length; i++) {
            let sum = 0;
            let count = 0;
        
            for (let j = i - 2; j <= i + 2; j++) {
                if (j >= 0 && j < data.values.length) {
                    sum += data.values[j];
                    count++;
                }
            }
        
            const movingAvg = sum / count;
            data.movingAverage.push(movingAvg);
        }
        const trace = {
            x: data.labels.map(String),
            y: data.values,
            type: 'line',
            name: 'Number of Storms',
            marker: {
              color: 'blue' 
            }
        };
        const movingAvgTrace = {
            x: data.labels.map(String),
            y: data.movingAverage,
            type: 'line',
            name: 'Moving Average',
            marker: {
                color: 'red'
            }
        };
        const layout = {
            xaxis: {
              title: 'Year',
            },
            yaxis: {
              title: 'Number of Storms'
            }
        };
        const plotData = [trace, movingAvgTrace];
        Plotly.newPlot(elementHook.cyclicalityContainer, plotData, layout);
    }
    // Heat Map 
    {
        const generalLatitudeMean = df['LAT'].mean();
        const generalLongitudeMean = df['LONG'].mean();
        var heatMapData = [];
        var steps = 0;
        df.$data.forEach((entry) => {
            steps += 1;
            if(steps % 2 !== 0 && steps % 3 !== 0) {
                conditionHook.n = conditionHook.n ? conditionHook.n + 1 : 1;
                const latitude = entry[df.$columns.indexOf('LAT')];
                const longitude = entry[df.$columns.indexOf('LONG')];
                const tropicalStormDiameter = entry[df.$columns.indexOf('TROPICALSTORM_FORCE_DIAMETER')];
                const hurricaneDiameter = entry[df.$columns.indexOf('HURRICANE_FORCE_DIAMETER')];
                const generalDiameter = tropicalStormDiameter > 0 ? tropicalStormDiameter : hurricaneDiameter;
                heatMapData.push([latitude, longitude, generalDiameter * 0.01]);
            }
        });

        mapHook.heatMap.touchZoom.disable();
        mapHook.heatMap.doubleClickZoom.disable();
        mapHook.heatMap.scrollWheelZoom.disable();
        mapHook.heatMap.boxZoom.disable();
        mapHook.heatMap.keyboard.disable();
        mapHook.heatMap.setView([generalLatitudeMean, generalLongitudeMean], 3);

        setTimeout(function () {
            mapHook.heatMap.invalidateSize(true);
            setTimeout(function () {
                leaflet.heatLayer(heatMapData, {radius: 10}).addTo(mapHook.heatMap);
            }, 5000);
        }, 1500);
    }
    // Storm Genesis
    {
        const generalLatitudeMean = df['LAT'].mean();
        const generalLongitudeMean = df['LONG'].mean();
        var uniqueSet = new Set();
        const data = df.$data;
        data.map(item => {
            if (!uniqueSet.has(item[0])) {
                uniqueSet.add(item[0]);
                return item;
            }
            return null;
        }).filter(item => item !== null).forEach(item => {
            const latitude = item[df.$columns.indexOf('LAT')];
            const longitude = item[df.$columns.indexOf('LONG')];
            leaflet.circleMarker([latitude, longitude], {
                radius: 1,
                color: 'red',
                fill: true,
                fillColor: 'red',
                fillOpacity: 1
            }).addTo(mapHook.stormGenesisMap)
        });
        mapHook.stormGenesisMap.setView([generalLatitudeMean, generalLongitudeMean], 3);
        setTimeout(function () {
            mapHook.stormGenesisMap.invalidateSize(true);
        }, 1500);
    }
    // STORM PATH
    {
        const iDs = df['ID'].$data;
        
        var uniqueValues = new Set();
        result = iDs.map(item => {
            if (!uniqueValues.has(item)) {
                uniqueValues.add(item);
                return item;
                }
            return null; // return null for duplicate values
        });
        result = result.filter(item => item !== null);
        result.forEach(id => {
            const optionElement = document.createElement('option');
            optionElement.value = id;
            if(result.indexOf(id) == 0) {
                console.log(id);
                optionElement.selected = true;
                elementHook.individualStormPathDatalistInput.value = id;
                generateIndividualStormPath(id, false);
            }
            elementHook.individualStormPathDatalist.appendChild(optionElement);
        })
        elementHook.individualStormPathDatalistInput.addEventListener('input', (e)=>{
            generateIndividualStormPath(e.target.value, elementHook.individualStormPathShowDiameterCheckbox.checked);
        });
        elementHook.individualStormPathShowDiameterCheckbox.addEventListener('change', (e)=>{
            generateIndividualStormPath(elementHook.individualStormPathDatalistInput.value, e.target.checked);
        });
        document.getElementById('shuffleButton').addEventListener('click', ()=> {
            const randomIndex = Math.floor(Math.random() * result.length);
            elementHook.individualStormPathDatalistInput.value = result[randomIndex];
            generateIndividualStormPath(result[randomIndex], elementHook.individualStormPathShowDiameterCheckbox.checked);
        });
        // dataFrameHook.df.query(dataFrameHook.df['ID'].eq('ALEX202206'));
        // dataFrameHook.df.query(dataFrameHook.df['ID'].eq('ALEX202206')).$data.length
        // conditionHook.diameterIsOn
    }
    // HurricaneStormTracks
    {
        generateGroupStormPath();
    }

    return;
}

const generateGroupStormPath = () => {

    const df = dataFrameHook.df;
    const generalLatitudeMean = df['LAT'].mean();
    const generalLongitudeMean = df['LONG'].mean();
    
    const iDs = df['ID'].$data;
    var uniqueValues = new Set();
    var uniqueIds = iDs.map(item => {
        if (!uniqueValues.has(item)) {
            uniqueValues.add(item);
            return item;
            }
        return null; // return null for duplicate values
    });
    uniqueIds = uniqueIds.filter(item => item !== null);

    Object.entries(mapHook.stormPathByGroupMap._layers)?.forEach(function ([key, value]) {
        if(value._path != undefined) {
            try {
                mapHook.stormPathByGroupMap.removeLayer(value);
            }
            catch(e) {
                console.log("problem with " + e + value);
            }
        }
    });
    uniqueIds.forEach(id => {
        const dfFromId = df.query(df['ID'].eq(id));
        var coordata = [];
        
        dfFromId.$data.forEach((entry) => {
            if (entry && entry.length >= 8) { 
                const latitude = entry[6];
                const longitude = entry[7];
                if (latitude !== undefined && longitude !== undefined) {
                    coordata.push([latitude, longitude]);
                }
            }
        });
    
        leaflet.polyline(coordata, { color: 'blue', weight: 0.5, opacity: 0.8 }).addTo(mapHook.stormPathByGroupMap);
    });
    
    //polylines.forEach(polyline => polyline.addTo(mapHook.stormPathByGroupMap));
    mapHook.stormPathByGroupMap.setView([generalLatitudeMean, generalLongitudeMean], 3);

    setTimeout(function () {
        mapHook.stormPathByGroupMap.invalidateSize(true);
    }, 2500);
    /*
        def HurricaneStormTracks(hurdat2):
            # Create a Folium map centered at the mean latitude and longitude
            m = folium.Map(location=[hurdat2['LAT'].mean(), hurdat2['LONG'].mean()], zoom_start=5, tiles='OpenStreetMap')

            # Select hurricanes
            HurricaneStorms = hurdat2[hurdat2['STATUS'] == "Hurricane"]
            HurricaneStorms_Unique = HurricaneStorms['NAME'].unique()
            print('Total number of Hurricane Storms = ', len(HurricaneStorms_Unique))

            # Iterate over each hurricane storm
            for storm_name in HurricaneStorms_Unique:
                temp_db = hurdat2[hurdat2['NAME'] == storm_name]
                latitudes = temp_db['LAT'].tolist()
                longitudes = temp_db['LONG'].tolist()
                coordinates = list(zip(latitudes, longitudes))

                # Add a PolyLine to the map for the storm track
                PolyLine(coordinates, color='red', weight=0.5, opacity=0.7, popup=storm_name).add_to(m)

            # Save the map as an HTML file or display it
            m.save("hurricane_storm_tracks_map.html")
            return m

        HurricaneStormTracks(df)
        */
}

const generateIndividualStormPath = (text, showDiameter) => {
    if(!text){
        return;
    }
    const df = dataFrameHook.df;
    const selectedStorm = df.query(df['ID'].eq(text));
    const numberOfQueryResults = selectedStorm.$data.length;
    if(numberOfQueryResults == 0) {
        return;
    }
    const latitudeCenter = selectedStorm['LAT'].mean();
    const longitudeCenter = selectedStorm['LONG'].mean();
    const latitudeData = selectedStorm['LAT'].$data;
    const longitudeData = selectedStorm['LONG'].$data;

    Object.entries(mapHook.individualStormPathMap._layers)?.forEach(function ([key, value]) {
        if(value._path != undefined) {
            try {
                mapHook.individualStormPathMap.removeLayer(value);
            }
            catch(e) {
                console.log("problem with " + e + value);
            }
        }
    });
    
    const pathCoordinates = latitudeData.map((lat, index) => [lat, longitudeData[index]]);
    mapHook.individualStormPathMap.setView([latitudeCenter, longitudeCenter], 3);
    leaflet.polyline(pathCoordinates, { color: 'blue', weight: 2.5, opacity: 0.8 }).addTo(mapHook.individualStormPathMap);
    // Add CircleMarkers for each point with labels
    selectedStorm.$data.forEach((entry) => {
        const entryLatitude = entry[selectedStorm.$columns.indexOf('LAT')];
        const entryLongitude = entry[selectedStorm.$columns.indexOf('LONG')];
        const entryYear = entry[selectedStorm.$columns.indexOf('YEAR')];
        const entryMonth = entry[selectedStorm.$columns.indexOf('MONTH')];
        const entryDay = entry[selectedStorm.$columns.indexOf('DAY')];
        const entryCategory = entry[selectedStorm.$columns.indexOf('CATEGORY')];
        const entryWind = entry[selectedStorm.$columns.indexOf('STATUS')];
        const entryTropicalDiameter = entry[selectedStorm.$columns.indexOf('TROPICALSTORM_FORCE_DIAMETER')];
        const entryHurricaneDiameter = entry[selectedStorm.$columns.indexOf('HURRICANE_FORCE_DIAMETER')];
        if(showDiameter && (entryTropicalDiameter > 0 || entryHurricaneDiameter > 0)) {
            leaflet.circle([entryLatitude, entryLongitude], {
                radius: (entryTropicalDiameter > 0 ? entryTropicalDiameter : entryHurricaneDiameter) * 1852,
                color: 'blue',
                fill: false,
                fillOpacity: 1
            }).addTo(mapHook.individualStormPathMap)
        }
        leaflet.circleMarker([entryLatitude, entryLongitude], {
            radius: 3,
            color: 'red',
            fill: true,
            fillColor: 'red',
            fillOpacity: 1
        }).bindPopup(`Year: ${entryYear} Month: ${entryMonth} Day: ${entryDay} Category: ${entryCategory} Wind: ${entryWind}`)
            .addTo(mapHook.individualStormPathMap)
    });
    setTimeout(function () {
        mapHook.individualStormPathMap.invalidateSize(true);
    }, 1500);
}

const generatePredictives = (df) => {
    
    // NUMBER OF STORM 
    {

        const dfGroupedByCategory = dataFrameHook.df.groupby(['YEAR']);
        var years = []
        var freq = [];
        console.log(years);
        console.log(freq);
        Object.entries(dfGroupedByCategory.colDict).forEach(function ([key, value]) {
            var uniqueValues = new Set();
            result = value['ID'].map(item => {
                if (!uniqueValues.has(item)) {
                    uniqueValues.add(item);
                    return item;
                    }
                return null; // return null for duplicate values
            });
            result = result.filter(item => item !== null);
            if(key != '0') {
                years.push(key);
                freq.push(result.length);
            }
        });
        const scaledYears = years.map(year => year - years[0]);
        const futureYears = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040, 2041, 2042];
        const scaledFutureYears = futureYears.map(year => year - years[0]);
        const model = new PolynomialRegression(scaledYears, freq, 1);
        const predictedStormNumbers = scaledFutureYears.map(year => model.predict(year));
        years.push(futureYears[0]);
        freq.push(predictedStormNumbers[0]);
        const trace = {
            x: years,
            y: freq,
            type: 'line',
            marker: {
              color: 'blue' // You can customize the color if needed
            },
            showlegend: false,
            name: 'Actual Storms Frequency'
        };
        const predictions = {
            x: futureYears,
            y: predictedStormNumbers,
            type: 'scatter',
            mode: 'lines',
            line: {
                dash: 'dot',  // Set the line style to dotted
                color: 'gray'
            },
            showlegend: false,
            name: 'Predictions'
        };
        const layout = {
            xaxis: {
              title: 'Year',
            },
            yaxis: {
              title: 'Number of Storms'
            },
            showlegend: false
        };
        const plotData = [trace, predictions];
        Plotly.newPlot(document.getElementById('storm-prediction-number-of-storms'), plotData, layout);
    }
    // CATEGORY
    {
        /*
        replaceDataFrameValues('', 0, df);
        // Extract features and labels
        const features = df.drop({ columns: ["CATEGORY","STATUS","ID","NAME","TROPICALSTORM_FORCE_DIAMETER","HURRICANE_FORCE_DIAMETER"], inplace: false }).values;
        console.log(features);
        const labels = df['CATEGORY'].values;
        const options = {
            seed: 3,
            maxFeatures: 0.8,
            replacement: true,
            nEstimators: 25,
        };
        const classifier = new RandomForestClassifier(options);
        // classifier.train(features, labels);
        conditionHook.categoryPredictiveModel = classifier;
        */
        parsedData = [];
        fs.createReadStream(conditionHook.filePath).pipe(csv({ columns: true, skip_empty_lines: true })).on('data', (row) => {
          parsedData.push(row);
        }).on('end', () => {
            try {
            // Extract features and labels
                const features = ['YEAR', 'MONTH', 'DAY', 'HOUR', 'LAT', 'LONG', 'WIND', 'PRESSURE'];
                const hurricaneLabel = 'CATEGORY'; // Level of hurricane
                const binaryLabel = 'IS_HURRICANE'; // Binary label indicating whether it became a hurricane
            
                const trainingData = parsedData.map((row) => ({
                    ...row,
                    [hurricaneLabel]: parseInt(row[hurricaneLabel], 10) || 0, // Default to 0 if parsing fails
                    [binaryLabel]: row[hurricaneLabel] > 0 ? 1 : 0, // 1 if hurricane, 0 otherwise
                }));
        
                const decisionTree = new DecisionTree(trainingData, binaryLabel, features);
                conditionHook.categoryPredictiveModel = decisionTree;

            } catch (e) {
                console.error(e);
            }
        });
    
    }
    // DURATION
    {/*
        trainModel().then((model)=>{
            conditionHook.durationPredictiveModel = model;
        });
    */
    }
    document.getElementById('form-category').addEventListener('submit', (e)=>{
        e.preventDefault();
        const year = parseInt(document.getElementById('form-category-year').value);
        const month = parseInt(document.getElementById('form-category-month').value);
        const day = parseInt(document.getElementById('form-category-day').value);
        const hour = parseInt(document.getElementById('form-category-hour').value);
        const latitude = parseFloat(document.getElementById('form-category-latitude').value);
        const longitude = parseFloat(document.getElementById('form-category-longitude').value);
        const wind = parseFloat(document.getElementById('form-category-wind').value);
        const pressure = parseFloat(document.getElementById('form-category-pressure').value);
        const newStormData = {
            YEAR: year,
            MONTH: month,
            DAY: day,
            HOUR: hour,
            LAT: latitude,
            LONG: longitude,
            WIND: wind,
            PRESSURE: pressure,
        };
        console.log(newStormData);
        const prediction = conditionHook.categoryPredictiveModel.predict(newStormData);
        const predictionText = document.getElementById('result-category');
        predictionText.innerHTML = `Predicted Category - ${prediction}`;
    });
    document.getElementById('form-duration').addEventListener('submit', (e)=>{
        const year = parseInt(document.getElementById('form-duration-year').value);
        const month = parseInt(document.getElementById('form-duration-month').value);
        const day = parseInt(document.getElementById('form-duration-day').value);
        const hour = parseInt(document.getElementById('form-duration-hour').value);
        const latitude = parseFloat(document.getElementById('form-duration-latitude').value);
        const longitude = parseFloat(document.getElementById('form-duration-longitude').value);
        const status = document.getElementById('form-duration-status').value;
        const category = parseInt(document.getElementById('form-duration-category').value);
        const wind = parseFloat(document.getElementById('form-duration-wind').value);
        const pressure = parseFloat(document.getElementById('form-duration-pressure').value);
        const newData = [
            { year: year, month: month, day: day, hour: hour, lat: latitude, long: longitude, wind: wind, pressure: pressure },
        ];
        const prediction = makeModelPredictions(conditionHooks.durationPredictiveModel, newData);
        const predictionText = document.getElementById('result-duration');
        e.preventDefault();
    });
    return;
}

function trainModel() {
    return new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(conditionHook.filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Convert the data to the correct types
          row.year = Number(row.year);
          row.month = Number(row.month);
          row.day = Number(row.day);
          row.hour = Number(row.hour);
          row.lat = Number(row.lat);
          row.long = Number(row.long);
          row.wind = Number(row.wind);
          row.pressure = Number(row.pressure);
  
          // Convert the year, month, day, and hour to a Date object
          row.date = new Date(row.year, row.month - 1, row.day, row.hour);
  
          // Add the row to the data array
          data.push(row);
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
          
            // Group the data by storm ID
            const groups = lodash.groupBy(data, 'ID');
          
            // Compute the duration for each group
            const durations = lodash.mapValues(groups, (group) => {
              const dates = group.map((row) => row.date);
              const minDate = new Date(Math.min.apply(null, dates));
              const maxDate = new Date(Math.max.apply(null, dates));
              const duration = (maxDate - minDate) / 1000 / 60 / 60; // Duration in hours
              return duration;
            });
          
            // Add the duration to each row in the data array
            data.forEach(row => {
              row.duration = durations[row.ID];
            });
          
            // console.log(data); // Log the data to the console
          
            const regression = trainModelWithData(data);
            resolve(regression);
          })
        .on('error', (error) => {
          reject(error);
        });
    });
}

// Function to train the model with data
function trainModelWithData(data) {
    try {
    const features = ['year', 'month', 'day', 'hour', 'lat', 'long', 'wind', 'pressure'];
    const X = data.map((row) => features.map((feature) => row[feature]));
    const Y = data.map((row) => row.duration);
    console.log(X); // Log the X array to the console
    console.log(Y); // Log the Y array to the console

    const options = {
        seed: 3,
        maxFeatures: 0.8,
        replacement: true,
        nEstimators: 25,
    };

    const regression = new RandomForestRegression(options);

    // Manually perform cross-validation
    const folds = 5;
    const foldSize = Math.floor(X.length / folds);

    for (let i = 0; i < folds; i++) {
        const start = i * foldSize;
        const end = (i + 1) * foldSize;

        const Xtrain = X.slice(0, start).concat(X.slice(end));
        const Ytrain = Y.slice(0, start).concat(Y.slice(end));

        regression.train(Xtrain, Ytrain);
    }

    console.log('Model training completed');
    console.log(regression);

        return regression;
    } catch (error) {
        console.error('Error in trainWithData function:', error);
    }
}

// Function to process data, perform cross-validation, and save the model
// ... (rest of the code remains the same)

// Function to process data, perform cross-validation, and save the model
function processAndSaveModel(data, regression) {
    console.log('Processing and saving the model...');
  
    // Group the data by storm ID
    const groups = lodash.groupBy(data, 'ID');
  
    // ... (rest of the code remains the same)
  
    console.log('Model training completed. Saving the model...');
  
    // Save the model to a JSON file
    const modelFilePath = 'durationmodel.json';
  
    jsonfile.writeFile(modelFilePath, regression, { spaces: 2 }, function (err) {
      if (err) {
        console.error('Error saving the model:', err);
      } else {
        console.log(`Model saved successfully to ${modelFilePath}`);
      }
  
      console.log('Model saving process completed.');
    });
  
    // ... (any additional tasks)
}
  
function makeModelPredictions(model, newData) {
    try {
        // Log the input to the predict method
        const features = ['year', 'month', 'day', 'hour', 'lat', 'long', 'wind', 'pressure'];
        const newX = newData.map((row) => features.map((feature) => row[feature]));

        console.log('Input to predict method:', newX);

        // Make predictions using the model
        const predictions = model.predict(newX);

        console.log('Predictions:', predictions);

        return predictions;
    } catch (error) {
        console.error('Error in makePredictions:', error);
        return null;
    }
}

const plotTable = (df) => {
    const id = uuid.v4();
    var table = document.createElement('table');
    //table.classList.add('table', 'table-sm', 'table-dark', 'align-self-center');
    table.id = id;
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');

    // Create header row
    var headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // Empty cell for index column
    df.$columns.forEach(function(column) {
        var th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create data rows
    df.$index.forEach(function(index) {
        var dataRow = document.createElement('tr');
        var indexCell = document.createElement('th');
        indexCell.textContent = index;
        dataRow.appendChild(indexCell);
        
        const tableData = df.$data[df.$index.indexOf(index)];
        if(Array.isArray(tableData)) {
            tableData.forEach(function(data) {
                var td = document.createElement('td');
                td.textContent = data.toFixed(2);
                dataRow.appendChild(td);
            });
        } else {
            var td = document.createElement('td');
            td.textContent = typeof value === 'number' && !isNaN(value) ? tableData.toFixed(2) : tableData;
            dataRow.appendChild(td);
        }
        

        tbody.appendChild(dataRow);
    });

    table.appendChild(tbody);

    return {table: table, id: id};
};

const replaceDataFrameValues = (oldValue, newValue, dataFrame) => {
    newData = dataFrame.values.map(function (_a) {
        var row = _a.slice(0);
        return row.map((function (cell) {
            if (cell === oldValue) {
                return newValue;
            }
            else {
                return cell;
            }
        }));
    });
    dataFrame.$setValues(newData);
};
        
initializeApp = () => {
    const currationText = document.getElementById('curration-text');
    const errorText = document.getElementById('error-text');
    const loadingIcon = document.getElementById('loading-icon');
    const errorIcon = document.getElementById('error-icon');
    const describeTable = document.getElementById('describe-table');
    const typesTable = document.getElementById('types-table');
    const heatMapContainer = document.getElementById('heat-map-container');
    const numberOfStormsStatusContainer = document.getElementById('number-of-storms-status-container');
    const numberOfStormsCategoryContainer = document.getElementById('number-of-storms-category-container');
    const numberOfStormsYearContainer = document.getElementById('number-of-storms-year-container');
    const numberOfStormsMonthContainer = document.getElementById('number-of-storms-month-container');
    const numberOfStormsSelectInput = document.getElementById('number-of-storms-select-input');
    const cyclicalityContainer = document.getElementById('cyclicality-container');
    const individualStormPathContainer = document.getElementById('individual-storm-path-container');
    const individualStormPathDatalist = document.getElementById('individual-storm-path-datalist');
    const individualStormPathDatalistInput = document.getElementById('individual-storm-path-datalist-input');
    const individualStormPathShowDiameterCheckbox = document.getElementById('individual-storm-path-show-diameter-checkbox');
    const stormPathByGroupContainer = document.getElementById('storm-path-by-group-container');
    const stormGenesisContainer = document.getElementById('storm-genesis-container');
    elementHook = {
        ...elementHook,
        currationText: currationText,
        describeTable: describeTable,
        typesTable: typesTable,
        errorText: errorText,
        loadingIcon: loadingIcon,
        errorIcon: errorIcon,
        heatMapContainer: heatMapContainer,
        numberOfStormsStatusContainer: numberOfStormsStatusContainer,
        numberOfStormsCategoryContainer: numberOfStormsCategoryContainer,
        numberOfStormsSelectInput: numberOfStormsSelectInput,
        cyclicalityContainer: cyclicalityContainer,
        individualStormPathContainer: individualStormPathContainer,
        individualStormPathDatalist: individualStormPathDatalist,
        individualStormPathDatalistInput: individualStormPathDatalistInput,
        individualStormPathShowDiameterCheckbox: individualStormPathShowDiameterCheckbox,
        stormPathByGroupContainer: stormPathByGroupContainer,
        stormGenesisContainer: stormGenesisContainer,
        numberOfStormsYearContainer: numberOfStormsYearContainer,
        numberOfStormsMonthContainer: numberOfStormsMonthContainer,
    }
    elementHook.individualStormPathContainer.appendChild(mapHook.individualStormPathMapDivision);
    elementHook.stormPathByGroupContainer.appendChild(mapHook.stormPathByGroupMapDivision);
    elementHook.stormGenesisContainer.appendChild(mapHook.stormGenesisMapDivision);
    elementHook.heatMapContainer.appendChild(mapHook.heatMapDivision);
    setTimeout(function () {
        mapHook.maps.forEach((map) => {
            map.invalidateSize(true);
        });
    }, 1000);
    elementHook.numberOfStormsSelectInput.addEventListener('change', (event) => {
        const value = event.target.value;
        if(value == 'status') {
            elementHook.numberOfStormsStatusContainer.classList.remove('d-none');
            elementHook.numberOfStormsCategoryContainer.classList.add('d-none');
            elementHook.numberOfStormsYearContainer.classList.add('d-none');
            elementHook.numberOfStormsMonthContainer.classList.add('d-none');
        } else if (value == 'category') {
            elementHook.numberOfStormsCategoryContainer.classList.remove('d-none');
            elementHook.numberOfStormsStatusContainer.classList.add('d-none');
            elementHook.numberOfStormsYearContainer.classList.add('d-none');
            elementHook.numberOfStormsMonthContainer.classList.add('d-none');
        } else if (value == 'year') {
            elementHook.numberOfStormsYearContainer.classList.remove('d-none');
            elementHook.numberOfStormsStatusContainer.classList.add('d-none');
            elementHook.numberOfStormsCategoryContainer.classList.add('d-none');
            elementHook.numberOfStormsMonthContainer.classList.add('d-none');
        } else if (value == 'month') {
            elementHook.numberOfStormsMonthContainer.classList.remove('d-none');
            elementHook.numberOfStormsStatusContainer.classList.add('d-none');
            elementHook.numberOfStormsCategoryContainer.classList.add('d-none');
            elementHook.numberOfStormsYearContainer.classList.add('d-none');
        }
    });
    elementHook.dropBox.addEventListener('click', ()=> {
        openFileDialog(elementHook);
    });
};

document.addEventListener('DOMContentLoaded', ()=> {
    initializeSlides();
    initializeDropBox();
    initializeApp();

    // openCSVFile(`Z:\\storm-predictive-model-project\\Asia-Pacific-Storm-Tracks\\2001-2022storms\\2001-2022storms.csv`);
    //console.log("elementHooks:");
    //console.log(elementHook);
});