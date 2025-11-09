@echo off
echo 正在下载前端依赖文件，以解决浏览器跟踪防护问题...

REM 创建js和css目录
if not exist "lib" mkdir lib
if not exist "lib\css" mkdir lib\css
if not exist "lib\js" mkdir lib\js

REM 下载Font Awesome CSS
echo 下载Font Awesome CSS文件...
powershell -Command "Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' -OutFile 'lib\css\font-awesome.css'"

REM 下载Supabase JS
echo 下载Supabase JS文件...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js' -OutFile 'lib\js\supabase.js'"

echo 下载完成！现在需要更新index.html文件来使用本地文件。
pause