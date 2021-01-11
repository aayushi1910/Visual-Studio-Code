const{app,BrowserWindow} = require('electron');
const reload = require('electron-reload');
const path = require('path')
//const monaco = require('monaco-editor');

function createWindow(){
    const win = new BrowserWindow({
        width : 800,
        height : 600,
        slow : false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('index.html').then(function(){
        win.removeMenu();
        win.maximize();
        win.show();
        win.webContents.openDevTools();
    });
}

reload(__dirname, {
    electron: path.join(__dirname, 'node_modules/.bin/electron.cmd')
});

app.on('window-all-clodes', () =>{
    if(process.platform !== 'darwin'){
        app.quit();
    }
});

app.on('activate', () =>{
    if(BrowserWindow.getAllWindows().length === 0){
        createWindow();
    }
})                       //activate function required only in mac

app.allowRendererProcessReuse = false;
app.whenReady().then(createWindow);