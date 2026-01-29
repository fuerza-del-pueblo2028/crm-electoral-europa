@echo off
echo Limpiando build anterior...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

echo Construyendo proyecto...
call npm run build

echo Build completado!
echo Archivos listos en carpeta 'out'
echo Ahora sube TODA la carpeta 'out' a Hostinger
pause
