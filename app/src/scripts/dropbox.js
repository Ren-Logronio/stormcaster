
const triggerDropBoxDragEvent = () => {

};


const initializeDropBox = () => {
    const dropBox = document.getElementById('drop-box');
    const dropBoxBlock = document.getElementById('drop-box-block');
    elementHook = {
        ...elementHook,
        dropBox: dropBox,
        dropBoxBlock: dropBoxBlock
    }
}