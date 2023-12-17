
const { dialog, BrowserView } = require('@electron/remote');
const fs = require('fs');
const dfd = require('danfojs');
const uuid = require('uuid');
const DataTable = require('datatables.net-dt')
const Plotly = require('plotly.js-dist');

const fakeLoadTime = 0.001;

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
        const custom_order = ['Other Low', 'Disturbance', 'Tropical Wave', 'Subtropical Depression', 'Subtropical Storm', 'Extratropical', 'Tropical Depression', 'Tropical Storm', 'Hurricane'];
        
        var dfGroupedByStatus = df.groupby(['STATUS']);

        var data = {
            labels: [],
            values: [],
        }

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

        console.log(data);

        const trace = {
            x: sortedData.map(item => item.label),
            y: sortedData.map(item => item.value),
            type: 'bar',
            marker: {
              color: 'blue' // You can customize the color if needed
            }
        };

        const layout = {
            title: 'Number of Storms by Status',
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
    // Number of Storms by Saffir-Simpson Hurricane Category Calculated from Wind Speed

    // HurrCyclicality

    // HurrSeasonalityByYear

    // STORM PATH

    // TROPICAL STORM FORCE DIAMETER

    // HurricaneStormTracks

    // Storm Genesis

    return;
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
    const numberOfStormsSelectInput = document.getElementById('number-of-storms-select-input');
    const cyclicalityContainer = document.getElementById('cyclicality-container');
    const seasonalityContainer = document.getElementById('seasonality-container');
    const stormPathContainer = document.getElementById('storm-path-container');
    const stormForceDiameterContainer = document.getElementById('storm-force-diameter-container');
    const stormTracksContainer = document.getElementById('storm-tracks-container');
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
        seasonalityContainer: seasonalityContainer,
        stormPathContainer: stormPathContainer,
        stormForceDiameterContainer: stormForceDiameterContainer,
        stormTracksContainer: stormTracksContainer,
        stormGenesisContainer: stormGenesisContainer,
    }
    elementHook.numberOfStormsSelectInput.addEventListener('change', (event) => {
        if(event.target.value == 'status') {
            elementHook.numberOfStormsStatusContainer.classList.remove('d-none');
            elementHook.numberOfStormsCategoryContainer.classList.add('d-none');
        } else {
            elementHook.numberOfStormsStatusContainer.classList.add('d-none');
            elementHook.numberOfStormsCategoryContainer.classList.remove('d-none');
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