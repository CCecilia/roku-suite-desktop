const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const User = require('../../models/user');

let signInWindow;

const controller = {
    createSignInWindow: () => {
        // create new window
        signInWindow = new BrowserWindow({
            width: 500,
            height: 550,
            title: 'Sign In'
        });

        // load html file into app
        signInWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../..', 'views', 'signInWindow.pug'),
            protocol: 'file:',
            slashes: true
        }));

        // garbage collection
        signInWindow.on('closed', () => signInWindow = null);
    },

    saveNewUser: (new_user_data) => {
        return new Promise((resolve, reject) => {
            let new_user = new User(new_user_data);
            new_user.save(function(err, new_user){
                if(err){
                    // debug(`error @ create sale: ${err}`);
                    console.log(err);
                    reject(err);
                }
                // close window
                signInWindow.close();
                resolve(new_user)
            });
        });
    }
};

module.exports = (controller);
