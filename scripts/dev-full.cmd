@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
echo.
echo === Link-Help: API + 웹 함께 실행 ===
echo    server\.env 에 VAPID 가 있어야 API가 뜹니다. (server\.env.example 참고)
echo.
if not exist "server\node_modules\" (
  echo [1/2] 서버 패키지 설치: npm run server:install
  call npm run server:install
  if errorlevel 1 exit /b 1
)
echo [2/2] npm run dev:full  (종료: Ctrl+C)
call npm run dev:full
pause
