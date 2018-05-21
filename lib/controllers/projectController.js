const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const Project = require('../../models/project');
const db = require('../../lib/config/database');
const async = require('async');
const fs = require('fs');
const watch = require('node-watch');
const branch = require('git-branch');

let addProjectWindow;
const active_watchers = [];

const controller = {
    /**
    * @function createAddProjectWindow crteates the add project window.
    * @author <a href="mailto:christian@fubo.tv">Christian</a>
    * @version 1.0.0
    */
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

    /**
    * @function saveNewProject saves a new project to local db.
    * @param {Object}  new_project_data should contain values for name, root_path, excluded_file_paths, and git_branch
    * @return Promise Return a promise object containing the new_project doc.
    * @version 1.0.0
    */
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

    autoDeploy: (project_id, mainWindow) => {
        async.parallel({
            project: (callback) => {
                db.Projects.findOne({_id: project_id})
                .exec(callback);
            }
        }, function(err, results){
            //  get paths that need to be watched
            var to_be_watched = {
                dirs: [],
                files: []
            };
            let project = results.project;

            // gets all files and dirs that need to be watched
            function compileDirsToBeWatched(project) {
                console.log('compile to_be_watched');
                return new Promise((resolve, reject) => {
                    fs.readdir(project.root_path, function(err, dirs) {
                        if(err) { reject(new Error('Failed to read project dir for to_be_watched')); }

                        for (let i=0; i<dirs.length; i++) {
                            // exclude hidden dirs
                            if ( dirs[i][0] !== '.' ) {
                                // add project dirs
                                if( fs.lstatSync(path.join(project.root_path, dirs[i])).isDirectory() ) {
                                    to_be_watched.dirs.push(dirs[i]);
                                } else {
                                    // check if file is an excluded file
                                    if( !project.excluded_file_paths.includes(dirs[i])) {
                                        // add file
                                        to_be_watched.files.push(dirs[i]);
                                    }
                                }
                            }
                        }
                        resolve();
                    });
                });
            }

            // adding the watchers to the appropiate files and dirs
            function startWartching(to_be_watched) {
                console.log('startWartching');
                for( let i=0; i<to_be_watched.files.length; i++ ){
                    let watcher_path = path.join(project.root_path, to_be_watched.files[i]);
                    let watcher = watch(watcher_path, { recursive: false });
                    active_watchers.push(watcher);

                    watcher.on('change', function(evt, name) {
                        if (evt == 'update' || evt == 'remove') {
                            console.log('auto deploying', to_be_watched.files[i]);
                            mainWindow.webContents.send('auto_deploy_start', project._id);
                        }
                    });

                    watcher.on('error', function(err) {
                        console.log('error occured on watcher for', to_be_watched.files[i]);
                        watcher.close();
                        console.log(`watcher for ${to_be_watched.files[i]} killed`);
                    });
                }

                for( let i=0; i<to_be_watched.dirs.length; i++ ){
                    let watcher_path = path.join(project.root_path, to_be_watched.dirs[i]);
                    let watcher = watch(watcher_path, { recursive: true });
                    active_watchers.push(watcher);

                    watcher.on('change', function(evt, name) {
                        if (evt == 'update' || evt == 'remove') {
                            console.log('auto deploying', to_be_watched.dirs[i]);
                            mainWindow.webContents.send('auto_deploy_start', project._id);
                        }
                    });

                    watcher.on('error', function(err) {
                        console.log('error occured on watcher for', to_be_watched.dirs[i]);
                        watcher.close();
                        console.log(`watcher for ${to_be_watched.dirs[i]} killed`);
                    });
                }
            }

            // kill any existing watchers
            function killWatchers() {
                return new Promise((resolve, reject) => {
                    if( active_watchers.length > 0 ) {
                        // iter over active in reverse for popping
                        for( let i=active_watchers.length; i>0; i--) {
                            // get the codemned 
                            let watcher_to_kill = active_watchers.pop();
                            // check if the condemned is guilty
                            if( !watcher_to_kill.isClosed() ){
                                // pass justice LOLs
                                watcher_to_kill.close();
                            }

                            if( active_watchers.length === 0 ) {
                                resolve(true)
                            }
                        }
                    } else {
                        resolve(true)
                    }
                });
            }

            killWatchers()
                .then(() => {
                    compileDirsToBeWatched(project)
                        .then(() => {
                            startWartching(to_be_watched)
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                })
        });
    },

    checkGitBranches: (projects) => {
        for( let i=0; i<projects.length; i++ ){
            // get current branch
            branch(projects[i].root_path)
                .then((name) => {
                    //  check branch
                    if(name != projects[i].git_branch) {
                        // update branch and replace doc in db with updated
                        updated_project = projects[i];
                        updated_project.git_branch = name;
                        db.Projects.update({_id: projects[i]._id}, updated_project, {}, function (err, numReplaced) {
                            if(err) {throw err}
                            console.log('updated ')
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    },

    remove: (project_id) => {
        return new Promise((resolve, reject) => {
            db.Projects.remove({ _id: project_id }, {}, function (err, numRemoved) {
                if(err) { 
                    reject(new Error('Failed to remove project'));
                }
                resolve('Project removed');
            });
        });
    }
};

module.exports = (controller);
