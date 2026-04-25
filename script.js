let zCounter = 200;
const winState = {}; 

function getWin(id) { return document.getElementById(id); }

function setTaskbarState(id, state) {
    const map = { 
        'equipo-window': 'ti-equipo', 
        'papelera-window': 'ti-papelera', 
        'about-window': 'ti-about', 
        'owo-window': 'ti-owo', 
        'taskmgr-window': 'ti-taskmgr', 
        'personalize-window': 'ti-personalize', 
        'player-window': 'ti-player', 
        'messenger-window': 'ti-messenger',
        'calculator-window': 'ti-calculator',
        'paint-window': 'ti-paint',
        'terminal-window': 'ti-terminal'
    };
    const btn = document.getElementById(map[id]);
    if (btn) {
        btn.classList.toggle('active-window', state);
        if (id === 'papelera-window' || id === 'personalize-window' || id === 'player-window' || 
            id === 'calculator-window' || id === 'paint-window' || id === 'terminal-window') {
            btn.style.display = state ? 'flex' : 'none';
        }
    }
}

function focusWindow(win) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    win.style.zIndex = ++zCounter;
}

function openWindow(id) {
    const win = getWin(id);
    if (!win) return;

    if (!winState[id]) {
        winState[id] = { minimized: false, maximized: false };
    }
    winState[id].minimized = false;

    win.classList.remove('minimized');
    win.classList.add('open');
    focusWindow(win);
    setTaskbarState(id, true);
}

function closeWindow(id) {
    const win = getWin(id);
    if (!win) return;
    win.classList.remove('open', 'minimized', 'focused');
    setTaskbarState(id, false);
    if (winState[id]) winState[id].minimized = false;

    const openWins = Array.from(document.querySelectorAll('.window.open:not(.minimized)'));
    if (openWins.length > 0) {
        openWins.sort((a,b) => parseInt(a.style.zIndex || 0) - parseInt(b.style.zIndex || 0));
        focusWindow(openWins[openWins.length - 1]);
    }
}

function minimizeWindow(id) {
    const win = getWin(id);
    if (!win) return;
    win.classList.add('minimized');
    win.classList.remove('focused');
    setTaskbarState(id, false);
    if (winState[id]) winState[id].minimized = true;

    const openWins = Array.from(document.querySelectorAll('.window.open:not(.minimized)'));
    if (openWins.length > 0) {
        openWins.sort((a,b) => parseInt(a.style.zIndex || 0) - parseInt(b.style.zIndex || 0));
        focusWindow(openWins[openWins.length - 1]);
    }
}

function maximizeWindow(id) {
    const win = getWin(id);
    if (!win) return;
    const s = winState[id] || (winState[id] = {});

    if (!s.maximized) {
        s.prevLeft = win.style.left; s.prevTop = win.style.top;
        s.prevW = win.style.width; s.prevH = win.style.height;
        win.style.left = '0'; win.style.top = '0';
        win.style.width = '100%'; win.style.height = 'calc(100% - 40px)';
        win.style.resize = 'none';
        s.maximized = true;
    } else {
        win.style.left = s.prevLeft; win.style.top = s.prevTop;
        win.style.width = s.prevW; win.style.height = s.prevH;
        win.style.resize = 'both';
        s.maximized = false;
    }
}

function toggleWindow(id) {
    const win = getWin(id);
    if (!win) return;
    const s = winState[id] || {};

    if (!win.classList.contains('open')) {
        openWindow(id);
    } else if (s.minimized) {
        openWindow(id);
    } else if (win.classList.contains('focused')) {
        minimizeWindow(id);
    } else {
        focusWindow(win);
    }
}

function toggleDesktop() {
    const windows = document.querySelectorAll('.window.open');
    const anyVisible = [...windows].some(w => !w.classList.contains('minimized'));
    windows.forEach(w => {
        const id = w.id;
        if (anyVisible) { minimizeWindow(id); }
        else { openWindow(id); }
    });
}

function makeDraggable(win) {
    const tb = win.querySelector('.title-bar');
    let drag = false, ox, oy, startX, startY;

    tb.addEventListener('mousedown', e => {
        if (e.target.closest('.title-bar-controls')) return;
        drag = true;
        startX = e.clientX;
        startY = e.clientY;
        const r = win.getBoundingClientRect();
        ox = e.clientX - r.left; oy = e.clientY - r.top;
        focusWindow(win);
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!drag) return;

        if (winState[win.id] && winState[win.id].maximized) {
            if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
                const ratio = e.clientX / window.innerWidth;
                maximizeWindow(win.id);
                ox = Math.round(ratio * win.offsetWidth);
            } else {
                return; 
            }
        }

        const dh = document.getElementById('desktop').offsetHeight || window.innerHeight;
        let nx = e.clientX - ox;
        let ny = e.clientY - oy;
        ny = Math.max(0, Math.min(ny, dh - 30));
        win.style.left = nx + 'px';
        win.style.top = ny + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (drag) { drag = false; document.body.style.userSelect = ''; }
    });

    tb.addEventListener('dblclick', e => {
        if (e.target.closest('.title-bar-controls')) return;
        maximizeWindow(win.id);
    });

    win.addEventListener('mousedown', () => focusWindow(win));
}

// Hacer arrastrables todas las ventanas existentes
document.querySelectorAll('.window').forEach(makeDraggable);

// Función para crear nuevas ventanas dinámicamente (para apps como Calculadora, Paint, etc.)
function createAppWindow(id, title, icon, contentHTML, width = 400, height = 350) {
    // Verificar si ya existe
    if (document.getElementById(id)) {
        openWindow(id);
        return;
    }
    
    const desktop = document.getElementById('desktop');
    const win = document.createElement('div');
    win.className = 'window';
    win.id = id;
    win.style.cssText = `top: ${100 + Math.random() * 50}px; left: ${150 + Math.random() * 50}px; width: ${width}px; height: ${height}px;`;
    
    win.innerHTML = `
        <div class="glass-reflection"></div>
        <div class="title-bar" id="${id}-tb">
            <div class="title-bar-text">
                <img src="${icon}" style="width: 14px; height: 14px; object-fit: contain;">
                <span style="margin-left: 5px;">${title}</span>
            </div>
            <div class="title-bar-controls">
                <button class="minimize" onclick="minimizeWindow('${id}')" title="Minimizar"></button>
                <button class="maximize" onclick="maximizeWindow('${id}')" title="Maximizar"></button>
                <button class="close-btn" onclick="closeWindow('${id}')" title="Cerrar"></button>
            </div>
        </div>
        <div class="window-content">${contentHTML}</div>
    `;
    
    desktop.appendChild(win);
    makeDraggable(win);
    openWindow(id);
}

function selectIcon(el) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
}
document.addEventListener('click', e => {
    if (!e.target.closest('.desktop-icon') && !e.target.closest('.context-menu')) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    }
});

const ctxMenu = document.getElementById('context-menu');

function showContextMenu(e) {
    e.preventDefault();
    if (e.target.closest('.window') || e.target.closest('.taskbar') ||
        e.target.closest('.start-menu') || e.target.closest('.sidebar-panel')) return;

    ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 220) + 'px';
    ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 260) + 'px';
    ctxMenu.style.display = 'block';
    requestAnimationFrame(() => ctxMenu.classList.add('visible'));
}

function hideContextMenu() {
    ctxMenu.classList.remove('visible');
    setTimeout(() => { ctxMenu.style.display = 'none'; }, 130);
}

document.addEventListener('click', e => {
    if (!e.target.closest('#context-menu')) hideContextMenu();
});

const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');

function closeStartMenu() {
    if (startMenu) startMenu.classList.remove('show');
    if (startBtn) startBtn.classList.remove('open');
}

startBtn.addEventListener('click', e => {
    e.stopPropagation();
    startMenu.classList.toggle('show');
    startBtn.classList.toggle('open');
});

document.addEventListener('click', e => {
    if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        closeStartMenu();
    }
});

function updateAllClocks() {
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes();
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 || 12;
    const mm = String(m).padStart(2, '0');
    document.getElementById('time').textContent = `${h12}:${mm} ${ampm}`;
    const day = String(now.getDate()).padStart(2, '0');
    const mon = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('date').textContent = `${day}/${mon}/${now.getFullYear()}`;

    const s = now.getSeconds();
    document.getElementById('gadget-digital-time').textContent =
        `${String(h12).padStart(2,'0')}:${mm}:${String(s).padStart(2,'0')}`;
    const sDeg = (s / 60) * 360;
    const mDeg = ((m + s / 60) / 60) * 360;
    const hDeg = ((h % 12 + m / 60) / 12) * 360;
    document.getElementById('second-hand').style.transform = `rotate(${sDeg}deg)`;
    document.getElementById('minute-hand').style.transform = `rotate(${mDeg}deg)`;
    document.getElementById('hour-hand').style.transform = `rotate(${hDeg}deg)`;
}
setInterval(updateAllClocks, 1000);
updateAllClocks();

function updateMeters() {
    const cpu = Math.round(20 + Math.random() * 45);
    const ram = Math.round(38 + Math.random() * 25);
    document.getElementById('cpu-fill').style.width = cpu + '%';
    document.getElementById('ram-fill').style.width = ram + '%';
    document.getElementById('cpu-val').textContent = cpu + '%';
    document.getElementById('ram-val').textContent = ram + '%';

    const tmCpu = document.getElementById('tm-cpu');
    const tmRam = document.getElementById('tm-ram');
    if (tmCpu && tmRam) {
        tmCpu.textContent = `Uso de CPU: ${cpu}%`;
        tmRam.textContent = `Memoria física: ${ram}%`;
    }
}
setInterval(updateMeters, 2000);
updateMeters();

const toast = document.getElementById('toast');

function closeToast() {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.style.display = 'none', 400);
}

function showToast() {
    toast.classList.remove('hide');
    toast.style.display = 'flex';
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(closeToast, 6000);
    }, 50);
}
const preview = document.getElementById('taskbar-preview');
const previewTitle = document.getElementById('preview-title');
const previewThumb = document.getElementById('preview-thumb');
let previewTimer;

const previewConfig = {
    'equipo-window': { title: 'Equipo', content: '<img src="icons/equipo.ico" style="width:48px; height:48px; object-fit:contain;">' },
    'papelera-window': { title: 'Papelera de reciclaje', content: '<img src="icons/papelera.ico" style="width:48px; height:48px; object-fit:contain;">' },
    'about-window': { title: 'Acerca de Femboy', content: '<span style="font-size:36px; line-height:1;">🏳️‍⚧️</span>' },
    'owo-window': { title: 'Centro de OwO', content: '<img src="icons/centro de owo.ico" style="width:48px; height:48px; object-fit:contain;">' },
    'taskmgr-window': { title: 'Administrador de tareas', content: '<img src="icons/administrador.ico" style="width:48px; height:48px; object-fit:contain;">' },
    'personalize-window': { title: 'Personalización', content: '<span style="font-size:36px; line-height:1;">🎨</span>' },
    'player-window': { title: 'Media Player', content: '<img src="icons/sonido.ico" style="width:48px; height:48px; object-fit:contain;">' },
    'messenger-window': { title: 'Messenger', content: '<span style="font-size:36px; line-height:1;">💬</span>' }
};

function showPreview(winId, btnId) {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
        const cfg = previewConfig[winId] || { title: 'Ventana', content: '<span style="font-size:36px;">🪟</span>' };
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        previewTitle.textContent = cfg.title;
        previewThumb.innerHTML = cfg.content;
        previewThumb.style.background = 'linear-gradient(135deg, #cde 30%, #aad 100%)';
        const px = Math.min(r.left, window.innerWidth - 215);
        preview.style.left = px + 'px';
        preview.classList.add('visible');
    }, 400);
}

function hidePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => preview.classList.remove('visible'), 300);
}

document.getElementById('preview-close-btn').addEventListener('click', () => {
    preview.classList.remove('visible');
});

function unlockDesktop() {
    const lockScreen = document.getElementById('lock-screen');
    const passInput = document.getElementById('lock-pass');
    const audio = document.getElementById('unlock-sound');
    
    // Validación de contraseña ( UwU o vacía para demo)
    const enteredPass = passInput ? passInput.value : '';
    const validPasswords = [' UwU', 'uwu', 'UwU', ''];
    
    if (!validPasswords.includes(enteredPass)) {
        // Contraseña incorrecta - sonido de error y animación
        showToastMsg('Error de inicio de sesión', 'Contraseña incorrecta n.n 💔', 'icons/bloqueo.ico');
        passInput.value = '';
        passInput.focus();
        lockScreen.classList.add('shake');
        setTimeout(() => lockScreen.classList.remove('shake'), 500);
        return;
    }
    
    if (audio) {
        audio.currentTime = 0;
        audio.volume = 1.0;
        let playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log('Audio error:', e));
        }
    }
    
    lockScreen.classList.add('unlocked');
    setTimeout(() => { 
        lockScreen.style.display = 'none'; 
        openWindow('equipo-window');
        setTimeout(showToast, 800);
    }, 850);
}

function lockDesktop() {
    const lockScreen = document.getElementById('lock-screen');
    lockScreen.style.display = 'flex';
    
    setTimeout(() => {
        lockScreen.classList.remove('unlocked');
    }, 10);

    document.querySelectorAll('.window.open').forEach(w => {
        minimizeWindow(w.id);
    });
}

const lockPassInput = document.getElementById('lock-pass');
if (lockPassInput) {
    lockPassInput.addEventListener('keydown', e => {
        const lockScreen = document.getElementById('lock-screen');
        if (e.key === 'Enter' && lockScreen.style.display !== 'none') {
            unlockDesktop();
        }
    });
}

function changeAeroColor(colorName) {
    const root = document.documentElement;
    const colors = {
        'default': { bg: 'rgba(235,245,255,0.22)', border: 'rgba(80,140,210,0.55)' },
        'pink': { bg: 'rgba(255, 182, 193, 0.45)', border: 'rgba(255, 105, 180, 0.65)' },
        'purple': { bg: 'rgba(216, 191, 216, 0.45)', border: 'rgba(147, 112, 219, 0.65)' },
        'dark': { bg: 'rgba(60, 60, 70, 0.45)', border: 'rgba(20, 20, 25, 0.75)' },
        'mint': { bg: 'rgba(152, 255, 152, 0.35)', border: 'rgba(60, 179, 113, 0.65)' }
    };
    
    if(colors[colorName]) {
        root.style.setProperty('--win-bg', colors[colorName].bg);
        root.style.setProperty('--win-border', colors[colorName].border);
    }
}

function showToastMsg(title, msg, iconSrc) {
    const t = document.getElementById('toast');
    if (!t) return;
    
    const img = t.querySelector('img');
    const bTitle = t.querySelector('.toast-body strong');
    const bDesc = t.querySelector('.toast-body div');

    const origImgSrc = img.src;
    const origTitle = bTitle.textContent;
    const origDesc = bDesc.textContent;

    if (iconSrc) img.src = iconSrc;
    if (title) bTitle.textContent = title;
    if (msg) bDesc.textContent = msg;

    showToast();
    setTimeout(() => {
        img.src = origImgSrc;
        bTitle.textContent = origTitle;
        bDesc.textContent = origDesc;
    }, 6000);
}

const playerAudio = document.getElementById('player-audio');
const playBtn = document.getElementById('player-play-btn');
const progFill = document.getElementById('player-progress-fill');
const progBar = document.getElementById('player-progress-bar');
const currTimeEl = document.getElementById('player-curr');
const durTimeEl = document.getElementById('player-dur');

function formatTime(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

if (playBtn && playerAudio) {
    playBtn.addEventListener('click', () => {
        if (playerAudio.paused) {
            playerAudio.play();
            playBtn.textContent = '⏸';
        } else {
            playerAudio.pause();
            playBtn.textContent = '▶';
        }
    });

    playerAudio.addEventListener('loadedmetadata', () => {
        durTimeEl.textContent = formatTime(playerAudio.duration);
    });

    playerAudio.addEventListener('timeupdate', () => {
        currTimeEl.textContent = formatTime(playerAudio.currentTime);
        if (!isNaN(playerAudio.duration) && playerAudio.duration > 0) {
            const p = (playerAudio.currentTime / playerAudio.duration) * 100;
            progFill.style.width = p + '%';
        }
    });

    progBar.addEventListener('click', e => {
        const r = progBar.getBoundingClientRect();
        const pct = (e.clientX - r.left) / r.width;
        playerAudio.currentTime = pct * playerAudio.duration;
    });
}
const dropzone = document.getElementById('player-dropzone');
const dragOverlay = document.getElementById('player-drag-overlay');
const coverImg = document.getElementById('player-cover-img');
const trackEl = document.getElementById('player-track');
const artistEl = document.getElementById('player-artist');

if (dropzone) {
    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dragOverlay.style.display = 'flex';
    });
    
    dropzone.addEventListener('dragleave', e => {
        e.preventDefault();
        if (!dropzone.contains(e.relatedTarget)) {
            dragOverlay.style.display = 'none';
        }
    });

    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dragOverlay.style.display = 'none';
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                playerAudio.src = url;
                playerAudio.play();
                playBtn.textContent = '⏸';
                trackEl.textContent = file.name.replace(/\.[^/.]+$/, ""); 
                artistEl.textContent = 'Artista desconocido';
                coverImg.src = 'icons/Astolfo.ico';
                
                if (window.jsmediatags) {
                    window.jsmediatags.read(file, {
                        onSuccess: function(tag) {
                            const tags = tag.tags;
                            if (tags.title) trackEl.textContent = tags.title;
                            if (tags.artist) artistEl.textContent = tags.artist;
                            
                            if (tags.picture) {
                                let base64String = "";
                                for (let i = 0; i < tags.picture.data.length; i++) {
                                    base64String += String.fromCharCode(tags.picture.data[i]);
                                }
                                const base64 = "data:" + tags.picture.format + ";base64," + window.btoa(base64String);
                                coverImg.src = base64;
                            }
                        },
                        onError: function(error) {
                            console.log("No ID3 metadata found:", error);
                        }
                    });
                }
            } else {
                showToastMsg('Por favor suelta un archivo de audio válido (mp3, wav, flac).');
            }
        }
    });
}

let currentChat = null;

const msgChatArea = document.getElementById('msg-chat-area');
const msgChatTitle = document.getElementById('msg-chat-title');
const msgHistory = document.getElementById('msg-history');
const msgInput = document.getElementById('msg-input');
const msgSendBtn = document.getElementById('msg-send-btn');

function openChat(contactName) {
    if(contactName === 'Blahaj') {
        showToastMsg('Blåhaj no está conectado en este momento. 🦈💤');
        return;
    }
    
    currentChat = contactName;
    msgChatTitle.textContent = `Chat con ${contactName}`;
    msgChatArea.style.display = 'flex';
    msgHistory.innerHTML = '';
    
    setTimeout(() => {
        addMessage('recv', `¡Hola Nanno! 🌸 ¿Qué vamos a programar hoy? UwU`);
    }, 500);
}

function closeChat() {
    msgChatArea.style.display = 'none';
    currentChat = null;
}

function addMessage(type, text) {
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${type}`;
    bubble.textContent = text;
    msgHistory.appendChild(bubble);
    msgHistory.scrollTop = msgHistory.scrollHeight;
}

function handleSendMessage() {
    const text = msgInput.value.trim();
    if (!text || !currentChat) return;
    
    addMessage('sent', text);
    msgInput.value = '';
    
    setTimeout(() => {
        const responses = [
            "OwO que genial!!",
            "Awww eso es súper tierno 🥺💓",
            "Me encanta esa idea jsjsjs",
            "Claro que sí, bestie ✨",
            "Nya~",
            "*te da headpats*",
            "¿Quieres que hagamos que el código compile de una vez? 💻💖"
        ];
        const res = responses[Math.floor(Math.random() * responses.length)];
        addMessage('recv', res);
    }, 1000 + Math.random() * 1000);
}

if (msgSendBtn) {
    msgSendBtn.addEventListener('click', handleSendMessage);
}
if (msgInput) {
    msgInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSendMessage();
    });
}

const stickyContainer = document.getElementById('sticky-notes-container');
let notesData = [];
try {
    const rawData = localStorage.getItem('femboy_notes');
    if (rawData) notesData = JSON.parse(rawData);
} catch (e) {
    console.error('Error loading notes from localStorage:', e);
}
const noteColors = ['yellow', 'pink', 'blue', 'green'];

function saveNotes() {
    localStorage.setItem('femboy_notes', JSON.stringify(notesData));
}

function renderNotes() {
    if(!stickyContainer) return;
    stickyContainer.innerHTML = '';
    notesData.forEach(note => createNoteElement(note));
}

function createNewStickyNote() {
    const note = {
        id: 'note_' + Date.now(),
        text: '',
        color: noteColors[Math.floor(Math.random() * noteColors.length)],
        x: Math.random() * (window.innerWidth - 300) + 20,
        y: Math.random() * (window.innerHeight - 340) + 20
    };
    notesData.push(note);
    saveNotes();
    createNoteElement(note);
}

function createNoteElement(note) {
    if(!stickyContainer) return;

    const el = document.createElement('div');
    el.className = `sticky-note ${note.color}`;
    el.id = note.id;
    el.style.left = note.x + 'px';
    el.style.top = note.y + 'px';

    el.innerHTML = `
        <div class="sticky-header">
            <div class="sticky-btn-group">
                <button class="sticky-btn color-btn" title="Cambiar color">🎨</button>
            </div>
            <div class="sticky-btn-group">
                <button class="sticky-btn delete" title="Eliminar nota">✕</button>
            </div>
        </div>
        <textarea class="sticky-textarea" placeholder="Escribe tu nota aquí... UwU">${note.text}</textarea>
    `;

    stickyContainer.appendChild(el);

    const header = el.querySelector('.sticky-header');
    const textarea = el.querySelector('.sticky-textarea');
    const colorBtn = el.querySelector('.color-btn');
    const deleteBtn = el.querySelector('.delete');

    el.addEventListener('mousedown', () => {
        document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('focused'));
        el.classList.add('focused');
        zCounter++;
        el.style.zIndex = zCounter;
    });
    textarea.addEventListener('input', () => {
        const idx = notesData.findIndex(n => n.id === note.id);
        if(idx > -1) {
            notesData[idx].text = textarea.value;
            saveNotes();
        }
    });

    colorBtn.addEventListener('click', () => {
        const currIdx = noteColors.indexOf(note.color);
        const nextColor = noteColors[(currIdx + 1) % noteColors.length];
        el.classList.remove(note.color);
        el.classList.add(nextColor);
        note.color = nextColor;
        
        const idx = notesData.findIndex(n => n.id === note.id);
        if(idx > -1) {
            notesData[idx].color = nextColor;
            saveNotes();
        }
    });

    deleteBtn.addEventListener('click', () => {
        el.remove();
        notesData = notesData.filter(n => n.id !== note.id);
        saveNotes();
    });

    let isDragging = false, startX, startY, origX, origY;
    
    header.addEventListener('mousedown', e => {
        if(e.target.tagName.toLowerCase() === 'button') return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = el.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        
        document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('focused'));
        el.classList.add('focused');
        zCounter++;
        el.style.zIndex = zCounter;
        e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        let nx = origX + (e.clientX - startX);
        let ny = origY + (e.clientY - startY);
        
        nx = Math.max(0, Math.min(nx, window.innerWidth - 250));
        ny = Math.max(0, Math.min(ny, window.innerHeight - 290));
        
        el.style.left = nx + 'px';
        el.style.top = ny + 'px';
    });

    document.addEventListener('mouseup', e => {
        if (isDragging) {
            isDragging = false;
            note.x = parseInt(el.style.left);
            note.y = parseInt(el.style.top);
            const idx = notesData.findIndex(n => n.id === note.id);
            if(idx > -1) {
                notesData[idx].x = note.x;
                notesData[idx].y = note.y;
                saveNotes();
            }
        }
    });
}

function changeCursor(type) {
    document.body.classList.remove('cursor-star', 'cursor-heart', 'cursor-wand');
    if (type !== 'default') {
        document.body.classList.add('cursor-' + type);
    }
}

let idleTime = 0;
const idleLimit = 60; b
let screensaverTimer;
let starInterval;
const screensaver = document.getElementById('screensaver');
function resetIdleTime() {
    idleTime = 0;
    if (screensaver && screensaver.classList.contains('active')) {
        screensaver.classList.remove('active');
        clearInterval(starInterval);
        screensaver.innerHTML = '';
        
        const lockScreen = document.getElementById('lock-screen');
        if (lockScreen && !lockScreen.classList.contains('unlocked')) {
        }
    }
}

setInterval(() => {
    idleTime++;
    if (idleTime >= idleLimit) {
        if (screensaver && !screensaver.classList.contains('active')) {
            const lockScreen = document.getElementById('lock-screen');
            if(lockScreen && lockScreen.classList.contains('unlocked')) {
                screensaver.classList.add('active');
                createStars();
                starInterval = setInterval(createStars, 200);
            }
        }
    }
}, 1000);

document.addEventListener('mousemove', resetIdleTime);
document.addEventListener('keypress', resetIdleTime);
document.addEventListener('mousedown', resetIdleTime);
document.addEventListener('touchstart', resetIdleTime);

function createStars() {
    if (!screensaver || !screensaver.classList.contains('active')) return;
    
    const star = document.createElement('div');
    star.className = 'screensaver-star';
    
    const startX = Math.random() * window.innerWidth;
    const duration = Math.random() * 3 + 4; // 4 to 7 seconds
    
    star.style.left = startX + 'px';
    star.style.top = '-10px';
    star.style.animationDuration = duration + 's, ' + (Math.random() * 1 + 0.5) + 's';
    
    screensaver.appendChild(star);
    
    setTimeout(() => {
        if (star.parentNode) {
            star.remove();
        }
    }, duration * 1000);
}

// Funciones del Administrador de Tareas
let selectedProcessRow = null;

function switchTmTab(tabName) {
    // Ocultar todas las vistas
    document.querySelectorAll('.tm-main').forEach(view => {
        view.style.display = 'none';
    });
    
    // Remover clase active de todas las tabs
    document.querySelectorAll('.tm-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar vista seleccionada
    const selectedView = document.getElementById(`tm-view-${tabName}`);
    if (selectedView) {
        selectedView.style.display = 'block';
    }
    
    // Activar tab correspondiente
    const activeTab = document.querySelector(`.tm-tab[onclick="switchTmTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Si es la vista de rendimiento, actualizar valores
    if (tabName === 'performance') {
        updatePerformanceView();
    }
}

function endProcess() {
    if (!selectedProcessRow) {
        showToastMsg('Administrador de Tareas', 'Selecciona un proceso para finalizar n.n 💕', 'icons/administrador.ico');
        return;
    }
    
    const processName = selectedProcessRow.querySelector('div:first-child').textContent;
    const row = selectedProcessRow;
    
    // Animación de eliminación
    row.style.transition = 'all 0.3s ease';
    row.style.background = '#ffcccc';
    row.style.transform = 'translateX(100%)';
    row.style.opacity = '0';
    
    setTimeout(() => {
        row.remove();
        selectedProcessRow = null;
        
        // Actualizar contador de procesos
        const count = document.querySelectorAll('#tm-tbody-processes .tm-row').length;
        document.querySelector('.tm-status-item').textContent = `Procesos: ${count}`;
        
        showToastMsg('Proceso finalizado', `${processName} ha sido cerrado ✨`, 'icons/administrador.ico');
    }, 300);
}

function updatePerformanceView() {
    const cpu = Math.round(20 + Math.random() * 45);
    const ram = Math.round(38 + Math.random() * 25);
    
    document.getElementById('perf-cpu').textContent = cpu + '%';
    document.getElementById('perf-ram').textContent = ram + '%';
    document.getElementById('perf-cpu-bar').style.width = cpu + '%';
    document.getElementById('perf-ram-bar').style.width = ram + '%';
}

// Agregar selección de filas en el administrador de tareas
document.addEventListener('DOMContentLoaded', function() {
    // Hacer seleccionables las filas de procesos
    document.addEventListener('click', function(e) {
        const row = e.target.closest('.tm-row');
        if (row && row.parentElement.id === 'tm-tbody-processes') {
            // Remover selección previa
            document.querySelectorAll('#tm-tbody-processes .tm-row').forEach(r => {
                r.classList.remove('selected');
            });
            // Seleccionar nueva fila
            row.classList.add('selected');
            selectedProcessRow = row;
        }
    });
});

// Funciones para nuevas aplicaciones

// Calculadora
function openCalculator() {
    const calcHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; padding: 10px; background: #f0f0f0; height: 100%;">
            <input type="text" id="calc-display" readonly style="grid-column: span 4; height: 40px; font-size: 24px; text-align: right; padding: 5px; border: 2px solid #ccc; border-radius: 4px; background: white;">
            <button onclick="calcInput('C')" style="height: 45px; font-size: 18px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">C</button>
            <button onclick="calcInput('(')" style="height: 45px; font-size: 18px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">(</button>
            <button onclick="calcInput(')')" style="height: 45px; font-size: 18px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">)</button>
            <button onclick="calcInput('/')" style="height: 45px; font-size: 18px; background: #ffa500; color: white; border: none; border-radius: 4px; cursor: pointer;">÷</button>
            <button onclick="calcInput('7')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">7</button>
            <button onclick="calcInput('8')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">8</button>
            <button onclick="calcInput('9')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">9</button>
            <button onclick="calcInput('*')" style="height: 45px; font-size: 18px; background: #ffa500; color: white; border: none; border-radius: 4px; cursor: pointer;">×</button>
            <button onclick="calcInput('4')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">4</button>
            <button onclick="calcInput('5')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">5</button>
            <button onclick="calcInput('6')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">6</button>
            <button onclick="calcInput('-')" style="height: 45px; font-size: 18px; background: #ffa500; color: white; border: none; border-radius: 4px; cursor: pointer;">−</button>
            <button onclick="calcInput('1')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">1</button>
            <button onclick="calcInput('2')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">2</button>
            <button onclick="calcInput('3')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">3</button>
            <button onclick="calcInput('+')" style="height: 45px; font-size: 18px; background: #ffa500; color: white; border: none; border-radius: 4px; cursor: pointer;">+</button>
            <button onclick="calcInput('0')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; grid-column: span 2;">0</button>
            <button onclick="calcInput('.')" style="height: 45px; font-size: 18px; background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">.</button>
            <button onclick="calcResult()" style="height: 45px; font-size: 18px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">=</button>
        </div>
    `;
    createAppWindow('calculator-window', 'Calculadora', 'icons/disco local.ico', calcHTML, 320, 420);
}

let calcExpression = '';

function calcInput(val) {
    const display = document.getElementById('calc-display');
    if (val === 'C') {
        calcExpression = '';
        display.value = '';
    } else {
        calcExpression += val;
        display.value = calcExpression;
    }
}

function calcResult() {
    try {
        const result = eval(calcExpression);
        document.getElementById('calc-display').value = result;
        calcExpression = result.toString();
    } catch (e) {
        document.getElementById('calc-display').value = 'Error n.n 💕';
        calcExpression = '';
    }
}

// Paint básico
function openPaint() {
    const paintHTML = `
        <div style="display: flex; height: 100%;">
            <div style="width: 60px; background: #f0f0f0; padding: 5px; display: flex; flex-direction: column; gap: 5px; border-right: 1px solid #ccc;">
                <button onclick="setBrushColor('#000000')" style="width: 40px; height: 25px; background: #000; border: 2px solid #999;" title="Negro"></button>
                <button onclick="setBrushColor('#ff0000')" style="width: 40px; height: 25px; background: #f00; border: 2px solid #999;" title="Rojo"></button>
                <button onclick="setBrushColor('#00ff00')" style="width: 40px; height: 25px; background: #0f0; border: 2px solid #999;" title="Verde"></button>
                <button onclick="setBrushColor('#0000ff')" style="width: 40px; height: 25px; background: #00f; border: 2px solid #999;" title="Azul"></button>
                <button onclick="setBrushColor('#ffff00')" style="width: 40px; height: 25px; background: #ff0; border: 2px solid #999;" title="Amarillo"></button>
                <button onclick="setBrushColor('#ff69b4')" style="width: 40px; height: 25px; background: #ff69b4; border: 2px solid #999;" title="Rosa"></button>
                <button onclick="clearCanvas()" style="margin-top: 10px; font-size: 11px; padding: 5px;" title="Limpiar">🗑️ Limpiar</button>
            </div>
            <div style="flex-grow: 1; background: #fff; position: relative;">
                <canvas id="paint-canvas" style="cursor: crosshair;"></canvas>
            </div>
        </div>
    `;
    createAppWindow('paint-window', 'Paint Femboy', 'icons/centro de owo.ico', paintHTML, 550, 450);
    
    setTimeout(() => {
        const canvas = document.getElementById('paint-canvas');
        if (canvas) {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth - 60;
            canvas.height = container.clientHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            let painting = false;
            
            function startPaint(e) {
                painting = true;
                ctx.beginPath();
                ctx.moveTo(e.offsetX, e.offsetY);
            }
            
            function paint(e) {
                if (!painting) return;
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
            }
            
            function stopPaint() {
                painting = false;
            }
            
            canvas.addEventListener('mousedown', startPaint);
            canvas.addEventListener('mousemove', paint);
            canvas.addEventListener('mouseup', stopPaint);
            canvas.addEventListener('mouseout', stopPaint);
        }
    }, 100);
}

let currentColor = '#000000';

function setBrushColor(color) {
    currentColor = color;
    const canvas = document.getElementById('paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = color;
    }
}

function clearCanvas() {
    const canvas = document.getElementById('paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Terminal falsa con comandos divertidos
function openTerminal() {
    const termHTML = `
        <div style="background: #000; color: #0f0; font-family: 'Consolas', monospace; height: 100%; padding: 10px; overflow-y: auto;" id="terminal-content" onclick="document.getElementById('term-input').focus()">
            <div>FemboyOS [Versión 6.9.80085]</div>
            <div>(c) 2026 Nanno Corporation. Todos los derechos reservados.</div>
            <br>
            <div id="term-output">Escribe 'help' para ver los comandos disponibles OwO</div>
            <div style="display: flex; margin-top: 5px;">
                <span>C:\\Users\\Nanno></span>
                <input type="text" id="term-input" style="flex-grow: 1; background: transparent; border: none; color: #0f0; margin-left: 5px; outline: none;" autofocus>
            </div>
        </div>
    `;
    createAppWindow('terminal-window', 'Terminal', 'icons/administrador.ico', termHTML, 600, 400);
    
    setTimeout(() => {
        const input = document.getElementById('term-input');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    handleTerminalCommand(this.value);
                    this.value = '';
                }
            });
            input.focus();
        }
    }, 100);
}

const terminalCommands = {
    'help': 'Comandos disponibles: help, owo, uwu, kawaii, fecha, cls, whoami, neko, gay',
    'owo': '¡OwO! ¿Qué es esto? ¡Un comando UwU! ✨',
    'uwu': 'UwU ~ Esto es muy kawaii n.n 💕',
    'kawaii': '(≧◡≦) ♡ ¡Eres súper kawaii! 💖',
    'fecha': new Date().toLocaleString(),
    'cls': 'CLEAR',
    'whoami': 'Nanno - Administrador supremo de la ternura 👑',
    'neko': 'ฅ^•ﻌ•^ฅ ¡Nya~! 🐱',
    'gay': '🏳️‍🌈 ¡El amor es amor! 💕✨',
    'sudo': '⚠️ Acceso denegado. Necesitas más kawaii para usar sudo n.n',
    'rm -rf': '💀 ¡¿Intentas borrar todo?! ¡Nooo! 🥺',
    'matrix': '🟢 La matrix te saluda... sigue al conejo blanco 🐇',
};

function handleTerminalCommand(cmd) {
    const output = document.getElementById('term-output');
    const cmdLower = cmd.toLowerCase().trim();
    
    // Agregar comando al historial
    const cmdLine = document.createElement('div');
    cmdLine.textContent = `C:\\Users\\Nanno> ${cmd}`;
    output.appendChild(cmdLine);
    
    // Procesar comando
    let response = terminalCommands[cmdLower];
    if (!response) {
        if (cmdLower.startsWith('echo ')) {
            response = cmd.substring(5);
        } else if (cmdLower === '') {
            response = null;
        } else {
            response = `'${cmd}' no se reconoce como un comando interno o externo.`;
        }
    }
    
    if (response && response !== 'CLEAR') {
        const respLine = document.createElement('div');
        respLine.style.color = '#0ff';
        respLine.textContent = response;
        output.appendChild(respLine);
    } else if (response === 'CLEAR') {
        output.innerHTML = '';
    }
    
    // Auto-scroll
    const termContent = document.getElementById('terminal-content');
    termContent.scrollTop = termContent.scrollHeight;
}

renderNotes();
