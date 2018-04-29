const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const Roku = require('../../models/roku');
var Datastore = require('nedb');
var Rokus = new Datastore({ filename: './data/rokus.db', autoload: true });

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
            let new_roku = new Roku(
                new_roku_data.ip_address,
                new_roku_data.device_name,
                new_roku_data.username,
                new_roku_data.password
            );

            Rokus.insert(new_roku, function(err, doc) {
                if(err) {
                    console.log(err);
                    reject(err);
                }

                console.log('Inserted', doc.name, 'with ID', doc._id);
                console.log(new_roku);
                addRokuWindow.close();
                resolve(new_roku);
            });
            // new_roku.save(function(err, new_roku) {

            //     // close window
            //     addRokuWindow.close();
            //     resolve(new_roku);
            // });
        });
    }
};

module.exports = (controller);
