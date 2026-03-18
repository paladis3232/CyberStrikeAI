// WebShell Management (similar to Behinder/AntSword: virtual terminal, file manager, command execution)

const WEBSHELL_SIDEBAR_WIDTH_KEY = 'webshell_sidebar_width';
const WEBSHELL_DEFAULT_SIDEBAR_WIDTH = 360;
/** Minimum width of the right main area (terminal/file manager) to prevent deformation when dragging */
const WEBSHELL_MAIN_MIN_WIDTH = 380;
const WEBSHELL_PROMPT = 'shell> ';
let webshellConnections = [];
let currentWebshellId = null;
let webshellTerminalInstance = null;
let webshellTerminalFitAddon = null;
let webshellTerminalResizeObserver = null;
let webshellTerminalResizeContainer = null;
let webshellCurrentConn = null;
let webshellLineBuffer = '';
let webshellRunning = false;
// Per-connection command history for up/down arrow navigation
let webshellHistoryByConn = {};
let webshellHistoryIndex = -1;
const WEBSHELL_HISTORY_MAX = 100;
// Clear screen guard: one click executes once (prevents duplicate bindings / multiple shell> prompts)
let webshellClearInProgress = false;
// AI assistant: saves conversation ID per connection for multi-turn conversations
let webshellAiConvMap = {};
let webshellAiSending = false;
// Streaming typewriter effect: current session response ID, used to abort stale typing
let webshellStreamingTypingId = 0;

// Fetch connection list from the server (SQLite)
function getWebshellConnections() {
    if (typeof apiFetch === 'undefined') {
        return Promise.resolve([]);
    }
    return apiFetch('/api/webshell/connections', { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(function (list) { return Array.isArray(list) ? list : []; })
        .catch(function (e) {
            console.warn('Failed to load WebShell connection list', e);
            return [];
        });
}

// Refresh connection list from server and re-render sidebar
function refreshWebshellConnectionsFromServer() {
    return getWebshellConnections().then(function (list) {
        webshellConnections = list;
        renderWebshellList();
        return list;
    });
}

// Use wsT to avoid conflicts with global window.t causing infinite recursion
function wsT(key) {
    var globalT = typeof window !== 'undefined' ? window.t : null;
    if (typeof globalT === 'function' && globalT !== wsT) return globalT(key);
    var fallback = {
        'webshell.title': 'WebShell Management',
        'webshell.addConnection': 'Add Connection',
        'webshell.cmdParam': 'Command Param',
        'webshell.cmdParamPlaceholder': 'Default is "cmd". If set to "xxx", request will use xxx=command',
        'webshell.connections': 'Connections',
        'webshell.noConnections': 'No connections yet. Click "Add Connection"',
        'webshell.selectOrAdd': 'Select a connection from the left, or add a new WebShell connection',
        'webshell.deleteConfirm': 'Are you sure you want to delete this connection?',
        'webshell.editConnection': 'Edit',
        'webshell.editConnectionTitle': 'Edit Connection',
        'webshell.tabTerminal': 'Terminal',
        'webshell.tabFileManager': 'File Manager',
        'webshell.tabAiAssistant': 'AI Assistant',
        'webshell.aiSystemReadyMessage': 'System ready. Enter your testing request and the system will execute the appropriate security tests.',
        'webshell.aiPlaceholder': 'e.g. List files in the current directory',
        'webshell.aiSend': 'Send',
        'webshell.terminalWelcome': 'WebShell Virtual Terminal — type a command and press Enter (Ctrl+L to clear)',
        'webshell.quickCommands': 'Quick Commands',
        'webshell.downloadFile': 'Download',
        'webshell.filePath': 'Current Path',
        'webshell.listDir': 'List Dir',
        'webshell.readFile': 'Read',
        'webshell.editFile': 'Edit',
        'webshell.deleteFile': 'Delete',
        'webshell.saveFile': 'Save',
        'webshell.cancelEdit': 'Cancel',
        'webshell.parentDir': 'Parent Dir',
        'webshell.execError': 'Execution failed',
        'webshell.testConnectivity': 'Test Connection',
        'webshell.testSuccess': 'Connection OK, shell is accessible',
        'webshell.testFailed': 'Connectivity test failed',
        'webshell.testNoExpectedOutput': 'Shell responded but output was unexpected. Check password and command param name.',
        'webshell.clearScreen': 'Clear',
        'webshell.running': 'Running…',
        'webshell.waitFinish': 'Please wait for the current command to finish',
        'webshell.newDir': 'New Directory',
        'webshell.rename': 'Rename',
        'webshell.upload': 'Upload',
        'webshell.newFile': 'New File',
        'webshell.filterPlaceholder': 'Filter filenames',
        'webshell.batchDelete': 'Batch Delete',
        'webshell.batchDownload': 'Batch Download',
        'webshell.refresh': 'Refresh',
        'webshell.selectAll': 'Select All',
        'webshell.breadcrumbHome': 'Root',
        'webshell.aiNewConversation': 'New Chat',
        'common.delete': 'Delete',
        'common.refresh': 'Refresh'
    };
    return fallback[key] || key;
}

// Bind clear screen handler once globally: destroys and recreates terminal (ensures only one shell> prompt)
function bindWebshellClearOnce() {
    if (window._webshellClearBound) return;
    window._webshellClearBound = true;
    document.body.addEventListener('click', function (e) {
        var btn = e.target && (e.target.id === 'webshell-terminal-clear' ? e.target : e.target.closest ? e.target.closest('#webshell-terminal-clear') : null);
        if (!btn || !webshellCurrentConn) return;
        e.preventDefault();
        e.stopPropagation();
        if (webshellClearInProgress) return;
        webshellClearInProgress = true;
        try {
            destroyWebshellTerminal();
            webshellLineBuffer = '';
            webshellHistoryIndex = -1;
            initWebshellTerminal(webshellCurrentConn);
        } finally {
            setTimeout(function () { webshellClearInProgress = false; }, 100);
        }
    }, true);
}

// Initialize WebShell Management page (fetches connection list from SQLite)
function initWebshellPage() {
    bindWebshellClearOnce();
    destroyWebshellTerminal();
    webshellCurrentConn = null;
    currentWebshellId = null;
    webshellConnections = [];
    renderWebshellList();
    applyWebshellSidebarWidth();
    initWebshellSidebarResize();
    const workspace = document.getElementById('webshell-workspace');
    if (workspace) {
        workspace.innerHTML = '<div class="webshell-workspace-placeholder" data-i18n="webshell.selectOrAdd">' + (wsT('webshell.selectOrAdd')) + '</div>';
    }
    getWebshellConnections().then(function (list) {
        webshellConnections = list;
        renderWebshellList();
    });
}

function getWebshellSidebarWidth() {
    try {
        const w = parseInt(localStorage.getItem(WEBSHELL_SIDEBAR_WIDTH_KEY), 10);
        if (!isNaN(w) && w >= 260 && w <= 800) return w;
    } catch (e) {}
    return WEBSHELL_DEFAULT_SIDEBAR_WIDTH;
}

function setWebshellSidebarWidth(px) {
    localStorage.setItem(WEBSHELL_SIDEBAR_WIDTH_KEY, String(px));
}

function applyWebshellSidebarWidth() {
    const sidebar = document.getElementById('webshell-sidebar');
    if (!sidebar) return;
    const parentW = sidebar.parentElement ? sidebar.parentElement.offsetWidth : 0;
    let w = getWebshellSidebarWidth();
    if (parentW > 0) w = Math.min(w, Math.max(260, parentW - WEBSHELL_MAIN_MIN_WIDTH));
    sidebar.style.width = w + 'px';
}

function initWebshellSidebarResize() {
    const handle = document.getElementById('webshell-resize-handle');
    const sidebar = document.getElementById('webshell-sidebar');
    if (!handle || !sidebar || handle.dataset.resizeBound === '1') return;
    handle.dataset.resizeBound = '1';
    let startX = 0, startW = 0;
    function onMove(e) {
        const dx = e.clientX - startX;
        let w = Math.round(startW + dx);
        const parentW = sidebar.parentElement ? sidebar.parentElement.offsetWidth : 800;
        const min = 260;
        const max = Math.min(800, parentW - WEBSHELL_MAIN_MIN_WIDTH);
        w = Math.max(min, Math.min(max, w));
        sidebar.style.width = w + 'px';
    }
    function onUp() {
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        setWebshellSidebarWidth(parseInt(sidebar.style.width, 10) || WEBSHELL_DEFAULT_SIDEBAR_WIDTH);
    }
    handle.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        startX = e.clientX;
        startW = sidebar.offsetWidth;
        handle.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

// Destroy current terminal instance (when switching connections or leaving the page)
function destroyWebshellTerminal() {
    if (webshellTerminalResizeObserver && webshellTerminalResizeContainer) {
        try { webshellTerminalResizeObserver.unobserve(webshellTerminalResizeContainer); } catch (e) {}
        webshellTerminalResizeObserver = null;
        webshellTerminalResizeContainer = null;
    }
    if (webshellTerminalInstance) {
        try {
            webshellTerminalInstance.dispose();
        } catch (e) {}
        webshellTerminalInstance = null;
    }
    webshellTerminalFitAddon = null;
    webshellLineBuffer = '';
    webshellRunning = false;
}

// Render the connection list in the sidebar
function renderWebshellList() {
    const listEl = document.getElementById('webshell-list');
    if (!listEl) return;

    if (!webshellConnections.length) {
        listEl.innerHTML = '<div class="webshell-empty" data-i18n="webshell.noConnections">' + (wsT('webshell.noConnections')) + '</div>';
        return;
    }

    listEl.innerHTML = webshellConnections.map(conn => {
        const remark = (conn.remark || conn.url || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const url = (conn.url || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const urlTitle = (conn.url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const active = currentWebshellId === conn.id ? ' active' : '';
        const safeId = escapeHtml(conn.id);
        return (
            '<div class="webshell-item' + active + '" data-id="' + safeId + '">' +
            '<div class="webshell-item-remark" title="' + urlTitle + '">' + remark + '</div>' +
            '<div class="webshell-item-url" title="' + urlTitle + '">' + url + '</div>' +
            '<div class="webshell-item-actions">' +
            '<button type="button" class="btn-ghost btn-sm webshell-edit-conn-btn" data-id="' + safeId + '" title="' + wsT('webshell.editConnection') + '">' + wsT('webshell.editConnection') + '</button> ' +
            '<button type="button" class="btn-ghost btn-sm webshell-delete-btn" data-id="' + safeId + '" title="' + wsT('common.delete') + '">' + wsT('common.delete') + '</button>' +
            '</div>' +
            '</div>'
        );
    }).join('');

    listEl.querySelectorAll('.webshell-item').forEach(el => {
        el.addEventListener('click', function (e) {
            if (e.target.closest('.webshell-delete-btn') || e.target.closest('.webshell-edit-conn-btn')) return;
            selectWebshell(el.getAttribute('data-id'));
        });
    });
    listEl.querySelectorAll('.webshell-edit-conn-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            showEditWebshellModal(btn.getAttribute('data-id'));
        });
    });
    listEl.querySelectorAll('.webshell-delete-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteWebshell(btn.getAttribute('data-id'));
        });
    });
}

function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function formatWebshellAiConvDate(updatedAt) {
    if (!updatedAt) return '';
    var d = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
    if (isNaN(d.getTime())) return '';
    var now = new Date();
    var sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (sameDay) return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    return (d.getMonth() + 1) + '/' + d.getDate();
}

// Build a timeline item HTML from saved processDetail (consistent with appendTimelineItem display)
function buildWebshellTimelineItemFromDetail(detail) {
    var eventType = detail.eventType || '';
    var title = detail.message || '';
    var data = detail.data || {};
    if (eventType === 'iteration') {
        title = (typeof window.t === 'function') ? window.t('chat.iterationRound', { n: data.iteration || 1 }) : ('Iteration ' + (data.iteration || 1));
    } else if (eventType === 'thinking') {
        title = '🤔 ' + ((typeof window.t === 'function') ? window.t('chat.aiThinking') : 'AI Thinking');
    } else if (eventType === 'tool_calls_detected') {
        title = '🔧 ' + ((typeof window.t === 'function') ? window.t('chat.toolCallsDetected', { count: data.count || 0 }) : ('Detected ' + (data.count || 0) + ' tool call(s)'));
    } else if (eventType === 'tool_call') {
        var tn = data.toolName || ((typeof window.t === 'function') ? window.t('chat.unknownTool') : 'Unknown tool');
        var idx = data.index || 0;
        var total = data.total || 0;
        title = '🔧 ' + ((typeof window.t === 'function') ? window.t('chat.callTool', { name: tn, index: idx, total: total }) : ('Calling: ' + tn + (total ? ' (' + idx + '/' + total + ')' : '')));
    } else if (eventType === 'tool_result') {
        var success = data.success !== false;
        var tname = data.toolName || 'Tool';
        title = (success ? '✅ ' : '❌ ') + ((typeof window.t === 'function') ? (success ? window.t('chat.toolExecComplete', { name: tname }) : window.t('chat.toolExecFailed', { name: tname })) : (tname + (success ? ' completed' : ' failed')));
    } else if (eventType === 'progress') {
        title = (typeof window.translateProgressMessage === 'function') ? window.translateProgressMessage(detail.message || '') : (detail.message || '');
    }
    var html = '<span class="webshell-ai-timeline-title">' + escapeHtml(title || '') + '</span>';
    if (eventType === 'tool_call' && data && (data.argumentsObj || data.arguments)) {
        try {
            var args = data.argumentsObj || (data.arguments ? JSON.parse(data.arguments) : null);
            if (args && typeof args === 'object') {
                var paramsLabel = (typeof window.t === 'function') ? window.t('timeline.params') : 'Parameters:';
                html += '<div class="webshell-ai-timeline-msg"><div class="tool-arg-section"><strong>' + escapeHtml(paramsLabel) + '</strong><pre class="tool-args">' + escapeHtml(JSON.stringify(args, null, 2)) + '</pre></div></div>';
            }
        } catch (ex) {}
    }
    if ((eventType === 'tool_result' || eventType === 'tool_call') && data && data.result !== undefined) {
        var resultStr = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
        if (resultStr && resultStr.trim()) {
            var resultLabel = (typeof window.t === 'function') ? window.t('timeline.result') : 'Result:';
            html += '<div class="webshell-ai-timeline-msg"><div class="tool-arg-section"><strong>' + escapeHtml(resultLabel) + '</strong><pre class="tool-args">' + escapeHtml(resultStr) + '</pre></div></div>';
        }
    }
    return html;
}

// Fetch and render the AI conversation list for a WebShell connection (sidebar)
function fetchAndRenderWebshellAiConvList(conn, listEl) {
    if (!conn || !listEl || typeof apiFetch === 'undefined') return;
    apiFetch('/api/webshell/connections/' + encodeURIComponent(conn.id) + '/ai-conversations', { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(function (list) {
            if (!Array.isArray(list) || list.length === 0) {
                listEl.innerHTML = '<div class="webshell-ai-conv-empty">No conversations yet</div>';
                return;
            }
            var currentConvId = webshellAiConvMap[conn.id] || null;
            listEl.innerHTML = list.map(function (item) {
                var active = item.id === currentConvId ? ' active' : '';
                return '<div class="webshell-ai-conv-item' + active + '" data-id="' + escapeHtml(item.id) + '">' +
                    '<span class="webshell-ai-conv-title">' + escapeHtml(item.title || 'Untitled') + '</span>' +
                    '<span class="webshell-ai-conv-date">' + formatWebshellAiConvDate(item.updatedAt) + '</span>' +
                    '</div>';
            }).join('');
            listEl.querySelectorAll('.webshell-ai-conv-item').forEach(function (el) {
                el.addEventListener('click', function () {
                    var convId = el.getAttribute('data-id');
                    if (!convId) return;
                    webshellAiConvMap[conn.id] = convId;
                    listEl.querySelectorAll('.webshell-ai-conv-item').forEach(function (x) { x.classList.remove('active'); });
                    el.classList.add('active');
                    loadWebshellAiHistory(conn, convId);
                });
            });
        })
        .catch(function () {
            listEl.innerHTML = '<div class="webshell-ai-conv-empty">Failed to load conversations</div>';
        });
}

// Select a connection and display the workspace (terminal / file manager / AI assistant)
function selectWebshell(id) {
    var conn = webshellConnections.find(function (c) { return c.id === id; });
    if (!conn) return;

    if (currentWebshellId !== id) {
        destroyWebshellTerminal();
        webshellHistoryIndex = -1;
    }

    currentWebshellId = id;
    webshellCurrentConn = conn;

    var listEl = document.getElementById('webshell-list');
    if (listEl) {
        listEl.querySelectorAll('.webshell-item').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-id') === id);
        });
    }

    var workspace = document.getElementById('webshell-workspace');
    if (!workspace) return;

    // Quick commands for the terminal toolbar
    var quickCmds = [
        { label: 'id', cmd: 'id' },
        { label: 'whoami', cmd: 'whoami' },
        { label: 'pwd', cmd: 'pwd' },
        { label: 'uname -a', cmd: 'uname -a' },
        { label: 'ifconfig', cmd: 'ifconfig' },
        { label: 'netstat', cmd: 'netstat -an' }
    ];

    workspace.innerHTML =
        '<div class="webshell-tabs">' +
        '<button type="button" class="webshell-tab active" data-tab="terminal">' + wsT('webshell.tabTerminal') + '</button>' +
        '<button type="button" class="webshell-tab" data-tab="file">' + wsT('webshell.tabFileManager') + '</button>' +
        '<button type="button" class="webshell-tab" data-tab="ai">' + (wsT('webshell.tabAiAssistant') || 'AI Assistant') + '</button>' +
        '</div>' +
        '<div class="webshell-pane active" data-pane="terminal">' +
        '<div class="webshell-terminal-toolbar">' +
        '<span class="webshell-quick-label">' + (wsT('webshell.quickCommands') || 'Quick Commands') + ':</span>' +
        quickCmds.map(function (q) { return '<button type="button" class="btn-ghost btn-sm webshell-quick-cmd" data-cmd="' + escapeHtml(q.cmd) + '">' + escapeHtml(q.label) + '</button>'; }).join('') +
        '<button type="button" id="webshell-terminal-clear" class="btn-ghost btn-sm" style="margin-left:auto;">' + (wsT('webshell.clearScreen') || 'Clear') + '</button>' +
        '</div>' +
        '<div class="webshell-terminal-container" id="webshell-terminal-container"></div>' +
        '</div>' +
        '<div class="webshell-pane" data-pane="file">' +
        '<div class="webshell-file-toolbar">' +
        '<label><span>' + wsT('webshell.filePath') + '</span><input type="text" id="webshell-file-path" value="." style="width:200px;" /></label>' +
        '<button type="button" id="webshell-list-dir" class="btn-ghost btn-sm">' + wsT('webshell.listDir') + '</button>' +
        '<button type="button" id="webshell-parent-dir" class="btn-ghost btn-sm">' + wsT('webshell.parentDir') + '</button>' +
        '<button type="button" id="webshell-file-refresh" class="btn-ghost btn-sm" title="' + (wsT('webshell.refresh') || 'Refresh') + '">' + (wsT('webshell.refresh') || 'Refresh') + '</button>' +
        '<button type="button" id="webshell-mkdir-btn" class="btn-ghost btn-sm">' + (wsT('webshell.newDir') || 'New Directory') + '</button>' +
        '<button type="button" id="webshell-newfile-btn" class="btn-ghost btn-sm">' + (wsT('webshell.newFile') || 'New File') + '</button>' +
        '<button type="button" id="webshell-upload-btn" class="btn-ghost btn-sm">' + (wsT('webshell.upload') || 'Upload') + '</button>' +
        '<button type="button" id="webshell-batch-delete-btn" class="btn-ghost btn-sm">' + (wsT('webshell.batchDelete') || 'Batch Delete') + '</button>' +
        '<button type="button" id="webshell-batch-download-btn" class="btn-ghost btn-sm">' + (wsT('webshell.batchDownload') || 'Batch Download') + '</button>' +
        '<input type="text" id="webshell-file-filter" placeholder="' + (wsT('webshell.filterPlaceholder') || 'Filter filenames') + '" style="width:140px;" />' +
        '</div>' +
        '<div id="webshell-file-breadcrumb" class="webshell-file-breadcrumb"></div>' +
        '<div id="webshell-file-list" class="webshell-file-list"></div>' +
        '</div>' +
        '<div class="webshell-pane" data-pane="ai">' +
        '<div class="webshell-ai-layout">' +
        '<div class="webshell-ai-conv-sidebar">' +
        '<div class="webshell-ai-conv-header">' +
        '<button type="button" id="webshell-ai-new-conv" class="btn-ghost btn-sm">' + (wsT('webshell.aiNewConversation') || 'New Chat') + '</button>' +
        '</div>' +
        '<div id="webshell-ai-conv-list" class="webshell-ai-conv-list"></div>' +
        '</div>' +
        '<div class="webshell-ai-main">' +
        '<div id="webshell-ai-messages" class="webshell-ai-messages"></div>' +
        '<div class="webshell-ai-input-row">' +
        '<textarea id="webshell-ai-input" rows="2" placeholder="' + (wsT('webshell.aiPlaceholder') || 'e.g. List files in current directory') + '"></textarea>' +
        '<button type="button" id="webshell-ai-send" class="btn-primary btn-sm">' + (wsT('webshell.aiSend') || 'Send') + '</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';

    // Tab switching
    workspace.querySelectorAll('.webshell-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            workspace.querySelectorAll('.webshell-tab').forEach(function (t) { t.classList.remove('active'); });
            workspace.querySelectorAll('.webshell-pane').forEach(function (p) { p.classList.remove('active'); });
            tab.classList.add('active');
            var pane = workspace.querySelector('[data-pane="' + tab.getAttribute('data-tab') + '"]');
            if (pane) pane.classList.add('active');
            if (tab.getAttribute('data-tab') === 'terminal' && webshellTerminalFitAddon) {
                setTimeout(function () { try { webshellTerminalFitAddon.fit(); } catch (e) {} }, 50);
            }
            if (tab.getAttribute('data-tab') === 'file') {
                var pathInput = document.getElementById('webshell-file-path');
                webshellFileListDir(conn, pathInput ? pathInput.value.trim() || '.' : '.');
            }
            if (tab.getAttribute('data-tab') === 'ai') {
                loadWebshellAiAssistant(conn);
            }
        });
    });

    // File manager toolbar event handlers
    var pathInput = document.getElementById('webshell-file-path');
    var listDirBtn = document.getElementById('webshell-list-dir');
    var parentDirBtn = document.getElementById('webshell-parent-dir');
    var refreshBtn = document.getElementById('webshell-file-refresh');
    var mkdirBtn = document.getElementById('webshell-mkdir-btn');
    var newFileBtn = document.getElementById('webshell-newfile-btn');
    var uploadBtn = document.getElementById('webshell-upload-btn');
    var batchDeleteBtn = document.getElementById('webshell-batch-delete-btn');
    var batchDownloadBtn = document.getElementById('webshell-batch-download-btn');
    var filterInput = document.getElementById('webshell-file-filter');

    if (listDirBtn) listDirBtn.addEventListener('click', function () { webshellFileListDir(conn, pathInput ? pathInput.value.trim() || '.' : '.'); });
    if (parentDirBtn) parentDirBtn.addEventListener('click', function () {
        if (!pathInput) return;
        var p = pathInput.value.trim() || '.';
        var parent = p.replace(/\/[^/]+\/?$/, '') || '.';
        if (parent === p) parent = '.';
        pathInput.value = parent;
        webshellFileListDir(conn, parent);
    });
    if (refreshBtn) refreshBtn.addEventListener('click', function () { webshellFileListDir(conn, pathInput ? pathInput.value.trim() || '.' : '.'); });
    if (mkdirBtn) mkdirBtn.addEventListener('click', function () { webshellFileMkdir(conn, pathInput); });
    if (newFileBtn) newFileBtn.addEventListener('click', function () { webshellFileNewFile(conn, pathInput); });
    if (uploadBtn) uploadBtn.addEventListener('click', function () { webshellFileUpload(conn, pathInput); });
    if (batchDeleteBtn) batchDeleteBtn.addEventListener('click', function () { webshellBatchDelete(conn, pathInput); });
    if (batchDownloadBtn) batchDownloadBtn.addEventListener('click', function () { webshellBatchDownload(conn, pathInput); });
    if (filterInput) filterInput.addEventListener('input', function () { webshellFileListApplyFilter(); });

    // Quick command buttons
    workspace.querySelectorAll('.webshell-quick-cmd').forEach(function (btn) {
        btn.addEventListener('click', function () { runQuickCommand(btn.getAttribute('data-cmd')); });
    });

    // Initialize terminal
    initWebshellTerminal(conn);
}

// Load AI assistant tab: fetch history, initialize conversation list
function loadWebshellAiAssistant(conn) {
    var convListEl = document.getElementById('webshell-ai-conv-list');
    var aiNewConvBtn = document.getElementById('webshell-ai-new-conv');
    var aiMessages = document.getElementById('webshell-ai-messages');
    var aiInput = document.getElementById('webshell-ai-input');
    var aiSendBtn = document.getElementById('webshell-ai-send');

    if (convListEl) fetchAndRenderWebshellAiConvList(conn, convListEl);

    if (aiNewConvBtn) {
        aiNewConvBtn.onclick = function () {
            delete webshellAiConvMap[conn.id];
            if (aiMessages) {
                aiMessages.innerHTML = '';
                var readyDiv = document.createElement('div');
                readyDiv.className = 'webshell-ai-msg assistant';
                readyDiv.textContent = wsT('webshell.aiSystemReadyMessage') || 'System ready.';
                aiMessages.appendChild(readyDiv);
            }
            if (convListEl) {
                convListEl.querySelectorAll('.webshell-ai-conv-item').forEach(function (x) { x.classList.remove('active'); });
            }
        };
    }

    // Load history for the most recent conversation
    var savedConvId = webshellAiConvMap[conn.id];
    if (savedConvId) {
        loadWebshellAiHistory(conn, savedConvId);
    } else {
        apiFetch('/api/webshell/connections/' + encodeURIComponent(conn.id) + '/ai-history', { method: 'GET' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.conversationId) {
                    webshellAiConvMap[conn.id] = data.conversationId;
                    if (Array.isArray(data.messages) && data.messages.length > 0) {
                        renderWebshellAiMessages(data.messages, aiMessages);
                    } else {
                        showWebshellAiReadyMessage(aiMessages);
                    }
                    if (convListEl) fetchAndRenderWebshellAiConvList(conn, convListEl);
                } else {
                    showWebshellAiReadyMessage(aiMessages);
                }
            })
            .catch(function () {
                showWebshellAiReadyMessage(aiMessages);
            });
    }

    if (aiSendBtn) {
        aiSendBtn.onclick = function () { runWebshellAiSend(conn); };
    }
    if (aiInput) {
        aiInput.onkeydown = function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runWebshellAiSend(conn); }
        };
    }
}

function showWebshellAiReadyMessage(aiMessages) {
    if (!aiMessages) return;
    aiMessages.innerHTML = '';
    var readyDiv = document.createElement('div');
    readyDiv.className = 'webshell-ai-msg assistant';
    readyDiv.textContent = wsT('webshell.aiSystemReadyMessage') || 'System ready.';
    aiMessages.appendChild(readyDiv);
}

function renderWebshellAiMessages(messages, container) {
    if (!container) return;
    container.innerHTML = '';
    messages.forEach(function (msg) {
        if (msg.role === 'user') {
            var div = document.createElement('div');
            div.className = 'webshell-ai-msg user';
            div.textContent = msg.content || '';
            container.appendChild(div);
        } else if (msg.role === 'assistant') {
            var div = document.createElement('div');
            div.className = 'webshell-ai-msg assistant';
            // Process details (timeline) if present
            if (Array.isArray(msg.processDetails) && msg.processDetails.length > 0) {
                var tlDiv = document.createElement('div');
                tlDiv.className = 'webshell-ai-timeline';
                msg.processDetails.forEach(function (detail) {
                    var item = document.createElement('div');
                    item.className = 'webshell-ai-timeline-item';
                    item.innerHTML = buildWebshellTimelineItemFromDetail(detail);
                    tlDiv.appendChild(item);
                });
                div.appendChild(tlDiv);
            }
            var textDiv = document.createElement('div');
            textDiv.className = 'webshell-ai-msg-text';
            if (typeof window.renderMarkdown === 'function') {
                textDiv.innerHTML = window.renderMarkdown(msg.content || '');
            } else {
                textDiv.textContent = msg.content || '';
            }
            div.appendChild(textDiv);
            container.appendChild(div);
        }
    });
    container.scrollTop = container.scrollHeight;
}

function loadWebshellAiHistory(conn, convId) {
    var aiMessages = document.getElementById('webshell-ai-messages');
    if (!aiMessages || !convId) return;
    if (typeof apiFetch === 'undefined') return;
    apiFetch('/api/conversations/' + encodeURIComponent(convId), { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data && Array.isArray(data.messages) && data.messages.length > 0) {
                renderWebshellAiMessages(data.messages, aiMessages);
            } else {
                showWebshellAiReadyMessage(aiMessages);
            }
        })
        .catch(function () {
            showWebshellAiReadyMessage(aiMessages);
        });
}

// Send AI message (streaming via /api/agent-loop/stream)
function runWebshellAiSend(conn) {
    var aiInput = document.getElementById('webshell-ai-input');
    var aiSendBtn = document.getElementById('webshell-ai-send');
    var aiMessages = document.getElementById('webshell-ai-messages');
    var convListEl = document.getElementById('webshell-ai-conv-list');
    if (!aiInput || !aiMessages) return;
    var text = aiInput.value.trim();
    if (!text) return;
    if (webshellAiSending) return;
    webshellAiSending = true;
    if (aiSendBtn) { aiSendBtn.disabled = true; aiSendBtn.textContent = '…'; }

    // Append user message
    var userDiv = document.createElement('div');
    userDiv.className = 'webshell-ai-msg user';
    userDiv.textContent = text;
    aiMessages.appendChild(userDiv);
    aiInput.value = '';
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // Create assistant message container
    var assistantDiv = document.createElement('div');
    assistantDiv.className = 'webshell-ai-msg assistant';
    var tlDiv = document.createElement('div');
    tlDiv.className = 'webshell-ai-timeline';
    assistantDiv.appendChild(tlDiv);
    var textDiv = document.createElement('div');
    textDiv.className = 'webshell-ai-msg-text';
    assistantDiv.appendChild(textDiv);
    aiMessages.appendChild(assistantDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    var convId = webshellAiConvMap[conn.id] || null;
    var myTypingId = ++webshellStreamingTypingId;

    var body = {
        message: text,
        conversationId: convId,
        webshellConnectionId: conn.id
    };

    if (typeof apiFetch === 'undefined') {
        webshellAiSending = false;
        if (aiSendBtn) { aiSendBtn.disabled = false; aiSendBtn.textContent = wsT('webshell.aiSend') || 'Send'; }
        return;
    }

    apiFetch('/api/agent-loop/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(function (resp) {
        if (!resp.ok || !resp.body) throw new Error('Stream error');
        var reader = resp.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
        var fullText = '';

        function read() {
            reader.read().then(function (result) {
                if (myTypingId !== webshellStreamingTypingId) return;
                if (result.done) {
                    webshellAiSending = false;
                    if (aiSendBtn) { aiSendBtn.disabled = false; aiSendBtn.textContent = wsT('webshell.aiSend') || 'Send'; }
                    if (convListEl) fetchAndRenderWebshellAiConvList(conn, convListEl);
                    return;
                }
                buffer += decoder.decode(result.value, { stream: true });
                var lines = buffer.split('\n');
                buffer = lines.pop();
                lines.forEach(function (line) {
                    if (!line.startsWith('data: ')) return;
                    var raw = line.slice(6).trim();
                    if (raw === '[DONE]') return;
                    try {
                        var ev = JSON.parse(raw);
                        if (ev.type === 'conversation_id' && ev.conversationId) {
                            webshellAiConvMap[conn.id] = ev.conversationId;
                        } else if (ev.type === 'text_delta' && ev.text) {
                            fullText += ev.text;
                            if (typeof window.renderMarkdown === 'function') {
                                textDiv.innerHTML = window.renderMarkdown(fullText);
                            } else {
                                textDiv.textContent = fullText;
                            }
                            aiMessages.scrollTop = aiMessages.scrollHeight;
                        } else if (ev.type === 'process_detail' && ev.detail) {
                            var item = document.createElement('div');
                            item.className = 'webshell-ai-timeline-item';
                            item.innerHTML = buildWebshellTimelineItemFromDetail(ev.detail);
                            tlDiv.appendChild(item);
                            aiMessages.scrollTop = aiMessages.scrollHeight;
                        }
                    } catch (ex) {}
                });
                read();
            }).catch(function () {
                webshellAiSending = false;
                if (aiSendBtn) { aiSendBtn.disabled = false; aiSendBtn.textContent = wsT('webshell.aiSend') || 'Send'; }
            });
        }
        read();
    }).catch(function (e) {
        webshellAiSending = false;
        if (aiSendBtn) { aiSendBtn.disabled = false; aiSendBtn.textContent = wsT('webshell.aiSend') || 'Send'; }
        var errDiv = document.createElement('div');
        errDiv.className = 'webshell-ai-msg assistant';
        errDiv.textContent = 'Error: ' + (e && e.message ? e.message : String(e));
        aiMessages.appendChild(errDiv);
    });
}

// Execute a quick command in the terminal
function runQuickCommand(cmd) {
    if (!webshellCurrentConn || !cmd) return;
    if (webshellRunning) { alert(wsT('webshell.waitFinish')); return; }
    var term = webshellTerminalInstance;
    if (!term) return;
    term.write('\r\n' + WEBSHELL_PROMPT + cmd + '\r\n');
    webshellRunning = true;
    execWebshellCommand(webshellCurrentConn, cmd).then(function (output) {
        webshellRunning = false;
        if (output) term.write(output.replace(/\n/g, '\r\n'));
        term.write('\r\n' + WEBSHELL_PROMPT);
        webshellLineBuffer = '';
    }).catch(function (err) {
        webshellRunning = false;
        term.write('\r\nError: ' + (err && err.message ? err.message : String(err)) + '\r\n' + WEBSHELL_PROMPT);
        webshellLineBuffer = '';
    });
}

// Initialize xterm.js terminal for a connection
function initWebshellTerminal(conn) {
    var container = document.getElementById('webshell-terminal-container');
    if (!container) return;

    // Destroy any previous instance
    destroyWebshellTerminal();

    if (typeof window.Terminal === 'undefined' || typeof window.FitAddon === 'undefined') {
        container.innerHTML = '<div class="webshell-terminal-error">xterm.js not loaded</div>';
        return;
    }

    var fitAddonInstance = new window.FitAddon.FitAddon();
    var term = new window.Terminal({
        cursorBlink: true,
        convertEol: true,
        scrollback: 1000,
        theme: { background: '#0d1117', foreground: '#c9d1d9' }
    });
    term.loadAddon(fitAddonInstance);
    term.open(container);
    try { fitAddonInstance.fit(); } catch (e) {}

    term.write(wsT('webshell.terminalWelcome') + '\r\n' + WEBSHELL_PROMPT);

    var history = webshellHistoryByConn[conn.id] || [];
    webshellHistoryByConn[conn.id] = history;

    term.onData(function (data) {
        if (webshellRunning) {
            if (data === '\r') term.write('\r\n' + wsT('webshell.running'));
            return;
        }
        // Enter key
        if (data === '\r') {
            var cmd = webshellLineBuffer.trim();
            webshellLineBuffer = '';
            webshellHistoryIndex = -1;
            term.write('\r\n');
            if (!cmd) { term.write(WEBSHELL_PROMPT); return; }
            history.push(cmd);
            if (history.length > WEBSHELL_HISTORY_MAX) history.shift();
            webshellRunning = true;
            execWebshellCommand(conn, cmd).then(function (output) {
                webshellRunning = false;
                if (output) term.write(output.replace(/\n/g, '\r\n'));
                term.write('\r\n' + WEBSHELL_PROMPT);
            }).catch(function (err) {
                webshellRunning = false;
                term.write('Error: ' + (err && err.message ? err.message : String(err)) + '\r\n' + WEBSHELL_PROMPT);
            });
            return;
        }
        // Arrow up
        if (data === '\x1b[A') {
            if (!history.length) return;
            if (webshellHistoryIndex === -1) webshellHistoryIndex = history.length - 1;
            else if (webshellHistoryIndex > 0) webshellHistoryIndex--;
            var h = history[webshellHistoryIndex] || '';
            term.write('\r' + WEBSHELL_PROMPT + h + '\x1b[K');
            webshellLineBuffer = h;
            return;
        }
        // Arrow down
        if (data === '\x1b[B') {
            if (webshellHistoryIndex === -1) return;
            webshellHistoryIndex++;
            var h2 = webshellHistoryIndex < history.length ? history[webshellHistoryIndex] : '';
            if (webshellHistoryIndex >= history.length) webshellHistoryIndex = -1;
            term.write('\r' + WEBSHELL_PROMPT + h2 + '\x1b[K');
            webshellLineBuffer = h2;
            return;
        }
        // Ctrl+L: clear
        if (data === '\x0c') {
            destroyWebshellTerminal();
            webshellLineBuffer = '';
            webshellHistoryIndex = -1;
            initWebshellTerminal(webshellCurrentConn);
            return;
        }
        // Other escape sequences (arrow left/right etc.) — forward directly
        if (data.startsWith('\x1b')) {
            term.write(data);
            return;
        }
        // Backspace
        if (data === '\x7f' || data === '\b') {
            if (webshellLineBuffer.length > 0) {
                webshellLineBuffer = webshellLineBuffer.slice(0, -1);
                term.write('\b \b');
            }
            return;
        }
        webshellLineBuffer += data;
        term.write(data);
    });

    webshellTerminalInstance = term;
    webshellTerminalFitAddon = fitAddonInstance;
    // Re-fit after container dimensions stabilize
    setTimeout(function () {
        try { if (fitAddonInstance) fitAddonInstance.fit(); } catch (e) {}
    }, 100);
    // Re-fit on container resize
    if (fitAddonInstance && typeof ResizeObserver !== 'undefined' && container) {
        webshellTerminalResizeContainer = container;
        webshellTerminalResizeObserver = new ResizeObserver(function () {
            try { fitAddonInstance.fit(); } catch (e) {}
        });
        webshellTerminalResizeObserver.observe(container);
    }
}

// Execute a command via the backend proxy
function execWebshellCommand(conn, command) {
    return new Promise(function (resolve, reject) {
        if (typeof apiFetch === 'undefined') {
            reject(new Error('apiFetch is not defined'));
            return;
        }
        apiFetch('/api/webshell/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: conn.url,
                password: conn.password || '',
                type: conn.type || 'php',
                method: (conn.method || 'post').toLowerCase(),
                cmd_param: conn.cmdParam || '',
                command: command
            })
        }).then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.output !== undefined) resolve(data.output || '');
                else if (data && data.error) reject(new Error(data.error));
                else resolve('');
            })
            .catch(reject);
    });
}

// ---------- File Manager ----------
function webshellFileListDir(conn, path) {
    const listEl = document.getElementById('webshell-file-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="webshell-loading">' + wsT('common.refresh') + '...</div>';

    if (typeof apiFetch === 'undefined') {
        listEl.innerHTML = '<div class="webshell-file-error">apiFetch is not defined</div>';
        return;
    }

    apiFetch('/api/webshell/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: conn.url,
            password: conn.password || '',
            type: conn.type || 'php',
            method: (conn.method || 'post').toLowerCase(),
            cmd_param: conn.cmdParam || '',
            action: 'list',
            path: path
        })
    }).then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.ok && data.error) {
                listEl.innerHTML = '<div class="webshell-file-error">' + escapeHtml(data.error) + '</div><pre class="webshell-file-raw">' + escapeHtml(data.output || '') + '</pre>';
                return;
            }
            listEl.dataset.currentPath = path;
            listEl.dataset.rawOutput = data.output || '';
            renderFileList(listEl, path, data.output || '', conn);
        })
        .catch(function (err) {
            listEl.innerHTML = '<div class="webshell-file-error">' + escapeHtml(err && err.message ? err.message : wsT('webshell.execError')) + '</div>';
        });
}

function renderFileList(listEl, currentPath, rawOutput, conn, nameFilter) {
    var lines = rawOutput.split(/\n/).filter(function (l) { return l.trim(); });
    var items = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var m = line.match(/\s*(\S+)\s*$/);
        var name = m ? m[1].trim() : line.trim();
        if (name === '.' || name === '..') continue;
        var isDir = line.startsWith('d') || line.toLowerCase().indexOf('<dir>') !== -1;
        var size = '';
        var mode = '';
        if (line.startsWith('-') || line.startsWith('d')) {
            var parts = line.split(/\s+/);
            if (parts.length >= 5) { mode = parts[0]; size = parts[4]; }
        }
        items.push({ name: name, isDir: isDir, line: line, size: size, mode: mode });
    }
    if (nameFilter && nameFilter.trim()) {
        var f = nameFilter.trim().toLowerCase();
        items = items.filter(function (item) { return item.name.toLowerCase().indexOf(f) !== -1; });
    }
    // Breadcrumb
    var breadcrumbEl = document.getElementById('webshell-file-breadcrumb');
    if (breadcrumbEl) {
        var parts = (currentPath === '.' || currentPath === '') ? [] : currentPath.replace(/^\//, '').split('/');
        breadcrumbEl.innerHTML = '<a href="#" class="webshell-breadcrumb-item" data-path=".">' + (wsT('webshell.breadcrumbHome') || 'Root') + '</a>' +
            parts.map(function (p, idx) {
                var path = parts.slice(0, idx + 1).join('/');
                return ' / <a href="#" class="webshell-breadcrumb-item" data-path="' + escapeHtml(path) + '">' + escapeHtml(p) + '</a>';
            }).join('');
    }
    var html = '';
    if (items.length === 0 && rawOutput.trim() && !nameFilter) {
        html = '<pre class="webshell-file-raw">' + escapeHtml(rawOutput) + '</pre>';
    } else {
        html = '<table class="webshell-file-table"><thead><tr><th class="webshell-col-check"><input type="checkbox" id="webshell-file-select-all" title="' + (wsT('webshell.selectAll') || 'Select All') + '" /></th><th>' + wsT('webshell.filePath') + '</th><th class="webshell-col-size">Size</th><th></th></tr></thead><tbody>';
        if (currentPath !== '.' && currentPath !== '') {
            html += '<tr><td></td><td><a href="#" class="webshell-file-link" data-path="' + escapeHtml(currentPath.replace(/\/[^/]+$/, '') || '.') + '" data-isdir="1">..</a></td><td></td><td></td></tr>';
        }
        items.forEach(function (item) {
            var pathNext = currentPath === '.' ? item.name : currentPath + '/' + item.name;
            html += '<tr><td class="webshell-col-check">';
            if (!item.isDir) html += '<input type="checkbox" class="webshell-file-cb" data-path="' + escapeHtml(pathNext) + '" />';
            html += '</td><td><a href="#" class="webshell-file-link" data-path="' + escapeHtml(pathNext) + '" data-isdir="' + (item.isDir ? '1' : '0') + '">' + escapeHtml(item.name) + (item.isDir ? '/' : '') + '</a></td><td class="webshell-col-size">' + escapeHtml(item.size) + '</td><td>';
            if (item.isDir) {
                html += '<button type="button" class="btn-ghost btn-sm webshell-file-rename" data-path="' + escapeHtml(pathNext) + '" data-name="' + escapeHtml(item.name) + '">' + (wsT('webshell.rename') || 'Rename') + '</button>';
            } else {
                html += '<button type="button" class="btn-ghost btn-sm webshell-file-read" data-path="' + escapeHtml(pathNext) + '">' + wsT('webshell.readFile') + '</button> ';
                html += '<button type="button" class="btn-ghost btn-sm webshell-file-download" data-path="' + escapeHtml(pathNext) + '">' + wsT('webshell.downloadFile') + '</button> ';
                html += '<button type="button" class="btn-ghost btn-sm webshell-file-edit" data-path="' + escapeHtml(pathNext) + '">' + wsT('webshell.editFile') + '</button> ';
                html += '<button type="button" class="btn-ghost btn-sm webshell-file-rename" data-path="' + escapeHtml(pathNext) + '" data-name="' + escapeHtml(item.name) + '">' + (wsT('webshell.rename') || 'Rename') + '</button> ';
                html += '<button type="button" class="btn-ghost btn-sm webshell-file-del" data-path="' + escapeHtml(pathNext) + '">' + wsT('webshell.deleteFile') + '</button>';
            }
            html += '</td></tr>';
        });
        html += '</tbody></table>';
    }
    listEl.innerHTML = html;

    listEl.querySelectorAll('.webshell-file-link').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const path = a.getAttribute('data-path');
            const isDir = a.getAttribute('data-isdir') === '1';
            const pathInput = document.getElementById('webshell-file-path');
            if (pathInput) pathInput.value = path;
            if (isDir) webshellFileListDir(webshellCurrentConn, path);
            else webshellFileRead(webshellCurrentConn, path, listEl);
        });
    });
    listEl.querySelectorAll('.webshell-file-read').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            webshellFileRead(webshellCurrentConn, btn.getAttribute('data-path'), listEl);
        });
    });
    listEl.querySelectorAll('.webshell-file-download').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            webshellFileDownload(webshellCurrentConn, btn.getAttribute('data-path'));
        });
    });
    listEl.querySelectorAll('.webshell-file-edit').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            webshellFileEdit(webshellCurrentConn, btn.getAttribute('data-path'), listEl);
        });
    });
    listEl.querySelectorAll('.webshell-file-del').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            appConfirm(wsT('webshell.deleteConfirm'), function() {
                webshellFileDelete(webshellCurrentConn, btn.getAttribute('data-path'), function () {
                    webshellFileListDir(webshellCurrentConn, document.getElementById('webshell-file-path').value.trim() || '.');
                });
            });
            return;
        });
    });
    listEl.querySelectorAll('.webshell-file-rename').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            webshellFileRename(webshellCurrentConn, btn.getAttribute('data-path'), btn.getAttribute('data-name'), listEl);
        });
    });
    var selectAll = document.getElementById('webshell-file-select-all');
    if (selectAll) {
        selectAll.addEventListener('change', function () {
            listEl.querySelectorAll('.webshell-file-cb').forEach(function (cb) { cb.checked = selectAll.checked; });
        });
    }
    if (breadcrumbEl) {
        breadcrumbEl.querySelectorAll('.webshell-breadcrumb-item').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var p = a.getAttribute('data-path');
                var pathInput = document.getElementById('webshell-file-path');
                if (pathInput) pathInput.value = p;
                webshellFileListDir(webshellCurrentConn, p);
            });
        });
    }
}

function webshellFileListApplyFilter() {
    var listEl = document.getElementById('webshell-file-list');
    var path = listEl && listEl.dataset.currentPath ? listEl.dataset.currentPath : (document.getElementById('webshell-file-path') && document.getElementById('webshell-file-path').value.trim()) || '.';
    var raw = listEl && listEl.dataset.rawOutput ? listEl.dataset.rawOutput : '';
    var filterInput = document.getElementById('webshell-file-filter');
    var filter = filterInput ? filterInput.value : '';
    if (!listEl || !raw) return;
    renderFileList(listEl, path, raw, webshellCurrentConn, filter);
}

function webshellFileMkdir(conn, pathInput) {
    if (!conn || typeof apiFetch === 'undefined') return;
    var base = (pathInput && pathInput.value.trim()) || '.';
    appPrompt(wsT('webshell.newDir') || 'New Directory', 'newdir', function(name) {
        if (name == null || !name.trim()) return;
        var path = base === '.' ? name.trim() : base + '/' + name.trim();
        apiFetch('/api/webshell/file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'mkdir', path: path }) })
            .then(function (r) { return r.json(); })
            .then(function () { webshellFileListDir(conn, base); })
            .catch(function () { webshellFileListDir(conn, base); });
    });
}

function webshellFileNewFile(conn, pathInput) {
    if (!conn || typeof apiFetch === 'undefined') return;
    var base = (pathInput && pathInput.value.trim()) || '.';
    appPrompt(wsT('webshell.newFile') || 'New File', 'newfile.txt', function(name) {
        if (name == null || !name.trim()) return;
        var path = base === '.' ? name.trim() : base + '/' + name.trim();
        appPrompt('Initial content (optional)', '', function(content) {
            if (content === null) return;
            var listEl = document.getElementById('webshell-file-list');
            webshellFileWrite(conn, path, content || '', function () { webshellFileListDir(conn, base); }, listEl);
        });
    });
}

function webshellFileUpload(conn, pathInput) {
    if (!conn || typeof apiFetch === 'undefined') return;
    var base = (pathInput && pathInput.value.trim()) || '.';
    var input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            var buf = reader.result;
            var bin = new Uint8Array(buf);
            var CHUNK = 32000;
            var base64Chunks = [];
            for (var i = 0; i < bin.length; i += CHUNK) {
                var slice = bin.subarray(i, Math.min(i + CHUNK, bin.length));
                var b64 = btoa(String.fromCharCode.apply(null, slice));
                base64Chunks.push(b64);
            }
            var path = base === '.' ? file.name : base + '/' + file.name;
            var listEl = document.getElementById('webshell-file-list');
            if (listEl) listEl.innerHTML = '<div class="webshell-loading">' + (wsT('webshell.upload') || 'Upload') + '...</div>';
            var idx = 0;
            function sendNext() {
                if (idx >= base64Chunks.length) {
                    webshellFileListDir(conn, base);
                    return;
                }
                apiFetch('/api/webshell/file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'upload_chunk', path: path, content: base64Chunks[idx], chunk_index: idx }) })
                    .then(function (r) { return r.json(); })
                    .then(function () { idx++; sendNext(); })
                    .catch(function () { idx++; sendNext(); });
            }
            sendNext();
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

function webshellFileRename(conn, oldPath, oldName, listEl) {
    if (!conn || typeof apiFetch === 'undefined') return;
    appPrompt((wsT('webshell.rename') || 'Rename') + ': ' + oldName, oldName, function(newName) {
        if (newName == null || newName.trim() === '') return;
        var parts = oldPath.split('/');
        var dir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
        var newPath = dir + newName.trim();
        apiFetch('/api/webshell/file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'rename', path: oldPath, target_path: newPath }) })
            .then(function (r) { return r.json(); })
            .then(function () { webshellFileListDir(conn, document.getElementById('webshell-file-path').value.trim() || '.'); })
            .catch(function () { webshellFileListDir(conn, document.getElementById('webshell-file-path').value.trim() || '.'); });
    });
}

function webshellBatchDelete(conn, pathInput) {
    if (!conn) return;
    var listEl = document.getElementById('webshell-file-list');
    var checked = listEl ? listEl.querySelectorAll('.webshell-file-cb:checked') : [];
    var paths = [];
    checked.forEach(function (cb) { paths.push(cb.getAttribute('data-path')); });
    if (paths.length === 0) { alert('Please select files first'); return; }
    appConfirm('Delete ' + paths.length + ' file(s)?', function() {
        var base = (pathInput && pathInput.value.trim()) || '.';
        var i = 0;
        function delNext() {
            if (i >= paths.length) { webshellFileListDir(conn, base); return; }
            webshellFileDelete(conn, paths[i], function () { i++; delNext(); });
        }
        delNext();
    });
    return;
}

function webshellBatchDownload(conn, pathInput) {
    if (!conn) return;
    var listEl = document.getElementById('webshell-file-list');
    var checked = listEl ? listEl.querySelectorAll('.webshell-file-cb:checked') : [];
    var paths = [];
    checked.forEach(function (cb) { paths.push(cb.getAttribute('data-path')); });
    if (paths.length === 0) { alert('Please select files first'); return; }
    paths.forEach(function (path) { webshellFileDownload(conn, path); });
}

// Download a file to local (reads content then triggers browser download)
function webshellFileDownload(conn, path) {
    if (typeof apiFetch === 'undefined') return;
    apiFetch('/api/webshell/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'read', path: path })
    }).then(function (r) { return r.json(); })
        .then(function (data) {
            var content = (data && data.output) != null ? data.output : (data.error || '');
            var name = path.replace(/^.*[/\\]/, '') || 'download.txt';
            var blob = new Blob([content], { type: 'application/octet-stream' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            URL.revokeObjectURL(a.href);
        })
        .catch(function (err) { alert(wsT('webshell.execError') + ': ' + (err && err.message ? err.message : '')); });
}

function webshellFileRead(conn, path, listEl) {
    if (typeof apiFetch === 'undefined') return;
    listEl.innerHTML = '<div class="webshell-loading">' + wsT('webshell.readFile') + '...</div>';
    apiFetch('/api/webshell/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'read', path: path })
    }).then(function (r) { return r.json(); })
        .then(function (data) {
            const out = (data && data.output) ? data.output : (data.error || '');
            listEl.innerHTML = '<div class="webshell-file-content"><pre>' + escapeHtml(out) + '</pre><button type="button" class="btn-ghost" onclick="webshellFileListDir(webshellCurrentConn, document.getElementById(\'webshell-file-path\').value.trim() || \'.\')">' + wsT('webshell.listDir') + '</button></div>';
        })
        .catch(function (err) {
            listEl.innerHTML = '<div class="webshell-file-error">' + escapeHtml(err && err.message ? err.message : '') + '</div>';
        });
}

function webshellFileEdit(conn, path, listEl) {
    if (typeof apiFetch === 'undefined') return;
    listEl.innerHTML = '<div class="webshell-loading">' + wsT('webshell.editFile') + '...</div>';
    apiFetch('/api/webshell/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'read', path: path })
    }).then(function (r) { return r.json(); })
        .then(function (data) {
            const content = (data && data.output) ? data.output : (data.error || '');
            const pathInput = document.getElementById('webshell-file-path');
            const currentPath = pathInput ? pathInput.value.trim() || '.' : '.';
            listEl.innerHTML =
                '<div class="webshell-file-edit-wrap">' +
                '<div class="webshell-file-edit-path">' + escapeHtml(path) + '</div>' +
                '<textarea id="webshell-edit-textarea" class="webshell-file-edit-textarea" rows="18">' + escapeHtml(content) + '</textarea>' +
                '<div class="webshell-file-edit-actions">' +
                '<button type="button" class="btn-primary btn-sm" id="webshell-edit-save">' + wsT('webshell.saveFile') + '</button> ' +
                '<button type="button" class="btn-ghost btn-sm" id="webshell-edit-cancel">' + wsT('webshell.cancelEdit') + '</button>' +
                '</div></div>';
            document.getElementById('webshell-edit-save').addEventListener('click', function () {
                const textarea = document.getElementById('webshell-edit-textarea');
                const newContent = textarea ? textarea.value : '';
                webshellFileWrite(webshellCurrentConn, path, newContent, function () {
                    webshellFileListDir(webshellCurrentConn, currentPath);
                }, listEl);
            });
            document.getElementById('webshell-edit-cancel').addEventListener('click', function () {
                webshellFileListDir(webshellCurrentConn, currentPath);
            });
        })
        .catch(function (err) {
            listEl.innerHTML = '<div class="webshell-file-error">' + escapeHtml(err && err.message ? err.message : '') + '</div>';
        });
}

function webshellFileWrite(conn, path, content, onDone, listEl) {
    if (typeof apiFetch === 'undefined') return;
    if (listEl) listEl.innerHTML = '<div class="webshell-loading">' + wsT('webshell.saveFile') + '...</div>';
    apiFetch('/api/webshell/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'write', path: path, content: content })
    }).then(function (r) { return r.json(); })
        .then(function (data) {
            if (data && !data.ok && data.error && listEl) {
                listEl.innerHTML = '<div class="webshell-file-error">' + escapeHtml(data.error) + '</div><pre class="webshell-file-raw">' + escapeHtml(data.output || '') + '</pre>';
                return;
            }
            if (onDone) onDone();
        })
        .catch(function (err) {
            if (listEl) listEl.innerHTML = '<div class="webshell-file-error">' + escapeHtml(err && err.message ? err.message : wsT('webshell.execError')) + '</div>';
        });
}

function webshellFileDelete(conn, path, onDone) {
    if (typeof apiFetch === 'undefined') return;
    apiFetch('/api/webshell/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: conn.url, password: conn.password || '', type: conn.type || 'php', method: (conn.method || 'post').toLowerCase(), cmd_param: conn.cmdParam || '', action: 'delete', path: path })
    }).then(function (r) { return r.json(); })
        .then(function () { if (onDone) onDone(); })
        .catch(function () { if (onDone) onDone(); });
}

// Delete a connection (request server to delete from DB, then refresh list)
function deleteWebshell(id) {
    appConfirm(wsT('webshell.deleteConfirm'), function() {
        if (currentWebshellId === id) destroyWebshellTerminal();
        if (currentWebshellId === id) currentWebshellId = null;
        if (typeof apiFetch === 'undefined') return;
        apiFetch('/api/webshell/connections/' + encodeURIComponent(id), { method: 'DELETE' })
            .then(function () {
                return refreshWebshellConnectionsFromServer();
            })
            .then(function () {
                const workspace = document.getElementById('webshell-workspace');
                if (workspace) {
                    workspace.innerHTML = '<div class="webshell-workspace-placeholder">' + wsT('webshell.selectOrAdd') + '</div>';
                }
            })
            .catch(function (e) {
                console.warn('Failed to delete WebShell connection', e);
                refreshWebshellConnectionsFromServer();
            });
    });
    return;
}

// Open the add connection modal
function showAddWebshellModal() {
    var editIdEl = document.getElementById('webshell-edit-id');
    if (editIdEl) editIdEl.value = '';
    document.getElementById('webshell-url').value = '';
    document.getElementById('webshell-password').value = '';
    document.getElementById('webshell-type').value = 'php';
    document.getElementById('webshell-method').value = 'post';
    document.getElementById('webshell-cmd-param').value = '';
    document.getElementById('webshell-remark').value = '';
    var titleEl = document.getElementById('webshell-modal-title');
    if (titleEl) titleEl.textContent = wsT('webshell.addConnection');
    var modal = document.getElementById('webshell-modal');
    if (modal) modal.style.display = 'block';
}

// Open the edit connection modal (pre-filled with current connection data)
function showEditWebshellModal(connId) {
    var conn = webshellConnections.find(function (c) { return c.id === connId; });
    if (!conn) return;
    var editIdEl = document.getElementById('webshell-edit-id');
    if (editIdEl) editIdEl.value = conn.id;
    document.getElementById('webshell-url').value = conn.url || '';
    document.getElementById('webshell-password').value = conn.password || '';
    document.getElementById('webshell-type').value = conn.type || 'php';
    document.getElementById('webshell-method').value = (conn.method || 'post').toLowerCase();
    document.getElementById('webshell-cmd-param').value = conn.cmdParam || '';
    document.getElementById('webshell-remark').value = conn.remark || '';
    var titleEl = document.getElementById('webshell-modal-title');
    if (titleEl) titleEl.textContent = wsT('webshell.editConnectionTitle');
    var modal = document.getElementById('webshell-modal');
    if (modal) modal.style.display = 'block';
}

// Close the add/edit modal
function closeWebshellModal() {
    var editIdEl = document.getElementById('webshell-edit-id');
    if (editIdEl) editIdEl.value = '';
    var modal = document.getElementById('webshell-modal');
    if (modal) modal.style.display = 'none';
}

// Refresh UI text after language change (without rebuilding terminal)
function refreshWebshellUIOnLanguageChange() {
    var page = typeof window.currentPage === 'function' ? window.currentPage() : (window.currentPage || '');
    if (page !== 'webshell') return;

    renderWebshellList();
    var workspace = document.getElementById('webshell-workspace');
    if (workspace) {
        if (!currentWebshellId || !webshellCurrentConn) {
            workspace.innerHTML = '<div class="webshell-workspace-placeholder" data-i18n="webshell.selectOrAdd">' + wsT('webshell.selectOrAdd') + '</div>';
        } else {
            var tabTerminal = workspace.querySelector('.webshell-tab[data-tab="terminal"]');
            var tabFile = workspace.querySelector('.webshell-tab[data-tab="file"]');
            var tabAi = workspace.querySelector('.webshell-tab[data-tab="ai"]');
            if (tabTerminal) tabTerminal.textContent = wsT('webshell.tabTerminal');
            if (tabFile) tabFile.textContent = wsT('webshell.tabFileManager');
            if (tabAi) tabAi.textContent = wsT('webshell.tabAiAssistant') || 'AI Assistant';

            var quickLabel = workspace.querySelector('.webshell-quick-label');
            var pathLabel = workspace.querySelector('.webshell-file-toolbar label span');
            var listDirBtn = document.getElementById('webshell-list-dir');
            var parentDirBtn = document.getElementById('webshell-parent-dir');
            if (quickLabel) quickLabel.textContent = (wsT('webshell.quickCommands') || 'Quick Commands') + ':';
            if (pathLabel) pathLabel.textContent = wsT('webshell.filePath');
            if (listDirBtn) listDirBtn.textContent = wsT('webshell.listDir');
            if (parentDirBtn) parentDirBtn.textContent = wsT('webshell.parentDir');

            var refreshBtn = document.getElementById('webshell-file-refresh');
            var mkdirBtn = document.getElementById('webshell-mkdir-btn');
            var newFileBtn = document.getElementById('webshell-newfile-btn');
            var uploadBtn = document.getElementById('webshell-upload-btn');
            var batchDeleteBtn = document.getElementById('webshell-batch-delete-btn');
            var batchDownloadBtn = document.getElementById('webshell-batch-download-btn');
            var filterInput = document.getElementById('webshell-file-filter');
            if (refreshBtn) { refreshBtn.title = wsT('webshell.refresh') || 'Refresh'; refreshBtn.textContent = wsT('webshell.refresh') || 'Refresh'; }
            if (mkdirBtn) mkdirBtn.textContent = wsT('webshell.newDir') || 'New Directory';
            if (newFileBtn) newFileBtn.textContent = wsT('webshell.newFile') || 'New File';
            if (uploadBtn) uploadBtn.textContent = wsT('webshell.upload') || 'Upload';
            if (batchDeleteBtn) batchDeleteBtn.textContent = wsT('webshell.batchDelete') || 'Batch Delete';
            if (batchDownloadBtn) batchDownloadBtn.textContent = wsT('webshell.batchDownload') || 'Batch Download';
            if (filterInput) filterInput.placeholder = wsT('webshell.filterPlaceholder') || 'Filter filenames';

            var aiNewConvBtn = document.getElementById('webshell-ai-new-conv');
            if (aiNewConvBtn) aiNewConvBtn.textContent = wsT('webshell.aiNewConversation') || 'New Chat';
            var aiInput = document.getElementById('webshell-ai-input');
            if (aiInput) aiInput.placeholder = wsT('webshell.aiPlaceholder') || 'e.g. List files in current directory';
            var aiSendBtn = document.getElementById('webshell-ai-send');
            if (aiSendBtn) aiSendBtn.textContent = wsT('webshell.aiSend') || 'Send';

            var aiMessages = document.getElementById('webshell-ai-messages');
            if (aiMessages) {
                var hasUserMsg = !!aiMessages.querySelector('.webshell-ai-msg.user');
                var msgNodes = aiMessages.querySelectorAll('.webshell-ai-msg');
                if (!hasUserMsg && msgNodes.length <= 1) {
                    aiMessages.innerHTML = '';
                    var readyDiv = document.createElement('div');
                    readyDiv.className = 'webshell-ai-msg assistant';
                    readyDiv.textContent = wsT('webshell.aiSystemReadyMessage') || 'System ready.';
                    aiMessages.appendChild(readyDiv);
                }
            }

            var pathInput = document.getElementById('webshell-file-path');
            var fileListEl = document.getElementById('webshell-file-list');
            if (fileListEl && webshellCurrentConn && pathInput) {
                webshellFileListDir(webshellCurrentConn, pathInput.value.trim() || '.');
            }
        }
    }

    var modal = document.getElementById('webshell-modal');
    if (modal && modal.style.display === 'block') {
        var titleEl = document.getElementById('webshell-modal-title');
        var editIdEl = document.getElementById('webshell-edit-id');
        if (titleEl) {
            titleEl.textContent = (editIdEl && editIdEl.value) ? wsT('webshell.editConnectionTitle') : wsT('webshell.addConnection');
        }
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(modal);
        }
    }
}

document.addEventListener('languagechange', function () {
    refreshWebshellUIOnLanguageChange();
});

// Sync conversation deletion across pages
document.addEventListener('conversation-deleted', function (e) {
    var id = e.detail && e.detail.conversationId;
    if (!id || !currentWebshellId || !webshellCurrentConn) return;
    var listEl = document.getElementById('webshell-ai-conv-list');
    if (listEl) fetchAndRenderWebshellAiConvList(webshellCurrentConn, listEl);
    if (webshellAiConvMap[webshellCurrentConn.id] === id) {
        delete webshellAiConvMap[webshellCurrentConn.id];
        var msgs = document.getElementById('webshell-ai-messages');
        if (msgs) msgs.innerHTML = '';
    }
});

// Test connectivity (does not save — uses form params to execute echo 1)
function testWebshellConnection() {
    var url = (document.getElementById('webshell-url') || {}).value;
    if (url && typeof url.trim === 'function') url = url.trim();
    if (!url) {
        alert('Shell URL is required');
        return;
    }
    var password = (document.getElementById('webshell-password') || {}).value;
    if (password && typeof password.trim === 'function') password = password.trim(); else password = '';
    var type = (document.getElementById('webshell-type') || {}).value || 'php';
    var method = ((document.getElementById('webshell-method') || {}).value || 'post').toLowerCase();
    var cmdParam = (document.getElementById('webshell-cmd-param') || {}).value;
    if (cmdParam && typeof cmdParam.trim === 'function') cmdParam = cmdParam.trim(); else cmdParam = '';
    var btn = document.getElementById('webshell-test-btn');
    if (btn) { btn.disabled = true; btn.textContent = (typeof wsT === 'function' ? wsT('common.refresh') : 'Refresh') + '...'; }
    if (typeof apiFetch === 'undefined') {
        if (btn) { btn.disabled = false; btn.textContent = wsT('webshell.testConnectivity'); }
        alert(wsT('webshell.testFailed') || 'Connectivity test failed');
        return;
    }
    apiFetch('/api/webshell/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: url,
            password: password || '',
            type: type,
            method: method === 'get' ? 'get' : 'post',
            cmd_param: cmdParam || '',
            command: 'echo 1'
        })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (btn) { btn.disabled = false; btn.textContent = wsT('webshell.testConnectivity'); }
            if (!data) {
                alert(wsT('webshell.testFailed') || 'Connectivity test failed');
                return;
            }
            var output = (data.output != null) ? String(data.output).trim() : '';
            var reallyOk = data.ok && output === '1';
            if (reallyOk) {
                alert(wsT('webshell.testSuccess') || 'Connection OK, shell is accessible');
            } else {
                var msg;
                if (data.ok && output !== '1')
                    msg = wsT('webshell.testNoExpectedOutput') || 'Shell responded but unexpected output. Check password and command param.';
                else
                    msg = (data.error) ? data.error : (wsT('webshell.testFailed') || 'Connectivity test failed');
                if (data.http_code) msg += ' (HTTP ' + data.http_code + ')';
                alert(msg);
            }
        })
        .catch(function (e) {
            if (btn) { btn.disabled = false; btn.textContent = wsT('webshell.testConnectivity'); }
            alert((wsT('webshell.testFailed') || 'Connectivity test failed') + ': ' + (e && e.message ? e.message : String(e)));
        });
}

// Save connection (create or update, writes to SQLite via server, then refreshes list)
function saveWebshellConnection() {
    var url = (document.getElementById('webshell-url') || {}).value;
    if (url && typeof url.trim === 'function') url = url.trim();
    if (!url) {
        alert('Shell URL is required');
        return;
    }
    var password = (document.getElementById('webshell-password') || {}).value;
    if (password && typeof password.trim === 'function') password = password.trim(); else password = '';
    var type = (document.getElementById('webshell-type') || {}).value || 'php';
    var method = ((document.getElementById('webshell-method') || {}).value || 'post').toLowerCase();
    var cmdParam = (document.getElementById('webshell-cmd-param') || {}).value;
    if (cmdParam && typeof cmdParam.trim === 'function') cmdParam = cmdParam.trim(); else cmdParam = '';
    var remark = (document.getElementById('webshell-remark') || {}).value;
    if (remark && typeof remark.trim === 'function') remark = remark.trim(); else remark = '';

    var editIdEl = document.getElementById('webshell-edit-id');
    var editId = editIdEl ? editIdEl.value.trim() : '';
    var body = { url: url, password: password, type: type, method: method === 'get' ? 'get' : 'post', cmd_param: cmdParam, remark: remark || url };
    if (typeof apiFetch === 'undefined') return;

    var reqUrl = editId ? ('/api/webshell/connections/' + encodeURIComponent(editId)) : '/api/webshell/connections';
    var reqMethod = editId ? 'PUT' : 'POST';
    apiFetch(reqUrl, {
        method: reqMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
        .then(function (r) { return r.json(); })
        .then(function () {
            closeWebshellModal();
            return refreshWebshellConnectionsFromServer();
        })
        .then(function (list) {
            // If the edited connection is currently selected, sync webshellCurrentConn to use new config
            if (editId && currentWebshellId === editId && Array.isArray(list)) {
                var updated = list.find(function (c) { return c.id === editId; });
                if (updated) webshellCurrentConn = updated;
            }
        })
        .catch(function (e) {
            console.warn('Failed to save WebShell connection', e);
            alert(e && e.message ? e.message : 'Save failed');
        });
}
