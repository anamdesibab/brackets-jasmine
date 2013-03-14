brackets-jasmine
===========

A jasmine extension to run a jasmine test file in Brackets and see the html jasmine results.

Installation
===========

1. Find your extensions folder by going to "Help -> Show Extensions Folder"
2. Extract the .zip to your Brackets extension directory
3. Start Brackets and create a jasmine test file to unit test your javascript api
4. Right click on the jasmine file (a jasmine file is either in a spec/ directory or ends with .spec.js)
5. Select Run Jasmine Unit Test from the context menu
6. The results will appear in new window

Usage
=====

The intended use is when you are writing jasmine unit tests.  The extension
gives you quick feedback when writing testcases.

For a quick test open the samples directory in the brackets-jasmine extension directory.  Right
click on each of the sample-fail.spec.js, sample-pass.spec.js, sample.spec.js files.  Select
"Run Jasmine Unit Test" and you will see the jasmine test report open up in a new window. 

Implementation Notes
============

The extensions uses the node server to run jasmine-node.  The node server uses jasmine-node and 
xml2js files unmodified.  A jasmine unit test is detected by ending with ".spec.js" in the file
name or is in specs/ directory.

Let me know if you have any suggestions or issues.  Contact me at: dschaffe@adobe.com.

Change Log
=========

03-13-2013 Initial commit