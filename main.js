// modules
const pug = require('electron-pug')({pretty: true});
const url = require('url');
const path = require('path');
const {app, BrowserWindow, Menu,  MenuItem, ipcMain, ipcRenderer} = require('electron');
const async = require('async');
// controllers
const projectController = require('./lib/controllers/projectController');
const rokuController = require('./lib/controllers/rokuController');
const toolController = require('./lib/controllers/toolController');
// DB config
const db = require('./lib/config/database')

let mainWindow;
let mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {role: 'minimize'},
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Projects',
        submenu: [
            {
                label: 'Add',
                accelerator: process.platform == 'darwin' ? 'Command+A' : 'Ctrl+A',
                click() {
                    projectController.createAddProjectWindow();
                }
            }
        ]
    },
    {
        label: 'Rokus',
        submenu: [
            {
                label: 'Add',
                click() {
                    rokuController.createAddRokuWindow();
                }
            }
        ]
    }
];

// fix menu spacing on mac
if( process.platform == 'darwin' ) {
    mainMenuTemplate.unshift({});
}

// add dev tools if not in production
if( process.env.NODE_ENV !== 'production' ) {
    mainMenuTemplate.push({
        label:  'development',
        submenu: [
            {
                 label: 'toogle dev tools',
                 accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                 click(item, focusedWindow) {
                     focusedWindow.toggleDevTools();
                 }
            },
            {
                role: 'reload'
            },
            {
                label: 'Test',
                // to quickly test dev functions
                click() {
                    console.log('test')
                }
            }
        ]
    })
}


app.on('ready', () => {
    // async gather init data
    async.parallel({
        projects: (callback) => {
            db.Projects.find()
            .exec(callback);
        },
        rokus: (callback) => {
            db.Rokus.find()
            .exec(callback);
        },
        keyLogs: (callback) => {
            db.KeyLogLists.find()
            .sort({'date_created': 1})
            .exec(callback);
        }
    }, function(err, results){
        // create new window
        mainWindow = new BrowserWindow({
            width: 800,
            height: 620,
            icon: path.join(__dirname, 'public', 'brs_icon.ico')
        });

        mainWindow.init_data = {
            projects: results.projects,
            rokus: results.rokus,
            key_logs: results.keyLogs
        };

        // load html file into app
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'views', 'mainWindow.pug'),
            protocol: 'file:',
            slashes: true
        }));

        // quit app on close
        mainWindow.on('closed', () => app.quit());

        // build menu from template
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

        // insert Menu
        Menu.setApplicationMenu(mainMenu);
    });
});

// handle new project
ipcMain.on('new_project', (e, new_project_data) => {
    // save
    projectController.saveNewProject(new_project_data)
    .then((new_project) => {
        // update main window
        mainWindow.webContents.send('new_project', new_project);
    })
    .catch((err) => {
        // update main window
        mainWindow.webContents.send('error', err);
    });
});

// handle new roku
ipcMain.on('new_roku_data', (e, new_roku_data) => {
    // save
    rokuController.saveNewRoku(new_roku_data)
    .then((new_roku) => {
        // update main window
        mainWindow.init_data.rokus.push(new_roku);
        mainWindow.reload();
    })
    .catch((err) => {
        // update main window
        mainWindow.webContents.send('error', err);
    });
});

// handle deploy
ipcMain.on('deploy_data', (e, deploy_data) => {
    rokuController.deploy(deploy_data)
    .then((deploy_status) => {
        // update main window
        mainWindow.webContents.send('deploy_status', deploy_status);
    })
    .catch((err) => {
        // update main window
        mainWindow.webContents.send('error', err);
    });
});

// handle key logger toggle
ipcMain.on('key_logger', (e, key_logger) => {
    if( key_logger.open ) {
        toolController.openLoggerWindow();
    } else {
        toolController.closeLoggerWindow();
    }
});

// handle updating key window from main
ipcMain.on('key_log', (e, key) => {
    toolController.updateKeyLog(key);
});

// how to handle new key log list
ipcMain.on('key_log_data', (e, key_log_data) => {
    toolController.saveKeyLogList(key_log_data)
    .then((new_key_log) => {
        // update main window
        // mainWindow.webContents.send('new_project', new_project);
    })
    .catch((err) => {
        // update main window
        mainWindow.webContents.send('error', err);
    });
});
