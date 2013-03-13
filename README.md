brackets-jasmine
===========

A jasmine extension to run any jasmine test file directly in Brackets.

Installation
===========

1. Find your extensions folder by going to "Help -> Show Extensions Folder"
2. Extract the .zip to your Brackets extension directory
3. Start Brackets and create a jasmine test file to unit test your javascript api
4. Right click on the jasmine file (with .spec in the filename), select Run Jasmine Unit Test
5. The results will appear in new window

Usage
=====

The intended use is when you are writing jasmine unit tests.  The extensions
gives you quick feedback when writing testcases.

Implementation Notes
============

The extensions uses the node server to run jasmine-node.  A jasmine unit test is
detected by having ".spec" in the file name.

Change Log
=========

03-12-2013 Initial commit