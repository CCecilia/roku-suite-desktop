const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const Roku = require('../../models/roku');
const db = require('../../lib/config/database');
const async = require('async');
const fs = require('fs');
const archiver = require('archiver');
const request = require('request');

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

    /**
    * @function saveNewRoku saves a new roku to local db.
    * @param Object Should contain values for name, root_path, excluded_file_paths, and git_branch
    * @return Promise Return a promise object containing the new_project doc.
    * @version 1.0.0
    */
    saveNewRoku: (new_roku_data) => {
        return new Promise((resolve, reject) => {
            let new_roku = new Roku(
                new_roku_data.ip_address,
                new_roku_data.device_name,
                new_roku_data.username,
                new_roku_data.password
            );

            // save new roku
            db.Rokus.insert(new_roku, function(err, doc) {
                if(err) {
                    reject(new Error('failed to save new roku'));
                }

                // close add window
                addRokuWindow.close();
                resolve(new_roku);
            });
        });
    },

    compileZip: (project_root_path, zip_paths, rokus, main_window) => {
        return new Promise((resolve, reject) => {
            // create a file to stream archive data to.
            let outPath = path.join(__dirname, '../..', 'out');
            
            if( !fs.existsSync(outPath) ) {
                fs.mkdirSync(outPath);
            }

            let output = fs.createWriteStream(outPath + '/archive.zip');
            let archive = archiver('zip');

            // listen for all archive data to be written
            output.on('close', function() {
                // sends zip once zip is finalized
                main_window.webContents.send('notificationData', {title: 'SideLoading', msg: "Deployment started", notification_type: 'info'});
                controller.sendZipToRokus(rokus, main_window)
                    .then(() => {
                        resolve(true);
                    })
                    .catch((err) => {
                        reject(new Error('failure in sendZipToRoku '));
                    });
            });

            // handle archiver errors
            archive.on('error', function(err) {
                // throw err;
                reject(new Error('error compiling zip'));
            });

            // pipe archive data to the file
            archive.pipe(output);

            // add dirs to zip
            for( let i=0; i<zip_paths.dirs.length; i++ ) {
                archive.directory(path.join(project_root_path, zip_paths.dirs[i]), zip_paths.dirs[i]);
            }

            // add files to zip
            for( let i=0; i<zip_paths.files.length; i++ ) {
                archive.append(fs.createReadStream(path.join(project_root_path, zip_paths.files[i])), {name: zip_paths.files[i]});
            }

            // complete
            resolve(archive);
        });
    },

    sendZipToRokus: (rokus, main_window) => {
        return new Promise((resolve, reject) => {
            function sendZip(roku) {
                return new Promise((resolve, reject) => {
                    function requestCallback(error, response, body){
                        if ((response !== undefined) && (response.statusCode !== undefined) && (response.statusCode === 200)) {
                            if (response.body.indexOf('Identical to previous version -- not replacing.') !== -1) {
                                main_window.webContents.send('notificationData', {title: 'SideLoading', msg: `Sideload cancelled by ${roku.device_name}: the package is identical to the package already on the Roku.`});
                                resolve(true);
                            } else if(response.body.indexOf('Install Failure: No space left on device') !== -1) {
                                main_window.webContents.send('notificationData', {title: 'SideLoading', msg: `Install Failure: No space left on ${roku.device_name}. :(`});
                                resolve(true);
                            } else {
                                main_window.webContents.send('notificationData', {title: 'SideLoading', msg: `Successfully deployed to ${roku.device_name}`});
                                resolve(true);
                            }
                        } else {
                            if (response !== undefined) {
                                main_window.webContents.send('error', new Error(`Failed to deploy to ${roku.device_name} see console output for details.`));                                
                                resolve(true);
                            }
                        }
                    }

                    // make request to roku
                    let connection = {
                        url : `http://${roku.ip_address}/plugin_install`,
                        formData : {
                            mysubmit : 'Replace',
                            archive : fs.createReadStream(path.join(__dirname, '../..', 'out', 'archive.zip'))
                        }
                    };
                    request.post(connection, requestCallback).auth(roku.username, roku.password, false);
                });
            }

            let counter = 0;
            sendZip(rokus[counter])
                .then(() => {
                    if( counter !== rokus.length - 1 ) {
                        counter++;
                        sendZip(rokus[counter]);                        
                    } else {
                        resolve({msg: 'Done all sideloads', notification_type: 'info'})
                    }
                })
                .catch((error) => {
                    if( counter !== rokus.length - 1 ) {
                        counter++;
                        sendZip(rokus[counter]);                        
                    } else {
                        resolve({msg: 'Done all sideloads', notification_type: 'info'})
                    }
                });
        });
    },

    deploy: (deploy_data, main_window) => {
        return new Promise((resolve, reject) => {
            async.parallel({
                project: (callback) => {
                    db.Projects.findOne({_id: deploy_data.project_id})
                    .exec(callback);
                },
                rokus: (callback) => {
                    db.Rokus.find({_id: {
                        $in:
                            deploy_data.roku_ids
                        }
                    })
                    .exec(callback);
                }
            }, function(err, results){
                if(err) {
                    console.log(err);
                    reject(err);
                }

                let project = results.project;
                var rokus = results.rokus;
                let zip_paths = {
                    dirs: [],
                    files: []
                };

                // get required file paths/compile zip
                fs.readdir(project.root_path, function(err, dirs) {
                    for (let i=0; i<dirs.length; i++) {
                        // exclude hidden dirs
                        if ( dirs[i][0] !== '.' ) {
                            // add project dirs
                            if( fs.lstatSync(path.join(project.root_path, dirs[i])).isDirectory() ) {
                                zip_paths.dirs.push(dirs[i]);
                            } else {
                                // check if file is an excluded file
                                if( !project.excluded_file_paths.includes(dirs[i])) {
                                    // add file
                                    zip_paths.files.push(dirs[i]);
                                }
                            }
                        }
                    }
                    // compile zip
                    controller.compileZip(project.root_path, zip_paths, rokus, main_window)
                        .then((archive) => {
                            // finalize zip file upon compilation
                            // listener for this event is compileZip().output.on('close')
                            archive.finalize();
                        }).catch((err) => {
                            // notfiy error
                            console.log(err);
                            reject(new Error);
                        });
                });
            });
        });
    },

    remove: (roku_id) => {
        return new Promise((resolve, reject) => {
            db.Rokus.remove({ _id: roku_id }, {}, function (err, numRemoved) {
                if(err) { 
                    reject(new Error('Failed to remove Roku'));
                }

                resolve('Roku removed');
            });
        });
    }
};

module.exports = (controller);
