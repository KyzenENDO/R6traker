const { app, BrowserWindow, globalShortcut, ipcMain, screen, net, shell, desktopCapturer, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const Tesseract = require('tesseract.js');
const { uIOhook } = require('uiohook-napi');

// URL vers le fichier JSON de version hébergé en ligne (à modifier par votre URL de production sur GitHub)
const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/KyzenENDO/R6traker/main/version.json';

function checkForUpdates() {
    return new Promise((resolve) => {
        const request = net.request(VERSION_CHECK_URL);
        
        request.on('response', (response) => {
            let body = '';
            response.on('data', (chunk) => {
                body += chunk;
            });
            
            response.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const currentVersion = app.getVersion();
                    const latestVersion = data.latestVersion;
                    
                    if (isOutdated(currentVersion, latestVersion)) {
                        if (data.mandatory) {
                            dialog.showMessageBoxSync({
                                type: 'error',
                                title: 'Mise à jour obligatoire',
                                message: `Une mise à jour importante (v${latestVersion}) est requise pour utiliser R6 Tracker.`,
                                detail: 'L\'application va s\'ouvrir dans votre navigateur pour installer la mise à jour et se fermer.',
                                buttons: ['Télécharger la mise à jour']
                            });
                            
                            shell.openExternal(data.downloadUrl).then(() => {
                                app.quit();
                            });
                            resolve(false);
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Erreur lors du traitement de la mise à jour:', err);
                }
                resolve(true);
            });
        });
        
        request.on('error', (err) => {
            console.error('Erreur lors de la vérification de mise à jour:', err);
            resolve(true); // Permet le démarrage si pas de connexion internet
        });
        
        request.end();
    });
}

function isOutdated(current, latest) {
    const currParts = current.split('.').map(Number);
    const lateParts = latest.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (lateParts[i] > currParts[i]) return true;
        if (lateParts[i] < currParts[i]) return false;
    }
    return false;
}

// ─── Fix crash "saturation mémoire tampon" sur Windows 11 ───
// Désactive l'accélération GPU hardware (cause fréquente de buffer overrun)
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

// Gestion des erreurs non capturées pour éviter les crash silencieux
process.on('uncaughtException', (err) => {
    console.error('Erreur non capturée:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('Promise rejetée:', err);
});

let mainWindow, overlayWindow;
let overlayVisible = true;
let overlayLocked = true;

const configPath = path.join(__dirname, 'overlay-config.json');

function loadConfig() {
    try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
    catch { return {}; }
}

function saveConfig(cfg) {
    try { fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2)); }
    catch { /* ignore */ }
}

/* ── Main window (Control Panel) ───────────────── */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 900,
        minHeight: 600,
        title: 'R6 Tracker',
        backgroundColor: '#0a0b0f',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('index.html');

    // ── Exclure la fenêtre du Tracker des captures d'écran et flux vidéo (anti-auto-capture OCR) ──
    if (typeof mainWindow.setContentProtection === 'function') {
        mainWindow.setContentProtection(true);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.close();
    });
}

/* ── Overlay window (transparent, always-on-top) ── */
function createOverlayWindow() {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    const cfg = loadConfig();

    overlayWindow = new BrowserWindow({
        width: 1000,
        height: 500,
        x: cfg.x ?? Math.floor((width - 1000) / 2),
        y: cfg.y ?? 20,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    overlayWindow.loadFile('overlay.html');
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');

    // ── Exclure l'overlay des captures également pour un rendu propre ──
    if (typeof overlayWindow.setContentProtection === 'function') {
        overlayWindow.setContentProtection(true);
    }

    overlayWindow.on('closed', () => { overlayWindow = null; });
    overlayWindow.on('moved', () => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
            const [x, y] = overlayWindow.getPosition();
            saveConfig({ ...loadConfig(), x, y });
        }
    });
}

/* ── App lifecycle ─────────────────────────────── */
app.whenReady().then(async () => {
    const proceed = await checkForUpdates();
    if (!proceed) return;

    createMainWindow();
    createOverlayWindow();

    /* F7 — Quick Win (updates overlay instantly) */
    globalShortcut.register('F7', () => {
        mainWindow?.webContents.send('quick-result', 'win');
    });

    /* F8 — Quick Loss (updates overlay instantly) */
    globalShortcut.register('F8', () => {
        mainWindow?.webContents.send('quick-result', 'loss');
    });

    /* N — Capture le tableau de score et lance le scan OCR */
    globalShortcut.register('N', () => {
        if (!overlayWindow) return;

        if (!overlayVisible) {
            overlayVisible = true;
            overlayWindow.showInactive();
            mainWindow?.webContents.send('overlay-visibility', overlayVisible);
            overlayWindow?.webContents.send('overlay-visibility', overlayVisible);
        }

        console.log('[Shortcut] Touche N → Lancement du scan OCR du tableau de score');
        scanScoreboardOCR();
    });

    uIOhook.start(); // toujours actif pour d'autres usages futurs

    /* F10 — Lock / Unlock overlay (click-through vs draggable) */
    globalShortcut.register('F10', () => {
        if (!overlayWindow) return;
        overlayLocked = !overlayLocked;
        if (overlayLocked) {
            overlayWindow.setIgnoreMouseEvents(true, { forward: true });
        } else {
            overlayWindow.setIgnoreMouseEvents(false);
            overlayWindow.focus();
        }
        overlayWindow.webContents.send('overlay-locked', overlayLocked);
        mainWindow?.webContents.send('overlay-locked', overlayLocked);
    });

    // Init Tesseract worker
    try {
        matchPollerWorker = await Tesseract.createWorker('eng', 1, {
            logger: m => {} // suppress logs for background polling
        });
    } catch (e) {
        console.error("Failed to init Tesseract worker", e);
    }

    // Start game watcher 3 seconds after app launch
    setTimeout(() => {
        checkR6Process(); // Initial check
        r6WatcherInterval = setInterval(checkR6Process, 6000); // Poll every 6s
    }, 3000);
});

/* ── IPC ───────────────────────────────────────── */
ipcMain.on('update-overlay', (_, data) => {
    overlayWindow?.webContents.send('overlay-data', data);
});

ipcMain.on('get-overlay-status', (event) => {
    event.reply('overlay-status-reply', { visible: overlayVisible, locked: overlayLocked });
});

ipcMain.on('open-external-url', (_, url) => {
    shell.openExternal(url);
});

ipcMain.on('trigger-manual-scan', () => {
    scanScoreboardOCR();
});

ipcMain.handle('list-displays', async () => {
    const allDisplays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    const displays = allDisplays.map(d => ({
        id: d.id.toString(),
        width: d.bounds.width,
        height: d.bounds.height,
        primary: d.id === primary.id
    }));
    const cfg = loadConfig();
    return { displays, selectedIndex: cfg.screenIndex || 0 };
});

ipcMain.on('set-display-index', (_, index) => {
    const cfg = loadConfig();
    cfg.screenIndex = index;
    saveConfig(cfg);
    console.log(`[Config] Écran de capture défini sur l'index ${index}`);
});

ipcMain.handle('capture-screen-frame', async () => {
    try {
        const { screen } = require('electron');
        const cfg = loadConfig();
        const screenIdx = cfg.screenIndex || 0;
        
        const allDisplays = screen.getAllDisplays();
        const mainDisplay = allDisplays[screenIdx] || allDisplays[0];
        const displayIdStr = mainDisplay.id.toString();
        
        // Résolution suffisante pour l'OCR de fond, extrêmement rapide
        const sources = await desktopCapturer.getSources({ 
            types: ['screen'], 
            thumbnailSize: { width: 1280, height: 720 } 
        });
        
        let source = sources.find(s => s.display_id === displayIdStr);
        if (!source) source = sources[screenIdx] || sources[0];
        
        return source ? source.thumbnail.toDataURL() : null;
    } catch (err) {
        console.error('[Capture] Erreur capture-screen-frame:', err);
        return null;
    }
});

let matchPollerWorker = null;

let isAnalyzingFrame = false;
ipcMain.on('analyze-match-frame', async (_, frameData) => {
    if (!matchPollerWorker || isAnalyzingFrame) return;
    isAnalyzingFrame = true;
    try {
        const result = await matchPollerWorker.recognize(frameData);
        // Bug fix: was using undefined 'text' — must use result.data.text
        const rawText = (result.data && result.data.text) ? result.data.text.toUpperCase() : '';
        const normalizedText = rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        let detected = null;
        if (normalizedText.includes('VICTORY') || normalizedText.includes('VICTOIRE') || normalizedText.includes('MATCH WON')) {
            detected = 'win';
        } else if (normalizedText.includes('DEFEAT') || normalizedText.includes('DEFAITE') || normalizedText.includes('MATCH LOST')) {
            detected = 'loss';
        }

        if (detected) {
            mainWindow?.webContents.send('auto-match-result', detected);
        }
    } catch (err) {
        // ignore errors
    } finally {
        isAnalyzingFrame = false;
    }
});

/* ── IPC: Quick result from overlay buttons ─── */
ipcMain.on('record-quick-result', (_, result) => {
    // Forward to main control panel (win/loss/draw)
    mainWindow?.webContents.send('quick-result', result);
});

/* ── R6 Siege Process Watcher ─────────────────── */
let r6IsRunning = false;
let r6WatcherInterval = null;

function checkR6Process() {
    // R6 Siege utilise RainbowSix.exe ou RainbowSix_Vulkan.exe
    exec('tasklist /FI "IMAGENAME eq RainbowSix*" /NH /FO CSV 2>NUL', (err, stdout) => {
        if (err) return;
        const nowRunning = stdout.toLowerCase().includes('rainbowsix');
        if (nowRunning !== r6IsRunning) {
            r6IsRunning = nowRunning;
            mainWindow?.webContents.send('r6-game-status', { running: r6IsRunning });
            overlayWindow?.webContents.send('r6-game-status', { running: r6IsRunning });

            // When game is running: allow mouse on overlay so buttons can be clicked
            // When game stops: restore locked click-through state
            if (overlayWindow && !overlayWindow.isDestroyed()) {
                if (r6IsRunning && overlayLocked) {
                    // Allow mouse for the quick result panel area only
                    overlayWindow.setIgnoreMouseEvents(false);
                } else if (!r6IsRunning && overlayLocked) {
                    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
                }
            }

            console.log(`[R6 Watcher] Jeu ${r6IsRunning ? 'DÉMARRÉ ✅' : 'FERMÉ ❌'}`);
        }
    });
}

// Le watcher de processus R6 est démarré dans le bloc d'initialisation principal ci-dessus

/* ── Scrapers Headless (R6 Tracker) ────────────────── */
// Contournement Cloudflare via Electron BrowserWindow
const SCRAPER_TIMEOUT = 25000;

ipcMain.handle('fetch-player-stats-headless', async (_, playerName, platform = 'pc') => {
    return new Promise((resolve) => {
        let scraperWindow = new BrowserWindow({
            show: false,
            webPreferences: { nodeIntegration: false, contextIsolation: true }
        });

        const timer = setTimeout(() => {
            if (scraperWindow && !scraperWindow.isDestroyed()) scraperWindow.destroy();
            resolve({ error: 'Timeout: Le chargement a pris trop de temps.' });
        }, SCRAPER_TIMEOUT);

        scraperWindow.webContents.on('did-finish-load', async () => {
            try {
                if (scraperWindow.isDestroyed()) return;
                const data = await scraperWindow.webContents.executeJavaScript(`
                    new Promise((resolve) => {
                        let attempts = 0;
                        const interval = setInterval(() => {
                            attempts++;
                            const title = document.title || '';
                            // Wait until it's not Cloudflare
                            if (!title.includes('Just a moment') && !title.includes('Attention Required')) {
                                clearInterval(interval);
                                // Extra wait for React to hydrate the stats
                                setTimeout(() => {
                                    resolve({ html: document.body.innerHTML, url: window.location.href });
                                }, 3000);
                            } else if (attempts > 30) {
                                clearInterval(interval);
                                resolve({ error: 'Cloudflare challenge non résolu.' });
                            }
                        }, 500);
                    });
                `);
                
                clearTimeout(timer);
                if (scraperWindow && !scraperWindow.isDestroyed()) scraperWindow.destroy();
                resolve(data);
            } catch (err) {
                clearTimeout(timer);
                if (scraperWindow && !scraperWindow.isDestroyed()) scraperWindow.destroy();
                resolve({ error: err.message });
            }
        });

        const platformKey = platform === 'xbox' ? 'xbl' : platform === 'psn' ? 'psn' : 'ubi';
        scraperWindow.loadURL(`https://r6.tracker.network/r6siege/profile/${platformKey}/${encodeURIComponent(playerName)}/overview`, {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    });
});

ipcMain.handle('fetch-leaderboard-headless', async () => {
    return new Promise((resolve) => {
        let scraperWindow = new BrowserWindow({
            show: false,
            webPreferences: { nodeIntegration: false, contextIsolation: true }
        });

        const timer = setTimeout(() => {
            if (scraperWindow && !scraperWindow.isDestroyed()) scraperWindow.destroy();
            resolve({ error: 'Timeout' });
        }, SCRAPER_TIMEOUT);

        scraperWindow.webContents.on('did-finish-load', async () => {
            try {
                if (scraperWindow.isDestroyed()) return;
                const data = await scraperWindow.webContents.executeJavaScript(`
                    new Promise((resolve) => {
                        let attempts = 0;
                        const interval = setInterval(() => {
                            attempts++;
                            const title = document.title || '';
                            // Wait until it's not Cloudflare
                            if (!title.includes('Just a moment') && !title.includes('Attention Required')) {
                                clearInterval(interval);
                                // Extra wait for React to hydrate leaderboard table
                                setTimeout(() => {
                                    resolve({ html: document.body.innerHTML, url: window.location.href });
                                }, 3000);
                            } else if (attempts > 40) {
                                clearInterval(interval);
                                resolve({ error: 'Cloudflare challenge non résolu.' });
                            }
                        }, 500);
                    });
                `);
                
                clearTimeout(timer);
                if (scraperWindow && !scraperWindow.isDestroyed()) scraperWindow.destroy();
                resolve(data);
            } catch (err) {
                clearTimeout(timer);
                if (scraperWindow && !scraperWindow.isDestroyed()) scraperWindow.destroy();
                resolve({ error: err.message });
            }
        });

        scraperWindow.loadURL('https://r6.tracker.network/r6siege/leaderboards/pc/Ranked/SkillRating', {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    });
});

/* ── OCR Scoreboard Scanner ─────────────────────── */
let isScanningOCR = false;

async function scanScoreboardOCR() {
    if (isScanningOCR) return;
    isScanningOCR = true;
    
    // Notify frontend that scan started
    mainWindow?.webContents.send('ocr-status', { status: 'scanning' });
    console.log('[OCR] Début de la capture d\'écran...');

    // ── Cacher la fenêtre du Tracker pour éviter l'auto-capture ──
    // L'UI du Tracker contient "Victoire", "Défaite" etc. que l'OCR peut lire
    const wasVisible = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible();
    if (wasVisible) mainWindow.hide();
    // Petit délai pour que la fenêtre soit bien cachée avant la capture
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        const { nativeImage, screen } = require('electron');
        const cfg = loadConfig();
        const screenIdx = cfg.screenIndex || 0;
        
        const allDisplays = screen.getAllDisplays();
        const mainDisplay = allDisplays[screenIdx] || allDisplays[0];
        
        // Obtenir la résolution native (en prenant en compte le zoom Windows/DPI)
        const nativeWidth = Math.round(mainDisplay.bounds.width * mainDisplay.scaleFactor);
        const nativeHeight = Math.round(mainDisplay.bounds.height * mainDisplay.scaleFactor);

        const sources = await desktopCapturer.getSources({ 
            types: ['screen'], 
            thumbnailSize: { width: nativeWidth, height: nativeHeight } 
        });
        
        // Trouver la source qui correspond exactement à l'écran choisi
        const displayIdStr = mainDisplay.id.toString();
        let source = sources.find(s => s.display_id === displayIdStr);
        if (!source) source = sources[screenIdx] || sources[0];

        const imgBuffer = source.thumbnail.toPNG();

        // ── Restaurer la fenêtre du Tracker (sans voler le focus du jeu) ──
        if (wasVisible && mainWindow && !mainWindow.isDestroyed()) mainWindow.showInactive();
        
        // ── Recadrage ajusté (v9) ──
        // X = 0.31 → Parfait pour le début du texte
        // Y = 0.32 → Parfait pour couper "DEF / ATT"
        // W = 0.17 → Assez large
        // H = 0.42 → Coupe pile à la fin de la 10ème ligne du tableau (retire le texte du bas)
        const fullImg = nativeImage.createFromBuffer(imgBuffer);
        const fullSize = fullImg.getSize();
        const cropX      = Math.round(fullSize.width  * 0.31);
        const cropY      = Math.round(fullSize.height * 0.32);
        const cropWidth  = Math.round(fullSize.width  * 0.17);
        const cropHeight = Math.round(fullSize.height * 0.42); // ← Encore un peu réduit
        const croppedImg = fullImg.crop({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
        const croppedBuffer = croppedImg.toPNG();

        // 🔍 DEBUG : sauvegarde le crop pour vérifier visuellement
        const debugPath = require('path').join(require('os').tmpdir(), 'r6_ocr_debug.png');
        require('fs').writeFileSync(debugPath, croppedBuffer);
        console.log(`[OCR] Debug crop sauvegardé → ${debugPath}`);

        mainWindow?.webContents.send('ocr-status', { status: 'processing' });
        console.log(`[OCR] Image capturée et recadrée (${cropWidth}x${cropHeight}). Début de la lecture...`);

        const result = await Tesseract.recognize(croppedBuffer, 'eng+fra', {
            logger: m => console.log(`[OCR] ${m.status} ${Math.round(m.progress * 100)}%`)
        });
        // Clean and extract names
        // R6 names: 3-15 chars, letters (including accented), numbers, dash, underscore, dot.
        const lines = result.data.text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        
        const blacklist = [
            // --- Mots UI R6 Siege (tableau de score) ---
            'DEF', 'ATT', 'ATK', 'SON', 'BON',
            'CLIQUEZ', 'INTERAGIR', 'CLASSEMENT', 'INTERACT',
            'VOTRE', 'EQUIPE', 'ENNEMIE', 'PARTIE', 'MANCHE',
            // --- Stats colonnes ---
            'SCORE', 'KILLS', 'DEATHS', 'ASSISTS', 'PING', 'KDA', 'KD',
            // --- UI générale R6 ---
            'MATCH', 'ROUND', 'TEAM', 'BLUE', 'ORANGE', 'RANKED', 'UNRANKED',
            'DEFEND', 'ATTACK', 'DEFENSE', 'ATTAQUE', 'PLAYER', 'PLAYERS', 'VS',
            'WIN', 'LOSS', 'VICTOIRE', 'DEFAITE', 'SURRENDER', 'ABANDON',
            'UBISOFT', 'CONNECT', 'MENU', 'OPTIONS', 'QUIT', 'RETOUR', 'QUITTER',
            'ACCUEIL', 'BOUTIQUE', 'AGENTS', 'JOUER', 'PACKS',
            'BATTLE', 'PASS', 'BOOST', 'FPS', 'LATENCY', 'VERSION',
            'RAPPORT', 'ALLIE', 'ENNEMI', 'BLEU', 'CHAT', 'MUTE', 'SIGNALER', 'PROFIL',
            'NIVEAU', 'LEVEL', 'EXP', 'RENOMMEE', 'RENOWN', 'ALPHA', 'BRAVO',
            'TICKET', 'VOTER', 'EXCLURE', 'BANNIR', 'DRONE', 'OTAGE',
            'SECURISATION', 'TAB', 'ESC', 'SPACE', 'ENTER', 'SHIFT', 'CTRL', 'ALT',
            'BACK', 'NEXT', 'PREV', 'PAGE', 'UP', 'DOWN', 'LEFT', 'RIGHT',
            'CLICK', 'MOUSE', 'KEYBOARD', 'PAD', 'START', 'SELECT', 'HOME',
            'XBOX', 'PLAYSTATION', 'NINTENDO', 'PC', 'WINDOWS', 'MAC', 'LINUX',
            'STEAM', 'EPIC', 'UPLAY', 'ORIGIN', 'NET', 'GOG', 'DISCORD',
            'TWITCH', 'YOUTUBE', 'REDDIT', 'GOOGLE', 'AMAZON',
            'OUI', 'NON', 'YES', 'NO', 'ON', 'OFF', 'TRUE', 'FALSE',
            'WINS', 'LOSSES', 'TOTAL', 'PHASE', 'TIMER', 'TEMPS', 'TIME',
            'MORT', 'DEAD', 'ALIVE', 'VIVANT', 'PREP', 'ACTION',
            'HEADSHOT', 'MELEE', 'GADGET', 'GRENADE', 'FLASH', 'SMOKE',
            'ARMOR', 'SPEED', 'HEALTH', 'POINTS', 'DAMAGE',
            'PLANTED', 'DEFUSED', 'OVERTIME', 'PROLONGATION', 'DEBUTANT',
            'CUIVRE', 'BRONZE', 'ARGENT', 'SILVER', 'GOLD', 'PLATINE', 'PLATINUM',
            'DIAMANT', 'DIAMOND', 'CHAMPION', 'EMERALD', 'COPPER',
            'SAISON', 'SEASON', 'OPERATION', 'LOADING', 'CHARGEMENT',
            'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN',
            'OUR', 'OUT', 'HAS', 'HIS', 'HOW', 'ITS', 'LET', 'MAY', 'NEW',
            'WHO', 'DID', 'GET', 'HIT', 'SET', 'TOP', 'USE', 'SAY', 'SHE',
            'AVEC', 'DANS', 'POUR', 'PLUS', 'SANS', 'SOUS', 'TOUT', 'TRES',
            'BIEN', 'MERCI', 'AIDE', 'INFO', 'DETAILS', 'STATS', 'STAT',
            // --- Noms de cartes R6 ---
            'MAISON', 'VILLA', 'BANK', 'CLUB', 'KAFE', 'SKYSCRAPER',
            'COASTLINE', 'BORDER', 'CONSULATE', 'FAVELA', 'HEREFORD',
            'KANAL', 'OREGON', 'PLANE', 'CHALET', 'THEME', 'TOWER', 'YACHT',
            'NIGHTHAVEN', 'EMERALD', 'STADIUM', 'FORTRESS', 'LAIR', 'CLOSE',
        ];
        
        // R6 names: jusqu'à 20 chars, alphanumériques, tirets, underscores, points.
        // Les points font partie des vrais pseudos (ex: K.Y.Z.E.N.)
        const nameRegex = /^[a-zA-Z0-9_\-\.]{3,20}$/;
        let candidates = new Set();

        lines.forEach(line => {
            const words = line.split(/\s+/);
            words.forEach(w => {
                // Enlève uniquement les symboles parasites en début/fin
                let cleanWord = w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9_\-.]+$/g, '');
                
                // ⚠️ ON ENLÈVE LES 4 POINTS DE SUSPENSION À LA FIN !
                // Le jeu ajoute "...." quand c'est trop long. 
                // Ton vrai pseudo Ubisoft est K.Y.Z.E.N, donc on supprime ces points finaux parasites.
                cleanWord = cleanWord.replace(/\.{2,}$/, '');

                // 🪄 CORRECTION SPÉCIALE POUR TOI : Si l'OCR rate le premier point et lit KY.ZEN
                if (cleanWord === 'KY.ZEN' || cleanWord === 'K.Y.ZEN' || cleanWord === 'KY.Z.E.N') {
                    cleanWord = 'K.Y.Z.E.N';
                }

                // On garde les points normaux (ex: K.Y.Z.E.N)
                if (cleanWord.length >= 3 && cleanWord.length <= 20) {
                    if (nameRegex.test(cleanWord) && !blacklist.includes(cleanWord.toUpperCase())) {
                        // Doit contenir au moins 2 lettres (évite les nombres purs comme "630")
                        if ((cleanWord.match(/[a-zA-Z]/g) || []).length >= 2) {
                            candidates.add(cleanWord);
                        }
                    }
                }
            });
        });

        const finalNames = Array.from(candidates);
        console.log('[OCR] Noms détectés:', finalNames);
        
        mainWindow?.webContents.send('ocr-results', finalNames);

        // --- Win/Loss detection: scan the FULL image (not the cropped one) ---
        // VICTOIRE/DEFAITE text appears outside the name column
        const fullResult = await Tesseract.recognize(imgBuffer, 'fra', {
            logger: m => {} // Silent, no need to log this pass
        });
        const upperText = fullResult.data.text.toUpperCase();
        const normalizedText2 = upperText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let detectedResult = null;
        if (normalizedText2.includes('VICTOIRE') || normalizedText2.includes('VICTORY') || normalizedText2.includes('MATCH WON')) {
            detectedResult = 'win';
            console.log('[OCR] Résultat détecté: VICTOIRE');
        } else if (normalizedText2.includes('DEFAITE') || normalizedText2.includes('DEFEAT') || normalizedText2.includes('MATCH LOST')) {
            detectedResult = 'loss';
            console.log('[OCR] Résultat détecté: DÉFAITE');
        }
        if (detectedResult) {
            mainWindow?.webContents.send('auto-match-result', detectedResult);
        }

    } catch (err) {
        console.error('[OCR] Erreur:', err);
        mainWindow?.webContents.send('ocr-status', { status: 'error', error: err.message });
        // Restaurer la fenêtre en cas d'erreur
        if (wasVisible && mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
            mainWindow.showInactive();
        }
    } finally {
        isScanningOCR = false;
    }
}

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
