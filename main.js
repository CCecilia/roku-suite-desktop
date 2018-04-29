const pug = require('electron-pug')({pretty: true});
const url = require('url');
const path = require('path');
const {app, BrowserWindow, Menu,  MenuItem, ipcMain, ipcRenderer} = require('electron');
const projectController = require('./lib/controllers/projectController');
const rokuController = require('./lib/controllers/rokuController');
const userController = require('./lib/controllers/userController');
const mongoose = require('mongoose');
const async = require('async');
const Project = require('./models/project')

let mainWindow;
let mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Sign-in',
                click() {
                    userController.createSignInWindow();
                }
            },
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
function test() {

}


// database setup
const mongoDB = 'mongodb://localhost:27017/rokuSuite';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

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
                click() {
                    let sign_out = {
                        label: 'Sign Out',
                        click() {
                            userController.signOut()
                        }
                    }
                    console.log(mainMenuTemplate[1].submenu[0]);
                }
            }
        ]
    })
}

// listen for app to be ready
app.on('ready', () => {
    // create new window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'public', 'brs_icon.ico')
    });

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
        mainWindow.webContents.send('new_roku', new_roku);
    })
    .catch((err) => {
        // update main window
        mainWindow.webContents.send('error', err);
    });
});

// handle new user
ipcMain.on('new_user_data', (e, new_user_data) => {
    // save
    userController.saveNewUser(new_user_data)
    .then((new_user) => {
        // update Menu

        // update main window
        mainWindow.webContents.send('new_user', new_user);
    })
    .catch((err) => {
        // update main window
        mainWindow.webContents.send('error', err);
    });
});
