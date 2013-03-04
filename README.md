brackets-jasmine
===========

A jasmine extension to run any jasmine test file directly in Brackets.

Installation
===========

1. Find your extensions folder by going to "Help -> Show Extensions Folder"
2. Extract the .zip to your Brackets extension directory
3. Start Brackets and create a jasmine test file to unit test your javascript api
4. Select Navigate/Run Jasmine Test
5. The results will appear in a window below your jasmine test source code

Usage
=====

The intended use is when you are writing jasmine unit tests.  The extensions
gives you quick feedback when writing testcases.  

Implementation Notes
============

The extension runs any jasmine testcase directly against jasmine-1.3.1.js similar
to how jasmine-node runs a testcase without using html.  Jasmine is loaded using 
require.js.  The test file is loaded using require.js.  The test is then started
by running jasmine.getEnv().execute().

I am interested in investigating whether the brackets node support can run jasmine
using jasmine-node.  It would be easier to use jasmine-node directly in the node
server.  Also lots of similar tools have node modules so they could also be 
integrated into brackets using node.

Change Log
=========

03-04-2013 Initial commit