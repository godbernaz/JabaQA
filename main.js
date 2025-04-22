const { app, BrowserWindow, ipcMain } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');

// Definir a variável de ambiente para desativar o aviso de symlinks do Hugging Face
process.env.HF_HUB_DISABLE_SYMLINKS_WARNING = 'true';

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    win.loadFile('index.html');

    // Listeners para os botões da barra de título
    ipcMain.on('minimize-window', () => {
        win.minimize();
    });

    ipcMain.on('maximize-window', () => {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });

    ipcMain.on('close-window', () => {
        win.close();
    });

    // Listener para avaliar traduções
    ipcMain.handle('evaluate-translation', async (event, sourceTexts, targetTexts) => {
        try {
            return await new Promise((resolve, reject) => {
                const options = {
                    mode: 'text',
                    pythonPath: process.platform === 'win32' ? path.join(__dirname, 'scripts', 'venv', 'Scripts', 'python.exe') : path.join(__dirname, 'scripts', 'venv', 'bin', 'python'),
                    scriptPath: path.join(__dirname, 'scripts'),
                };

                const pyshell = new PythonShell('evaluate_translation.py', options);

                const data = { source: sourceTexts, target: targetTexts };
                pyshell.send(JSON.stringify(data));

                pyshell.on('message', (message) => {
                    console.log('evaluate_translation.py message:', message); // Log para depuração
                    try {
                        const result = JSON.parse(message);
                        resolve(result);
                    } catch (err) {
                        reject(new Error(`Failed to parse evaluation result: ${err.message}`));
                    }
                });

                pyshell.on('error', (err) => {
                    console.error('evaluate_translation.py error:', err);
                    reject(err);
                });

                pyshell.end((err) => {
                    if (err) reject(err);
                });
            });
        } catch (err) {
            throw new Error(`Failed to evaluate translation: ${err.message}`);
        }
    });

    // Listener para traduzir textos
    ipcMain.handle('translate-text', async (event, payload) => {
        try {
            return await new Promise((resolve, reject) => {
                const options = {
                    mode: 'text',
                    pythonPath: process.platform === 'win32' ? path.join(__dirname, 'scripts', 'venv', 'Scripts', 'python.exe') : path.join(__dirname, 'scripts', 'venv', 'bin', 'python'),
                    scriptPath: path.join(__dirname, 'scripts'),
                };

                const pyshell = new PythonShell('translate.py', options);

                // Enviar os textos e os idiomas
                const data = {
                    source: payload.texts,
                    sourceLang: payload.sourceLang,
                    targetLang: payload.targetLang
                };
                console.log('Sending to translate.py:', data); // Log para depuração
                pyshell.send(JSON.stringify(data));

                pyshell.on('message', (message) => {
                    console.log('translate.py message:', message); // Log para depuração
                    try {
                        const result = JSON.parse(message);
                        resolve(result);
                    } catch (err) {
                        reject(new Error(`Failed to parse translation result: ${err.message}`));
                    }
                });

                pyshell.on('error', (err) => {
                    console.error('translate.py error:', err);
                    reject(err);
                });

                pyshell.end((err) => {
                    if (err) reject(err);
                });
            });
        } catch (err) {
            throw new Error(`Failed to translate text: ${err.message}`);
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});