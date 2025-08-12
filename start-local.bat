@echo off
echo 🚀 正在启动 RSAG 课题组网站本地测试环境...
echo.

:: 检查是否安装了 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查是否安装了 npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 npm
    echo 请确保 npm 已正确安装
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo ✅ npm 已安装
echo.

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    echo.
)

echo 🌟 启动本地测试服务器...
echo.
echo 📋 测试信息:
echo    管理后台: http://localhost:3000/admin/login.html
echo    前端网站: http://localhost:3000/index.html
echo    管理员账号: admin / rsag2025!
echo    编辑员账号: editor / rsag_edit2025
echo.
echo 💡 提示: 按 Ctrl+C 停止服务器
echo.

:: 启动服务器
npm start

pause
