/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 * brackets-jasmine - a jasmine brackets plugin
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, jasmine, requirejs */

define(function (require, exports, module) {
    'use strict';

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus"),
        EditorManager  = brackets.getModule("editor/EditorManager"),
        Resizer        = brackets.getModule("utils/Resizer"),
        NativeFileSystem = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        FileUtils      = brackets.getModule("file/FileUtils"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        COMMAND_ID = "JasmineNode.JasmineNode",
        tmpFileCounter = 0,
        reporterInitialized = false,
        currentResult = '',
        currentFile = '';
    // load unmodified jasmine-1.3.1.js into jasmine global variable
    require('./jasmine-node/jasmine-1.3.1');
    //require('./jasmine-node/jasmine-html');
    var jasmineEnv = jasmine;
    var reporter = require('jasmine-node/reporter');
    // TerminalReporter callback, save all results to currentResult
    function myprinter(data) {
        currentResult += data.replace('\n', '<br>');
    }

    // after jasmine completes set value of currentResult to window
    function done(runner, log) {
        $("#stuff").empty().append(currentResult);
        currentResult = '';
        var jasmineEnv = jasmine.getEnv();
        runner = jasmineEnv.currentRunner_;
        runner.queue = new jasmine.Queue(runner.env);
        runner.suites_ = [];
    }
    
    /*
     *  when Run Jasmine menu is selected run test
     *  - write contents of current buffer to a temporary file
     *    since require will not reload the file if it has been changed since
          the last time the test was run.
        - load the temp file using require(tmpFile)
        - add a reporter once to collect the results
        - call jasmine.getEnv().execute() to run the test
        - when the test finishes running the done callback will run
     */
    function runJasmine() {
        var extdir = ExtensionUtils.getModulePath(module, '');
        var editor = EditorManager.getCurrentFullEditor();
        if (!editor) {
            console.log("jasmine: no window is selected");
            return;
        }
        var $jasmine = $("#jasmine");
        $jasmine.show();
        Resizer.makeResizable($('#jasmine').get(0), "vert", "top", 150);
        EditorManager.resizeEditor();
        var fullpath = editor.document.file.fullPath;
        currentFile = editor.document.file.name;
        $("#jasminetitle").empty().append("Jasmine: " + currentFile);
        var text = editor.document.getText();
        var tmpFile = extdir + 'tmpfile' + tmpFileCounter;
        tmpFileCounter += 1;
        var tmpFileEntry = new NativeFileSystem.FileEntry(tmpFile);
        FileUtils.writeText(tmpFileEntry, text).done(function () {
            requirejs([tmpFile], function () {
                var jasmineEnv = jasmine.getEnv();
                if (reporterInitialized === false) {
                    jasmineEnv.addReporter(new reporter.jasmineNode.TerminalVerboseReporter({print: myprinter, onComplete: done}));
                    reporterInitialized = true;
                }
                jasmineEnv.execute();
            });
        }).fail(function (err) {
            console.log("Error writing text: " + err.name);
        });
    }

    // register the extensions and add Run Jasmine under Navigate menu
    CommandManager.register("Run Jasmine", COMMAND_ID, runJasmine);
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(COMMAND_ID);

    //add an html window for results, hide it initially
    var content =          '  <div id="jasmine" class="bottom-panel">'
                         + '  <div class="toolbar simple-toolbar-layout">'
                         + '  <div id="jasminetitle">Jasmine</div><a href="#" class="close">&times;</a>'
                         + '  </div>'
                         + '  <div id="stuff"/>'
                         + '  </div>';
    $(content).insertBefore("#status-bar");

    $('#jasmine').hide();
    $('#jasmine .close').click(function () { $('#jasmine').hide();
        EditorManager.resizeEditor();
         });
});
