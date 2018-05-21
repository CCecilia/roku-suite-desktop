const {app, BrowserWindow, ipcMain, ipcRenderer} = require('electron');
const url = require('url');
const path = require('path');
const db = require('../../lib/config/database');
const KeyLogList = require('../../models/keyLogList');

let loggerWindow;

const controller = {
	openLoggerWindow: () => {
		// create new window
        loggerWindow = new BrowserWindow({
            width: 500,
            height: 600,
            title: 'Key Logger'
        });

        // load html file into app
        loggerWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../..', 'views', 'loggerWindow.pug'),
            protocol: 'file:',
            slashes: true
        }));

        // garbage collection
        loggerWindow.on('closed', () => loggerWindow = null );
	},

	updateKeyLog: (key) => {
		loggerWindow.send('key_log', key);
	},

	closeLoggerWindow: () => {
		loggerWindow.close();
	},

	saveKeyLogList: (key_log_list_data) => {
		return new Promise((resolve, reject) => {
            let new_key_list = new KeyLogList(
				key_log_list_data.name,
				key_log_list_data.logs
			);

            // save new roku
            db.KeyLogLists.insert(new_key_list, function(err, doc) {
                if(err) {
                    reject(new Error('failed to save key log list'));
                }

                resolve(new_key_list);
            });
        });
	},

    remove: (key_log_id) => {
        return new Promise((resolve, reject) => {
            db.KeyLogLists.remove({ _id: key_log_id }, {}, function (err, numRemoved) {
                if(err) { 
                    reject(new Error('Failed to remove key log'));
                }

                resolve('Key Log removed');
            });
        });
    }
};

module.exports = (controller);
