const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const Roku = require('../../models/roku');
const db = require('../../lib/config/database');
const async = require('async');

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

            db.Rokus.insert(new_roku, function(err, doc) {
                if(err) {
                    console.log(err);
                    reject(err);
                }

                console.log('Inserted', doc.name, 'with ID', doc._id);
                console.log(new_roku);
                addRokuWindow.close();
                resolve(new_roku);
            });
        });
    },

    deploy: (deploy_data) => {
        console.log('deploy');
        return new Promise((resolve, reject) => {
            console.log('deploy promise');
            async.parallel({
                project: function(callback){
                    db.Projects.findOne({_id: deploy_data.project_id})
                    .exec(callback);
                },
                rokus: function(callback){
                    db.Rokus.findOne({_id: deploy_data.roku_id})
                    .exec(callback);
                }
            }, function(err, results){
                if(err) {
                    console.log(err);
                    reject(err);
                }

                let project = results.project;
                let roku = results.roku;
                
                resolve(true);
            });
        });
    }
};

module.exports = (controller);
