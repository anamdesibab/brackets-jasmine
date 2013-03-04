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

    // TerminalReporter callback, save all results to currentResult
    function myprinter(data) {
        currentResult += data;
    }

    // after jasmine completes set value of currentResult to window
    function done(runner, log) {
        $("#stuff").empty().append(currentResult.replace('\n', '<br>'));
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
                    jasmineEnv.addReporter(new jasmine.TerminalReporter({print: myprinter, onComplete: done}));
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
    var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
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

    // AppInit.htmlReady() has already executed before extensions are loaded
    // so, for now, we need to call this ourself
  
  // todo: dschaffe should figure out how to reuse the TerminalReporter from
  // jasmine-node source instead of reimplementing it below
    var jasmineNode = jasmine;
    jasmineNode.TerminalReporter = function (config) {
        this.print_ = config.print || console.log;
        this.color_ = config.color ? this.ANSIColors : this.NoColors;

        this.started_ = false;
        this.finished_ = false;

        this.callback_ = config.onComplete || false;

        this.suites_ = [];
        this.specResults_ = {};
        this.failures_ = [];
    };

    jasmineNode.TerminalReporter.prototype = {
        reportRunnerStarting: function (runner) {
            var i;
            this.started_ = true;
            this.startedAt = new Date();
            var suites = runner.topLevelSuites();
            for (i = 0; i < suites.length; i++) {
                var suite = suites[i];
                this.suites_.push(this.summarize_(suite));
            }
        },

        ANSIColors: {
            pass:    function () { return ''; }, // Green
            fail:    function () { return ''; }, // Red
            neutral: function () { return '';  }  // Normal
        },

        NoColors: {
            pass:    function () { return ''; },
            fail:    function () { return ''; },
            neutral: function () { return ''; }
        },

        summarize_: function (suiteOrSpec) {
            var isSuite = suiteOrSpec instanceof jasmine.Suite;

      // We could use a separate object for suite and spec
            var summary = {
                id: suiteOrSpec.id,
                name: suiteOrSpec.description,
                type: isSuite ? 'suite' : 'spec',
                suiteNestingLevel: 0,
                children: []
            };

            if (isSuite) {
                var calculateNestingLevel = function (examinedSuite) {
                    var nestingLevel = 0;
                    while (examinedSuite.parentSuite !== null) {
                        nestingLevel += 1;
                        examinedSuite = examinedSuite.parentSuite;
                    }
                    return nestingLevel;
                };

                summary.suiteNestingLevel = calculateNestingLevel(suiteOrSpec);

                var children = suiteOrSpec.children();
                var i = 0;
                for (i = 0; i < children.length; i++) {
                    summary.children.push(this.summarize_(children[i]));
                }
            }

            return summary;
        },

    // This is heavily influenced by Jasmine's Html/Trivial Reporter
        reportRunnerResults: function (runner) {
            this.reportFailures_();
            var results = runner.results();
            var resultColor = (results.failedCount > 0) ? this.color_.fail() : this.color_.pass();

            var specs = runner.specs();
            var specCount = specs.length;

            var message = "\n\nFinished in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + " seconds";
            this.printLine_(message);
            this.printLine_(this.stringWithColor_(this.printRunnerResults_(runner), resultColor));
            this.finished_ = true;
            if (this.callback_) { this.callback_(runner); }
        },

        reportFailures_: function () {
            if (this.failures_.length === 0) {
                return;
            }

            var indent = '  ', failure;
            this.printLine_('\n');

            this.print_('Failures:');
            var i;
            for (i = 0; i < this.failures_.length; i++) {
                failure = this.failures_[i];
                this.printLine_('\n');
                this.printLine_('  ' + (i + 1) + ') ' + failure.spec);
                this.printLine_('   Message:');
                this.printLine_('     ' + this.stringWithColor_(failure.message, this.color_.fail()));
                this.printLine_('   Stacktrace:');
                this.print_('     ' + failure.stackTrace);
            }
        },

        reportSuiteResults: function (suite) {
        // Not used in this context
        },

        reportSpecResults: function (spec) {
            var result = spec.results();
            var msg = '';
            if (result.passed()) {
                msg = this.stringWithColor_('.', this.color_.pass());
            } else {
                msg = this.stringWithColor_('F', this.color_.fail());
                this.addFailureToFailures_(spec);
            }
            this.spec_results += msg;
            this.print_(msg);
        },

        addFailureToFailures_: function (spec) {
            var result = spec.results();
            var failureItem = null;

            var items_length = result.items_.length;
            var i;
            for (i = 0; i < items_length; i++) {
                if (result.items_[i].passed_ === false) {
                    failureItem = result.items_[i];

                    var failure = {
                        spec: spec.suite.getFullName() + " " + spec.description,
                        message: failureItem.message,
                        stackTrace: failureItem.trace.stack
                    };

                    this.failures_.push(failure);
                }
            }
        },

        printRunnerResults_: function (runner) {
            var results = runner.results();
            var specs = runner.specs();
            var msg = '';
            msg += specs.length + ' test' + ((specs.length === 1) ? '' : 's') + ', ';
            msg += results.totalCount + ' assertion' + ((results.totalCount === 1) ? '' : 's') + ', ';
            msg += results.failedCount + ' failure' + ((results.failedCount === 1) ? '' : 's') + '\n';
            return msg;
        },

      // Helper Methods //
        stringWithColor_: function (stringValue, color) {
            return (color || this.color_.neutral()) + stringValue + this.color_.neutral();
        },

        printLine_: function (stringValue) {
            this.print_(stringValue);
            this.print_('\n');
        }
    };
});