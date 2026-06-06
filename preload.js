const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('r6api', {
    /* Control panel → Overlay */
    updateOverlay: (data) => ipcRenderer.send('update-overlay', data),
    getOverlayStatus: () => ipcRenderer.send('get-overlay-status'),

    /* Listeners (used by both windows) */
    onOverlayData:       (cb) => ipcRenderer.on('overlay-data',       (_, d) => cb(d)),
    onOverlayLocked:     (cb) => ipcRenderer.on('overlay-locked',     (_, v) => cb(v)),
    onOverlayVisibility: (cb) => ipcRenderer.on('overlay-visibility', (_, v) => cb(v)),
    onOverlayStatusReply:(cb) => ipcRenderer.on('overlay-status-reply',(_, d) => cb(d)),
    onQuickResult:       (cb) => ipcRenderer.on('quick-result',       (_, r) => cb(r)),

    /* Game process status */
    onR6GameStatus:      (cb) => ipcRenderer.on('r6-game-status',     (_, s) => cb(s)),

    /* Overlay → Main: record result directly from overlay buttons */
    recordQuickResult:   (result) => ipcRenderer.send('record-quick-result', result),

    /* OCR */
    onOcrStatus:         (cb) => ipcRenderer.on('ocr-status',         (_, s) => cb(s)),
    onOcrResults:        (cb) => ipcRenderer.on('ocr-results',        (_, r) => cb(r)),
    onAutoMatchResult:   (cb) => ipcRenderer.on('auto-match-result',  (_, r) => cb(r)),

    /* Scrapers Headless */
    fetchPlayerStatsHeadless: (playerName, platform) => ipcRenderer.invoke('fetch-player-stats-headless', playerName, platform),
    fetchLeaderboardHeadless: () => ipcRenderer.invoke('fetch-leaderboard-headless'),
    
    /* Auto-Tracker Desktop Capturer */
    captureScreenFrame: () => ipcRenderer.invoke('capture-screen-frame'),
    analyzeMatchFrame: (frameData) => ipcRenderer.send('analyze-match-frame', frameData),
    
    /* Utilities */
    openExternalUrl: (url) => ipcRenderer.send('open-external-url', url),
    triggerManualScan: () => ipcRenderer.send('trigger-manual-scan'),

    /* Display selection */
    listDisplays: () => ipcRenderer.invoke('list-displays'),
    setDisplayIndex: (index) => ipcRenderer.send('set-display-index', index),
});
