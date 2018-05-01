const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const Project = require('../../models/project');
const db = require('../../lib/config/database');
const async = require('async');

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
            let new_project = new Project(
                new_project_data.name,
                new_project_data.root_path,
                new_project_data.excluded_file_paths,
                new_project_data.git_branch
            );

            db.Projects.insert(new_project, function(err, doc) {
                if(err) {
                    reject(new Error('failed to save new project'));
                }

                addProjectWindow.close();
                resolve(new_project);
            });
        });
    },
};

module.exports = (controller);
