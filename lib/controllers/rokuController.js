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

    compileZip: (project_root_path, zipPaths, roku) => {
        return new Promise((resolve, reject) => {
            // create a file to stream archive data to.
            let outPath = path.join(__dirname, '../..', 'out');
            let output = fs.createWriteStream(outPath + '/archive.zip');
            let archive = archiver('zip');

            // listen for all archive data to be written
            output.on('close', function() {
                // sends zip once zip is finalized
                controller.sendZipToRoku(roku)
                .then(() => {
                    console.log('responded');
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
            for( let i=0; i<zipPaths.dirs.length; i++ ) {
                archive.directory(path.join(project_root_path, zipPaths.dirs[i]), zipPaths.dirs[i]);
            }

            // add files to zip
            for( let i=0; i<zipPaths.files.length; i++ ) {
                archive.append(fs.createReadStream(path.join(project_root_path, zipPaths.files[i])), {name: zipPaths.files[i]});
            }

            // complete
            resolve(archive);
        });
    },

    requestCallback: (error, response, body) => {
        if ((response !== undefined) && (response.statusCode !== undefined) && (response.statusCode === 200)) {
            if (response.body.indexOf("Identical to previous version -- not replacing.") !== -1) {
                // return atom.notifications.addWarning("Deploy cancelled by Roku: the package is identical to the package already on the Roku.");
                return console.log("Deploy cancelled by Roku: the package is identical to the package already on the Roku.");
            } else {
                // return atom.notifications.addSuccess(`Deployed to ${module.exports.rokuName}@${module.exports.rokuIP}`);
                return console.log("Successfully deployed");
            }
        } else {
            // atom.notifications.addFatalError(`Failed to deploy to ${module.exports.rokuName}@${module.exports.rokuIP} see console output for details.`);
            console.log(error);
            if (response !== undefined) {
                return console.log(response.body);
            }
        }
    },

    sendZipToRoku: (roku) => {
        return new Promise((resolve, reject) => {
            console.log('sending...')
            request()
            // make request to roku
            console.log(path.join(__dirname, '../..', 'out', 'archive.zip'));
            let connection = {
                url : `http://${roku.ip_address}/plugin_install`,
                formData : {
                    mysubmit : 'Replace',
                    archive : fs.createReadStream(path.join(__dirname, '../..', 'out', 'archive.zip'))
                }
            };
            request.post(connection, controller.requestCallback).auth(roku.username, roku.password, false);
        });
    },

    deploy: (deploy_data) => {
        return new Promise((resolve, reject) => {
            async.parallel({
                project: (callback) => {
                    db.Projects.findOne({_id: deploy_data.project_id})
                    .exec(callback);
                },
                roku: (callback) => {
                    db.Rokus.findOne({_id: deploy_data.roku_id})
                    .exec(callback);
                }
            }, function(err, results){
                if(err) {
                    console.log(err);
                    reject(err);
                }

                let project = results.project;
                var roku = results.roku;
                let zipPaths = {
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
                                zipPaths.dirs.push(dirs[i]);
                            } else {
                                // check if file is an excluded file
                                if( !project.excluded_file_paths.includes(dirs[i])) {
                                    // add file
                                    zipPaths.files.push(dirs[i]);
                                }
                            }
                        }
                    }
                    // compile zip
                    controller.compileZip(project.root_path, zipPaths, roku)
                    .then((archive) => {
                        // finalize zip file upon compilation
                        archive.finalize();

                        console.log('archive finalized');

                    }).catch((err) => {
                        // notfiy error
                        console.log(err);
                        reject(new Error);
                    });
                });
            });
        });
    },
};

module.exports = (controller);
