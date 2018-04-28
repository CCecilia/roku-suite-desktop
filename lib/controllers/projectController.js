const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const Project = require('../../models/project');

let addProjectWindow;

const controller = {
    createAddProjectWindow: () => {

        // create new window
        addProjectWindow = new BrowserWindow({
            width: 500,
            height: 600,
            title: 'Add Project'
        });

        // load html file into app
        addProjectWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../..', 'views', 'addProjectWindow.pug'),
            protocol: 'file:',
            slashes: true
        }));

        // garbage collection
        addProjectWindow.on('closed', () => addProjectWindow = null);
    },

    saveNewProject: (new_project_data) => {
        return new Promise((resolve, reject) => {
            let new_project = new Project(new_project_data);
            new_project.save(function(err, new_project){
                if(err){
                    // debug(`error @ create sale: ${err}`);
                    console.log(err);
                    reject(err);
                }
                // close window
                addProjectWindow.close();
                resolve(new_project)
            });
        });
    }
};

module.exports = (controller);
