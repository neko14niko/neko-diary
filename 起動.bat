@echo off
cd /d %~dp0
start http://localhost:56628
node server.js
