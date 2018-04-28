const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const Project = require('../../models/roku');

const controller = {
    createAddRokuWindow: () => {
        // create new window
        addRokuWindow = new BrowserWindow({
            width: 500,
            height: 600,
            title: 'Add Roku'
        });

        // load html file into app
        addRokuWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../..', 'views', 'addRokuWindow.pug'),
            protocol: 'file:',
            slashes: true
        }));

        // garbage collection
        addRokuWindow.on('closed', () => addRokuWindow = null);
    },

    saveNewRoku: (new_roku_data) => {
        return new Promise((resolve, reject) => {
            let new_roku = new Roku(new_roku_data);
            new_roku.save(function(err, new_roku) {
                if(err) {
                    reject(err);
                }
                // close window
                addRokuWindow.close();
                resolve(new_roku);
            });
        });
    }
};

module.exports = (controller);
