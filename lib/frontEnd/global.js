const {ipcRenderer} = require('electron');

function handleInputError(element) {
    element.css('border', '1px solid red').focus();

    setTimeout(() => {
        element.css('border', '');
    }, 2000);
}
