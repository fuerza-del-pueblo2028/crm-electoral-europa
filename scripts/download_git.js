const https = require('https');
const fs = require('fs');
const url = 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/Git-2.47.1-64-bit.exe';
const file = fs.createWriteStream("git-installer.exe");

console.log("Iniciando descarga de Git...");

const request = https.get(url, function (response) {
    if (response.statusCode === 302 || response.statusCode === 301) {
        console.log("Redirigiendo a:", response.headers.location);
        https.get(response.headers.location, function (newResponse) {
            newResponse.pipe(file);
            file.on('finish', function () {
                file.close();
                console.log("Descarga completada.");
            });
        });
    } else {
        response.pipe(file);
        file.on('finish', function () {
            file.close();
            console.log("Descarga completada.");
        });
    }
});

request.on('error', function (err) {
    fs.unlink("git-installer.exe");
    console.error("Error en la descarga:", err.message);
});

