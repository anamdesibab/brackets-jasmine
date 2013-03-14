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
 * brackets-jasmine - a brackets plugin to run jasmine unit tests
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, jasmine, requirejs */

define(function (require, exports, module) {
    'use strict';

    var AppInit             = brackets.getModule("utils/AppInit"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        Menus               = brackets.getModule("command/Menus"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        ProjectManager      = brackets.getModule("project/ProjectManager");

    var moduledir           = FileUtils.getNativeModuleDirectoryPath(module),
        templateEntry       = new NativeFileSystem.FileEntry(moduledir + '/html/jasmineReportTemplate.html'),
        reportEntry         = new NativeFileSystem.FileEntry(moduledir + '/node/reports/jasmineReport.html'),
        COMMAND_ID          = "BracketsJasmine.BracketsJasmine",
        JASMINE_CMD         = "jasmine_cmd",
        projectMenu         = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU),
        menuItems           = [],
        nodeConnection      = null,
        buildMenuItem       = null;

    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }

    AppInit.appReady(function () {
        nodeConnection = new NodeConnection();
        function connect() {
            var connectionPromise = nodeConnection.connect(true);
            connectionPromise.fail(function () {
                console.error("[brackets-jasmine] failed to connect to node");
            });
            return connectionPromise;
        }

        function loadJasmineDomain() {
            var path = ExtensionUtils.getModulePath(module, "node/JasmineDomain");
            var loadPromise = nodeConnection.loadDomains([path], true);
            loadPromise.fail(function () {
                console.log("[brackets-jasmine] failed to load jasmine domain");
            });
            return loadPromise;
        }

        $(nodeConnection).on("jasmine.update", function (evt, jsondata) {
            FileUtils.readAsText(templateEntry).done(function (text, timestamp) {
                jsondata = jsondata.replace(/'/g, "");
                var data = JSON.parse(jsondata);
                var index = text.indexOf("%jsondata%");
                text = text.substring(0, index) + jsondata + text.substring(index + 10);
                index = text.indexOf("%time%");
                var totaltime = 0;
                var i;
                for (i = 0; i < data.length; i++) {
                    totaltime = totaltime + parseFloat(data[i].time);
                }
                text = text.substring(0, index) + totaltime + text.substring(index + 6);
                FileUtils.writeText(reportEntry, text).done(function () {
                    window.open(reportEntry.fullPath);
                });
            });
        });

        chain(connect, loadJasmineDomain);
    });

    function runJasmine() {
        var entry = ProjectManager.getSelectedItem();
        nodeConnection.domains.jasmine.runTest(entry.fullPath)
            .fail(function (err) {
                console.log("[brackets-jasmine] error running file: "+entry.fullPath+" message: "+err.toString());
            });
    }

    function _isSpec(fileEntry) {
        return fileEntry && (fileEntry.name.indexOf(".spec.js") == fileEntry.name.length-8 || 
                             (fileEntry.fullPath.indexOf("/spec/") >=0 && fileEntry.name.indexOf(".js") == fileEntry.name.length-3 ));
    }
    CommandManager.register("Run Jasmine Unit Test", JASMINE_CMD, function () {
        runJasmine();
    });
    $(projectMenu).on("beforeContextMenuOpen", function (evt) {
        var selectedEntry = ProjectManager.getSelectedItem();
        projectMenu.removeMenuItem(JASMINE_CMD);
        if (_isSpec(selectedEntry)) {
            projectMenu.addMenuItem(JASMINE_CMD, "", Menus.LAST);
        }
    });
});
