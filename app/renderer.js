
const { dialog, BrowserView } = require('@electron/remote');
const fs = require('fs');
const dfd = require('danfojs');
const uuid = require('uuid');
const DataTable = require('datatables.net-dt')
const Plotly = require('plotly.js-dist');
const sk = require('scikitjs');
const leaflet = require('leaflet');

const fakeLoadTime = 0.001;

const mapLayer = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 3,
    edgeBufferTiles: 5,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

mapHook.individualStormPathMapDivision = document.createElement("div");
mapHook.individualStormPathMapDivision.classList.add("map");
mapHook.individualStormPathMap = leaflet.map(mapHook.individualStormPathMapDivision);
mapLayer.addTo(mapHook.individualStormPathMap);

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

        elementHook.currationText.innerHTML = "Training Models...";
        await new Promise(resolve => setTimeout(resolve, fakeLoadTime * 1000));

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
    // HurricaneStormTracks
    {


    }
    // Storm Genesis
    {

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
                generateStormPath(id);
            }
            elementHook.individualStormPathDatalist.appendChild(optionElement);
        })
        elementHook.individualStormPathDatalistInput.addEventListener('input', (e)=>{
            
        });
        // dataFrameHook.df.query(dataFrameHook.df['ID'].eq('ALEX202206'));
        // dataFrameHook.df.query(dataFrameHook.df['ID'].eq('ALEX202206')).$data.length
        // conditionHook.diameterIsOn
        //

    }
    return;
}

const generateStormPath = (text) => {
    if(!text){
        return;
    }
    const df = dataFrameHook.df;
    const selectedStorm = df.query(df['ID'].eq(text));
    const numberOfQueryResults = selectedStorm.$data.length;
    if(numberOfQueryResults == 0) {
        return;
    }
    console.log("MAPPING");
    const latitudeCenter = selectedStorm['LAT'].mean();
    const longitudeCenter = selectedStorm['LONG'].mean();
    const latitudeData = selectedStorm['LAT'].$data;
    const longitudeData = selectedStorm['LONG'].$data;
    console.log(latitudeCenter);
    console.log(longitudeCenter);
    console.log(latitudeData);
    console.log(longitudeData);
    
    const pathCoordinates = latitudeData.map((lat, index) => [lat, longitudeData[index]]);
    mapHook.individualStormPathMap.setView([latitudeCenter, longitudeCenter], 1);
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
        leaflet.circleMarker([entryLatitude, entryLongitude], {
            radius: 3,
            color: 'red',
            fill: true,
            fillColor: 'red',
            fillOpacity: 1
        }).bindPopup(`Year: ${entryYear} Month: ${entryMonth} Day: ${entryDay} Category: ${entryCategory} Wind: ${entryWind}`).addTo(mapHook.individualStormPathMap);
    });
    setTimeout(function () {
        mapHook.individualStormPathMap.invalidateSize(true);
    }, 1000);
}

const generatePredictives = () => {

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
    setTimeout(function () {
        mapHook.individualStormPathMap.invalidateSize(true);
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

    openCSVFile(`Z:\\storm-predictive-model-project\\Asia-Pacific-Storm-Tracks\\2001-2022storms\\2001-2022storms.csv`);
    //console.log("elementHooks:");
    //console.log(elementHook);
});