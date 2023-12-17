
const { dialog } = require('@electron/remote');
const fs = require('fs');
const dfd = require('danfojs');

const fakeLoadTime = 0.001;

const openFileDialog = () => {
    const options = {
        title: 'Select CSV File',
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    };

    // Showing the file dialog
    dialog.showOpenDialog(options).then(result => {
        if (!result.canceled) {
            const filePath = result.filePaths[0];
            // Do something with the selected file path, e.g., read the file
            openCSVFile(filePath)
        }
    }).catch(err => {
        console.error(err);
    });
}

const openCSVFile = (filePath) => {
    jumpSlide(2);
    conditionHook = { ...conditionHook, isFileLoaded: true }
    elementHook.nextSlidebutton.classList.add('disabled');
    elementHook.previousSlidebutton.classList.add('disabled');
    elementHook.dropBox.classList.add('disabled');
    dfd.readCSV(filePath).then(async (df) => {
        sampleDataFrame = new dfd.DataFrame([{A: 1, B: 9, C: NaN}, {A: 1, B: 1, C:2}]);
        sampleDataFrame.dropNa({axis: 1, inplace: true});
        replaceDataFrameValues('NA', 0, df);
        // df.plot(elementHook.dataUnTable.id).table();
        df.fillNa({ columns: ["TROPICALSTORM_FORCE_DIAMETER", "HURRICANE_FORCE_DIAMETER"], value: 0 }, inplace=true);
        df.dropNa({axis: 0, inplace: true});
        // df.plot(elementHook.dataTable.id).table();
        dataFrameHook = {df: df, describe: df.describe()};
        const table = plotTable(df.describe());
        elementHook.describeTable.appendChild(table);
        //df.describe().plot(elementHook.describeTable.id).table();
        await new Promise(resolve => setTimeout(resolve, 2000));
        elementHook.currationText.innerHTML = "Removing NaN Values...";
        await new Promise(resolve => setTimeout(resolve, fakeLoadTime * 1000));
        elementHook.currationText.innerHTML = "Creating Tables and Graphs...";
        await new Promise(resolve => setTimeout(resolve, fakeLoadTime * 1000));
        elementHook.currationText.innerHTML = "Training Models...";
        await new Promise(resolve => setTimeout(resolve, fakeLoadTime * 1000));
        jumpSlide(3);
        elementHook.nextSlidebutton.classList.remove('disabled');
    }).catch(err => {
        console.error(err);
    });
}

const plotTable = (df) => {
    var table = document.createElement('table');
    table.classList.add('table', 'table-sm', 'table-dark', 'mx-5');
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
        tableData.forEach(function(data) {
            var td = document.createElement('td');
            td.textContent = data.toFixed(2);
            dataRow.appendChild(td);
        });
        

        tbody.appendChild(dataRow);
    });

    table.appendChild(tbody);

    return table;
};
        
initializeApp = () => {
    const currationText = document.getElementById('curration-text');
    const describeTable = document.getElementById('describe-table');
    const dataTable = document.getElementById('data-table');
    const dataUnTable = document.getElementById('data-un-table');
    elementHook = {
        ...elementHook,
        currationText: currationText,
        describeTable: describeTable,
        dataTable: dataTable,
        dataUnTable: dataUnTable,
    }
    elementHook.uploadButton.addEventListener('click', ()=> {
        openFileDialog(elementHook);
    });
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

document.addEventListener('DOMContentLoaded', ()=> {
    initializeSlides();
    initializeDropBox();
    initializeApp();

    openCSVFile(`Z:\\storm-predictive-model-project\\Asia-Pacific-Storm-Tracks\\2001-2022storms\\2001-2022storms.csv`);
    //console.log("elementHooks:");
    //console.log(elementHook);
});