// SillyTavern Mobile Layout Extension
// Transforms the mobile UI into a phone-native experience.

const EXTENSION_NAME = 'st-mobile-layout';
const LS_PREFIX = 'st-mobile-layout-';

function isMobileDevice() {
    return window.innerWidth <= 768;
}

function loadSetting(key, fallback) {
    try {
        const val = localStorage.getItem(LS_PREFIX + key);
        if (val === null) return fallback;
        return JSON.parse(val);
    } catch {
        return fallback;
    }
}

function saveSetting(key, value) {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
}

const settings = {
    enabled: true,
    amoled: false,
    accentColor: '#7c5cbf',
    gestures: true,
    charStrip: true,
    responseStrip: true,
    charContextMenu: true,
    formatToolbar: true,
    modelCombobox: true,
};

function loadAllSettings() {
    settings.enabled = loadSetting('enabled', true);
    settings.amoled = loadSetting('amoled', false);
    settings.accentColor = loadSetting('accentColor', '#7c5cbf');
    settings.gestures = loadSetting('gestures', true);
    settings.charStrip = loadSetting('charStrip', true);
    settings.responseStrip = loadSetting('responseStrip', true);
    settings.charContextMenu = loadSetting('charContextMenu', true);
    settings.formatToolbar = loadSetting('formatToolbar', true);
    settings.modelCombobox = loadSetting('modelCombobox', true);
}

function saveAllSettings() {
    for (const [key, value] of Object.entries(settings)) {
        saveSetting(key, value);
    }
}

// ─── Settings Panel Binding ────────────────────────────────────────────────────

function bindSettingsPanel() {
    const map = {
        'mobile-layout-enabled': 'enabled',
        'mobile-layout-amoled': 'amoled',
        'mobile-layout-gestures': 'gestures',
        'mobile-layout-char-strip': 'charStrip',
        'mobile-layout-response-strip': 'responseStrip',
        'mobile-layout-char-context-menu': 'charContextMenu',
        'mobile-layout-format-toolbar': 'formatToolbar',
        'mobile-layout-model-combobox': 'modelCombobox',
    };

    for (const [elId, settingKey] of Object.entries(map)) {
        const el = document.getElementById(elId);
        if (!el) continue;
        el.checked = settings[settingKey];
        el.addEventListener('change', () => {
            settings[settingKey] = el.checked;
            saveAllSettings();
            applySettings();
        });
    }

    // Accent color swatches
    document.querySelectorAll('.mobile-layout-accent-swatch').forEach(swatch => {
        if (swatch.dataset.color === settings.accentColor) {
            swatch.classList.add('active');
        }
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.mobile-layout-accent-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            settings.accentColor = swatch.dataset.color;
            const customInput = document.getElementById('mobile-layout-accent-custom');
            if (customInput) customInput.value = '';
            saveAllSettings();
            applyAccentColor();
        });
    });

    // Custom accent hex input
    const customAccent = document.getElementById('mobile-layout-accent-custom');
    if (customAccent) {
        customAccent.addEventListener('change', () => {
            const val = customAccent.value.trim();
            if (/^#[0-9a-fA-F]{3,6}$/.test(val)) {
                document.querySelectorAll('.mobile-layout-accent-swatch').forEach(s => s.classList.remove('active'));
                settings.accentColor = val;
                saveAllSettings();
                applyAccentColor();
            }
        });
    }
}

// ─── Apply Settings ────────────────────────────────────────────────────────────

function applySettings() {
    const body = document.body;
    if (!body) return;

    if (settings.enabled && isMobileDevice()) {
        body.classList.add('mobile-layout-active');
    } else {
        body.classList.remove('mobile-layout-active');
    }

    if (settings.amoled) {
        body.classList.add('mobile-amoled');
    } else {
        body.classList.remove('mobile-amoled');
    }

    applyAccentColor();
    applyFeatureToggles();
}

function applyAccentColor() {
    document.documentElement.style.setProperty('--mobile-accent', settings.accentColor);
}

function applyFeatureToggles() {
    const body = document.body;
    const toggleMap = {
        'mobile-gestures-on': settings.gestures,
        'mobile-char-strip-on': settings.charStrip,
        'mobile-response-strip-on': settings.responseStrip,
        'mobile-char-context-menu-on': settings.charContextMenu,
        'mobile-format-toolbar-on': settings.formatToolbar,
        'mobile-model-combobox-on': settings.modelCombobox,
    };
    for (const [cls, enabled] of Object.entries(toggleMap)) {
        body.classList.toggle(cls, enabled && settings.enabled && isMobileDevice());
    }
}

// ─── Bottom Navigation Bar ─────────────────────────────────────────────────────

let activePanel = 'chat';

function initBottomNav() {
    const navBar = document.getElementById('mobile-nav-bar');
    if (!navBar) return;

    navBar.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            if (!target) return;
            handleNavTap(target);
        });
    });
}

function handleNavTap(target) {
    if (target === activePanel && target !== 'chat') {
        closeAllDrawers();
        setActiveNav('chat');
        return;
    }

    closeAllDrawers();

    switch (target) {
        case 'chat':
            break;
        case 'characters':
            openDrawer('#rightNavDrawerIcon');
            break;
        case 'settings':
            openDrawer('#leftNavDrawerIcon');
            break;
        case 'world-info':
            openDrawer('#WIDrawerIcon');
            break;
        case 'extensions':
            openDrawer('#leftNavDrawerIcon', () => {
                const extensionsHeader = findExtensionsAccordion();
                if (extensionsHeader) extensionsHeader.click();
            });
            break;
    }

    setActiveNav(target);
}

function setActiveNav(target) {
    activePanel = target;
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.target === target);
    });
}

function openDrawer(iconSelector, afterOpen) {
    const icon = document.querySelector(iconSelector);
    if (!icon) return;

    const drawer = icon.closest('.drawer-toggle')?.nextElementSibling ||
                   icon.closest('.nav-toggle')?.querySelector('.drawer-content');

    if (icon.classList.contains('closedIcon')) {
        icon.click();
    }

    if (afterOpen) {
        setTimeout(afterOpen, 100);
    }
}

function closeAllDrawers() {
    ['#leftNavDrawerIcon', '#rightNavDrawerIcon', '#WIDrawerIcon'].forEach(sel => {
        const icon = document.querySelector(sel);
        if (icon && icon.classList.contains('openIcon')) {
            icon.click();
        }
    });
    closeMobileDrawerOverlay();
}

function findExtensionsAccordion() {
    const headers = document.querySelectorAll('#left-nav-panel .inline-drawer-header');
    for (const header of headers) {
        if (header.textContent.toLowerCase().includes('extension')) {
            return header;
        }
    }
    return null;
}

// ─── Slide-Up Drawers ──────────────────────────────────────────────────────────

let drawerOverlay = null;

function initSlideUpDrawers() {
    drawerOverlay = document.createElement('div');
    drawerOverlay.id = 'mobile-drawer-overlay';
    drawerOverlay.addEventListener('click', () => {
        closeAllDrawers();
        setActiveNav('chat');
    });
    document.body.appendChild(drawerOverlay);

    document.querySelectorAll('.drawer-content').forEach(drawer => {
        injectDrawerControls(drawer);
    });

    observeDrawerChanges();
}

function injectDrawerControls(drawer) {
    if (drawer.querySelector('.mobile-drawer-handle-bar')) return;

    const handleBar = document.createElement('div');
    handleBar.className = 'mobile-drawer-handle-bar';

    const handle = document.createElement('div');
    handle.className = 'mobile-drawer-handle';
    handleBar.appendChild(handle);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-drawer-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.addEventListener('click', () => {
        closeAllDrawers();
        setActiveNav('chat');
    });
    handleBar.appendChild(closeBtn);

    drawer.insertBefore(handleBar, drawer.firstChild);

    initSwipeToClose(drawer, handleBar);
}

function initSwipeToClose(drawer, handleBar) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    handleBar.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        drawer.style.transition = 'none';
    }, { passive: true });

    handleBar.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const delta = Math.max(0, currentY - startY);
        drawer.style.transform = `translateY(${delta}px)`;
    }, { passive: true });

    handleBar.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        drawer.style.transition = '';
        const delta = currentY - startY;
        if (delta > 100) {
            closeAllDrawers();
            setActiveNav('chat');
        } else {
            drawer.style.transform = '';
        }
    });
}

function observeDrawerChanges() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('drawer-content')) {
                    if (target.classList.contains('openDrawer')) {
                        showMobileDrawerOverlay();
                        target.style.transform = '';
                    } else {
                        const anyOpen = document.querySelector('.drawer-content.openDrawer');
                        if (!anyOpen) closeMobileDrawerOverlay();
                    }
                }
            }
        }
    });

    document.querySelectorAll('.drawer-content').forEach(drawer => {
        observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
    });
}

function showMobileDrawerOverlay() {
    if (drawerOverlay) drawerOverlay.classList.add('visible');
}

function closeMobileDrawerOverlay() {
    if (drawerOverlay) drawerOverlay.classList.remove('visible');
}

// ─── Keyboard Handling ─────────────────────────────────────────────────────────

function initKeyboardHandling() {
    if (!window.visualViewport) return;

    const initialHeight = window.visualViewport.height;

    window.visualViewport.addEventListener('resize', () => {
        if (!settings.enabled || !isMobileDevice()) return;

        const currentHeight = window.visualViewport.height;
        const diff = initialHeight - currentHeight;
        const keyboardOpen = diff > 100;

        const formSheld = document.getElementById('form_sheld');
        const navBar = document.getElementById('mobile-nav-bar');
        const chat = document.getElementById('chat');

        if (keyboardOpen) {
            const offset = diff;
            if (formSheld) formSheld.style.bottom = `${offset}px`;
            if (navBar) navBar.style.display = 'none';
            if (chat) {
                chat.scrollTop = chat.scrollHeight;
            }
        } else {
            if (formSheld) formSheld.style.bottom = '';
            if (navBar) navBar.style.display = '';
        }
    });
}

// ─── Quick Character Strip (Top — Navigation) ─────────────────────────────────

let charStripContainer = null;

function initCharacterStrip() {
    charStripContainer = document.createElement('div');
    charStripContainer.id = 'mobile-char-strip';

    const topBar = document.getElementById('top-bar');
    const sheld = document.getElementById('sheld');
    if (topBar && sheld) {
        sheld.insertBefore(charStripContainer, sheld.firstChild);
    } else if (sheld) {
        sheld.insertBefore(charStripContainer, sheld.firstChild);
    }

    refreshCharacterStrip();

    try {
        const context = SillyTavern.getContext();
        if (context?.eventSource && context?.eventTypes) {
            context.eventSource.on(context.eventTypes.CHAT_CHANGED, refreshCharacterStrip);
            context.eventSource.on(context.eventTypes.CHARACTER_MESSAGE_RENDERED, refreshCharacterStrip);
        }
    } catch (e) {
        console.warn('[Mobile Layout] Could not bind character strip events:', e);
    }
}

function refreshCharacterStrip() {
    if (!charStripContainer) return;
    if (!settings.charStrip) {
        charStripContainer.style.display = 'none';
        return;
    }
    charStripContainer.style.display = '';

    try {
        const context = SillyTavern.getContext();
        if (!context?.characters) return;

        charStripContainer.innerHTML = '';

        const chars = context.characters.slice(0, 20);

        chars.forEach((char, index) => {
            const avatar = document.createElement('div');
            avatar.className = 'mobile-char-strip-avatar';
            avatar.title = char.name || '';

            if (context.characterId === index) {
                avatar.classList.add('active');
            }

            const img = document.createElement('img');
            img.src = char.avatar ? `/characters/${encodeURIComponent(char.avatar)}` :
                       '/img/ai4.png';
            img.alt = char.name || '';
            img.loading = 'lazy';
            img.onerror = () => { img.src = '/img/ai4.png'; };

            avatar.appendChild(img);
            avatar.addEventListener('click', () => selectCharacter(index));
            charStripContainer.appendChild(avatar);
        });
    } catch (e) {
        console.warn('[Mobile Layout] Error refreshing character strip:', e);
    }
}

function selectCharacter(index) {
    try {
        const charElements = document.querySelectorAll('#rm_print_characters_block .character_select');
        if (charElements[index]) {
            charElements[index].click();
        }
    } catch (e) {
        console.warn('[Mobile Layout] Error selecting character:', e);
    }
}

// ─── Message Actions ───────────────────────────────────────────────────────────

let longPressTimer = null;
let messageActionMenu = null;

function initMessageActions() {
    messageActionMenu = document.createElement('div');
    messageActionMenu.id = 'mobile-message-menu';
    messageActionMenu.innerHTML = `
        <div class="mobile-msg-action" data-action="copy"><i class="fa-solid fa-copy"></i> Copy</div>
        <div class="mobile-msg-action" data-action="edit"><i class="fa-solid fa-pencil"></i> Edit</div>
        <div class="mobile-msg-action" data-action="delete"><i class="fa-solid fa-trash"></i> Delete</div>
        <div class="mobile-msg-action" data-action="regenerate"><i class="fa-solid fa-rotate"></i> Regenerate</div>
    `;
    document.body.appendChild(messageActionMenu);

    messageActionMenu.querySelectorAll('.mobile-msg-action').forEach(action => {
        action.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMessageAction(action.dataset.action);
        });
    });

    document.addEventListener('click', () => hideMessageMenu());

    const chat = document.getElementById('chat');
    if (!chat) return;

    chat.addEventListener('touchstart', onMessageTouchStart, { passive: true });
    chat.addEventListener('touchend', onMessageTouchEnd);
    chat.addEventListener('touchmove', onMessageTouchMove, { passive: true });

    initDoubleTapCopy(chat);
}

let activeMes = null;
let touchStartPos = { x: 0, y: 0 };

function onMessageTouchStart(e) {
    if (!settings.enabled || !isMobileDevice()) return;

    const mes = e.target.closest('.mes');
    if (!mes) return;

    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    activeMes = mes;

    longPressTimer = setTimeout(() => {
        showMessageMenu(mes, touchStartPos.x, touchStartPos.y);
    }, 500);
}

function onMessageTouchMove(e) {
    if (!longPressTimer) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.y);
    if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function onMessageTouchEnd() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showMessageMenu(mes, x, y) {
    if (!messageActionMenu) return;
    activeMes = mes;

    const isUser = mes.getAttribute('is_user') === 'true';
    const regenAction = messageActionMenu.querySelector('[data-action="regenerate"]');
    if (regenAction) regenAction.style.display = isUser ? 'none' : '';

    messageActionMenu.style.left = `${Math.min(x, window.innerWidth - 180)}px`;
    messageActionMenu.style.top = `${Math.min(y, window.innerHeight - 200)}px`;
    messageActionMenu.classList.add('visible');
}

function hideMessageMenu() {
    if (messageActionMenu) messageActionMenu.classList.remove('visible');
}

function handleMessageAction(action) {
    hideMessageMenu();
    if (!activeMes) return;

    switch (action) {
        case 'copy': {
            const textEl = activeMes.querySelector('.mes_text');
            if (textEl) {
                navigator.clipboard.writeText(textEl.innerText).then(() => showToast('Copied!'));
            }
            break;
        }
        case 'edit': {
            const editBtn = activeMes.querySelector('.mes_edit');
            if (editBtn) editBtn.click();
            break;
        }
        case 'delete': {
            const delBtn = activeMes.querySelector('.mes_edit_delete');
            if (delBtn) {
                delBtn.click();
            }
            break;
        }
        case 'regenerate': {
            const regenBtn = activeMes.querySelector('.mes_edit_regenerate') ||
                             document.getElementById('option_regenerate');
            if (regenBtn) regenBtn.click();
            break;
        }
    }
}

function initDoubleTapCopy(chat) {
    let lastTap = 0;
    let lastTarget = null;

    chat.addEventListener('touchend', (e) => {
        if (!settings.enabled || !isMobileDevice()) return;

        const mes = e.target.closest('.mes');
        if (!mes) return;

        const now = Date.now();
        if (lastTarget === mes && now - lastTap < 300) {
            const textEl = mes.querySelector('.mes_text');
            if (textEl) {
                navigator.clipboard.writeText(textEl.innerText).then(() => showToast('Copied!'));
            }
            lastTap = 0;
            lastTarget = null;
        } else {
            lastTap = now;
            lastTarget = mes;
        }
    });
}

// ─── Edge Swipe Gestures ───────────────────────────────────────────────────────

function initGestures() {
    let gestureStartX = 0;
    let gestureStartY = 0;
    let isEdgeSwipe = false;

    document.addEventListener('touchstart', (e) => {
        if (!settings.enabled || !settings.gestures || !isMobileDevice()) return;
        if (document.querySelector('.drawer-content.openDrawer')) return;

        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        gestureStartX = x;
        gestureStartY = y;
        isEdgeSwipe = (x < 20 || x > window.innerWidth - 20);
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!isEdgeSwipe) return;
        isEdgeSwipe = false;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - gestureStartX;
        const dy = Math.abs(endY - gestureStartY);

        if (Math.abs(dx) < 50 || dy > Math.abs(dx)) return;

        if (gestureStartX < 20 && dx > 0) {
            handleNavTap('settings');
        } else if (gestureStartX > window.innerWidth - 20 && dx < 0) {
            handleNavTap('characters');
        }
    }, { passive: true });
}

// ─── Chat Navigation ───────────────────────────────────────────────────────────

let jumpToBottomBtn = null;
let chatSearchOverlay = null;

function initChatNavigation() {
    jumpToBottomBtn = document.createElement('button');
    jumpToBottomBtn.id = 'mobile-jump-bottom';
    jumpToBottomBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
    jumpToBottomBtn.title = 'Jump to bottom';
    document.body.appendChild(jumpToBottomBtn);

    jumpToBottomBtn.addEventListener('click', () => {
        const chat = document.getElementById('chat');
        if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    });

    let jumpLongPress = null;
    jumpToBottomBtn.addEventListener('touchstart', () => {
        jumpLongPress = setTimeout(() => {
            const chat = document.getElementById('chat');
            if (chat) chat.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
    }, { passive: true });
    jumpToBottomBtn.addEventListener('touchend', () => {
        if (jumpLongPress) { clearTimeout(jumpLongPress); jumpLongPress = null; }
    });

    const chat = document.getElementById('chat');
    if (chat) {
        chat.addEventListener('scroll', () => {
            if (!jumpToBottomBtn) return;
            const distFromBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
            jumpToBottomBtn.classList.toggle('visible', distFromBottom > chat.clientHeight);
        });
    }

    initChatSearch();
}

function initChatSearch() {
    chatSearchOverlay = document.createElement('div');
    chatSearchOverlay.id = 'mobile-chat-search';
    chatSearchOverlay.innerHTML = `
        <div class="mobile-search-bar">
            <input type="text" id="mobile-search-input" placeholder="Search in chat...">
            <button id="mobile-search-prev"><i class="fa-solid fa-chevron-up"></i></button>
            <button id="mobile-search-next"><i class="fa-solid fa-chevron-down"></i></button>
            <button id="mobile-search-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="mobile-search-info"></div>
    `;
    document.body.appendChild(chatSearchOverlay);

    const searchInput = document.getElementById('mobile-search-input');
    const searchInfo = chatSearchOverlay.querySelector('.mobile-search-info');
    let matches = [];
    let currentMatch = -1;

    const searchBtn = document.createElement('button');
    searchBtn.id = 'mobile-chat-search-btn';
    searchBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    searchBtn.addEventListener('click', () => {
        chatSearchOverlay.classList.add('visible');
        if (searchInput) searchInput.focus();
    });

    const topBar = document.getElementById('top-bar');
    if (topBar) topBar.appendChild(searchBtn);

    document.getElementById('mobile-search-close')?.addEventListener('click', () => {
        chatSearchOverlay.classList.remove('visible');
        clearSearchHighlights();
        if (searchInput) searchInput.value = '';
        if (searchInfo) searchInfo.textContent = '';
        matches = [];
        currentMatch = -1;
    });

    searchInput?.addEventListener('input', () => {
        clearSearchHighlights();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            if (searchInfo) searchInfo.textContent = '';
            matches = [];
            currentMatch = -1;
            return;
        }

        matches = [];
        document.querySelectorAll('#chat .mes .mes_text').forEach(el => {
            if (el.innerText.toLowerCase().includes(query)) {
                matches.push(el);
                el.classList.add('mobile-search-highlight');
            }
        });

        if (matches.length > 0) {
            currentMatch = 0;
            scrollToMatch();
            if (searchInfo) searchInfo.textContent = `1 of ${matches.length}`;
        } else {
            if (searchInfo) searchInfo.textContent = 'No results';
        }
    });

    document.getElementById('mobile-search-prev')?.addEventListener('click', () => {
        if (matches.length === 0) return;
        currentMatch = (currentMatch - 1 + matches.length) % matches.length;
        scrollToMatch();
        if (searchInfo) searchInfo.textContent = `${currentMatch + 1} of ${matches.length}`;
    });

    document.getElementById('mobile-search-next')?.addEventListener('click', () => {
        if (matches.length === 0) return;
        currentMatch = (currentMatch + 1) % matches.length;
        scrollToMatch();
        if (searchInfo) searchInfo.textContent = `${currentMatch + 1} of ${matches.length}`;
    });

    function scrollToMatch() {
        matches.forEach(m => m.classList.remove('mobile-search-active'));
        if (matches[currentMatch]) {
            matches[currentMatch].classList.add('mobile-search-active');
            matches[currentMatch].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function clearSearchHighlights() {
    document.querySelectorAll('.mobile-search-highlight').forEach(el => {
        el.classList.remove('mobile-search-highlight', 'mobile-search-active');
    });
}

// ─── Input Enhancements ────────────────────────────────────────────────────────

function initInputEnhancements() {
    initAutoExpandTextarea();
    initFormattingToolbar();
}

function initAutoExpandTextarea() {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) return;

    textarea.addEventListener('input', () => {
        if (!settings.enabled || !isMobileDevice()) return;
        textarea.style.height = 'auto';
        const maxHeight = window.innerHeight * 0.4;
        textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    });
}

function initFormattingToolbar() {
    const sendForm = document.getElementById('send_form');
    if (!sendForm) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'mobile-format-toolbar';
    toolbar.innerHTML = `
        <button class="mobile-fmt-btn" data-wrap="**" title="Bold"><i class="fa-solid fa-bold"></i></button>
        <button class="mobile-fmt-btn" data-wrap="*" title="Italic"><i class="fa-solid fa-italic"></i></button>
        <button class="mobile-fmt-btn" data-prefix="> " title="Quote"><i class="fa-solid fa-quote-right"></i></button>
        <button class="mobile-fmt-btn" data-wrap="\`" title="Code"><i class="fa-solid fa-code"></i></button>
        <button class="mobile-fmt-btn" data-wrap="~~" title="Strikethrough"><i class="fa-solid fa-strikethrough"></i></button>
    `;

    sendForm.parentElement.insertBefore(toolbar, sendForm);

    toolbar.querySelectorAll('.mobile-fmt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const textarea = document.getElementById('send_textarea');
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const selected = text.slice(start, end);

            if (btn.dataset.wrap) {
                const w = btn.dataset.wrap;
                const newText = text.slice(0, start) + w + selected + w + text.slice(end);
                textarea.value = newText;
                textarea.selectionStart = start + w.length;
                textarea.selectionEnd = end + w.length;
            } else if (btn.dataset.prefix) {
                const p = btn.dataset.prefix;
                const newText = text.slice(0, start) + p + selected + text.slice(end);
                textarea.value = newText;
                textarea.selectionStart = start + p.length;
                textarea.selectionEnd = end + p.length;
            }

            textarea.focus();
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });
}

// ─── Model Combo Box ───────────────────────────────────────────────────────────

function initModelCombobox() {
    if (!settings.modelCombobox) return;

    const modelSelect = document.getElementById('model_openai_select') ||
                        document.getElementById('model_novel_select') ||
                        document.querySelector('#left-nav-panel select[name*="model"]') ||
                        document.querySelector('#left-nav-panel select[id*="model"]');

    if (!modelSelect) {
        console.warn('[Mobile Layout] Could not find model select dropdown');
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'mobile-model-combobox';

    const inputRow = document.createElement('div');
    inputRow.className = 'mobile-model-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'mobile-model-input';
    input.placeholder = 'Type or paste model name...';
    input.value = modelSelect.options[modelSelect.selectedIndex]?.text || '';

    const favBtn = document.createElement('button');
    favBtn.className = 'mobile-model-fav-btn';
    favBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
    favBtn.title = 'Save to favorites';

    inputRow.appendChild(input);
    inputRow.appendChild(favBtn);
    wrapper.appendChild(inputRow);

    const dropdown = document.createElement('div');
    dropdown.className = 'mobile-model-dropdown';
    wrapper.appendChild(dropdown);

    const recentSection = document.createElement('div');
    recentSection.className = 'mobile-model-section';
    recentSection.innerHTML = '<div class="mobile-model-section-title">Recent</div><div class="mobile-model-chips" id="mobile-model-recent"></div>';
    wrapper.appendChild(recentSection);

    const favSection = document.createElement('div');
    favSection.className = 'mobile-model-section';
    favSection.innerHTML = '<div class="mobile-model-section-title">Favorites</div><div class="mobile-model-list" id="mobile-model-favorites"></div>';
    wrapper.appendChild(favSection);

    modelSelect.style.display = 'none';
    modelSelect.parentElement.insertBefore(wrapper, modelSelect.nextSibling);

    function getOptions() {
        return Array.from(modelSelect.options).map(o => ({ value: o.value, text: o.text }));
    }

    function setModel(value, text) {
        modelSelect.value = value;
        modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
        input.value = text || value;
        dropdown.classList.remove('visible');
        addRecentModel(value, text || value);
    }

    function setCustomModel(name) {
        let found = false;
        for (const opt of modelSelect.options) {
            if (opt.value === name || opt.text === name) {
                setModel(opt.value, opt.text);
                found = true;
                break;
            }
        }
        if (!found) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.text = name;
            modelSelect.appendChild(opt);
            setModel(name, name);
        }
    }

    input.addEventListener('focus', () => {
        showFilteredDropdown('');
        dropdown.classList.add('visible');
    });

    input.addEventListener('input', () => {
        showFilteredDropdown(input.value);
        dropdown.classList.add('visible');
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setCustomModel(input.value.trim());
        }
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('visible');
        }
    });

    function showFilteredDropdown(query) {
        const options = getOptions();
        const filtered = query
            ? options.filter(o => o.text.toLowerCase().includes(query.toLowerCase()))
            : options;

        dropdown.innerHTML = '';
        filtered.slice(0, 30).forEach(opt => {
            const item = document.createElement('div');
            item.className = 'mobile-model-option';
            item.textContent = opt.text;
            item.addEventListener('click', () => setModel(opt.value, opt.text));
            dropdown.appendChild(item);
        });

        if (filtered.length === 0) {
            const item = document.createElement('div');
            item.className = 'mobile-model-option mobile-model-no-results';
            item.textContent = 'Press Enter to use custom model';
            dropdown.appendChild(item);
        }
    }

    // Recent models
    function getRecentModels() {
        return loadSetting('recentModels', []);
    }

    function addRecentModel(value, text) {
        let recent = getRecentModels();
        recent = recent.filter(m => m.value !== value);
        recent.unshift({ value, text });
        recent = recent.slice(0, 5);
        saveSetting('recentModels', recent);
        renderRecent();
    }

    function renderRecent() {
        const container = document.getElementById('mobile-model-recent');
        if (!container) return;
        const recent = getRecentModels();
        container.innerHTML = '';
        recent.forEach(m => {
            const chip = document.createElement('span');
            chip.className = 'mobile-model-chip';
            chip.textContent = m.text;
            chip.addEventListener('click', () => setModel(m.value, m.text));
            container.appendChild(chip);
        });
        recentSection.style.display = recent.length ? '' : 'none';
    }

    // Favorites
    function getFavorites() {
        return loadSetting('favoriteModels', []);
    }

    function addFavorite(value, text) {
        const favs = getFavorites();
        if (favs.some(f => f.value === value)) return;
        favs.push({ value, text });
        saveSetting('favoriteModels', favs);
        renderFavorites();
    }

    function removeFavorite(value) {
        let favs = getFavorites();
        favs = favs.filter(f => f.value !== value);
        saveSetting('favoriteModels', favs);
        renderFavorites();
    }

    function renderFavorites() {
        const container = document.getElementById('mobile-model-favorites');
        if (!container) return;
        const favs = getFavorites();
        container.innerHTML = '';
        favs.forEach(m => {
            const item = document.createElement('div');
            item.className = 'mobile-model-fav-item';

            const name = document.createElement('span');
            name.textContent = m.text;
            name.addEventListener('click', () => setModel(m.value, m.text));

            const removeBtn = document.createElement('button');
            removeBtn.className = 'mobile-model-fav-remove';
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFavorite(m.value);
            });

            item.appendChild(name);
            item.appendChild(removeBtn);
            container.appendChild(item);
        });
        favSection.style.display = favs.length ? '' : 'none';
    }

    favBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (val) addFavorite(modelSelect.value || val, val);
    });

    renderRecent();
    renderFavorites();
}

// ─── Quick Character Response Strip (Bottom — Prompting) ───────────────────────

let responseStripContainer = null;

function initResponseStrip() {
    responseStripContainer = document.createElement('div');
    responseStripContainer.id = 'mobile-response-strip';

    const label = document.createElement('span');
    label.className = 'mobile-response-label';
    label.textContent = 'Respond';
    responseStripContainer.appendChild(label);

    const avatarsRow = document.createElement('div');
    avatarsRow.className = 'mobile-response-avatars';
    responseStripContainer.appendChild(avatarsRow);

    const formSheld = document.getElementById('form_sheld');
    if (formSheld) {
        formSheld.parentElement.insertBefore(responseStripContainer, formSheld);
    }

    refreshResponseStrip();

    try {
        const context = SillyTavern.getContext();
        if (context?.eventSource && context?.eventTypes) {
            context.eventSource.on(context.eventTypes.CHAT_CHANGED, refreshResponseStrip);
            context.eventSource.on(context.eventTypes.GROUP_MEMBER_DRAFTED, refreshResponseStrip);
        }
    } catch (e) {
        console.warn('[Mobile Layout] Could not bind response strip events:', e);
    }
}

function refreshResponseStrip() {
    if (!responseStripContainer) return;
    if (!settings.responseStrip) {
        responseStripContainer.style.display = 'none';
        return;
    }
    responseStripContainer.style.display = '';

    const avatarsRow = responseStripContainer.querySelector('.mobile-response-avatars');
    if (!avatarsRow) return;

    try {
        const context = SillyTavern.getContext();
        if (!context) return;

        avatarsRow.innerHTML = '';

        if (context.groupId) {
            const group = context.groups?.find(g => g.id === context.groupId);
            if (group?.members) {
                group.members.forEach(memberId => {
                    const char = context.characters.find(c => c.avatar === memberId);
                    if (char) addResponseAvatar(avatarsRow, char, context);
                });
            }
        } else if (context.characterId !== undefined && context.characters[context.characterId]) {
            addResponseAvatar(avatarsRow, context.characters[context.characterId], context);
        }
    } catch (e) {
        console.warn('[Mobile Layout] Error refreshing response strip:', e);
    }
}

function addResponseAvatar(container, char, context) {
    const avatar = document.createElement('div');
    avatar.className = 'mobile-response-avatar';
    avatar.title = char.name || '';

    const img = document.createElement('img');
    img.src = char.avatar ? `/characters/${encodeURIComponent(char.avatar)}` : '/img/ai4.png';
    img.alt = char.name || '';
    img.loading = 'lazy';
    img.onerror = () => { img.src = '/img/ai4.png'; };

    avatar.appendChild(img);

    // Tap to prompt response
    avatar.addEventListener('click', () => {
        try {
            if (context.groupId) {
                const generateBtn = document.getElementById('send_but');
                if (generateBtn) generateBtn.click();
            } else {
                const generateBtn = document.getElementById('send_but');
                if (generateBtn) generateBtn.click();
            }
        } catch (e) {
            console.warn('[Mobile Layout] Error triggering response:', e);
        }
    });

    // Long-press to impersonate
    let impersonateTimer = null;
    avatar.addEventListener('touchstart', () => {
        impersonateTimer = setTimeout(() => {
            try {
                const impersonateBtn = document.getElementById('option_impersonate');
                if (impersonateBtn) impersonateBtn.click();
                showToast(`Typing as ${char.name}`);
            } catch (e) {
                console.warn('[Mobile Layout] Error impersonating:', e);
            }
        }, 600);
    }, { passive: true });
    avatar.addEventListener('touchend', () => {
        if (impersonateTimer) { clearTimeout(impersonateTimer); impersonateTimer = null; }
    });
    avatar.addEventListener('touchmove', () => {
        if (impersonateTimer) { clearTimeout(impersonateTimer); impersonateTimer = null; }
    }, { passive: true });

    container.appendChild(avatar);
}

// ─── Character Tap Context Menu ────────────────────────────────────────────────

let charContextMenu = null;
let charContextTarget = null;

function initCharContextMenu() {
    charContextMenu = document.createElement('div');
    charContextMenu.id = 'mobile-char-context-menu';
    charContextMenu.innerHTML = `
        <div class="mobile-char-ctx-action" data-action="edit"><i class="fa-solid fa-pencil"></i> Edit</div>
        <div class="mobile-char-ctx-action" data-action="chat"><i class="fa-solid fa-comments"></i> Start Chat</div>
        <div class="mobile-char-ctx-action" data-action="info"><i class="fa-solid fa-circle-info"></i> View Info</div>
    `;
    document.body.appendChild(charContextMenu);

    charContextMenu.querySelectorAll('.mobile-char-ctx-action').forEach(action => {
        action.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCharContextAction(action.dataset.action);
        });
    });

    document.addEventListener('click', (e) => {
        if (!charContextMenu.contains(e.target)) {
            charContextMenu.classList.remove('visible');
        }
    });

    interceptCharacterClicks();
}

function interceptCharacterClicks() {
    const charBlock = document.getElementById('rm_print_characters_block');
    if (!charBlock) return;

    charBlock.addEventListener('click', (e) => {
        if (!settings.enabled || !settings.charContextMenu || !isMobileDevice()) return;

        const charEl = e.target.closest('.character_select');
        if (!charEl) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        charContextTarget = charEl;

        const rect = charEl.getBoundingClientRect();
        charContextMenu.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
        charContextMenu.style.top = `${Math.min(rect.bottom + 5, window.innerHeight - 150)}px`;
        charContextMenu.classList.add('visible');
    }, true);
}

function handleCharContextAction(action) {
    charContextMenu.classList.remove('visible');
    if (!charContextTarget) return;

    switch (action) {
        case 'edit': {
            const editBtn = document.getElementById('rm_button_selected_ch');
            if (editBtn) editBtn.click();
            setTimeout(() => {
                charContextTarget.click();
            }, 100);
            break;
        }
        case 'chat': {
            settings.charContextMenu = false;
            charContextTarget.click();
            setTimeout(() => { settings.charContextMenu = true; }, 200);
            break;
        }
        case 'info': {
            showCharInfoModal(charContextTarget);
            break;
        }
    }
}

function showCharInfoModal(charEl) {
    const name = charEl.querySelector('.ch_name')?.textContent || 'Unknown';

    const modal = document.createElement('div');
    modal.id = 'mobile-char-info-modal';
    modal.innerHTML = `
        <div class="mobile-char-info-content">
            <div class="mobile-char-info-header">
                <h3>${name}</h3>
                <button class="mobile-char-info-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="mobile-char-info-body">
                <p>Loading character info...</p>
            </div>
        </div>
    `;

    modal.querySelector('.mobile-char-info-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);

    try {
        const context = SillyTavern.getContext();
        const chId = charEl.getAttribute('chid');
        if (chId !== null && context.characters[chId]) {
            const char = context.characters[chId];
            const body = modal.querySelector('.mobile-char-info-body');
            body.innerHTML = `
                <div class="mobile-char-info-avatar">
                    <img src="/characters/${encodeURIComponent(char.avatar || '')}" onerror="this.src='/img/ai4.png'" alt="${char.name}">
                </div>
                <div class="mobile-char-info-field"><strong>Name:</strong> ${char.name || 'N/A'}</div>
                <div class="mobile-char-info-field"><strong>Creator:</strong> ${char.data?.creator || 'N/A'}</div>
                <div class="mobile-char-info-field"><strong>Description:</strong><br>${char.description || char.data?.description || 'No description'}</div>
                <div class="mobile-char-info-field"><strong>Personality:</strong><br>${char.personality || char.data?.personality || 'No personality defined'}</div>
                <div class="mobile-char-info-field"><strong>Scenario:</strong><br>${char.scenario || char.data?.scenario || 'No scenario'}</div>
            `;
        }
    } catch (e) {
        console.warn('[Mobile Layout] Error loading character info:', e);
    }
}

// ─── Toast Notification ────────────────────────────────────────────────────────

function showToast(message, duration = 1500) {
    const existing = document.getElementById('mobile-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'mobile-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ─── Main Init ─────────────────────────────────────────────────────────────────

function createNavBarFallback() {
    const nav = document.createElement('div');
    nav.id = 'mobile-nav-bar';
    nav.innerHTML = `
        <div class="mobile-nav-item active" data-target="chat" title="Chat">
            <i class="fa-solid fa-comments"></i>
            <span class="mobile-nav-label">Chat</span>
        </div>
        <div class="mobile-nav-item" data-target="characters" title="Characters">
            <i class="fa-solid fa-address-book"></i>
            <span class="mobile-nav-label">Characters</span>
        </div>
        <div class="mobile-nav-item" data-target="settings" title="Settings">
            <i class="fa-solid fa-cog"></i>
            <span class="mobile-nav-label">Settings</span>
        </div>
        <div class="mobile-nav-item" data-target="world-info" title="World Info">
            <i class="fa-solid fa-globe"></i>
            <span class="mobile-nav-label">World Info</span>
        </div>
        <div class="mobile-nav-item" data-target="extensions" title="Extensions">
            <i class="fa-solid fa-puzzle-piece"></i>
            <span class="mobile-nav-label">Extensions</span>
        </div>
    `;
    return nav;
}

function createSettingsFallback() {
    const div = document.createElement('div');
    div.innerHTML = `
        <div id="mobile-layout-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-header inline-drawer-toggle">
                    <b>Mobile Layout</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-enabled" checked>
                            <span>Enable Mobile Layout</span>
                        </label>
                    </div>
                    <h4>Theme</h4>
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-amoled">
                            <span>AMOLED Black Mode</span>
                        </label>
                    </div>
                    <div class="mobile-layout-setting-group">
                        <label for="mobile-layout-accent">Accent Color</label>
                        <div class="mobile-layout-accent-row">
                            <div class="mobile-layout-accent-swatch" data-color="#7c5cbf" style="background:#7c5cbf;" title="Purple"></div>
                            <div class="mobile-layout-accent-swatch" data-color="#3b82f6" style="background:#3b82f6;" title="Blue"></div>
                            <div class="mobile-layout-accent-swatch" data-color="#10b981" style="background:#10b981;" title="Green"></div>
                            <div class="mobile-layout-accent-swatch" data-color="#f59e0b" style="background:#f59e0b;" title="Amber"></div>
                            <div class="mobile-layout-accent-swatch" data-color="#ef4444" style="background:#ef4444;" title="Red"></div>
                            <div class="mobile-layout-accent-swatch" data-color="#ec4899" style="background:#ec4899;" title="Pink"></div>
                            <input type="text" id="mobile-layout-accent-custom" placeholder="#hex" maxlength="7">
                        </div>
                    </div>
                    <h4>Features</h4>
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-gestures" checked>
                            <span>Edge Swipe Gestures</span>
                        </label>
                    </div>
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-char-strip" checked>
                            <span>Quick Character Strip</span>
                        </label>
                    </div>
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-response-strip" checked>
                            <span>Response Strip</span>
                        </label>
                    </div>
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-char-context-menu" checked>
                            <span>Character Tap Context Menu</span>
                        </label>
                    </div>
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-format-toolbar" checked>
                            <span>Formatting Toolbar</span>
                        </label>
                    </div>
                    <div class="mobile-layout-setting-group">
                        <label class="mobile-layout-toggle">
                            <input type="checkbox" id="mobile-layout-model-combobox" checked>
                            <span>Model Combo Box</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    return div.innerHTML;
}

async function init() {
    console.log('[Mobile Layout] Extension loaded');

    loadAllSettings();

    if (!isMobileDevice()) {
        console.log('[Mobile Layout] Desktop detected, extension dormant');
        return;
    }

    applySettings();

    let navLoaded = false;
    let settingsLoaded = false;

    try {
        const context = SillyTavern.getContext();
        if (context?.renderExtensionTemplateAsync) {
            try {
                const navHtml = await context.renderExtensionTemplateAsync(EXTENSION_NAME, 'mobile-nav');
                if (navHtml) {
                    const navContainer = document.createElement('div');
                    navContainer.innerHTML = navHtml;
                    document.body.appendChild(navContainer.firstElementChild || navContainer);
                    navLoaded = true;
                }
            } catch (e) {
                console.warn('[Mobile Layout] Template load failed, using fallback:', e);
            }

            try {
                const settingsHtml = await context.renderExtensionTemplateAsync(EXTENSION_NAME, 'settings');
                if (settingsHtml) {
                    const extSettings = document.getElementById('extensions_settings');
                    if (extSettings) {
                        extSettings.insertAdjacentHTML('beforeend', settingsHtml);
                        settingsLoaded = true;
                    }
                }
            } catch (e) {
                console.warn('[Mobile Layout] Settings template load failed, using fallback:', e);
            }
        }
    } catch (e) {
        console.warn('[Mobile Layout] Context unavailable, using fallbacks:', e);
    }

    if (!navLoaded) {
        console.log('[Mobile Layout] Using JS fallback for nav bar');
        document.body.appendChild(createNavBarFallback());
    }

    if (!settingsLoaded) {
        console.log('[Mobile Layout] Using JS fallback for settings panel');
        const extSettings = document.getElementById('extensions_settings');
        if (extSettings) {
            extSettings.insertAdjacentHTML('beforeend', createSettingsFallback());
        }
    }

    initBottomNav();
    initSlideUpDrawers();
    initKeyboardHandling();
    initCharacterStrip();
    initMessageActions();
    initGestures();
    initChatNavigation();
    initInputEnhancements();
    initResponseStrip();
    initCharContextMenu();
    bindSettingsPanel();

    setTimeout(() => {
        initModelCombobox();
    }, 1000);

    window.addEventListener('resize', () => {
        applySettings();
    });
}

jQuery(async () => {
    await init();
});
