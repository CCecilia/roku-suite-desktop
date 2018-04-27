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
        let new_project = new Project(new_project_data);
        new_project.save(function(err){
            if(err){
                // debug(`error @ create sale: ${err}`);
                console.log(err);
                return;
            }
            // close window
            addProjectWindow.close();
        });
    }
};

module.exports = (controller);
