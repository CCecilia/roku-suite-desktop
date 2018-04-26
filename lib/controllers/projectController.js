const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');

let addProjectWindow;

const controller = {
    createAddProjectWindow: () => {
        // create new window
        addProjectWindow = new BrowserWindow({
            width: 300,
            height: 200,
            title: 'Add Project'
        });

        // load html file into app
        addProjectWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../..', 'views', 'addProjectWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        console.log(path.join(__dirname, '../..', 'views', 'addProjectWindow.html'));

        // garbage collection
        addProjectWindow.on('closed', () => addProjectWindow = null);
    }
};

module.exports = (controller);
