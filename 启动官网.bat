@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 翡翠战境服务器官网
echo 官网地址：http://192.168.101.17:8088
echo 保持此窗口开启。按 Ctrl+C 可关闭官网服务。
start "" "http://localhost:8088"
python server.py
