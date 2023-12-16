
/*

const { dialog } = require('@electron/remote');
const fs = require('fs');
console.log("Testing remote")
const dfd = require('danfojs');
console.log("Testing done")


var dataFrameHook;

const openFileDialog = (elements) => {
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
            openCSVFile(filePath, elements)
        }
    }).catch(err => {
        console.error(err);
    });
}



const openCSVFile = (filePath, elements) => {
    dfd.readCSV(filePath).then(df => {
        console.log(df.head());
        elements.analysisDescription.innerHTML = df.describe();
    }).catch(err => {
        elements.errorText.innerHTML = 'An error ocurred reading the file';
        console.error(err);
    });
    // Todo - danfojs
}

        
document.addEventListener('DOMContentLoaded', ()=> {
    const uploadButton = document.getElementById('upload-button');
    const errorText = document.getElementById('error-text');
    const analysisDescription = document.getElementById('analysis-description');

    const elements = {
        uploadButton: uploadButton,
        errorText: errorText,
        analysisDescription: analysisDescription
    }
    console.log(elements);

errorText
    uploadButton.addEventListener('click', ()=> {
        openFileDialog(elements);
    });
});

*/