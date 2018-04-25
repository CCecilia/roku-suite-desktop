const url = require('url');
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain} = require('electron');

let mainWindow;
let mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'quit',
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
                    console.log('add project');
                }
            }
        ]
    }
]
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
        icon: `${__dirname}/public/brs_icon.ico`
    });

    // load html file into app
    mainWindow.loadURL(url.format({
        pathname: `${__dirname}/views/mainWindow.html`,
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
