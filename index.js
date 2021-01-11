const $ = jQuery = require('jquery');
require('jquery-ui-dist/jquery-ui');
require('jstree');
let nodePath = require("path");
const fs = require('fs');
const os = require('os');
const Terminal = require('xterm').Terminal;
var pty = require('node-pty');
const { FitAddon } = require('xterm-addon-fit')

$(document).ready(async function () {

    // Initialize node-pty with an appropriate shell
    const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
    });

    // Initialize xterm.js and attach it to the DOM
    const xterm = new Terminal({

        fontSize: 12
        // default is canvas
    });
    xterm.setOption('theme', {
        background: "#764ba2",
        foreground: "white",
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(document.getElementById('terminal'));
    fitAddon.fit();
    
    // Setup communication between xterm.js and node-pty
    xterm.onData(data => ptyProcess.write(data));
    ptyProcess.on('data', function (data) {
        xterm.write(data);
    });

    let editor = await createEditor();
    //console.log(editor);

    let currPath = process.cwd();    //gives path of current directory
    //console.log(currPath);

    //------------------------
    //creating tabs
    let tabs = $("#tabs").tabs();
    //---------------------------

    let data = [];
    let baseobj = {
        id: currPath,      //id should be diff for each node so we have given file names for every node since they are diff from each other
        parent: "#",       // # denotes that the node is root node
        text: getNameFromPath(currPath)     //we have to get just the file or folder name from the complete path
    }
    data.push(baseobj);

    let rootChildren = getCurrentDirectories(currPath);      //returns array of root's children
    data = data.concat(rootChildren);       //adds array in another array
    //console.log(rootChildren);

    $("#jstree").jstree({
        "core": {
            "check_callback": true,
            "data": data
        }
    }).on('open_node.jstree', function (e, data) {
        //console.log(data.node.children);

        data.node.children.forEach(function (child) {
            let childDirectories = getCurrentDirectories(child);      //gives children of root's children ,i.e., root's grandchildren

            childDirectories.forEach(function (directory) {
                $('#jstree').jstree().create_node(child, directory, "last");    //three fields in creating new node --> parent name, , where to add child(first or last)
            })
        })
    }).on('select_node.jstree', function (e, data) {
        console.log(data.node.id);
        if (fs.lstatSync(data.node.id).isFile()) {
            openFile(data.node.id);
            updateEditor(data.node.id);
        }

    })

    function openFile(path) {

        let fileName = getNameFromPath(path);
        let label = fileName;
        tabid = fileName;
        let tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
        li = $(tabTemplate.replace(/#\{href\}/g, "#" + tabid).replace(/#\{label\}/g, label));

        tabs.find(".ui-tabs-nav").append(li);
        tabs.append("<div id='" + tabid + "'></div>");
        tabs.tabs("refresh");
    }

    function updateEditor(path) {

        let fileName = getNameFromPath(path);
        let fileExtension = fileName.split('.')[1];
        if (fileExtension === 'js')
            fileExtension = 'javascript'

        let data = fs.readFileSync(path).toString();
        // console.log(data);
        // console.log(editor);
        editor.setValue(data);

        monaco.editor.setModelLanguage(editor.getModel(), fileExtension);
    }
})

function getNameFromPath(path) {
    return nodePath.basename(path);
}

function getCurrentDirectories(path) {
    if (fs.lstatSync(path).isFile()) {     //if the current path is a file(no children) then return empty array
        return [];
    }

    let files = fs.readdirSync(path);
    console.log(files);

    let rv = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        rv.push({
            id: nodePath.join(path, file),
            parent: path,
            text: file
        })
    }

    return rv;
}

function createEditor() {

    return new Promise(function (resolve, reject) {
        let monacoLoader = require("./node_modules/monaco-editor/min/vs/loader.js");
        monacoLoader.require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' } });

        monacoLoader.require(['vs/editor/editor.main'], function () {
            monaco.editor.defineTheme('myTheme', {
                base: 'vs',
                inherit: true,
                rules: [{ background: 'EDF9FA' }],
                colors: {
                    'editor.foreground': '#000000',
                    'editor.background': '#1e2024',
                    'editorCursor.foreground': '#8B0000',
                    'editor.lineHighlightBackground': '#0000FF20',
                    'editorLineNumber.foreground': '#008800',
                    'editor.selectionBackground': '#88000030',
                    'editor.inactiveSelectionBackground': '#88000015'
                }
            });
            monaco.editor.setTheme('myTheme');
            var editor = monaco.editor.create(document.getElementById('editor'), {
                value: [
                    'function x() {',
                    '\tconsole.log("Hello world!");',
                    '}'
                ].join('\n'),
                language: 'javascript',
                theme: 'myTheme'
            });

            resolve(editor);
        });

    })
}



// npm install --save-dev jstree
// npm install --save-dev jquery
// npm install monaco-editor
// npm install --save-dev os
// npm install --save-dev xterm
// npm install --save-dev node-pty
// npm install jquery-ui-dist