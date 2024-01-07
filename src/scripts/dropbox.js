var dragEventCounter = 0;



const triggerDropBoxDropEvent = (e) => {
    e.preventDefault();
    dragEventCounter = 0; 
    if(e.dataTransfer.files.length == 1) {
        if(["csv", "CSV"].includes(e.dataTransfer.files[0].name.match(/\.([0-9a-z]+)$/i)[1])){
            const filePath = e.dataTransfer.files[0].path;
            openCSVFile(filePath);
        }
    }
    elementHook.dropBoxBlock.classList.add('d-none');
}

const triggerDropBoxDragEvent = (e) => {
    e.preventDefault();
    e.effectAllowed = 'copy';
    e.dataTransfer.dropEffect = 'copy';
    elementHook.dropBoxBlock.classList.remove('d-none'); 
    dragEventCounter++;
};

const triggerDropBoxDragLeaveEvent = (e) => {
    dragEventCounter--;
    e.preventDefault();
    if (dragEventCounter == 0) {
        dragEvent = false;
        elementHook.dropBoxBlock.classList.add('d-none');
    }
}

const initializeDropBox = () => {
    const dropBox = document.getElementById('drop-box');
    const uploadButton = document.getElementById('upload-button');
    const dropBoxBlock = document.getElementById('drop-box-block');
    elementHook = {
        ...elementHook,
        dropBox: dropBox,
        dropBoxBlock: dropBoxBlock,
        uploadButton: uploadButton,
    }
    elementHook.inputs.push(uploadButton, dropBox);
    dropBox.addEventListener('dragover', (e)=>{ 
        e.preventDefault()
        e.effectAllowed = 'copy';
        e.dataTransfer.dropEffect = 'copy';
    });
    dropBox.addEventListener('dragenter', triggerDropBoxDragEvent);
    dropBox.addEventListener('dragleave', triggerDropBoxDragLeaveEvent);
    dropBox.addEventListener('drop', triggerDropBoxDropEvent);
}