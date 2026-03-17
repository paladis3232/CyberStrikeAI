let currentConversationId = null;

// @ mention related state
let mentionTools = [];
let mentionToolsLoaded = false;
let mentionToolsLoadingPromise = null;
let mentionSuggestionsEl = null;
let mentionFilteredTools = [];
let externalMcpNames = []; // External MCP name list
const mentionState = {
    active: false,
    startIndex: -1,
    query: '',
    selectedIndex: 0,
};

// IME input method state tracking
let isComposing = false;

// Input field draft saving related
const DRAFT_STORAGE_KEY = 'cyberstrike-chat-draft';
let draftSaveTimer = null;
const DRAFT_SAVE_DELAY = 500; // 500ms debounce delay

// Chat file upload related (backend concatenates path and content to send to the model; frontend no longer re-sends file list)
const MAX_CHAT_FILES = 10;
const CHAT_FILE_DEFAULT_PROMPT = 'Please analyze the uploaded file content.';
/** @type {{ fileName: string, content: string, mimeType: string }[]} */
let chatAttachments = [];

// Save input field draft to localStorage (debounced version)
function saveChatDraftDebounced(content) {
    // Clear previous timer
    if (draftSaveTimer) {
        clearTimeout(draftSaveTimer);
    }
    
    // Set new timer
    draftSaveTimer = setTimeout(() => {
        saveChatDraft(content);
    }, DRAFT_SAVE_DELAY);
}

// Save input field draft to localStorage
function saveChatDraft(content) {
    try {
        const chatInput = document.getElementById('chat-input');
        const placeholderText = chatInput ? (chatInput.getAttribute('placeholder') || '').trim() : '';
        const trimmed = (content || '').trim();

        // Do not save the placeholder text itself as a draft
        if (trimmed && (!placeholderText || trimmed !== placeholderText)) {
            localStorage.setItem(DRAFT_STORAGE_KEY, content);
        } else {
            // If content is empty or equals placeholder text, clear the saved draft
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    } catch (error) {
        // localStorage may be full or unavailable, fail silently
        console.warn('Failed to save draft:', error);
    }
}

// Restore input field draft from localStorage
function restoreChatDraft() {
    try {
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) {
            return;
        }
        const placeholderText = (chatInput.getAttribute('placeholder') || '').trim();
        // If current value matches placeholder, the placeholder was mistaken for content — clear it to display placeholder correctly
        if (placeholderText && chatInput.value.trim() === placeholderText) {
            chatInput.value = '';
        }
        // If the input field already has content, do not restore the draft (avoid overwriting user input)
        if (chatInput.value && chatInput.value.trim().length > 0) {
            return;
        }
        
        const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
        const trimmedDraft = draft ? draft.trim() : '';

        // If draft content matches the placeholder, treat it as an invalid draft and do not restore
        if (trimmedDraft && (!placeholderText || trimmedDraft !== placeholderText)) {
            chatInput.value = draft;
            // Adjust textarea height to fit content
            adjustTextareaHeight(chatInput);
        } else if (trimmedDraft && placeholderText && trimmedDraft === placeholderText) {
            // Clean up invalid draft to avoid future interference
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    } catch (error) {
        console.warn('Failed to restore draft:', error);
    }
}

// Clear saved draft
function clearChatDraft() {
    try {
        // Synchronous clear to ensure immediate effect
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to clear draft:', error);
    }
}

// Adjust textarea height to fit content
function adjustTextareaHeight(textarea) {
    if (!textarea) return;
    
    // First reset height to auto, then immediately set to a fixed value to accurately get scrollHeight
    textarea.style.height = 'auto';
    // Force browser to recalculate layout
    void textarea.offsetHeight;
    
    // Calculate new height (minimum 40px, maximum 300px)
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, 40), 300);
    textarea.style.height = newHeight + 'px';
    
    // If content is empty or minimal, immediately reset to minimum height
    if (!textarea.value || textarea.value.trim().length === 0) {
        textarea.style.height = '40px';
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    let message = input.value.trim();
    const hasAttachments = chatAttachments && chatAttachments.length > 0;

    if (!message && !hasAttachments) {
        return;
    }
    // If there are attachments but no user input, send a short default prompt (backend concatenates path and file content for the model)
    if (hasAttachments && !message) {
        message = CHAT_FILE_DEFAULT_PROMPT;
    }

    // Show user message (including attachment names for confirmation)
    const displayMessage = hasAttachments
        ? message + '\n' + chatAttachments.map(a => '📎 ' + a.fileName).join('\n')
        : message;
    addMessage('user', displayMessage);
    
    // Clear debounce timer to prevent re-saving draft after clearing input
    if (draftSaveTimer) {
        clearTimeout(draftSaveTimer);
        draftSaveTimer = null;
    }
    
    // Immediately clear draft to prevent restoration on page refresh
    clearChatDraft();
    // Use synchronous approach to ensure draft is cleared
    try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
        // Ignore error
    }

    // Immediately clear input field and draft (before sending the request)
    input.value = '';
    // Force reset input field height to initial height (40px)
    input.style.height = '40px';

    // Build request body (with attachments)
    const body = {
        message: message,
        conversationId: currentConversationId,
        role: typeof getCurrentRole === 'function' ? getCurrentRole() : ''
    };
    if (hasAttachments) {
        body.attachments = chatAttachments.map(a => ({
            fileName: a.fileName,
            content: a.content,
            mimeType: a.mimeType || ''
        }));
    }
    // Clear attachment list after sending
    chatAttachments = [];
    renderChatFileChips();

    // Create progress message container (using detailed progress display)
    const progressId = addProgressMessage();
    const progressElement = document.getElementById(progressId);
    registerProgressTask(progressId, currentConversationId);
    loadActiveTasks();
    let assistantMessageId = null;
    let mcpExecutionIds = [];
    
    try {
        const response = await apiFetch('/api/agent-loop/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            throw new Error('Request failed: ' + response.status);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep the last incomplete line
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const eventData = JSON.parse(line.slice(6));
                        handleStreamEvent(eventData, progressElement, progressId, 
                                         () => assistantMessageId, (id) => { assistantMessageId = id; },
                                         () => mcpExecutionIds, (ids) => { mcpExecutionIds = ids; });
                    } catch (e) {
                        console.error('Failed to parse event data:', e, line);
                    }
                }
            }
        }

        // Process remaining buffer
        if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const eventData = JSON.parse(line.slice(6));
                        handleStreamEvent(eventData, progressElement, progressId,
                                         () => assistantMessageId, (id) => { assistantMessageId = id; },
                                         () => mcpExecutionIds, (ids) => { mcpExecutionIds = ids; });
                    } catch (e) {
                        console.error('Failed to parse event data:', e, line);
                    }
                }
            }
        }

        // After message sent successfully, ensure draft is cleared again
        clearChatDraft();
        try {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            // Ignore error
        }

    } catch (error) {
        removeMessage(progressId);
        addMessage('system', 'Error: ' + error.message);
        // On send failure, do not restore the draft as the message is already shown in the chat
    }
}

// ---------- Chat file upload ----------
function renderChatFileChips() {
    const list = document.getElementById('chat-file-list');
    if (!list) return;
    list.innerHTML = '';
    if (!chatAttachments.length) return;
    chatAttachments.forEach((a, i) => {
        const chip = document.createElement('div');
        chip.className = 'chat-file-chip';
        chip.setAttribute('role', 'listitem');
        const name = document.createElement('span');
        name.className = 'chat-file-chip-name';
        name.title = a.fileName;
        name.textContent = a.fileName;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'chat-file-chip-remove';
        remove.title = typeof window.t === 'function' ? window.t('chatGroup.remove') : 'Remove';
        remove.innerHTML = '×';
        remove.setAttribute('aria-label', 'Remove ' + a.fileName);
        remove.addEventListener('click', () => removeChatAttachment(i));
        chip.appendChild(name);
        chip.appendChild(remove);
        list.appendChild(chip);
    });
}

function removeChatAttachment(index) {
    chatAttachments.splice(index, 1);
    renderChatFileChips();
}

// If there are attachments and input is empty, fill in a default prompt (editable); backend separately concatenates path and content for the model
function appendChatFilePrompt() {
    const input = document.getElementById('chat-input');
    if (!input || !chatAttachments.length) return;
    if (!input.value.trim()) {
        input.value = CHAT_FILE_DEFAULT_PROMPT;
        adjustTextareaHeight(input);
    }
}

function readFileAsAttachment(file) {
    return new Promise((resolve, reject) => {
        const mimeType = file.type || '';
        const isTextLike = /^text\//i.test(mimeType) || /^(application\/(json|xml|javascript)|image\/svg\+xml)/i.test(mimeType);
        const reader = new FileReader();
        reader.onload = () => {
            let content = reader.result;
            if (typeof content === 'string' && content.startsWith('data:')) {
                content = content.replace(/^data:[^;]+;base64,/, '');
            }
            resolve({ fileName: file.name, content: content, mimeType: mimeType });
        };
        reader.onerror = () => reject(reader.error);
        if (isTextLike) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsDataURL(file);
        }
    });
}

function addFilesToChat(files) {
    if (!files || !files.length) return;
    const next = Array.from(files);
    if (chatAttachments.length + next.length > MAX_CHAT_FILES) {
        alert('You can upload at most ' + MAX_CHAT_FILES + ' files at a time. Currently selected: ' + chatAttachments.length + '.');
        return;
    }
    const addOne = (file) => {
        return readFileAsAttachment(file).then((a) => {
            chatAttachments.push(a);
            renderChatFileChips();
            appendChatFilePrompt();
        }).catch(() => {
            alert('Failed to read file: ' + file.name);
        });
    };
    let p = Promise.resolve();
    next.forEach((file) => { p = p.then(() => addOne(file)); });
    p.then(() => {});
}

function setupChatFileUpload() {
    const inputEl = document.getElementById('chat-file-input');
    const container = document.getElementById('chat-input-container') || document.querySelector('.chat-input-container');
    if (!inputEl || !container) return;

    inputEl.addEventListener('change', function () {
        const files = this.files;
        if (files && files.length) {
            addFilesToChat(files);
        }
        this.value = '';
    });

    container.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
    });
    container.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.contains(e.relatedTarget)) {
            this.classList.remove('drag-over');
        }
    });
    container.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) addFilesToChat(files);
    });
}

// Ensure chat-input-container has an id (in case template omits it)
function ensureChatInputContainerId() {
    const c = document.querySelector('.chat-input-container');
    if (c && !c.id) c.id = 'chat-input-container';
}

function setupMentionSupport() {
    mentionSuggestionsEl = document.getElementById('mention-suggestions');
    if (mentionSuggestionsEl) {
        mentionSuggestionsEl.style.display = 'none';
        mentionSuggestionsEl.addEventListener('mousedown', (event) => {
            // Prevent input from losing focus when clicking a suggestion item
            event.preventDefault();
        });
    }
    ensureMentionToolsLoaded().catch(() => {
        // Ignore load errors, can retry later
    });
}

// Refresh tool list (reset loaded state, force reload)
function refreshMentionTools() {
    mentionToolsLoaded = false;
    mentionTools = [];
    externalMcpNames = [];
    mentionToolsLoadingPromise = null;
    // If @ mention is currently active, immediately trigger reload
    if (mentionState.active) {
        ensureMentionToolsLoaded().catch(() => {
            // Ignore load errors
        });
    }
}

// Expose refresh function to the window object for other modules to call
if (typeof window !== 'undefined') {
    window.refreshMentionTools = refreshMentionTools;
}

function ensureMentionToolsLoaded() {
    // Check if the role has changed; if so, force reload
    if (typeof window !== 'undefined' && window._mentionToolsRoleChanged) {
        mentionToolsLoaded = false;
        mentionTools = [];
        delete window._mentionToolsRoleChanged;
    }
    
    if (mentionToolsLoaded) {
        return Promise.resolve(mentionTools);
    }
    if (mentionToolsLoadingPromise) {
        return mentionToolsLoadingPromise;
    }
    mentionToolsLoadingPromise = fetchMentionTools().finally(() => {
        mentionToolsLoadingPromise = null;
    });
    return mentionToolsLoadingPromise;
}

// Generate a unique key for a tool to distinguish tools with the same name but different sources
function getToolKeyForMention(tool) {
    // For external tools, use external_mcp::tool.name as the unique key
    // For internal tools, use tool.name as the key
    if (tool.is_external && tool.external_mcp) {
        return `${tool.external_mcp}::${tool.name}`;
    }
    return tool.name;
}

async function fetchMentionTools() {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const seen = new Set();
    const collected = [];

    try {
        // Get the currently selected role (from the function in roles.js)
        const roleName = typeof getCurrentRole === 'function' ? getCurrentRole() : '';

        // Also fetch the external MCP list
        try {
            const mcpResponse = await apiFetch('/api/external-mcp');
            if (mcpResponse.ok) {
                const mcpData = await mcpResponse.json();
                externalMcpNames = Object.keys(mcpData.servers || {}).filter(name => {
                    const server = mcpData.servers[name];
                    // Only include connected and enabled MCPs
                    return server.status === 'connected' && 
                           (server.config.external_mcp_enable || (server.config.enabled && !server.config.disabled));
                });
            }
        } catch (mcpError) {
            console.warn('Failed to load external MCP list:', mcpError);
            externalMcpNames = [];
        }

        while (page <= totalPages && page <= 20) {
            // Build API URL, add role query parameter if a role is specified
            let url = `/api/config/tools?page=${page}&page_size=${pageSize}`;
            if (roleName && roleName !== 'Default') {
                url += `&role=${encodeURIComponent(roleName)}`;
            }

            const response = await apiFetch(url);
            if (!response.ok) {
                break;
            }
            const result = await response.json();
            const tools = Array.isArray(result.tools) ? result.tools : [];
            tools.forEach(tool => {
                if (!tool || !tool.name) {
                    return;
                }
                // Use unique key for deduplication instead of just tool name
                const toolKey = getToolKeyForMention(tool);
                if (seen.has(toolKey)) {
                    return;
                }
                seen.add(toolKey);

                // Determine the tool's enabled state for the current role
                // If role_enabled field is present, use it (indicates a role was specified)
                // Otherwise use the enabled field (indicates no role specified or all tools)
                let roleEnabled = tool.enabled !== false;
                if (tool.role_enabled !== undefined && tool.role_enabled !== null) {
                    roleEnabled = tool.role_enabled;
                }

                collected.push({
                    name: tool.name,
                    description: tool.description || '',
                    enabled: tool.enabled !== false, // Tool's own enabled state
                    roleEnabled: roleEnabled, // Enabled state for the current role
                    isExternal: !!tool.is_external,
                    externalMcp: tool.external_mcp || '',
                    toolKey: toolKey, // Save unique key
                });
            });
            totalPages = result.total_pages || 1;
            page += 1;
            if (page > totalPages) {
                break;
            }
        }
        mentionTools = collected;
        mentionToolsLoaded = true;
    } catch (error) {
        console.warn('Failed to load tool list, @ mention feature may be unavailable:', error);
    }
    return mentionTools;
}

function handleChatInputInput(event) {
    const textarea = event.target;
    updateMentionStateFromInput(textarea);
    // Auto-adjust input field height
    // Use requestAnimationFrame to adjust immediately after DOM update, especially when deleting content
    requestAnimationFrame(() => {
        adjustTextareaHeight(textarea);
    });
    // Save input content to localStorage (debounced)
    saveChatDraftDebounced(textarea.value);
}

function handleChatInputClick(event) {
    updateMentionStateFromInput(event.target);
}

function handleChatInputKeydown(event) {
    // If using IME input, the Enter key should confirm the candidate word, not send the message
    // Use event.isComposing or the isComposing flag to determine this
    if (event.isComposing || isComposing) {
        return;
    }

    if (mentionState.active && mentionSuggestionsEl && mentionSuggestionsEl.style.display !== 'none') {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveMentionSelection(1);
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveMentionSelection(-1);
            return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            applyMentionSelection();
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            deactivateMentionState();
            return;
        }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function updateMentionStateFromInput(textarea) {
    if (!textarea) {
        deactivateMentionState();
        return;
    }
    const caret = textarea.selectionStart || 0;
    const textBefore = textarea.value.slice(0, caret);
    const atIndex = textBefore.lastIndexOf('@');

    if (atIndex === -1) {
        deactivateMentionState();
        return;
    }

    // Require whitespace or start of string before the trigger character
    if (atIndex > 0) {
        const boundaryChar = textBefore[atIndex - 1];
        if (boundaryChar && !/\s/.test(boundaryChar) && !'([{，。,.;:!?'.includes(boundaryChar)) {
            deactivateMentionState();
            return;
        }
    }

    const querySegment = textBefore.slice(atIndex + 1);

    if (querySegment.includes(' ') || querySegment.includes('\n') || querySegment.includes('\t') || querySegment.includes('@')) {
        deactivateMentionState();
        return;
    }

    if (querySegment.length > 60) {
        deactivateMentionState();
        return;
    }

    mentionState.active = true;
    mentionState.startIndex = atIndex;
    mentionState.query = querySegment.toLowerCase();
    mentionState.selectedIndex = 0;

    if (!mentionToolsLoaded) {
        renderMentionSuggestions({ showLoading: true });
    } else {
        updateMentionCandidates();
        renderMentionSuggestions();
    }

    ensureMentionToolsLoaded().then(() => {
        if (mentionState.active) {
            updateMentionCandidates();
            renderMentionSuggestions();
        }
    });
}

function updateMentionCandidates() {
    if (!mentionState.active) {
        mentionFilteredTools = [];
        return;
    }
    const normalizedQuery = (mentionState.query || '').trim().toLowerCase();
    let filtered = mentionTools;

    if (normalizedQuery) {
        // Check for exact match of external MCP name
        const exactMatchedMcp = externalMcpNames.find(mcpName => 
            mcpName.toLowerCase() === normalizedQuery
        );

        if (exactMatchedMcp) {
            // If exactly matching an MCP name, show only tools under that MCP
            filtered = mentionTools.filter(tool => {
                return tool.externalMcp && tool.externalMcp.toLowerCase() === exactMatchedMcp.toLowerCase();
            });
        } else {
            // Check for partial match of MCP name
            const partialMatchedMcps = externalMcpNames.filter(mcpName => 
                mcpName.toLowerCase().includes(normalizedQuery)
            );
            
            // Normal match: filter by tool name and description, also match MCP name
            filtered = mentionTools.filter(tool => {
                const nameMatch = tool.name.toLowerCase().includes(normalizedQuery);
                const descMatch = tool.description && tool.description.toLowerCase().includes(normalizedQuery);
                const mcpMatch = tool.externalMcp && tool.externalMcp.toLowerCase().includes(normalizedQuery);
                
                // If partially matching an MCP name, also include all tools under that MCP
                const mcpPartialMatch = partialMatchedMcps.some(mcpName => 
                    tool.externalMcp && tool.externalMcp.toLowerCase() === mcpName.toLowerCase()
                );
                
                return nameMatch || descMatch || mcpMatch || mcpPartialMatch;
            });
        }
    }

    filtered = filtered.slice().sort((a, b) => {
        // If a role is specified, prioritize tools enabled for the current role
        if (a.roleEnabled !== undefined || b.roleEnabled !== undefined) {
            const aRoleEnabled = a.roleEnabled !== undefined ? a.roleEnabled : a.enabled;
            const bRoleEnabled = b.roleEnabled !== undefined ? b.roleEnabled : b.enabled;
            if (aRoleEnabled !== bRoleEnabled) {
                return aRoleEnabled ? -1 : 1; // Enabled tools first
            }
        }

        if (normalizedQuery) {
            // Tools with exact MCP name match shown first
            const aMcpExact = a.externalMcp && a.externalMcp.toLowerCase() === normalizedQuery;
            const bMcpExact = b.externalMcp && b.externalMcp.toLowerCase() === normalizedQuery;
            if (aMcpExact !== bMcpExact) {
                return aMcpExact ? -1 : 1;
            }
            
            const aStarts = a.name.toLowerCase().startsWith(normalizedQuery);
            const bStarts = b.name.toLowerCase().startsWith(normalizedQuery);
            if (aStarts !== bStarts) {
                return aStarts ? -1 : 1;
            }
        }
        // If a role is specified, use roleEnabled; otherwise use enabled
        const aEnabled = a.roleEnabled !== undefined ? a.roleEnabled : a.enabled;
        const bEnabled = b.roleEnabled !== undefined ? b.roleEnabled : b.enabled;
        if (aEnabled !== bEnabled) {
            return aEnabled ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'zh-CN');
    });

    mentionFilteredTools = filtered;
    if (mentionFilteredTools.length === 0) {
        mentionState.selectedIndex = 0;
    } else if (mentionState.selectedIndex >= mentionFilteredTools.length) {
        mentionState.selectedIndex = 0;
    }
}

function renderMentionSuggestions({ showLoading = false } = {}) {
    if (!mentionSuggestionsEl || !mentionState.active) {
        hideMentionSuggestions();
        return;
    }

    const currentQuery = mentionState.query || '';
    const existingList = mentionSuggestionsEl.querySelector('.mention-suggestions-list');
    const canPreserveScroll = !showLoading &&
        existingList &&
        mentionSuggestionsEl.dataset.lastMentionQuery === currentQuery;
    const previousScrollTop = canPreserveScroll ? existingList.scrollTop : 0;

    if (showLoading) {
        mentionSuggestionsEl.innerHTML = '<div class="mention-empty">' + (typeof window.t === 'function' ? window.t('chat.loadingTools') : 'Loading tools...') + '</div>';
        mentionSuggestionsEl.style.display = 'block';
        delete mentionSuggestionsEl.dataset.lastMentionQuery;
        return;
    }

    if (!mentionFilteredTools.length) {
        mentionSuggestionsEl.innerHTML = '<div class="mention-empty">' + (typeof window.t === 'function' ? window.t('chat.noMatchTools') : 'No matching tools') + '</div>';
        mentionSuggestionsEl.style.display = 'block';
        mentionSuggestionsEl.dataset.lastMentionQuery = currentQuery;
        return;
    }

    const itemsHtml = mentionFilteredTools.map((tool, index) => {
        const activeClass = index === mentionState.selectedIndex ? 'active' : '';
        // If the tool has a roleEnabled field (role specified), use it; otherwise use enabled
        const toolEnabled = tool.roleEnabled !== undefined ? tool.roleEnabled : tool.enabled;
        const disabledClass = toolEnabled ? '' : 'disabled';
        const badge = tool.isExternal ? '<span class="mention-item-badge">External</span>' : '<span class="mention-item-badge internal">Built-in</span>';
        const nameHtml = escapeHtml(tool.name);
        const description = tool.description && tool.description.length > 0 ? escapeHtml(tool.description) : (typeof window.t === 'function' ? window.t('chat.noDescription') : 'No description');
        const descHtml = `<div class="mention-item-desc">${description}</div>`;
        // Show status label based on the tool's enabled state for the current role
        const statusLabel = toolEnabled ? 'Available' : (tool.roleEnabled !== undefined ? 'Disabled (current role)' : 'Disabled');
        const statusClass = toolEnabled ? 'enabled' : 'disabled';
        const originLabel = tool.isExternal
            ? (tool.externalMcp ? `Source: ${escapeHtml(tool.externalMcp)}` : 'Source: External MCP')
            : 'Source: Built-in';

        return `
            <button type="button" class="mention-item ${activeClass} ${disabledClass}" data-index="${index}">
                <div class="mention-item-name">
                    <span class="mention-item-icon">🔧</span>
                    <span class="mention-item-text">@${nameHtml}</span>
                    ${badge}
                </div>
                ${descHtml}
                <div class="mention-item-meta">
                    <span class="mention-status ${statusClass}">${statusLabel}</span>
                    <span class="mention-origin">${originLabel}</span>
                </div>
            </button>
        `;
    }).join('');

    const listWrapper = document.createElement('div');
    listWrapper.className = 'mention-suggestions-list';
    listWrapper.innerHTML = itemsHtml;

    mentionSuggestionsEl.innerHTML = '';
    mentionSuggestionsEl.appendChild(listWrapper);
    mentionSuggestionsEl.style.display = 'block';
    mentionSuggestionsEl.dataset.lastMentionQuery = currentQuery;

    if (canPreserveScroll) {
        listWrapper.scrollTop = previousScrollTop;
    }

    listWrapper.querySelectorAll('.mention-item').forEach(item => {
        item.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const idx = parseInt(item.dataset.index, 10);
            if (!Number.isNaN(idx)) {
                mentionState.selectedIndex = idx;
            }
            applyMentionSelection();
        });
    });

    scrollMentionSelectionIntoView();
}

function hideMentionSuggestions() {
    if (mentionSuggestionsEl) {
        mentionSuggestionsEl.style.display = 'none';
        mentionSuggestionsEl.innerHTML = '';
        delete mentionSuggestionsEl.dataset.lastMentionQuery;
    }
}

function deactivateMentionState() {
    mentionState.active = false;
    mentionState.startIndex = -1;
    mentionState.query = '';
    mentionState.selectedIndex = 0;
    mentionFilteredTools = [];
    hideMentionSuggestions();
}

function moveMentionSelection(direction) {
    if (!mentionFilteredTools.length) {
        return;
    }
    const max = mentionFilteredTools.length - 1;
    let nextIndex = mentionState.selectedIndex + direction;
    if (nextIndex < 0) {
        nextIndex = max;
    } else if (nextIndex > max) {
        nextIndex = 0;
    }
    mentionState.selectedIndex = nextIndex;
    updateMentionActiveHighlight();
}

function updateMentionActiveHighlight() {
    if (!mentionSuggestionsEl) {
        return;
    }
    const items = mentionSuggestionsEl.querySelectorAll('.mention-item');
    if (!items.length) {
        return;
    }
    items.forEach(item => item.classList.remove('active'));

    let targetIndex = mentionState.selectedIndex;
    if (targetIndex < 0) {
        targetIndex = 0;
    }
    if (targetIndex >= items.length) {
        targetIndex = items.length - 1;
        mentionState.selectedIndex = targetIndex;
    }

    const activeItem = items[targetIndex];
    if (activeItem) {
        activeItem.classList.add('active');
        scrollMentionSelectionIntoView(activeItem);
    }
}

function scrollMentionSelectionIntoView(targetItem = null) {
    if (!mentionSuggestionsEl) {
        return;
    }
    const activeItem = targetItem || mentionSuggestionsEl.querySelector('.mention-item.active');
    if (activeItem && typeof activeItem.scrollIntoView === 'function') {
        activeItem.scrollIntoView({
            block: 'nearest',
            inline: 'nearest',
            behavior: 'auto'
        });
    }
}

function applyMentionSelection() {
    const textarea = document.getElementById('chat-input');
    if (!textarea || mentionState.startIndex === -1 || !mentionFilteredTools.length) {
        deactivateMentionState();
        return;
    }

    const selectedTool = mentionFilteredTools[mentionState.selectedIndex] || mentionFilteredTools[0];
    if (!selectedTool) {
        deactivateMentionState();
        return;
    }

    const caret = textarea.selectionStart || 0;
    const before = textarea.value.slice(0, mentionState.startIndex);
    const after = textarea.value.slice(caret);
    const mentionText = `@${selectedTool.name}`;
    const needsSpace = after.length === 0 || !/^\s/.test(after);
    const insertText = mentionText + (needsSpace ? ' ' : '');

    textarea.value = before + insertText + after;
    const newCaret = before.length + insertText.length;
    textarea.focus();
    textarea.setSelectionRange(newCaret, newCaret);
    
    // Adjust input field height and save draft
    adjustTextareaHeight(textarea);
    saveChatDraftDebounced(textarea.value);

    deactivateMentionState();
}

function initializeChatUI() {
    const chatInputEl = document.getElementById('chat-input');
    if (chatInputEl) {
        // Set correct height on initialization
        adjustTextareaHeight(chatInputEl);
        // Restore saved draft (only when input is empty, to avoid overwriting user input)
        if (!chatInputEl.value || chatInputEl.value.trim() === '') {
            // Check if there are recent messages in the conversation (within 30s); if so, it may be a just-sent message, do not restore draft
            const messagesDiv = document.getElementById('chat-messages');
            let shouldRestoreDraft = true;
            if (messagesDiv && messagesDiv.children.length > 0) {
                // Check the time of the last message
                const lastMessage = messagesDiv.lastElementChild;
                if (lastMessage) {
                    const timeDiv = lastMessage.querySelector('.message-time');
                    if (timeDiv && timeDiv.textContent) {
                        // If the last message is a user message and it was very recent, do not restore draft
                        const isUserMessage = lastMessage.classList.contains('user');
                        if (isUserMessage) {
                            // Check message time; if within the last 30 seconds, do not restore draft
                            const now = new Date();
                            const messageTimeText = timeDiv.textContent;
                            // Simple check: if message time shows current time (format: HH:MM) and it's a user message, do not restore draft
                            // A more precise approach would check the message's creation time from the element
                            // Simple strategy here: if last message is a user message and input is empty, it may have just been sent — do not restore draft
                            shouldRestoreDraft = false;
                        }
                    }
                }
            }
            if (shouldRestoreDraft) {
                restoreChatDraft();
            } else {
                // Even if draft is not restored, clear it from localStorage to prevent mistaken restoration next time
                clearChatDraft();
            }
        }
    }

    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv && messagesDiv.childElementCount === 0) {
        const readyMsg = typeof window.t === 'function' ? window.t('chat.systemReadyMessage') : 'System is ready. Please enter your test requirements and the system will automatically execute the relevant security tests.';
        addMessage('assistant', readyMsg, null, null, null, { systemReadyMessage: true });
    }

    addAttackChainButton(currentConversationId);
    loadActiveTasks(true);
    if (activeTaskInterval) {
        clearInterval(activeTaskInterval);
    }
    activeTaskInterval = setInterval(() => loadActiveTasks(), ACTIVE_TASK_REFRESH_INTERVAL);
    setupMentionSupport();
    ensureChatInputContainerId();
    setupChatFileUpload();
}

// Message counter to ensure unique IDs
let messageCounter = 0;

// Add independent scroll containers for tables inside message bubbles
function wrapTablesInBubble(bubble) {
    const tables = bubble.querySelectorAll('table');
    tables.forEach(table => {
        // Check if table already has a wrapper container
        if (table.parentElement && table.parentElement.classList.contains('table-wrapper')) {
            return;
        }
        
        // Create table wrapper container
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        // Move table into wrapper container
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

/**
 * Re-render the "system ready" message in the bubble according to the current language (safe handling consistent with the addMessage assistant branch)
 */
function refreshSystemReadyMessageBubbles() {
    if (typeof window.t !== 'function') return;
    const text = window.t('chat.systemReadyMessage');
    const escapeHtmlLocal = (s) => {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    };
    const defaultSanitizeConfig = {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
        ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class'],
        ALLOW_DATA_ATTR: false,
    };
    let formattedContent;
    if (typeof marked !== 'undefined') {
        try {
            marked.setOptions({ breaks: true, gfm: true });
            const parsed = marked.parse(text);
            formattedContent = typeof DOMPurify !== 'undefined'
                ? DOMPurify.sanitize(parsed, defaultSanitizeConfig)
                : parsed;
        } catch (e) {
            formattedContent = escapeHtmlLocal(text).replace(/\n/g, '<br>');
        }
    } else {
        formattedContent = escapeHtmlLocal(text).replace(/\n/g, '<br>');
    }

    document.querySelectorAll('.message.assistant[data-system-ready-message]').forEach(function (messageDiv) {
        const bubble = messageDiv.querySelector('.message-bubble');
        if (!bubble) return;
        const copyBtn = bubble.querySelector('.message-copy-btn');
        if (copyBtn) copyBtn.remove();
        bubble.innerHTML = formattedContent;
        if (typeof wrapTablesInBubble === 'function') wrapTablesInBubble(bubble);
        messageDiv.dataset.originalContent = text;
        const copyBtnNew = document.createElement('button');
        copyBtnNew.className = 'message-copy-btn';
        copyBtnNew.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span>' + window.t('common.copy') + '</span>';
        copyBtnNew.title = window.t('chat.copyMessageTitle');
        copyBtnNew.onclick = function (e) {
            e.stopPropagation();
            copyMessageToClipboard(messageDiv, this);
        };
        bubble.appendChild(copyBtnNew);
    });
}

// Add message (when options.systemReadyMessage is true, language switch will refresh this message)
function addMessage(role, content, mcpExecutionIds = null, progressId = null, createdAt = null, options = null) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageCounter++;
    const id = 'msg-' + Date.now() + '-' + messageCounter + '-' + Math.random().toString(36).substr(2, 9);
    messageDiv.id = id;
    messageDiv.className = 'message ' + role;
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (role === 'user') {
        avatar.textContent = 'U';
    } else if (role === 'assistant') {
        avatar.textContent = 'A';
    } else {
        avatar.textContent = 'S';
    }
    messageDiv.appendChild(avatar);
    
    // Create message content container
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content';
    
    // Create message bubble
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // Parse Markdown or HTML format
    let formattedContent;
    const defaultSanitizeConfig = {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
        ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class'],
        ALLOW_DATA_ATTR: false,
    };
    
    // HTML entity encoding function
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    // Note: code block content does not need escaping because:
    // 1. After Markdown parsing, code blocks are wrapped in <code> or <pre> tags
    // 2. Browsers do not execute HTML inside <code> and <pre> tags (they are text nodes)
    // 3. DOMPurify preserves the text content inside these tags
    // This prevents XSS while still displaying code correctly
    
    const parseMarkdown = (raw) => {
        if (typeof marked === 'undefined') {
            return null;
        }
        try {
            marked.setOptions({
                breaks: true,
                gfm: true,
            });
            return marked.parse(raw);
        } catch (e) {
            console.error('Markdown parsing failed:', e);
            return null;
        }
    };
    
    // Replace known Chinese error prefixes in assistant messages with i18n equivalents (backend always returns Chinese)
    let displayContent = content;
    if (role === 'assistant' && typeof displayContent === 'string' && typeof window.t === 'function') {
        if (displayContent.indexOf('执行失败: ') === 0) {
            displayContent = window.t('chat.executeFailed') + ': ' + displayContent.slice('执行失败: '.length);
        }
        if (displayContent.indexOf('调用OpenAI失败:') !== -1) {
            displayContent = displayContent.replace(/调用OpenAI失败:/g, window.t('chat.callOpenAIFailed') + ':');
        }
    }

    // For user messages, escape HTML directly without Markdown parsing to preserve all special characters
    if (role === 'user') {
        formattedContent = escapeHtml(content).replace(/\n/g, '<br>');
    } else if (typeof DOMPurify !== 'undefined') {
        // Parse Markdown directly (code blocks wrapped in <code>/<pre>, DOMPurify preserves their text content)
        let parsedContent = parseMarkdown(role === 'assistant' ? displayContent : content);
        if (!parsedContent) {
            parsedContent = content;
        }
        
        // Sanitize with DOMPurify, adding only necessary URL validation hooks (DOMPurify handles event handlers etc. by default)
        if (DOMPurify.addHook) {
            // Remove previously registered hooks
            try {
                DOMPurify.removeHook('uponSanitizeAttribute');
            } catch (e) {
                // Hook does not exist, ignore
            }

            // Only validate URL attributes to block dangerous protocols (DOMPurify handles event handlers, style, etc. by default)
            DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
                const attrName = data.attrName.toLowerCase();
                
                // Only validate URL attributes (src, href)
                if ((attrName === 'src' || attrName === 'href') && data.attrValue) {
                    const value = data.attrValue.trim().toLowerCase();
                    // Block dangerous protocols
                    if (value.startsWith('javascript:') || 
                        value.startsWith('vbscript:') ||
                        value.startsWith('data:text/html') ||
                        value.startsWith('data:text/javascript')) {
                        data.keepAttr = false;
                        return;
                    }
                    // For img src, block suspiciously short URLs (prevent 404 and XSS)
                    if (attrName === 'src' && node.tagName && node.tagName.toLowerCase() === 'img') {
                        if (value.length <= 2 || /^[a-z]$/i.test(value)) {
                            data.keepAttr = false;
                            return;
                        }
                    }
                }
            });
        }
        
        formattedContent = DOMPurify.sanitize(parsedContent, defaultSanitizeConfig);
    } else if (typeof marked !== 'undefined') {
        const rawForParse = role === 'assistant' ? displayContent : content;
        const parsedContent = parseMarkdown(rawForParse);
        if (parsedContent) {
            formattedContent = parsedContent;
        } else {
            formattedContent = escapeHtml(rawForParse).replace(/\n/g, '<br>');
        }
    } else {
        const rawForEscape = role === 'assistant' ? displayContent : content;
        formattedContent = escapeHtml(rawForEscape).replace(/\n/g, '<br>');
    }
    
    bubble.innerHTML = formattedContent;
    
    // Final safety check: only handle obviously suspicious images (prevent 404 and XSS)
    // DOMPurify has already handled most XSS vectors; this is just a necessary supplement
    const images = bubble.querySelectorAll('img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
            const trimmedSrc = src.trim();
            // Only check obviously suspicious URLs (short strings, single characters)
            if (trimmedSrc.length <= 2 || /^[a-z]$/i.test(trimmedSrc)) {
                img.remove();
            }
        } else {
            img.remove();
        }
    });
    
    // Add independent scroll containers for each table
    wrapTablesInBubble(bubble);
    
    contentWrapper.appendChild(bubble);
    
    // Save original content to message element for copy functionality
    if (role === 'assistant') {
        messageDiv.dataset.originalContent = content;
    }
    
    // Add copy button to assistant messages (copy entire reply) - placed at bottom-right of bubble
    if (role === 'assistant') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-copy-btn';
        copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span>' + (typeof window.t === 'function' ? window.t('common.copy') : 'Copy') + '</span>';
        copyBtn.title = typeof window.t === 'function' ? window.t('chat.copyMessageTitle') : 'Copy message content';
        copyBtn.onclick = function(e) {
            e.stopPropagation();
            copyMessageToClipboard(messageDiv, this);
        };
        bubble.appendChild(copyBtn);
    }
    
    // Add timestamp
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    // If a creation time is provided, use it; otherwise use current time
    let messageTime;
    if (createdAt) {
        // Handle string or Date object
        if (typeof createdAt === 'string') {
            messageTime = new Date(createdAt);
        } else if (createdAt instanceof Date) {
            messageTime = createdAt;
        } else {
            messageTime = new Date(createdAt);
        }
        // If parsing fails, use current time
        if (isNaN(messageTime.getTime())) {
            messageTime = new Date();
        }
    } else {
        messageTime = new Date();
    }
    const msgTimeLocale = (typeof window.__locale === 'string' && window.__locale.startsWith('zh')) ? 'zh-CN' : 'en-US';
    const msgTimeOpts = { hour: '2-digit', minute: '2-digit' };
    if (msgTimeLocale === 'zh-CN') msgTimeOpts.hour12 = false;
    timeDiv.textContent = messageTime.toLocaleTimeString(msgTimeLocale, msgTimeOpts);
    contentWrapper.appendChild(timeDiv);
    
    // If there are MCP execution IDs or a progress ID, add a details section (uniformly using "penetration test details" style)
    if (role === 'assistant' && ((mcpExecutionIds && Array.isArray(mcpExecutionIds) && mcpExecutionIds.length > 0) || progressId)) {
        const mcpSection = document.createElement('div');
        mcpSection.className = 'mcp-call-section';
        
        const mcpLabel = document.createElement('div');
        mcpLabel.className = 'mcp-call-label';
        mcpLabel.textContent = '📋 ' + (typeof window.t === 'function' ? window.t('chat.penetrationTestDetail') : 'Penetration Test Details');
        mcpSection.appendChild(mcpLabel);
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'mcp-call-buttons';
        
        // If there are MCP execution IDs, add MCP call detail buttons
        if (mcpExecutionIds && Array.isArray(mcpExecutionIds) && mcpExecutionIds.length > 0) {
            mcpExecutionIds.forEach((execId, index) => {
                const detailBtn = document.createElement('button');
                detailBtn.className = 'mcp-detail-btn';
                detailBtn.innerHTML = '<span>' + (typeof window.t === 'function' ? window.t('chat.callNumber', { n: index + 1 }) : 'Call #' + (index + 1)) + '</span>';
                detailBtn.onclick = () => showMCPDetail(execId);
                buttonsContainer.appendChild(detailBtn);
                // Asynchronously fetch tool name and update button text
                updateButtonWithToolName(detailBtn, execId, index + 1);
            });
        }
        
        // If there is a progress ID, add an expand details button (uniformly using "Expand Details" text)
        if (progressId) {
            const progressDetailBtn = document.createElement('button');
            progressDetailBtn.className = 'mcp-detail-btn process-detail-btn';
            progressDetailBtn.innerHTML = '<span>' + (typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand Details') + '</span>';
            progressDetailBtn.onclick = () => toggleProcessDetails(progressId, messageDiv.id);
            buttonsContainer.appendChild(progressDetailBtn);
            // Store progress ID on message element
            messageDiv.dataset.progressId = progressId;
        }
        
        mcpSection.appendChild(buttonsContainer);
        contentWrapper.appendChild(mcpSection);
    }
    
    messageDiv.appendChild(contentWrapper);
    // Mark "system ready" placeholder message for content refresh on language switch
    if (options && options.systemReadyMessage) {
        messageDiv.setAttribute('data-system-ready-message', '1');
    }
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return id;
}

// Copy message content to clipboard (using original Markdown format)
function copyMessageToClipboard(messageDiv, button) {
    try {
        // Get saved original Markdown content
        const originalContent = messageDiv.dataset.originalContent;
        
        if (!originalContent) {
            // If original content is not saved, try to extract from rendered HTML (fallback)
            const bubble = messageDiv.querySelector('.message-bubble');
            if (bubble) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = bubble.innerHTML;
                
                // Remove the copy button itself (avoid copying button text)
                const copyBtnInTemp = tempDiv.querySelector('.message-copy-btn');
                if (copyBtnInTemp) {
                    copyBtnInTemp.remove();
                }
                
                // Extract plain text content
                let textContent = tempDiv.textContent || tempDiv.innerText || '';
                textContent = textContent.replace(/\n{3,}/g, '\n\n').trim();
                
                navigator.clipboard.writeText(textContent).then(() => {
                    showCopySuccess(button);
                }).catch(err => {
                    console.error('Copy failed:', err);
                    alert(typeof window.t === 'function' ? window.t('chat.copyFailedManual') : 'Copy failed. Please select and copy the content manually.');
                });
            }
            return;
        }
        
        // Use original Markdown content
        navigator.clipboard.writeText(originalContent).then(() => {
            showCopySuccess(button);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert(typeof window.t === 'function' ? window.t('chat.copyFailedManual') : 'Copy failed. Please select and copy the content manually.');
        });
    } catch (error) {
        console.error('Error copying message:', error);
        alert(typeof window.t === 'function' ? window.t('chat.copyFailedManual') : 'Copy failed. Please select and copy the content manually.');
    }
}

// Show copy success feedback
function showCopySuccess(button) {
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span>' + (typeof window.t === 'function' ? window.t('common.copied') : 'Copied') + '</span>';
        button.style.color = '#10b981';
        button.style.background = 'rgba(16, 185, 129, 0.1)';
        button.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.color = '';
            button.style.background = '';
            button.style.borderColor = '';
        }, 2000);
    }
}

// Render process details
function renderProcessDetails(messageId, processDetails) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) {
        return;
    }
    
    // Find or create MCP call section
    let mcpSection = messageElement.querySelector('.mcp-call-section');
    if (!mcpSection) {
        mcpSection = document.createElement('div');
        mcpSection.className = 'mcp-call-section';
        
        const contentWrapper = messageElement.querySelector('.message-content');
        if (contentWrapper) {
            contentWrapper.appendChild(mcpSection);
        } else {
            return;
        }
    }
    
    // Ensure label and button container exist (unified structure)
    let mcpLabel = mcpSection.querySelector('.mcp-call-label');
    let buttonsContainer = mcpSection.querySelector('.mcp-call-buttons');
    
    // If no label exists, create one (when there are no tool calls)
    if (!mcpLabel && !buttonsContainer) {
        mcpLabel = document.createElement('div');
        mcpLabel.className = 'mcp-call-label';
        mcpLabel.textContent = '📋 ' + (typeof window.t === 'function' ? window.t('chat.penetrationTestDetail') : 'Penetration Test Details');
        mcpSection.appendChild(mcpLabel);
    } else if (mcpLabel && mcpLabel.textContent !== ('📋 ' + (typeof window.t === 'function' ? window.t('chat.penetrationTestDetail') : 'Penetration Test Details'))) {
        // If label exists but is not in the unified format, update it
        mcpLabel.textContent = '📋 ' + (typeof window.t === 'function' ? window.t('chat.penetrationTestDetail') : 'Penetration Test Details');
    }
    
    // If no button container, create one
    if (!buttonsContainer) {
        buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'mcp-call-buttons';
        mcpSection.appendChild(buttonsContainer);
    }
    
    // Add process details button (if not already present)
    let processDetailBtn = buttonsContainer.querySelector('.process-detail-btn');
    if (!processDetailBtn) {
        processDetailBtn = document.createElement('button');
        processDetailBtn.className = 'mcp-detail-btn process-detail-btn';
        processDetailBtn.innerHTML = '<span>' + (typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand Details') + '</span>';
        processDetailBtn.onclick = () => toggleProcessDetails(null, messageId);
        buttonsContainer.appendChild(processDetailBtn);
    }

    // Create process details container (placed after the button container)
    const detailsId = 'process-details-' + messageId;
    let detailsContainer = document.getElementById(detailsId);

    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.id = detailsId;
        detailsContainer.className = 'process-details-container';
        // Ensure the container comes after the button container
        if (buttonsContainer.nextSibling) {
            mcpSection.insertBefore(detailsContainer, buttonsContainer.nextSibling);
        } else {
            mcpSection.appendChild(detailsContainer);
        }
    }

    // Create timeline (even when processDetails is empty, so the expand button works)
    const timelineId = detailsId + '-timeline';
    let timeline = document.getElementById(timelineId);

    if (!timeline) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'process-details-content';

        timeline = document.createElement('div');
        timeline.id = timelineId;
        timeline.className = 'progress-timeline';

        contentDiv.appendChild(timeline);
        detailsContainer.appendChild(contentDiv);
    }

    // If processDetails is missing or empty, show empty state
    if (!processDetails || processDetails.length === 0) {
        // Show empty state message
        timeline.innerHTML = '<div class="progress-timeline-empty">' + (typeof window.t === 'function' ? window.t('chat.noProcessDetail') : 'No process details available (execution may have been too fast or no detailed events were triggered)') + '</div>';
        // Collapsed by default
        timeline.classList.remove('expanded');
        return;
    }

    // Clear timeline and re-render
    timeline.innerHTML = '';


    // Render each process detail event
    processDetails.forEach(detail => {
        const eventType = detail.eventType || '';
        const title = detail.message || '';
        const data = detail.data || {};

        // Render different content based on event type
        let itemTitle = title;
        if (eventType === 'iteration') {
            itemTitle = (typeof window.t === 'function' ? window.t('chat.iterationRound', { n: data.iteration || 1 }) : 'Iteration ' + (data.iteration || 1));
        } else if (eventType === 'thinking') {
            itemTitle = '🤔 ' + (typeof window.t === 'function' ? window.t('chat.aiThinking') : 'AI Thinking');
        } else if (eventType === 'tool_calls_detected') {
            itemTitle = '🔧 ' + (typeof window.t === 'function' ? window.t('chat.toolCallsDetected', { count: data.count || 0 }) : (data.count || 0) + ' tool call(s) detected');
        } else if (eventType === 'tool_call') {
            const toolName = data.toolName || (typeof window.t === 'function' ? window.t('chat.unknownTool') : 'Unknown tool');
            const index = data.index || 0;
            const total = data.total || 0;
            itemTitle = '🔧 ' + (typeof window.t === 'function' ? window.t('chat.callTool', { name: escapeHtml(toolName), index: index, total: total }) : 'Calling tool: ' + escapeHtml(toolName) + ' (' + index + '/' + total + ')');
        } else if (eventType === 'tool_result') {
            const toolName = data.toolName || (typeof window.t === 'function' ? window.t('chat.unknownTool') : 'Unknown tool');
            const success = data.success !== false;
            const statusIcon = success ? '✅' : '❌';
            const execText = success ? (typeof window.t === 'function' ? window.t('chat.toolExecComplete', { name: escapeHtml(toolName) }) : 'Tool ' + escapeHtml(toolName) + ' completed') : (typeof window.t === 'function' ? window.t('chat.toolExecFailed', { name: escapeHtml(toolName) }) : 'Tool ' + escapeHtml(toolName) + ' failed');
            itemTitle = statusIcon + ' ' + execText;
            if (toolName === BuiltinTools.SEARCH_KNOWLEDGE_BASE && success) {
                itemTitle = '📚 ' + itemTitle + ' - ' + (typeof window.t === 'function' ? window.t('chat.knowledgeRetrievalTag') : 'Knowledge Retrieval');
            }
        } else if (eventType === 'knowledge_retrieval') {
            itemTitle = '📚 ' + (typeof window.t === 'function' ? window.t('chat.knowledgeRetrieval') : 'Knowledge Retrieval');
        } else if (eventType === 'error') {
            itemTitle = '❌ ' + (typeof window.t === 'function' ? window.t('chat.error') : 'Error');
        } else if (eventType === 'cancelled') {
            itemTitle = '⛔ ' + (typeof window.t === 'function' ? window.t('chat.taskCancelled') : 'Task Cancelled');
        } else if (eventType === 'progress') {
            itemTitle = typeof window.translateProgressMessage === 'function' ? window.translateProgressMessage(detail.message || '') : (detail.message || '');
        }

        addTimelineItem(timeline, eventType, {
            title: itemTitle,
            message: detail.message || '',
            data: data,
            createdAt: detail.createdAt // Pass the actual event creation time
        });
    });

    // Check for error or cancelled events; if found, ensure details are collapsed by default
    const hasErrorOrCancelled = processDetails.some(d =>
        d.eventType === 'error' || d.eventType === 'cancelled'
    );
    if (hasErrorOrCancelled) {
        // Ensure timeline is collapsed
        timeline.classList.remove('expanded');
        // Update button text to "Expand Details"
        const processDetailBtn = messageElement.querySelector('.process-detail-btn');
        if (processDetailBtn) {
            processDetailBtn.innerHTML = '<span>' + (typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand Details') + '</span>';
        }
    }
}

// Remove message
function removeMessage(id) {
    const messageDiv = document.getElementById(id);
    if (messageDiv) {
        messageDiv.remove();
    }
}

// Input field event binding (Enter to send / @ mention)
const chatInput = document.getElementById('chat-input');
if (chatInput) {
    chatInput.addEventListener('keydown', handleChatInputKeydown);
    chatInput.addEventListener('input', handleChatInputInput);
    chatInput.addEventListener('click', handleChatInputClick);
    chatInput.addEventListener('focus', handleChatInputClick);
    // IME input method event listeners for tracking composition state
    chatInput.addEventListener('compositionstart', () => {
        isComposing = true;
    });
    chatInput.addEventListener('compositionend', () => {
        isComposing = false;
    });
    chatInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (!chatInput.matches(':focus')) {
                deactivateMentionState();
            }
        }, 120);
        // Save draft immediately on blur (without debounce)
        if (chatInput.value) {
            saveChatDraft(chatInput.value);
        }
    });
}

// Save draft immediately on page unload
window.addEventListener('beforeunload', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput && chatInput.value) {
        // Save immediately, without debounce
        saveChatDraft(chatInput.value);
    }
});

// Asynchronously fetch tool name and update button text
async function updateButtonWithToolName(button, executionId, index) {
    try {
        const response = await apiFetch(`/api/monitor/execution/${executionId}`);
        if (response.ok) {
            const exec = await response.json();
            const toolName = exec.toolName || (typeof window.t === 'function' ? window.t('chat.unknownTool') : 'Unknown tool');
            // Format tool name (if in name::toolName format, show only the toolName part)
            const displayToolName = toolName.includes('::') ? toolName.split('::')[1] : toolName;
            button.querySelector('span').textContent = `${displayToolName} #${index}`;
        }
    } catch (error) {
        // If fetch fails, keep existing button text
        console.error('Failed to fetch tool name:', error);
    }
}

// Show MCP call details
async function showMCPDetail(executionId) {
    try {
        const response = await apiFetch(`/api/monitor/execution/${executionId}`);
        const exec = await response.json();

        if (response.ok) {
            // Populate modal content
            document.getElementById('detail-tool-name').textContent = exec.toolName || (typeof window.t === 'function' ? window.t('mcpDetailModal.unknown') : 'Unknown');
            document.getElementById('detail-execution-id').textContent = exec.id || 'N/A';
            const statusEl = document.getElementById('detail-status');
            const normalizedStatus = (exec.status || 'unknown').toLowerCase();
            statusEl.textContent = getStatusText(exec.status);
            statusEl.className = `status-chip status-${normalizedStatus}`;
            const detailTimeLocale = (typeof window.__locale === 'string' && window.__locale.startsWith('zh')) ? 'zh-CN' : 'en-US';
            document.getElementById('detail-time').textContent = exec.startTime
                ? new Date(exec.startTime).toLocaleString(detailTimeLocale)
                : '—';
            
            // Request parameters
            const requestData = {
                tool: exec.toolName,
                arguments: exec.arguments
            };
            document.getElementById('detail-request').textContent = JSON.stringify(requestData, null, 2);

            // Response result + success info / error info
            const responseElement = document.getElementById('detail-response');
            const successSection = document.getElementById('detail-success-section');
            const successElement = document.getElementById('detail-success');
            const errorSection = document.getElementById('detail-error-section');
            const errorElement = document.getElementById('detail-error');

            // Reset state
            responseElement.className = 'code-block';
            responseElement.textContent = '';
            if (successSection && successElement) {
                successSection.style.display = 'none';
                successElement.textContent = '';
            }
            if (errorSection && errorElement) {
                errorSection.style.display = 'none';
                errorElement.textContent = '';
            }

            if (exec.result) {
                const responseData = {
                    content: exec.result.content,
                    isError: exec.result.isError
                };
                responseElement.textContent = JSON.stringify(responseData, null, 2);

                if (exec.result.isError) {
                    // Error scenario: highlight response in red + show error block
                    responseElement.className = 'code-block error';
                    if (exec.error && errorSection && errorElement) {
                        errorSection.style.display = 'block';
                        errorElement.textContent = exec.error;
                    }
                } else {
                    // Success scenario: keep response in normal style, extract success info separately
                    responseElement.className = 'code-block';
                    if (successSection && successElement) {
                        successSection.style.display = 'block';
                        let successText = '';
                        const content = exec.result.content;
                        if (typeof content === 'string') {
                            successText = content;
                        } else if (Array.isArray(content)) {
                            const texts = content
                                .map(item => (item && typeof item === 'object' && typeof item.text === 'string') ? item.text : '')
                                .filter(Boolean);
                            if (texts.length > 0) {
                                successText = texts.join('\n\n');
                            }
                        } else if (content && typeof content === 'object' && typeof content.text === 'string') {
                            successText = content.text;
                        }
                        if (!successText) {
                            successText = typeof window.t === 'function' ? window.t('mcpDetailModal.execSuccessNoContent') : 'Execution successful, no displayable text content returned.';
                        }
                        successElement.textContent = successText;
                    }
                }
            } else {
                responseElement.textContent = typeof window.t === 'function' ? window.t('chat.noResponseData') : 'No response data available';
            }

            // Show modal
            document.getElementById('mcp-detail-modal').style.display = 'block';
        } else {
            alert((typeof window.t === 'function' ? window.t('mcpDetailModal.getDetailFailed') : 'Failed to get details') + ': ' + (exec.error || (typeof window.t === 'function' ? window.t('mcpDetailModal.unknown') : 'Unknown error')));
        }
    } catch (error) {
        alert((typeof window.t === 'function' ? window.t('mcpDetailModal.getDetailFailed') : 'Failed to get details') + ': ' + error.message);
    }
}

// Close MCP detail modal
function closeMCPDetail() {
    document.getElementById('mcp-detail-modal').style.display = 'none';
}

// Copy content from detail panel
function copyDetailBlock(elementId, triggerBtn = null) {
    const target = document.getElementById(elementId);
    if (!target) {
        return;
    }
    const text = target.textContent || '';
    if (!text.trim()) {
        return;
    }

    const originalLabel = triggerBtn ? (triggerBtn.dataset.originalLabel || triggerBtn.textContent.trim()) : '';
    if (triggerBtn && !triggerBtn.dataset.originalLabel) {
        triggerBtn.dataset.originalLabel = originalLabel;
    }

    const showCopiedState = () => {
        if (!triggerBtn) {
            return;
        }
        triggerBtn.textContent = 'Copied';
        triggerBtn.disabled = true;
        setTimeout(() => {
            triggerBtn.disabled = false;
            triggerBtn.textContent = triggerBtn.dataset.originalLabel || originalLabel || 'Copy';
        }, 1200);
    };

    const fallbackCopy = (value) => {
        return new Promise((resolve, reject) => {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (successful) {
                    resolve();
                } else {
                    reject(new Error('execCommand failed'));
                }
            } catch (err) {
                document.body.removeChild(textarea);
                reject(err);
            }
        });
    };

    const copyPromise = (navigator.clipboard && typeof navigator.clipboard.writeText === 'function')
        ? navigator.clipboard.writeText(text)
        : fallbackCopy(text);

    copyPromise
        .then(() => {
            showCopiedState();
        })
        .catch(() => {
            if (triggerBtn) {
                triggerBtn.disabled = false;
                triggerBtn.textContent = triggerBtn.dataset.originalLabel || originalLabel || 'Copy';
            }
            alert('Copy failed. Please select the text and copy manually.');
        });
}


// Start new conversation
async function startNewConversation() {
    // If currently on group detail page, exit group detail first
    if (currentGroupId) {
        const groupDetailPage = document.getElementById('group-detail-page');
        const chatContainer = document.querySelector('.chat-container');
        if (groupDetailPage) groupDetailPage.style.display = 'none';
        if (chatContainer) chatContainer.style.display = 'flex';
        currentGroupId = null;
        // Refresh conversation list
        loadConversationsWithGroups();
    }

    currentConversationId = null;
    currentConversationGroupId = null; // New conversation does not belong to any group
    document.getElementById('chat-messages').innerHTML = '';
    const readyMsgNew = typeof window.t === 'function' ? window.t('chat.systemReadyMessage') : 'System is ready. Please enter your test requirements and the system will automatically execute the relevant security tests.';
    addMessage('assistant', readyMsgNew, null, null, null, { systemReadyMessage: true });
    addAttackChainButton(null);
    updateActiveConversation();
    // Refresh group list, clear group highlight
    await loadGroups();
    // Refresh conversation list to show the latest history
    loadConversationsWithGroups();
    // Clear debounce timer to prevent saving when restoring draft
    if (draftSaveTimer) {
        clearTimeout(draftSaveTimer);
        draftSaveTimer = null;
    }
    // Clear draft — new conversation should not restore previous draft
    clearChatDraft();
    // Clear input field
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.value = '';
        adjustTextareaHeight(chatInput);
    }
}

// Load conversation list (grouped by time)
async function loadConversations(searchQuery = '') {
    try {
        let url = '/api/conversations?limit=50';
        if (searchQuery && searchQuery.trim()) {
            url += '&search=' + encodeURIComponent(searchQuery.trim());
        }
        const response = await apiFetch(url);

        const listContainer = document.getElementById('conversations-list');
        if (!listContainer) {
            return;
        }

        // Save scroll position
        const sidebarContent = listContainer.closest('.sidebar-content');
        const savedScrollTop = sidebarContent ? sidebarContent.scrollTop : 0;

        const emptyStateHtml = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.875rem;" data-i18n="chat.noHistoryConversations"></div>';
        listContainer.innerHTML = '';

        // If response is not 200, show empty state (friendly handling, no error shown)
        if (!response.ok) {
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
            return;
        }

        const conversations = await response.json();

        if (!Array.isArray(conversations) || conversations.length === 0) {
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
            return;
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekday = todayStart.getDay() === 0 ? 7 : todayStart.getDay();
        const startOfWeek = new Date(todayStart);
        startOfWeek.setDate(todayStart.getDate() - (weekday - 1));
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1);

        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            earlier: [],
        };

        conversations.forEach(conv => {
            const dateObj = conv.updatedAt ? new Date(conv.updatedAt) : new Date();
            const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
            const groupKey = getConversationGroup(validDate, todayStart, startOfWeek, yesterdayStart);
            groups[groupKey].push({
                ...conv,
                _time: validDate,
                _timeText: formatConversationTimestamp(validDate, todayStart, yesterdayStart),
            });
        });

        const groupOrder = [
            { key: 'today', label: typeof window.t === 'function' ? window.t('chat.groupToday') : 'Today' },
            { key: 'yesterday', label: typeof window.t === 'function' ? window.t('chat.groupYesterday') : 'Yesterday' },
            { key: 'thisWeek', label: typeof window.t === 'function' ? window.t('chat.groupThisWeek') : 'This Week' },
            { key: 'earlier', label: typeof window.t === 'function' ? window.t('chat.groupEarlier') : 'Earlier' },
        ];

        const fragment = document.createDocumentFragment();
        let rendered = false;

        groupOrder.forEach(({ key, label }) => {
            const items = groups[key];
            if (!items || items.length === 0) {
                return;
            }
            rendered = true;

            const section = document.createElement('div');
            section.className = 'conversation-group';

            const title = document.createElement('div');
            title.className = 'conversation-group-title';
            title.textContent = label;
            section.appendChild(title);

            items.forEach(itemData => {
                // Check if pinned
                const isPinned = itemData.pinned || false;
                section.appendChild(createConversationListItemWithMenu(itemData, isPinned));
            });

            fragment.appendChild(section);
        });

        if (!rendered) {
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
            return;
        }

        listContainer.appendChild(fragment);
        updateActiveConversation();
        
        // Restore scroll position
        if (sidebarContent) {
            // Use requestAnimationFrame to ensure DOM has been updated
            requestAnimationFrame(() => {
                sidebarContent.scrollTop = savedScrollTop;
            });
        }
    } catch (error) {
        console.error('Failed to load conversation list:', error);
        // On error, show empty state instead of error message (better user experience)
        const listContainer = document.getElementById('conversations-list');
        if (listContainer) {
            const emptyStateHtml = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.875rem;" data-i18n="chat.noHistoryConversations"></div>';
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
        }
    }
}

function createConversationListItem(conversation) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.conversationId = conversation.id;
    if (conversation.id === currentConversationId) {
        item.classList.add('active');
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'conversation-content';

    const title = document.createElement('div');
    title.className = 'conversation-title';
    const titleText = conversation.title || (typeof window.t === 'function' ? window.t('chat.unnamedConversation') : 'Unnamed Conversation');
    title.textContent = safeTruncateText(titleText, 60);
    title.title = titleText; // Set full title for hover tooltip
    contentWrapper.appendChild(title);

    const time = document.createElement('div');
    time.className = 'conversation-time';
    time.textContent = conversation._timeText || formatConversationTimestamp(conversation._time || new Date());
    contentWrapper.appendChild(time);

    item.appendChild(contentWrapper);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'conversation-delete-btn';
    deleteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    deleteBtn.title = typeof window.t === 'function' ? window.t('chat.deleteConversation') : 'Delete conversation';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteConversation(conversation.id);
    };
    item.appendChild(deleteBtn);

    item.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadConversation(conversation.id);
    };
    return item;
}

// Handle history search
let conversationSearchTimer = null;
function handleConversationSearch(query) {
    // Debounce to avoid excessive requests
    if (conversationSearchTimer) {
        clearTimeout(conversationSearchTimer);
    }
    
    const searchInput = document.getElementById('conversation-search-input');
    const clearBtn = document.getElementById('conversation-search-clear');
    
    if (clearBtn) {
        if (query && query.trim()) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    }
    
    conversationSearchTimer = setTimeout(() => {
        loadConversations(query);
    }, 300); // 300ms debounce delay
}

// Clear search
function clearConversationSearch() {
    const searchInput = document.getElementById('conversation-search-input');
    const clearBtn = document.getElementById('conversation-search-clear');
    
    if (searchInput) {
        searchInput.value = '';
    }
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    loadConversations('');
}

function formatConversationTimestamp(dateObj, todayStart, yesterdayStart) {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return '';
    }
    // If todayStart is not provided, use the current date as reference
    const now = new Date();
    const referenceToday = todayStart || new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const referenceYesterday = yesterdayStart || new Date(referenceToday.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const fmtLocale = (typeof window.__locale === 'string' && window.__locale.startsWith('zh')) ? 'zh-CN' : 'en-US';
    const yesterdayLabel = typeof window.t === 'function' ? window.t('chat.yesterday') : 'Yesterday';

    const timeOnlyOpts = { hour: '2-digit', minute: '2-digit' };
    const dateTimeOpts = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const fullDateOpts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    if (fmtLocale === 'zh-CN') {
        timeOnlyOpts.hour12 = false;
        dateTimeOpts.hour12 = false;
        fullDateOpts.hour12 = false;
    }
    if (messageDate.getTime() === referenceToday.getTime()) {
        return dateObj.toLocaleTimeString(fmtLocale, timeOnlyOpts);
    }
    if (messageDate.getTime() === referenceYesterday.getTime()) {
        return yesterdayLabel + ' ' + dateObj.toLocaleTimeString(fmtLocale, timeOnlyOpts);
    }
    if (dateObj.getFullYear() === referenceToday.getFullYear()) {
        return dateObj.toLocaleString(fmtLocale, dateTimeOpts);
    }
    return dateObj.toLocaleString(fmtLocale, fullDateOpts);
}

function getConversationGroup(dateObj, todayStart, startOfWeek, yesterdayStart) {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return 'earlier';
    }
    const today = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate());
    const yesterday = new Date(yesterdayStart.getFullYear(), yesterdayStart.getMonth(), yesterdayStart.getDate());
    const messageDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    if (messageDay.getTime() === today.getTime() || messageDay > today) {
        return 'today';
    }
    if (messageDay.getTime() === yesterday.getTime()) {
        return 'yesterday';
    }
    if (messageDay >= startOfWeek && messageDay < today) {
        return 'thisWeek';
    }
    return 'earlier';
}

// Load conversation
async function loadConversation(conversationId) {
    try {
        const response = await apiFetch(`/api/conversations/${conversationId}`);
        const conversation = await response.json();

        if (!response.ok) {
            alert('Failed to load conversation: ' + (conversation.error || 'Unknown error'));
            return;
        }

        // If currently on group detail page, switch to conversation view
        // Exit group detail mode and show all recent conversations for better UX
        if (currentGroupId) {
            const sidebar = document.querySelector('.conversation-sidebar');
            const groupDetailPage = document.getElementById('group-detail-page');
            const chatContainer = document.querySelector('.chat-container');

            // Always keep sidebar visible
            if (sidebar) sidebar.style.display = 'flex';
            // Hide group detail page, show conversation view
            if (groupDetailPage) groupDetailPage.style.display = 'none';
            if (chatContainer) chatContainer.style.display = 'flex';

            // Exit group detail mode so the recent conversation list shows all conversations
            // User can see all conversations in the sidebar for easy switching
            const previousGroupId = currentGroupId;
            currentGroupId = null;

            // Refresh recent conversation list, show all conversations (including grouped ones)
            loadConversationsWithGroups();
        }

        // Get the group ID the current conversation belongs to (for highlight)
        // Ensure the group mapping is loaded
        if (Object.keys(conversationGroupMappingCache).length === 0) {
            await loadConversationGroupMapping();
        }
        currentConversationGroupId = conversationGroupMappingCache[conversationId] || null;

        // Always refresh group list to ensure highlight state is correct
        // This clears the highlight state of the previous group and keeps UI consistent
        await loadGroups();

        // Update current conversation ID
        currentConversationId = conversationId;
        updateActiveConversation();

        // If the attack chain modal is open but showing a different conversation, close it
        const attackChainModal = document.getElementById('attack-chain-modal');
        if (attackChainModal && attackChainModal.style.display === 'block') {
            if (currentAttackChainConversationId !== conversationId) {
                closeAttackChainModal();
            }
        }

        // Clear message area
        const messagesDiv = document.getElementById('chat-messages');
        messagesDiv.innerHTML = '';

        // Check if there are recent messages in the conversation; if so, clear draft (avoid restoring already sent messages)
        let hasRecentUserMessage = false;
        if (conversation.messages && conversation.messages.length > 0) {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                // Check message time; if within 30 seconds, clear draft
                const messageTime = new Date(lastMessage.createdAt);
                const now = new Date();
                const timeDiff = now.getTime() - messageTime.getTime();
                if (timeDiff < 30000) { // within 30 seconds
                    hasRecentUserMessage = true;
                }
            }
        }
        if (hasRecentUserMessage) {
            // If there's a recently sent user message, clear draft
            clearChatDraft();
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = '';
                adjustTextareaHeight(chatInput);
            }
        }

        // Load messages
        if (conversation.messages && conversation.messages.length > 0) {
            conversation.messages.forEach(msg => {
                // Check if message content is "Processing..."; if so, check processDetails for error or cancelled events
                let displayContent = msg.content;
                if (msg.role === 'assistant' && msg.content === 'Processing...' && msg.processDetails && msg.processDetails.length > 0) {
                    // Find the last error or cancelled event
                    for (let i = msg.processDetails.length - 1; i >= 0; i--) {
                        const detail = msg.processDetails[i];
                        if (detail.eventType === 'error' || detail.eventType === 'cancelled') {
                            displayContent = detail.message || msg.content;
                            break;
                        }
                    }
                }

                // Pass message creation time
                const messageId = addMessage(msg.role, displayContent, msg.mcpExecutionIds || [], null, msg.createdAt);
                // For assistant messages, always render process details (show expand button even without processDetails)
                if (msg.role === 'assistant') {
                    // Small delay to ensure message is rendered
                    setTimeout(() => {
                        renderProcessDetails(messageId, msg.processDetails || []);
                        // If there are process details, check for error or cancelled events and collapse by default
                        if (msg.processDetails && msg.processDetails.length > 0) {
                            const hasErrorOrCancelled = msg.processDetails.some(d =>
                                d.eventType === 'error' || d.eventType === 'cancelled'
                            );
                            if (hasErrorOrCancelled) {
                                collapseAllProgressDetails(messageId, null);
                            }
                        }
                    }, 100);
                }
            });
        } else {
            const readyMsgEmpty = typeof window.t === 'function' ? window.t('chat.systemReadyMessage') : 'System is ready. Please enter your test requirements and the system will automatically execute the relevant security tests.';
            addMessage('assistant', readyMsgEmpty, null, null, null, { systemReadyMessage: true });
        }

        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // Add attack chain button
        addAttackChainButton(conversationId);

        // Refresh conversation list
        loadConversations();
    } catch (error) {
        console.error('Failed to load conversation:', error);
        alert('Failed to load conversation: ' + error.message);
    }
}

// Delete conversation
async function deleteConversation(conversationId, skipConfirm = false) {
    // Confirm deletion (if caller did not skip confirmation)
    if (!skipConfirm) {
        if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            return;
        }
    }

    try {
        const response = await apiFetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Delete failed');
        }

        // If the deleted conversation is the current one, clear the chat view
        if (conversationId === currentConversationId) {
            currentConversationId = null;
            document.getElementById('chat-messages').innerHTML = '';
            const readyMsgLoad = typeof window.t === 'function' ? window.t('chat.systemReadyMessage') : 'System is ready. Please enter your test requirements and the system will automatically execute the relevant security tests.';
            addMessage('assistant', readyMsgLoad, null, null, null, { systemReadyMessage: true });
            addAttackChainButton(null);
        }

        // Update cache — delete immediately to ensure correct recognition on next load
        delete conversationGroupMappingCache[conversationId];
        // Also remove from pending mappings
        delete pendingGroupMappings[conversationId];

        // If currently on group detail page, reload group conversations
        if (currentGroupId) {
            await loadGroupConversations(currentGroupId);
        }

        // Refresh conversation list
        loadConversations();
    } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Failed to delete conversation: ' + error.message);
    }
}

// Update active conversation style
function updateActiveConversation() {
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (currentConversationId && item.dataset.conversationId === currentConversationId) {
            item.classList.add('active');
        }
    });
}

// ==================== Attack Chain Visualization ====================

let attackChainCytoscape = null;
let currentAttackChainConversationId = null;
// Manage loading state per conversation ID, decoupling different conversations
const attackChainLoadingMap = new Map(); // Map<conversationId, boolean>

// Check if a given conversation is currently loading
function isAttackChainLoading(conversationId) {
    return attackChainLoadingMap.get(conversationId) === true;
}

// Set loading state for a given conversation
function setAttackChainLoading(conversationId, loading) {
    if (loading) {
        attackChainLoadingMap.set(conversationId, true);
    } else {
        attackChainLoadingMap.delete(conversationId);
    }
}

// Add attack chain button (moved to menu; this function is kept for compatibility but no longer shows a top button)
function addAttackChainButton(conversationId) {
    // Attack chain button has been moved to the three-dot menu; no top button needed
    // This function is kept for code compatibility but no longer performs any action
    const conversationHeader = document.getElementById('conversation-header');
    if (conversationHeader) {
        conversationHeader.style.display = 'none';
    }
}

function updateAttackChainAvailability() {
    addAttackChainButton(currentConversationId);
}

// Show attack chain modal
async function showAttackChain(conversationId) {
    // Allow opening if showing a different conversation or not loading
    // Also allow opening if loading the same conversation (show loading state)
    if (isAttackChainLoading(conversationId) && currentAttackChainConversationId === conversationId) {
        // If modal is already open for the same conversation, do not open again
        const modal = document.getElementById('attack-chain-modal');
        if (modal && modal.style.display === 'block') {
            console.log('Attack chain is loading, modal already open');
            return;
        }
    }

    currentAttackChainConversationId = conversationId;
    const modal = document.getElementById('attack-chain-modal');
    if (!modal) {
        console.error('Attack chain modal not found');
        return;
    }

    modal.style.display = 'block';
    // Immediately refresh stats in current language on open (avoid hardcoded Chinese in red box)
    updateAttackChainStats({ nodes: [], edges: [] });

    // Clear container
    const container = document.getElementById('attack-chain-container');
    if (container) {
        container.innerHTML = '<div class="loading-spinner">' + (typeof window.t === 'function' ? window.t('chat.loading') : 'Loading...') + '</div>';
    }

    // Hide details panel
    const detailsPanel = document.getElementById('attack-chain-details');
    if (detailsPanel) {
        detailsPanel.style.display = 'none';
    }

    // Disable regenerate button
    const regenerateBtn = document.querySelector('button[onclick="regenerateAttackChain()"]');
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.style.opacity = '0.5';
        regenerateBtn.style.cursor = 'not-allowed';
    }

    // Load attack chain data
    await loadAttackChain(conversationId);
}

// Load attack chain data
async function loadAttackChain(conversationId) {
    if (isAttackChainLoading(conversationId)) {
        return; // Prevent duplicate calls
    }

    setAttackChainLoading(conversationId, true);

    try {
        const response = await apiFetch(`/api/attack-chain/${conversationId}`);

        if (!response.ok) {
            // Handle 409 Conflict (generation in progress)
            if (response.status === 409) {
                const error = await response.json();
                const container = document.getElementById('attack-chain-container');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 28px 24px; color: var(--text-secondary);">
                            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.95rem; color: var(--text-primary);">
                                <span role="presentation" aria-hidden="true">⏳</span>
                                <span>${typeof window.t === 'function' ? window.t('chat.attackChainGenerating') : 'Attack chain is being generated, please wait'}</span>
                            </div>
                            <button class="btn-secondary" onclick="refreshAttackChain()" style="margin-top: 12px; font-size: 0.78rem; padding: 4px 12px;">
                                ${typeof window.t === 'function' ? window.t('common.refresh') : 'Refresh'}
                            </button>
                        </div>
                    `;
                }
                // Auto-refresh after 5 seconds (allow refresh but keep loading state to prevent duplicate clicks)
                // Use closure to save conversationId, prevent cross-conversation interference
                setTimeout(() => {
                    // Check if currently displayed conversation ID matches
                    if (currentAttackChainConversationId === conversationId) {
                        refreshAttackChain();
                    }
                }, 5000);
                // In 409 case, keep loading state to prevent duplicate clicks
                // But allow refreshAttackChain to call loadAttackChain to check status
                // Note: do not reset loading state, keep it
                // Restore button state (keep loading state but allow manual refresh)
                const regenerateBtn = document.querySelector('button[onclick="regenerateAttackChain()"]');
                if (regenerateBtn) {
                    regenerateBtn.disabled = false;
                    regenerateBtn.style.opacity = '1';
                    regenerateBtn.style.cursor = 'pointer';
                }
                return; // Early return, do not execute setAttackChainLoading(conversationId, false) in finally
            }

            const error = await response.json();
            throw new Error(error.error || 'Failed to load attack chain');
        }

        const chainData = await response.json();

        // Check if currently displayed conversation ID matches, prevent cross-conversation interference
        if (currentAttackChainConversationId !== conversationId) {
            console.log('Attack chain data returned, but displayed conversation has changed — ignoring this render', {
                returned: conversationId,
                current: currentAttackChainConversationId
            });
            setAttackChainLoading(conversationId, false);
            return;
        }
        
        // Render attack chain
        renderAttackChain(chainData);

        // Update statistics
        updateAttackChainStats(chainData);

        // Reset loading state after successful load
        setAttackChainLoading(conversationId, false);

    } catch (error) {
        console.error('Failed to load attack chain:', error);
        const container = document.getElementById('attack-chain-container');
        if (container) {
            container.innerHTML = '<div class="error-message">' + (typeof window.t === 'function' ? window.t('chat.loadFailed', { message: error.message }) : 'Load failed: ' + error.message) + '</div>';
        }
        // Also reset loading state on error
        setAttackChainLoading(conversationId, false);
    } finally {
        // Restore regenerate button
        const regenerateBtn = document.querySelector('button[onclick="regenerateAttackChain()"]');
        if (regenerateBtn) {
            regenerateBtn.disabled = false;
            regenerateBtn.style.opacity = '1';
            regenerateBtn.style.cursor = 'pointer';
        }
    }
}

// Render attack chain
function renderAttackChain(chainData) {
    const container = document.getElementById('attack-chain-container');
    if (!container) {
        return;
    }

    // Clear container
    container.innerHTML = '';

    if (!chainData.nodes || chainData.nodes.length === 0) {
        container.innerHTML = '<div class="empty-message">' + (typeof window.t === 'function' ? window.t('chat.noAttackChainData') : 'No attack chain data available') + '</div>';
        return;
    }

    // Calculate graph complexity (for dynamic layout and style adjustments)
    const nodeCount = chainData.nodes.length;
    const edgeCount = chainData.edges.length;
    const isComplexGraph = nodeCount > 15 || edgeCount > 25;

    // Optimize node labels: smart truncation and wrapping
    chainData.nodes.forEach(node => {
        if (node.label) {
            // Smart truncation: prefer breaking at punctuation or spaces
            const maxLength = isComplexGraph ? 18 : 22;
            if (node.label.length > maxLength) {
                let truncated = node.label.substring(0, maxLength);
                // Try to truncate at the last punctuation mark or space
                const lastPunct = Math.max(
                    truncated.lastIndexOf(' '),
                    truncated.lastIndexOf('/')
                );
                if (lastPunct > maxLength * 0.6) { // If punctuation position is reasonable
                    truncated = truncated.substring(0, lastPunct + 1);
                }
                node.label = truncated + '...';
            }
        }
    });

    // Prepare Cytoscape data
    const elements = [];

    // Add nodes, pre-compute text color and border color, and prepare type label data
    chainData.nodes.forEach(node => {
        const riskScore = node.risk_score || 0;
        const nodeType = node.type || '';

        // Set type label text and badge based on node type (modern design)
        let typeLabel = '';
        let typeBadge = '';
        let typeColor = '';
        if (nodeType === 'target') {
            typeLabel = typeof window.t === 'function' ? window.t('attackChain.nodeTypeTarget') : 'Target';
            typeBadge = '○';  // hollow circle, more modern
            typeColor = '#1976d2';  // blue
        } else if (nodeType === 'action') {
            typeLabel = typeof window.t === 'function' ? window.t('attackChain.nodeTypeAction') : 'Action';
            typeBadge = '▷';  // simple triangle
            typeColor = '#f57c00';  // orange
        } else if (nodeType === 'vulnerability') {
            typeLabel = typeof window.t === 'function' ? window.t('attackChain.nodeTypeVulnerability') : 'Vulnerability';
            typeBadge = '◇';  // hollow diamond
            typeColor = '#d32f2f';  // red
        } else {
            typeLabel = nodeType;
            typeBadge = '•';
            typeColor = '#666';
        }

        // Calculate text color and border color based on risk score
        let textColor, borderColor, textOutlineWidth, textOutlineColor;
        if (riskScore >= 80) {
            // Red background: white text, white border
            textColor = '#fff';
            borderColor = '#fff';
            textOutlineWidth = 1;
            textOutlineColor = '#333';
        } else if (riskScore >= 60) {
            // Orange background: white text, white border
            textColor = '#fff';
            borderColor = '#fff';
            textOutlineWidth = 1;
            textOutlineColor = '#333';
        } else if (riskScore >= 40) {
            // Yellow background: dark text, dark border
            textColor = '#333';
            borderColor = '#cc9900';
            textOutlineWidth = 2;
            textOutlineColor = '#fff';
        } else {
            // Green background: dark green text, dark border
            textColor = '#1a5a1a';
            borderColor = '#5a8a5a';
            textOutlineWidth = 2;
            textOutlineColor = '#fff';
        }

        // Save node data using original label (type label will be added in style)
        elements.push({
            data: {
                id: node.id,
                label: node.label,  // original label
                originalLabel: node.label,  // save original label for search
                type: nodeType,
                typeLabel: typeLabel,  // save type label text
                typeBadge: typeBadge,  // save type badge
                typeColor: typeColor,  // save type color
                riskScore: riskScore,
                toolExecutionId: node.tool_execution_id || '',
                metadata: node.metadata || {},
                textColor: textColor,
                borderColor: borderColor,
                textOutlineWidth: textOutlineWidth,
                textOutlineColor: textOutlineColor
            }
        });
    });

    // Add edges (only add edges where both source and target nodes exist)
    const nodeIds = new Set(chainData.nodes.map(node => node.id));

    // Save valid edges for ELK layout
    const validEdges = [];
    chainData.edges.forEach(edge => {
        // Validate that both source and target nodes exist
        if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
            validEdges.push(edge);
            elements.push({
                data: {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: edge.type || 'leads_to',
                    weight: edge.weight || 1
                }
            });
        } else {
            console.warn('Skipping invalid edge: source or target node does not exist', {
                edgeId: edge.id,
                source: edge.source,
                target: edge.target,
                sourceExists: nodeIds.has(edge.source),
                targetExists: nodeIds.has(edge.target)
            });
        }
    });

    // Initialize Cytoscape
    attackChainCytoscape = cytoscape({
        container: container,
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    // Modern card design with clear visual hierarchy
                    'label': function(ele) {
                        const typeLabel = ele.data('typeLabel') || '';
                        const label = ele.data('label') || '';
                        // Clean two-line display: type label + content
                        return typeLabel + '\n' + label;
                    },
                    // Reasonable node dimensions
                    'width': function(ele) {
                        const type = ele.data('type');
                        if (type === 'target') return isComplexGraph ? 280 : 320;
                        if (type === 'vulnerability') return isComplexGraph ? 260 : 300;
                        return isComplexGraph ? 240 : 280;
                    },
                    'height': function(ele) {
                        const type = ele.data('type');
                        if (type === 'target') return isComplexGraph ? 100 : 120;
                        if (type === 'vulnerability') return isComplexGraph ? 90 : 110;
                        return isComplexGraph ? 80 : 100;
                    },
                    'shape': 'round-rectangle',
                    // Modern background: white card + colored left bar
                    'background-color': '#FFFFFF',
                    'background-opacity': 1,
                    // Left color bar effect (via border)
                    'border-width': function(ele) {
                        const type = ele.data('type');
                        return 0;  // No border, use background color block
                    },
                    'border-color': 'transparent',
                    // Text style: clear and readable
                    'color': '#2C3E50',  // Dark blue-gray, professional look
                    'font-size': function(ele) {
                        const type = ele.data('type');
                        if (type === 'target') return isComplexGraph ? '14px' : '16px';
                        if (type === 'vulnerability') return isComplexGraph ? '13px' : '15px';
                        return isComplexGraph ? '13px' : '15px';
                    },
                    'font-weight': '600',  // Medium bold
                    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-wrap': 'wrap',
                    'text-max-width': function(ele) {
                        const type = ele.data('type');
                        if (type === 'target') return isComplexGraph ? '240px' : '280px';
                        if (type === 'vulnerability') return isComplexGraph ? '220px' : '260px';
                        return isComplexGraph ? '200px' : '240px';
                    },
                    'text-overflow-wrap': 'anywhere',
                    'text-margin-y': 4,
                    'padding': '12px 16px',  // Reasonable padding
                    'line-height': 1.5,
                    'text-outline-width': 0
                }
            },
            {
                // Target node: blue theme
                selector: 'node[type = "target"]',
                style: {
                    'background-color': '#E3F2FD',
                    'color': '#1565C0',
                    'border-width': 3,
                    'border-color': '#2196F3',
                    'border-style': 'solid'
                }
            },
            {
                // Action node: different colors based on status
                selector: 'node[type = "action"]',
                style: {
                    'background-color': function(ele) {
                        const metadata = ele.data('metadata') || {};
                        const findings = metadata.findings || [];
                        const status = metadata.status || '';
                        const hasFindings = Array.isArray(findings) && findings.length > 0;
                        const isFailedInsight = status === 'failed_insight';

                        if (hasFindings && !isFailedInsight) {
                            return '#E8F5E9';  // light green background
                        } else {
                            return '#F5F5F5';  // light grey background
                        }
                    },
                    'color': '#424242',
                    'border-width': 2,
                    'border-color': function(ele) {
                        const metadata = ele.data('metadata') || {};
                        const findings = metadata.findings || [];
                        const status = metadata.status || '';
                        const hasFindings = Array.isArray(findings) && findings.length > 0;
                        const isFailedInsight = status === 'failed_insight';

                        if (hasFindings && !isFailedInsight) {
                            return '#4CAF50';  // green border
                        } else {
                            return '#9E9E9E';  // grey border
                        }
                    },
                    'border-style': 'solid'
                }
            },
            {
                // Vulnerability node: color based on risk level
                selector: 'node[type = "vulnerability"]',
                style: {
                    'background-color': function(ele) {
                        const riskScore = ele.data('riskScore') || 0;
                        if (riskScore >= 80) return '#FFEBEE';
                        if (riskScore >= 60) return '#FFF3E0';
                        if (riskScore >= 40) return '#FFFDE7';
                        return '#E8F5E9';
                    },
                    'color': function(ele) {
                        const riskScore = ele.data('riskScore') || 0;
                        if (riskScore >= 80) return '#C62828';
                        if (riskScore >= 60) return '#E65100';
                        if (riskScore >= 40) return '#F57C00';
                        return '#2E7D32';
                    },
                    'border-width': 3,
                    'border-color': function(ele) {
                        const riskScore = ele.data('riskScore') || 0;
                        if (riskScore >= 80) return '#F44336';
                        if (riskScore >= 60) return '#FF9800';
                        if (riskScore >= 40) return '#FFC107';
                        return '#4CAF50';
                    },
                    'border-style': 'solid'
                }
            },
            {
                selector: 'edge',
                style: {
                    // Clean and clear connectors
                    'width': function(ele) {
                        const type = ele.data('type');
                        if (type === 'discovers') return 2.5;  // slightly thicker for discovery edges
                        if (type === 'enables') return 2.5;  // slightly thicker for enables edges
                        return 2;  // normal edge
                    },
                    'line-color': function(ele) {
                        const type = ele.data('type');
                        if (type === 'discovers') return '#42A5F5';  // blue
                        if (type === 'targets') return '#42A5F5';  // blue
                        if (type === 'enables') return '#EF5350';  // red
                        if (type === 'leads_to') return '#90A4AE';  // grey-blue
                        return '#B0BEC5';
                    },
                    'target-arrow-color': function(ele) {
                        const type = ele.data('type');
                        if (type === 'discovers') return '#42A5F5';
                        if (type === 'targets') return '#42A5F5';
                        if (type === 'enables') return '#EF5350';
                        if (type === 'leads_to') return '#90A4AE';
                        return '#B0BEC5';
                    },
                    'target-arrow-shape': 'triangle',
                    'arrow-scale': 1.2,  // moderate arrow size
                    'curve-style': 'straight',
                    'opacity': 0.7,  // moderate opacity
                    'line-style': function(ele) {
                        const type = ele.data('type');
                        if (type === 'targets') return 'dashed';
                        return 'solid';
                    },
                    'line-dash-pattern': function(ele) {
                        const type = ele.data('type');
                        if (type === 'targets') return [8, 4];
                        return [];
                    }
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-width': 5,
                    'border-color': '#0066ff',
                    'z-index': 999,
                    'opacity': 1,
                    'overlay-opacity': 0.1,
                    'overlay-color': '#0066ff'
                }
            }
        ],
        userPanningEnabled: true,
        userZoomingEnabled: true,
        boxSelectionEnabled: true
    });
    
    // Use ELK layout (high-quality DAG layout, reduces edge crossings)
    let layoutOptions = {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: isComplexGraph ? 3.0 : 2.5,
        padding: 40
    };

    // Use ELK.js for layout calculation
    // elk.bundled.js exposes ELK object, can be used directly with new ELK()
    let elkInstance = null;
    if (typeof ELK !== 'undefined') {
        try {
            elkInstance = new ELK();
        } catch (e) {
            console.warn('ELK initialization failed:', e);
        }
    }
    
    if (elkInstance) {
        try {
            
            // Build ELK graph structure
            const elkGraph = {
                id: 'root',
                layoutOptions: {
                    'elk.algorithm': 'layered',
                    'elk.direction': 'DOWN',
                    'elk.spacing.nodeNode': String(isComplexGraph ? 100 : 120),  // reasonable node spacing
                    'elk.spacing.edgeNode': '50',  // reasonable edge-to-node spacing
                    'elk.spacing.edgeEdge': '25',  // reasonable edge spacing
                    'elk.layered.spacing.nodeNodeBetweenLayers': String(isComplexGraph ? 150 : 180),  // reasonable layer spacing
                    'elk.layered.nodePlacement.strategy': 'SIMPLE',  // use simple strategy for more spread-out layout
                    'elk.layered.crossingMinimization.strategy': 'INTERACTIVE',  // interactive crossing minimization
                    'elk.layered.thoroughness': '10',  // highest optimization level
                    'elk.layered.spacing.edgeNodeBetweenLayers': '50',
                    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
                    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
                    'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
                    'elk.layered.cycleBreaking.strategy': 'GREEDY',
                    'elk.layered.thoroughness': '7',
                    'elk.padding': '[top=60,left=100,bottom=60,right=100]',  // larger left/right padding for more spread-out graph
                    'elk.spacing.componentComponent': String(isComplexGraph ? 100 : 120)  // component spacing
                },
                children: chainData.nodes.map(node => {
                    const type = node.type || '';
                    return {
                        id: node.id,
                        width: type === 'target' ? (isComplexGraph ? 280 : 320) : 
                               type === 'vulnerability' ? (isComplexGraph ? 260 : 300) : 
                               (isComplexGraph ? 240 : 280),
                        height: type === 'target' ? (isComplexGraph ? 100 : 120) : 
                                type === 'vulnerability' ? (isComplexGraph ? 90 : 110) : 
                                (isComplexGraph ? 80 : 100)
                    };
                }),
                edges: validEdges.map(edge => ({
                    id: edge.id,
                    sources: [edge.source],
                    targets: [edge.target]
                }))
            };
            
            // Use ELK to calculate layout
            elkInstance.layout(elkGraph).then(laidOutGraph => {
                // Apply ELK-calculated layout to Cytoscape nodes
                if (laidOutGraph && laidOutGraph.children) {
                    laidOutGraph.children.forEach(elkNode => {
                        const cyNode = attackChainCytoscape.getElementById(elkNode.id);
                        if (cyNode && elkNode.x !== undefined && elkNode.y !== undefined) {
                            cyNode.position({
                                x: elkNode.x + (elkNode.width || 0) / 2,
                                y: elkNode.y + (elkNode.height || 0) / 2
                            });
                        }
                    });

                    // Center the graph after layout is complete
                    setTimeout(() => {
                        centerAttackChain();
                    }, 150);
                } else {
                    throw new Error('ELK layout returned invalid result');
                }
            }).catch(err => {
                console.warn('ELK layout calculation failed, using default layout:', err);
                // Fall back to default layout
                const layout = attackChainCytoscape.layout(layoutOptions);
                layout.one('layoutstop', () => {
                    setTimeout(() => {
                        centerAttackChain();
                    }, 100);
                });
                layout.run();
            });
        } catch (e) {
            console.warn('ELK layout initialization failed, using default layout:', e);
            // Fall back to default layout
            const layout = attackChainCytoscape.layout(layoutOptions);
            layout.one('layoutstop', () => {
                setTimeout(() => {
                    centerAttackChain();
                }, 100);
            });
            layout.run();
        }
    } else {
        console.warn('ELK.js not loaded, using default layout. Please check that the elkjs library is loaded correctly.');
        // Use default layout
        const layout = attackChainCytoscape.layout(layoutOptions);
        layout.one('layoutstop', () => {
            setTimeout(() => {
                centerAttackChain();
            }, 100);
        });
        layout.run();
    }

    // Function to center the attack chain
    function centerAttackChain() {
        try {
            if (!attackChainCytoscape) {
                return;
            }

            const container = attackChainCytoscape.container();
            if (!container) {
                return;
            }

            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            if (containerWidth === 0 || containerHeight === 0) {
                // If container size is 0, retry after delay
                setTimeout(centerAttackChain, 100);
                return;
            }

            // Center the graph while maintaining reasonable zoom
            const padding = 80;  // margin
            attackChainCytoscape.fit(undefined, padding);

            // Adjust after fit completes
            setTimeout(() => {
                const extent = attackChainCytoscape.extent();
                if (!extent || typeof extent.x1 === 'undefined' || typeof extent.x2 === 'undefined' ||
                    typeof extent.y1 === 'undefined' || typeof extent.y2 === 'undefined') {
                    return;
                }

                const graphWidth = extent.x2 - extent.x1;
                const graphHeight = extent.y2 - extent.y1;
                const currentZoom = attackChainCytoscape.zoom();

                // If graph is too small, zoom in appropriately
                const availableWidth = containerWidth - padding * 2;
                const availableHeight = containerHeight - padding * 2;
                const widthScale = graphWidth > 0 ? availableWidth / (graphWidth * currentZoom) : 1;
                const heightScale = graphHeight > 0 ? availableHeight / (graphHeight * currentZoom) : 1;
                const scale = Math.min(widthScale, heightScale);

                // Only adjust zoom within reasonable range (0.8–1.3x)
                if (scale > 1 && scale < 1.3) {
                    attackChainCytoscape.zoom(currentZoom * scale);
                } else if (scale < 0.8) {
                    attackChainCytoscape.zoom(currentZoom * 0.8);
                }

                // Ensure graph is centered
                const graphCenterX = (extent.x1 + extent.x2) / 2;
                const graphCenterY = (extent.y1 + extent.y2) / 2;
                const zoom = attackChainCytoscape.zoom();
                const pan = attackChainCytoscape.pan();

                const graphCenterViewX = graphCenterX * zoom + pan.x;
                const graphCenterViewY = graphCenterY * zoom + pan.y;

                const desiredViewX = containerWidth / 2;
                const desiredViewY = containerHeight / 2;

                const deltaX = desiredViewX - graphCenterViewX;
                const deltaY = desiredViewY - graphCenterViewY;

                attackChainCytoscape.pan({
                    x: pan.x + deltaX,
                    y: pan.y + deltaY
                });
            }, 100);
        } catch (error) {
            console.warn('Error centering graph:', error);
        }
    }

    // Add click events
    attackChainCytoscape.on('tap', 'node', function(evt) {
        const node = evt.target;
        showNodeDetails(node.data());
    });

    // Add hover effects (using event listeners instead of CSS selectors)
    attackChainCytoscape.on('mouseover', 'node', function(evt) {
        const node = evt.target;
        node.style('border-width', 5);
        node.style('z-index', 998);
        node.style('overlay-opacity', 0.05);
        node.style('overlay-color', '#333333');
    });

    attackChainCytoscape.on('mouseout', 'node', function(evt) {
        const node = evt.target;
        const type = node.data('type');
        // Restore default border width
        const defaultBorderWidth = type === 'target' ? 5 : 4;
        node.style('border-width', defaultBorderWidth);
        node.style('z-index', 'auto');
        node.style('overlay-opacity', 0);
    });

    // Save original data for filtering
    window.attackChainOriginalData = chainData;
}

// Safely get source and target nodes of an edge
function getEdgeNodes(edge) {
    try {
        const source = edge.source();
        const target = edge.target();

        // Check that source and target nodes exist
        if (!source || !target || source.length === 0 || target.length === 0) {
            return { source: null, target: null, valid: false };
        }

        return { source: source, target: target, valid: true };
    } catch (error) {
        console.warn('Error getting edge nodes:', error, edge.id());
        return { source: null, target: null, valid: false };
    }
}

// Filter attack chain nodes (by search keyword)
function filterAttackChainNodes(searchText) {
    if (!attackChainCytoscape || !window.attackChainOriginalData) {
        return;
    }

    const searchLower = searchText.toLowerCase().trim();
    if (searchLower === '') {
        // Reset all node visibility
        attackChainCytoscape.nodes().style('display', 'element');
        attackChainCytoscape.edges().style('display', 'element');
        // Restore default border
        attackChainCytoscape.nodes().style('border-width', 2);
        return;
    }

    // Filter nodes
    attackChainCytoscape.nodes().forEach(node => {
        // Use original label for search, excluding type label
        const originalLabel = node.data('originalLabel') || node.data('label') || '';
        const label = originalLabel.toLowerCase();
        const type = (node.data('type') || '').toLowerCase();
        const matches = label.includes(searchLower) || type.includes(searchLower);

        if (matches) {
            node.style('display', 'element');
            // Highlight matching nodes
            node.style('border-width', 4);
            node.style('border-color', '#0066ff');
        } else {
            node.style('display', 'none');
        }
    });

    // Hide edges where source or target node is not visible
    attackChainCytoscape.edges().forEach(edge => {
        const { source, target, valid } = getEdgeNodes(edge);
        if (!valid) {
            edge.style('display', 'none');
            return;
        }

        const sourceVisible = source.style('display') !== 'none';
        const targetVisible = target.style('display') !== 'none';
        if (sourceVisible && targetVisible) {
            edge.style('display', 'element');
        } else {
            edge.style('display', 'none');
        }
    });

    // Re-adjust view
    attackChainCytoscape.fit(undefined, 60);
}

// Filter attack chain nodes by type
function filterAttackChainByType(type) {
    if (!attackChainCytoscape || !window.attackChainOriginalData) {
        return;
    }

    if (type === 'all') {
        attackChainCytoscape.nodes().style('display', 'element');
        attackChainCytoscape.edges().style('display', 'element');
        attackChainCytoscape.nodes().style('border-width', 2);
        attackChainCytoscape.fit(undefined, 60);
        return;
    }

    // Filter nodes
    attackChainCytoscape.nodes().forEach(node => {
        const nodeType = node.data('type') || '';
        if (nodeType === type) {
            node.style('display', 'element');
        } else {
            node.style('display', 'none');
        }
    });

    // Hide edges where source or target node is not visible
    attackChainCytoscape.edges().forEach(edge => {
        const { source, target, valid } = getEdgeNodes(edge);
        if (!valid) {
            edge.style('display', 'none');
            return;
        }

        const sourceVisible = source.style('display') !== 'none';
        const targetVisible = target.style('display') !== 'none';
        if (sourceVisible && targetVisible) {
            edge.style('display', 'element');
        } else {
            edge.style('display', 'none');
        }
    });

    // Re-adjust view
    attackChainCytoscape.fit(undefined, 60);
}

// Filter attack chain nodes by risk level
function filterAttackChainByRisk(riskLevel) {
    if (!attackChainCytoscape || !window.attackChainOriginalData) {
        return;
    }

    if (riskLevel === 'all') {
        attackChainCytoscape.nodes().style('display', 'element');
        attackChainCytoscape.edges().style('display', 'element');
        attackChainCytoscape.nodes().style('border-width', 2);
        attackChainCytoscape.fit(undefined, 60);
        return;
    }

    // Define risk ranges
    const riskRanges = {
        'high': [80, 100],
        'medium-high': [60, 79],
        'medium': [40, 59],
        'low': [0, 39]
    };

    const [minRisk, maxRisk] = riskRanges[riskLevel] || [0, 100];

    // Filter nodes
    attackChainCytoscape.nodes().forEach(node => {
        const riskScore = node.data('riskScore') || 0;
        if (riskScore >= minRisk && riskScore <= maxRisk) {
            node.style('display', 'element');
        } else {
            node.style('display', 'none');
        }
    });

    // Hide edges where source or target node is not visible
    attackChainCytoscape.edges().forEach(edge => {
        const { source, target, valid } = getEdgeNodes(edge);
        if (!valid) {
            edge.style('display', 'none');
            return;
        }

        const sourceVisible = source.style('display') !== 'none';
        const targetVisible = target.style('display') !== 'none';
        if (sourceVisible && targetVisible) {
            edge.style('display', 'element');
        } else {
            edge.style('display', 'none');
        }
    });

    // Re-adjust view
    attackChainCytoscape.fit(undefined, 60);
}

// Reset attack chain filters
function resetAttackChainFilters() {
    // Reset search field
    const searchInput = document.getElementById('attack-chain-search');
    if (searchInput) {
        searchInput.value = '';
    }

    // Reset type filter
    const typeFilter = document.getElementById('attack-chain-type-filter');
    if (typeFilter) {
        typeFilter.value = 'all';
    }

    // Reset risk filter
    const riskFilter = document.getElementById('attack-chain-risk-filter');
    if (riskFilter) {
        riskFilter.value = 'all';
    }

    // Reset all node visibility
    if (attackChainCytoscape) {
        attackChainCytoscape.nodes().forEach(node => {
            node.style('display', 'element');
            node.style('border-width', 2); // Restore default border
        });
        attackChainCytoscape.edges().style('display', 'element');
        attackChainCytoscape.fit(undefined, 60);
    }
}

// Show node details
function showNodeDetails(nodeData) {
    const detailsPanel = document.getElementById('attack-chain-details');
    const detailsContent = document.getElementById('attack-chain-details-content');

    if (!detailsPanel || !detailsContent) {
        return;
    }

    // Use requestAnimationFrame to optimize display animation
    requestAnimationFrame(() => {
        detailsPanel.style.display = 'flex';
        // Set opacity in the next frame to ensure smooth animation
        requestAnimationFrame(() => {
            detailsPanel.style.opacity = '1';
        });
    });

    const t = (key, fallback) => (typeof window.t === 'function' ? window.t(key) : fallback);

    let html = `
        <div class="node-detail-item">
            <strong>${t('attackChain.detail.nodeId', 'Node ID')}:</strong> <code>${nodeData.id}</code>
        </div>
        <div class="node-detail-item">
            <strong>${t('attackChain.detail.type', 'Type')}:</strong> ${getNodeTypeLabel(nodeData.type)}
        </div>
        <div class="node-detail-item">
            <strong>${t('attackChain.detail.label', 'Label')}:</strong> ${escapeHtml(nodeData.originalLabel || nodeData.label)}
        </div>
        <div class="node-detail-item">
            <strong>${t('attackChain.detail.riskScore', 'Risk Score')}:</strong> ${nodeData.riskScore}/100
        </div>
    `;

    // Show action node info (tool execution + AI analysis)
    if (nodeData.type === 'action' && nodeData.metadata) {
        if (nodeData.metadata.tool_name) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.toolName', 'Tool Name')}:</strong> <code>${escapeHtml(nodeData.metadata.tool_name)}</code>
                </div>
            `;
        }
        if (nodeData.metadata.tool_intent) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.toolIntent', 'Tool Intent')}:</strong> <span style="color: #0066ff; font-weight: bold;">${escapeHtml(nodeData.metadata.tool_intent)}</span>
                </div>
            `;
        }
        if (nodeData.metadata.status === 'failed_insight') {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.execStatus', 'Execution Status')}:</strong> <span style="color: #ff9800; font-weight: bold;">${t('attackChain.detail.failedWithClues', 'Failed but has clues')}</span>
                </div>
            `;
        }
        if (nodeData.metadata.ai_analysis) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.aiAnalysis', 'AI Analysis')}:</strong> <div style="margin-top: 5px; padding: 8px; background: #f5f5f5; border-radius: 4px;">${escapeHtml(nodeData.metadata.ai_analysis)}</div>
                </div>
            `;
        }
        if (nodeData.metadata.findings && Array.isArray(nodeData.metadata.findings) && nodeData.metadata.findings.length > 0) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.keyFindings', 'Key Findings')}:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        ${nodeData.metadata.findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    // Show target info (if target node)
    if (nodeData.type === 'target' && nodeData.metadata && nodeData.metadata.target) {
        html += `
            <div class="node-detail-item">
                <strong>${t('attackChain.detail.testTarget', 'Test Target')}:</strong> <code>${escapeHtml(nodeData.metadata.target)}</code>
            </div>
        `;
    }

    // Show vulnerability info (if vulnerability node)
    if (nodeData.type === 'vulnerability' && nodeData.metadata) {
        if (nodeData.metadata.vulnerability_type) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.vulnType', 'Vulnerability Type')}:</strong> ${escapeHtml(nodeData.metadata.vulnerability_type)}
                </div>
            `;
        }
        if (nodeData.metadata.description) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.description', 'Description')}:</strong> ${escapeHtml(nodeData.metadata.description)}
                </div>
            `;
        }
        if (nodeData.metadata.severity) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.severity', 'Severity')}:</strong> <span style="color: ${getSeverityColor(nodeData.metadata.severity)}; font-weight: bold;">${escapeHtml(nodeData.metadata.severity)}</span>
                </div>
            `;
        }
        if (nodeData.metadata.location) {
            html += `
                <div class="node-detail-item">
                    <strong>${t('attackChain.detail.location', 'Location')}:</strong> <code>${escapeHtml(nodeData.metadata.location)}</code>
                </div>
            `;
        }
    }

    if (nodeData.toolExecutionId) {
        html += `
            <div class="node-detail-item">
                <strong>${t('attackChain.detail.toolExecId', 'Tool Execution ID')}:</strong> <code>${nodeData.toolExecutionId}</code>
            </div>
        `;
    }

    // Reset scroll position first to avoid scroll calculation during content update
    if (detailsContent) {
        detailsContent.scrollTop = 0;
    }

    // Use requestAnimationFrame to optimize DOM update and scroll
    requestAnimationFrame(() => {
        // Update content
        detailsContent.innerHTML = html;

        // Execute scroll in next frame to avoid conflict with DOM update
        requestAnimationFrame(() => {
            // Reset scroll position of details content area
            if (detailsContent) {
                detailsContent.scrollTop = 0;
            }

            // Reset sidebar scroll position to ensure details area is visible
            const sidebar = document.querySelector('.attack-chain-sidebar-content');
            if (sidebar) {
                // Find the position of the details panel
                const detailsPanel = document.getElementById('attack-chain-details');
                if (detailsPanel && detailsPanel.offsetParent !== null) {
                    // Use getBoundingClientRect for better performance
                    const detailsRect = detailsPanel.getBoundingClientRect();
                    const sidebarRect = sidebar.getBoundingClientRect();
                    const scrollTop = sidebar.scrollTop;
                    const relativeTop = detailsRect.top - sidebarRect.top + scrollTop;
                    sidebar.scrollTop = relativeTop - 20; // leave a small margin
                }
            }
        });
    });
}

// Get severity color
function getSeverityColor(severity) {
    const colors = {
        'critical': '#ff0000',
        'high': '#ff4444',
        'medium': '#ff8800',
        'low': '#ffbb00'
    };
    return colors[severity.toLowerCase()] || '#666';
}

// Get node type label
function getNodeTypeLabel(type) {
    if (typeof window.t === 'function') {
        const labels = {
            'action': window.t('attackChain.nodeTypeAction') || 'Action',
            'vulnerability': window.t('attackChain.nodeTypeVulnerability') || 'Vulnerability',
            'target': window.t('attackChain.nodeTypeTarget') || 'Target'
        };
        return labels[type] || type;
    }
    const labels = {
        'action': 'Action',
        'vulnerability': 'Vulnerability',
        'target': 'Target'
    };
    return labels[type] || type;
}

// Update statistics (using i18n, consistent with attackChainModal.nodesEdges)
function updateAttackChainStats(chainData) {
    const statsElement = document.getElementById('attack-chain-stats');
    if (statsElement) {
        const nodeCount = chainData.nodes ? chainData.nodes.length : 0;
        const edgeCount = chainData.edges ? chainData.edges.length : 0;
        if (typeof window.t === 'function') {
            statsElement.textContent = window.t('attackChainModal.nodesEdges', {
                nodes: nodeCount,
                edges: edgeCount
            });
        } else {
            statsElement.textContent = `Nodes: ${nodeCount} | Edges: ${edgeCount}`;
        }
    }
}

// Refresh attack chain stats text on language switch (dynamic textContent is not updated by applyTranslations)
document.addEventListener('languagechange', function () {
    if (window.attackChainOriginalData && typeof updateAttackChainStats === 'function') {
        updateAttackChainStats(window.attackChainOriginalData);
    } else {
        const statsEl = document.getElementById('attack-chain-stats');
        if (statsEl && typeof window.t === 'function') {
            statsEl.textContent = window.t('attackChainModal.nodesEdges', { nodes: 0, edges: 0 });
        }
    }
});

// Close node details
function closeNodeDetails() {
    const detailsPanel = document.getElementById('attack-chain-details');
    if (detailsPanel) {
        // Add fade-out animation
        detailsPanel.style.opacity = '0';
        detailsPanel.style.maxHeight = detailsPanel.scrollHeight + 'px';

        setTimeout(() => {
            detailsPanel.style.display = 'none';
            detailsPanel.style.maxHeight = '';
            detailsPanel.style.opacity = '';
        }, 300);
    }

    // Deselect node
    if (attackChainCytoscape) {
        attackChainCytoscape.elements().unselect();
    }
}

// Close attack chain modal
function closeAttackChainModal() {
    const modal = document.getElementById('attack-chain-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Close node details
    closeNodeDetails();

    // Clean up Cytoscape instance
    if (attackChainCytoscape) {
        attackChainCytoscape.destroy();
        attackChainCytoscape = null;
    }

    currentAttackChainConversationId = null;
}

// Refresh attack chain (reload)
// Note: this function can be called during loading, to check generation status
function refreshAttackChain() {
    if (currentAttackChainConversationId) {
        // Temporarily allow refresh even while loading (for checking generation status)
        const wasLoading = isAttackChainLoading(currentAttackChainConversationId);
        setAttackChainLoading(currentAttackChainConversationId, false); // temporarily reset to allow refresh
        loadAttackChain(currentAttackChainConversationId).finally(() => {
            // If it was previously loading (409 case), restore loading state
            // Otherwise keep false (normal completion)
            if (wasLoading) {
                // Check if loading state still needs to be maintained (if still 409, loadAttackChain will handle it)
                // Here we assume that if loaded successfully, state is reset
                // If still 409, loadAttackChain will maintain loading state
            }
        });
    }
}

// Regenerate attack chain
async function regenerateAttackChain() {
    if (!currentAttackChainConversationId) {
        return;
    }

    // Prevent duplicate clicks (only check loading state of current conversation)
    if (isAttackChainLoading(currentAttackChainConversationId)) {
        console.log('Attack chain is being generated, please wait...');
        return;
    }

    // Save conversation ID at request time to prevent cross-conversation interference
    const savedConversationId = currentAttackChainConversationId;
    setAttackChainLoading(savedConversationId, true);

    const container = document.getElementById('attack-chain-container');
    if (container) {
        container.innerHTML = '<div class="loading-spinner">' + (typeof window.t === 'function' ? window.t('chat.regenerating') : 'Regenerating...') + '</div>';
    }

    // Disable regenerate button
    const regenerateBtn = document.querySelector('button[onclick="regenerateAttackChain()"]');
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.style.opacity = '0.5';
        regenerateBtn.style.cursor = 'not-allowed';
    }

    try {
        // Call regenerate API
        const response = await apiFetch(`/api/attack-chain/${savedConversationId}/regenerate`, {
            method: 'POST'
        });

        if (!response.ok) {
            // Handle 409 Conflict (generation in progress)
            if (response.status === 409) {
                const error = await response.json();
                if (container) {
                    container.innerHTML = `
                        <div class="loading-spinner" style="text-align: center; padding: 40px;">
                            <div style="margin-bottom: 16px;">⏳ ${typeof window.t === 'function' ? window.t('chat.attackChainGenerating') : 'Attack chain is being generated...'}</div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">
                                ${typeof window.t === 'function' ? window.t('chat.attackChainGeneratingWait') : 'Please wait, it will be displayed automatically when done'}
                            </div>
                            <button class="btn-secondary" onclick="refreshAttackChain()" style="margin-top: 16px;">
                                ${typeof window.t === 'function' ? window.t('chat.refreshProgress') : 'Refresh to check progress'}
                            </button>
                        </div>
                    `;
                }
                // Auto-refresh after 5 seconds
                // savedConversationId is already defined at the start of the function
                setTimeout(() => {
                    // Check if currently displayed conversation ID matches and is still loading
                    if (currentAttackChainConversationId === savedConversationId &&
                        isAttackChainLoading(savedConversationId)) {
                        refreshAttackChain();
                    }
                }, 5000);
                return;
            }

            const error = await response.json();
            throw new Error(error.error || 'Failed to regenerate attack chain');
        }

        const chainData = await response.json();

        // Check if currently displayed conversation ID matches, prevent cross-conversation interference
        if (currentAttackChainConversationId !== savedConversationId) {
            console.log('Attack chain data returned, but displayed conversation has changed — ignoring this render', {
                returned: savedConversationId,
                current: currentAttackChainConversationId
            });
            setAttackChainLoading(savedConversationId, false);
            return;
        }

        // Render attack chain
        renderAttackChain(chainData);

        // Update statistics
        updateAttackChainStats(chainData);

    } catch (error) {
        console.error('Failed to regenerate attack chain:', error);
        if (container) {
            container.innerHTML = `<div class="error-message">${typeof window.t === 'function' ? window.t('chat.regenerateFailed') : 'Regeneration failed'}: ${error.message}</div>`;
        }
    } finally {
        setAttackChainLoading(savedConversationId, false);

        // Restore regenerate button
        if (regenerateBtn) {
            regenerateBtn.disabled = false;
            regenerateBtn.style.opacity = '1';
            regenerateBtn.style.cursor = 'pointer';
        }
    }
}

// Export attack chain
function exportAttackChain(format) {
    if (!attackChainCytoscape) {
        alert(typeof window.t === 'function' ? window.t('chat.loadAttackChainFirst') : 'Please load the attack chain first');
        return;
    }

    // Ensure graph has finished rendering (use small delay)
    setTimeout(() => {
        try {
            if (format === 'png') {
                try {
                    const pngPromise = attackChainCytoscape.png({
                        output: 'blob',
                        bg: 'white',
                        full: true,
                        scale: 1
                    });
                    
                    // Handle Promise
                    if (pngPromise && typeof pngPromise.then === 'function') {
                        pngPromise.then(blob => {
                            if (!blob) {
                                throw new Error('PNG export returned empty data');
                            }
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `attack-chain-${currentAttackChainConversationId || 'export'}-${Date.now()}.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 100);
                        }).catch(err => {
                            console.error('Failed to export PNG:', err);
                            alert('Failed to export PNG: ' + (err.message || 'Unknown error'));
                        });
                    } else {
                        // If not a Promise, use directly
                        const url = URL.createObjectURL(pngPromise);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `attack-chain-${currentAttackChainConversationId || 'export'}-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    }
                } catch (err) {
                    console.error('PNG export error:', err);
                    alert('Failed to export PNG: ' + (err.message || 'Unknown error'));
                }
            } else if (format === 'svg') {
                try {
                    // Cytoscape.js 3.x does not directly support the .svg() method
                    // Use alternative: manually build SVG from Cytoscape data
                    const container = attackChainCytoscape.container();
                    if (!container) {
                        throw new Error('Failed to get container element');
                    }

                    // Get all nodes and edges
                    const nodes = attackChainCytoscape.nodes();
                    const edges = attackChainCytoscape.edges();

                    if (nodes.length === 0) {
                        throw new Error('No nodes to export');
                    }

                    // Calculate actual bounds of all nodes (including node sizes)
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    nodes.forEach(node => {
                        const pos = node.position();
                        const nodeWidth = node.width();
                        const nodeHeight = node.height();
                        const size = Math.max(nodeWidth, nodeHeight) / 2;
                        
                        minX = Math.min(minX, pos.x - size);
                        minY = Math.min(minY, pos.y - size);
                        maxX = Math.max(maxX, pos.x + size);
                        maxY = Math.max(maxY, pos.y + size);
                    });
                    
                    // Also account for edge bounds
                    edges.forEach(edge => {
                        const { source, target, valid } = getEdgeNodes(edge);
                        if (valid) {
                            const sourcePos = source.position();
                            const targetPos = target.position();
                            minX = Math.min(minX, sourcePos.x, targetPos.x);
                            minY = Math.min(minY, sourcePos.y, targetPos.y);
                            maxX = Math.max(maxX, sourcePos.x, targetPos.x);
                            maxY = Math.max(maxY, sourcePos.y, targetPos.y);
                        }
                    });
                    
                    // Add padding
                    const padding = 50;
                    minX -= padding;
                    minY -= padding;
                    maxX += padding;
                    maxY += padding;
                    
                    const width = maxX - minX;
                    const height = maxY - minY;
                    
                    // Create SVG element
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('width', width.toString());
                    svg.setAttribute('height', height.toString());
                    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
                    
                    // Add white background rectangle
                    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    bgRect.setAttribute('x', minX.toString());
                    bgRect.setAttribute('y', minY.toString());
                    bgRect.setAttribute('width', width.toString());
                    bgRect.setAttribute('height', height.toString());
                    bgRect.setAttribute('fill', 'white');
                    svg.appendChild(bgRect);
                    
                    // Create defs for arrow markers
                    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

                    // Add arrow markers for edges (different arrows for different edge types)
                    const edgeTypes = ['discovers', 'targets', 'enables', 'leads_to'];
                    edgeTypes.forEach((type, index) => {
                        let color = '#999';
                        if (type === 'discovers') color = '#3498db';
                        else if (type === 'targets') color = '#0066ff';
                        else if (type === 'enables') color = '#e74c3c';
                        else if (type === 'leads_to') color = '#666';
                        
                        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                        marker.setAttribute('id', `arrowhead-${type}`);
                        marker.setAttribute('markerWidth', '10');
                        marker.setAttribute('markerHeight', '10');
                        marker.setAttribute('refX', '9');
                        marker.setAttribute('refY', '3');
                        marker.setAttribute('orient', 'auto');
                        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        polygon.setAttribute('points', '0 0, 10 3, 0 6');
                        polygon.setAttribute('fill', color);
                        marker.appendChild(polygon);
                        defs.appendChild(marker);
                    });
                    svg.appendChild(defs);
                    
                    // Add edges (drawn first so nodes appear on top)
                    edges.forEach(edge => {
                        const { source, target, valid } = getEdgeNodes(edge);
                        if (!valid) {
                            return; // skip invalid edges
                        }
                        
                        const sourcePos = source.position();
                        const targetPos = target.position();
                        const edgeData = edge.data();
                        const edgeType = edgeData.type || 'leads_to';
                        
                        // Get edge style
                        let lineColor = '#999';
                        if (edgeType === 'discovers') lineColor = '#3498db';
                        else if (edgeType === 'targets') lineColor = '#0066ff';
                        else if (edgeType === 'enables') lineColor = '#e74c3c';
                        else if (edgeType === 'leads_to') lineColor = '#666';
                        
                        // Create path (supports curves)
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        // Simple straight-line path (can be improved to curves)
                        const midX = (sourcePos.x + targetPos.x) / 2;
                        const midY = (sourcePos.y + targetPos.y) / 2;
                        const dx = targetPos.x - sourcePos.x;
                        const dy = targetPos.y - sourcePos.y;
                        const offset = Math.min(30, Math.sqrt(dx * dx + dy * dy) * 0.3);

                        // Use quadratic Bezier curve
                        const controlX = midX + (dy > 0 ? -offset : offset);
                        const controlY = midY + (dx > 0 ? offset : -offset);
                        path.setAttribute('d', `M ${sourcePos.x} ${sourcePos.y} Q ${controlX} ${controlY} ${targetPos.x} ${targetPos.y}`);
                        path.setAttribute('stroke', lineColor);
                        path.setAttribute('stroke-width', '2');
                        path.setAttribute('fill', 'none');
                        path.setAttribute('marker-end', `url(#arrowhead-${edgeType})`);
                        svg.appendChild(path);
                    });
                    
                    // Add nodes
                    nodes.forEach(node => {
                        const pos = node.position();
                        const nodeData = node.data();
                        const riskScore = nodeData.riskScore || 0;
                        const nodeWidth = node.width();
                        const nodeHeight = node.height();
                        const size = Math.max(nodeWidth, nodeHeight) / 2;
                        
                        // Determine node color
                        let bgColor = '#88cc00';
                        let textColor = '#1a5a1a';
                        let borderColor = '#5a8a5a';
                        if (riskScore >= 80) {
                            bgColor = '#ff4444';
                            textColor = '#fff';
                            borderColor = '#fff';
                        } else if (riskScore >= 60) {
                            bgColor = '#ff8800';
                            textColor = '#fff';
                            borderColor = '#fff';
                        } else if (riskScore >= 40) {
                            bgColor = '#ffbb00';
                            textColor = '#333';
                            borderColor = '#cc9900';
                        }
                        
                        // Determine node shape
                        const nodeType = nodeData.type;
                        let shapeElement;
                        if (nodeType === 'vulnerability') {
                            // Diamond shape
                            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            const points = [
                                `${pos.x},${pos.y - size}`,
                                `${pos.x + size},${pos.y}`,
                                `${pos.x},${pos.y + size}`,
                                `${pos.x - size},${pos.y}`
                            ].join(' ');
                            shapeElement.setAttribute('points', points);
                        } else if (nodeType === 'target') {
                            // Star shape (pentagon)
                            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            const points = [];
                            for (let i = 0; i < 5; i++) {
                                const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
                                const x = pos.x + size * Math.cos(angle);
                                const y = pos.y + size * Math.sin(angle);
                                points.push(`${x},${y}`);
                            }
                            shapeElement.setAttribute('points', points.join(' '));
                        } else {
                            // Rounded rectangle
                            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            shapeElement.setAttribute('x', (pos.x - size).toString());
                            shapeElement.setAttribute('y', (pos.y - size).toString());
                            shapeElement.setAttribute('width', (size * 2).toString());
                            shapeElement.setAttribute('height', (size * 2).toString());
                            shapeElement.setAttribute('rx', '5');
                            shapeElement.setAttribute('ry', '5');
                        }
                        
                        shapeElement.setAttribute('fill', bgColor);
                        shapeElement.setAttribute('stroke', borderColor);
                        shapeElement.setAttribute('stroke-width', '2');
                        svg.appendChild(shapeElement);
                        
                        // Add text label (use text stroke to improve readability)
                        // Use original label, without type label prefix
                        const label = (nodeData.originalLabel || nodeData.label || nodeData.id || '').toString();
                        const maxLength = 15;

                        // Create text group with stroke and fill
                        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                        textGroup.setAttribute('text-anchor', 'middle');
                        textGroup.setAttribute('dominant-baseline', 'middle');

                        // Handle long text (simple wrapping)
                        let lines = [];
                        if (label.length > maxLength) {
                            const words = label.split(' ');
                            let currentLine = '';
                            words.forEach(word => {
                                if ((currentLine + word).length <= maxLength) {
                                    currentLine += (currentLine ? ' ' : '') + word;
                                } else {
                                    if (currentLine) lines.push(currentLine);
                                    currentLine = word;
                                }
                            });
                            if (currentLine) lines.push(currentLine);
                            lines = lines.slice(0, 2); // max two lines
                        } else {
                            lines = [label];
                        }
                        
                        // Determine text stroke color (consistent with original rendering)
                        let textOutlineColor = '#fff';
                        let textOutlineWidth = 2;
                        if (riskScore >= 80 || riskScore >= 60) {
                            // Red/orange background: white text, white stroke, dark outline
                            textOutlineColor = '#333';
                            textOutlineWidth = 1;
                        } else if (riskScore >= 40) {
                            // Yellow background: dark text, white stroke
                            textOutlineColor = '#fff';
                            textOutlineWidth = 2;
                        } else {
                            // Green background: dark green text, white stroke
                            textOutlineColor = '#fff';
                            textOutlineWidth = 2;
                        }

                        // Create stroke and fill for each line of text
                        lines.forEach((line, i) => {
                            const textY = pos.y + (i - (lines.length - 1) / 2) * 16;

                            // Stroke text (to improve contrast, simulating text-outline effect)
                            const strokeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            strokeText.setAttribute('x', pos.x.toString());
                            strokeText.setAttribute('y', textY.toString());
                            strokeText.setAttribute('fill', 'none');
                            strokeText.setAttribute('stroke', textOutlineColor);
                            strokeText.setAttribute('stroke-width', textOutlineWidth.toString());
                            strokeText.setAttribute('stroke-linejoin', 'round');
                            strokeText.setAttribute('stroke-linecap', 'round');
                            strokeText.setAttribute('font-size', '14px');
                            strokeText.setAttribute('font-weight', 'bold');
                            strokeText.setAttribute('font-family', 'Arial, sans-serif');
                            strokeText.setAttribute('text-anchor', 'middle');
                            strokeText.setAttribute('dominant-baseline', 'middle');
                            strokeText.textContent = line;
                            textGroup.appendChild(strokeText);
                            
                            // Fill text (actually visible text)
                            const fillText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            fillText.setAttribute('x', pos.x.toString());
                            fillText.setAttribute('y', textY.toString());
                            fillText.setAttribute('fill', textColor);
                            fillText.setAttribute('font-size', '14px');
                            fillText.setAttribute('font-weight', 'bold');
                            fillText.setAttribute('font-family', 'Arial, sans-serif');
                            fillText.setAttribute('text-anchor', 'middle');
                            fillText.setAttribute('dominant-baseline', 'middle');
                            fillText.textContent = line;
                            textGroup.appendChild(fillText);
                        });
                        
                        svg.appendChild(textGroup);
                    });
                    
                    // Convert SVG to string
                    const serializer = new XMLSerializer();
                    let svgString = serializer.serializeToString(svg);

                    // Ensure XML declaration is present
                    if (!svgString.startsWith('<?xml')) {
                        svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
                    }
                    
                    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `attack-chain-${currentAttackChainConversationId || 'export'}-${Date.now()}.svg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                } catch (err) {
                    console.error('SVG export error:', err);
                    alert('Failed to export SVG: ' + (err.message || 'Unknown error'));
                }
            } else {
                alert('Unsupported export format: ' + format);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + (error.message || 'Unknown error'));
        }
    }, 100); // Small delay to ensure graph is rendered
}

// ============================================
// Conversation grouping and batch management
// ============================================

// Group data management (using API)
let currentGroupId = null; // Currently viewed group detail page
let currentConversationGroupId = null; // Group ID of the current conversation (for highlight)
let contextMenuConversationId = null;
let contextMenuGroupId = null;
let groupsCache = [];
let conversationGroupMappingCache = {};
let pendingGroupMappings = {}; // Pending group mappings (for handling backend API delay)

// Load group list
async function loadGroups() {
    try {
        const response = await apiFetch('/api/groups');
        if (!response.ok) {
            groupsCache = [];
            return;
        }
        const data = await response.json();
        // Ensure groupsCache is a valid array
        if (Array.isArray(data)) {
            groupsCache = data;
        } else {
            // If the returned value is not an array, use empty array (no warning — graceful handling)
            groupsCache = [];
        }

        const groupsList = document.getElementById('conversation-groups-list');
        if (!groupsList) return;

        groupsList.innerHTML = '';

        if (!Array.isArray(groupsCache) || groupsCache.length === 0) {
            return;
        }

        // Sort groups: pinned groups first (backend already sorts, just display in order)
        const sortedGroups = [...groupsCache];

            sortedGroups.forEach(group => {
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            // Highlight logic:
            // 1. If in group detail view, only highlight the current group (currentGroupId)
            // 2. If not in group detail view, highlight the group the current conversation belongs to (currentConversationGroupId)
            const shouldHighlight = currentGroupId
                ? (currentGroupId === group.id)
                : (currentConversationGroupId === group.id);
            if (shouldHighlight) {
                groupItem.classList.add('active');
            }
            const isPinned = group.pinned || false;
            if (isPinned) {
                groupItem.classList.add('pinned');
            }
            groupItem.dataset.groupId = group.id;

            const content = document.createElement('div');
            content.className = 'group-item-content';

            const icon = document.createElement('span');
            icon.className = 'group-item-icon';
            icon.textContent = group.icon || '📁';

            const name = document.createElement('span');
            name.className = 'group-item-name';
            name.textContent = group.name;

            content.appendChild(icon);
            content.appendChild(name);

            // If the group is pinned, add a pin icon
            if (isPinned) {
                const pinIcon = document.createElement('span');
                pinIcon.className = 'group-item-pinned';
                pinIcon.innerHTML = '📌';
                pinIcon.title = typeof window.t === 'function' ? window.t('chat.pinned') : 'Pinned';
                name.appendChild(pinIcon);
            }
            groupItem.appendChild(content);

            const menuBtn = document.createElement('button');
            menuBtn.className = 'group-item-menu';
            menuBtn.innerHTML = '⋯';
            menuBtn.onclick = (e) => {
                e.stopPropagation();
                showGroupContextMenu(e, group.id);
            };
            groupItem.appendChild(menuBtn);

            groupItem.onclick = () => {
                enterGroupDetail(group.id);
            };

            groupsList.appendChild(groupItem);
        });
    } catch (error) {
        console.error('Failed to load group list:', error);
    }
}

// Load conversation list (modified to support groups and pinning)
async function loadConversationsWithGroups(searchQuery = '') {
    try {
        // Always reload the group list and mapping to ensure cache is up to date.
        // This correctly handles the case where a group has been deleted.
        await loadGroups();
        await loadConversationGroupMapping();

        // If there is a search query, use a larger limit to get all matching results
        const limit = (searchQuery && searchQuery.trim()) ? 1000 : 100;
        let url = `/api/conversations?limit=${limit}`;
        if (searchQuery && searchQuery.trim()) {
            url += '&search=' + encodeURIComponent(searchQuery.trim());
        }
        const response = await apiFetch(url);

        const listContainer = document.getElementById('conversations-list');
        if (!listContainer) {
            return;
        }

        // Save scroll position
        const sidebarContent = listContainer.closest('.sidebar-content');
        const savedScrollTop = sidebarContent ? sidebarContent.scrollTop : 0;

        const emptyStateHtml = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.875rem;" data-i18n="chat.noHistoryConversations"></div>';
        listContainer.innerHTML = '';

        // If response is not 200, show empty state (friendly handling, no error shown)
        if (!response.ok) {
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
            return;
        }

        const conversations = await response.json();

        if (!Array.isArray(conversations) || conversations.length === 0) {
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
            return;
        }
        
        // Separate pinned and normal conversations
        const pinnedConvs = [];
        const normalConvs = [];
        const hasSearchQuery = searchQuery && searchQuery.trim();

        conversations.forEach(conv => {
            // If there is a search query, show all matching conversations (global search, including grouped ones)
            if (hasSearchQuery) {
                // During search, show all matching conversations regardless of group membership
                if (conv.pinned) {
                    pinnedConvs.push(conv);
                } else {
                    normalConvs.push(conv);
                }
                return;
            }

            // If no search query, use the original logic
            // The "Recent Conversations" list should only show conversations not in any group
            // Conversations in a group should not appear in "Recent Conversations" regardless of current view
            if (conversationGroupMappingCache[conv.id]) {
                // Conversation is in a group, should not appear in "Recent Conversations"
                return;
            }

            if (conv.pinned) {
                pinnedConvs.push(conv);
            } else {
                normalConvs.push(conv);
            }
        });

        // Sort by time
        const sortByTime = (a, b) => {
            const timeA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
            const timeB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
            return timeB - timeA;
        };

        pinnedConvs.sort(sortByTime);
        normalConvs.sort(sortByTime);

        const fragment = document.createDocumentFragment();

        // Add pinned conversations
        if (pinnedConvs.length > 0) {
            pinnedConvs.forEach(conv => {
                fragment.appendChild(createConversationListItemWithMenu(conv, true));
            });
        }

        // Add normal conversations
        normalConvs.forEach(conv => {
            fragment.appendChild(createConversationListItemWithMenu(conv, false));
        });

        if (fragment.children.length === 0) {
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
            return;
        }

        listContainer.appendChild(fragment);
        updateActiveConversation();
        
        // Restore scroll position
        if (sidebarContent) {
            // Use requestAnimationFrame to ensure DOM has been updated
            requestAnimationFrame(() => {
                sidebarContent.scrollTop = savedScrollTop;
            });
        }
    } catch (error) {
        console.error('Failed to load conversation list:', error);
        // On error, show empty state instead of error message (better user experience)
        const listContainer = document.getElementById('conversations-list');
        if (listContainer) {
            const emptyStateHtml = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.875rem;" data-i18n="chat.noHistoryConversations"></div>';
            listContainer.innerHTML = emptyStateHtml;
            if (typeof window.applyTranslations === 'function') window.applyTranslations(listContainer);
        }
    }
}

// Create conversation list item with context menu
function createConversationListItemWithMenu(conversation, isPinned) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.conversationId = conversation.id;
    if (conversation.id === currentConversationId) {
        item.classList.add('active');
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'conversation-content';

    const titleWrapper = document.createElement('div');
    titleWrapper.style.display = 'flex';
    titleWrapper.style.alignItems = 'center';
    titleWrapper.style.gap = '4px';

    const title = document.createElement('div');
    title.className = 'conversation-title';
    const titleText = conversation.title || (typeof window.t === 'function' ? window.t('chat.unnamedConversation') : 'Unnamed Conversation');
    title.textContent = safeTruncateText(titleText, 60);
    title.title = titleText; // Set full title for hover tooltip
    titleWrapper.appendChild(title);

    if (isPinned) {
        const pinIcon = document.createElement('span');
        pinIcon.className = 'conversation-item-pinned';
        pinIcon.innerHTML = '📌';
        pinIcon.title = typeof window.t === 'function' ? window.t('chat.pinned') : 'Pinned';
        titleWrapper.appendChild(pinIcon);
    }

    contentWrapper.appendChild(titleWrapper);

    const time = document.createElement('div');
    time.className = 'conversation-time';
    const dateObj = conversation.updatedAt ? new Date(conversation.updatedAt) : new Date();
    time.textContent = formatConversationTimestamp(dateObj);
    contentWrapper.appendChild(time);

    // If the conversation belongs to a group, show the group tag
    const groupId = conversationGroupMappingCache[conversation.id];
    if (groupId) {
        const group = groupsCache.find(g => g.id === groupId);
        if (group) {
            const groupTag = document.createElement('div');
            groupTag.className = 'conversation-group-tag';
            groupTag.innerHTML = `<span class="group-tag-icon">${group.icon || '📁'}</span><span class="group-tag-name">${group.name}</span>`;
            groupTag.title = (typeof window.t === 'function' ? window.t('chat.group') : 'Group') + ': ' + group.name;
            contentWrapper.appendChild(groupTag);
        }
    }

    item.appendChild(contentWrapper);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'conversation-item-menu';
    menuBtn.innerHTML = '⋯';
    menuBtn.onclick = (e) => {
        e.stopPropagation();
        contextMenuConversationId = conversation.id;
        showConversationContextMenu(e);
    };
    item.appendChild(menuBtn);

    item.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentGroupId) {
            exitGroupDetail();
        }
        loadConversation(conversation.id);
    };

    return item;
}

// Show conversation context menu
async function showConversationContextMenu(event) {
    const menu = document.getElementById('conversation-context-menu');
    if (!menu) return;

    // Hide submenu first, ensuring it is closed each time the menu opens
    const submenu = document.getElementById('move-to-group-submenu');
    if (submenu) {
        submenu.style.display = 'none';
        submenuVisible = false;
    }
    // Clear all timers
    clearSubmenuHideTimeout();
    clearSubmenuShowTimeout();
    submenuLoading = false;

    const convId = contextMenuConversationId;

    // Update the enabled state of the attack chain menu item
    const attackChainMenuItem = document.getElementById('attack-chain-menu-item');
    if (attackChainMenuItem) {
        if (convId) {
            const isRunning = typeof isConversationTaskRunning === 'function'
                ? isConversationTaskRunning(convId)
                : false;
            if (isRunning) {
                attackChainMenuItem.style.opacity = '0.5';
                attackChainMenuItem.style.cursor = 'not-allowed';
                attackChainMenuItem.onclick = null;
                attackChainMenuItem.title = typeof window.t === 'function' ? window.t('chat.attackChainConvRunning') : 'Conversation is running, please generate the attack chain later';
            } else {
                attackChainMenuItem.style.opacity = '1';
                attackChainMenuItem.style.cursor = 'pointer';
                attackChainMenuItem.onclick = showAttackChainFromContext;
                attackChainMenuItem.title = (typeof window.t === 'function' ? window.t('chat.viewAttackChainCurrentConv') : 'View attack chain for current conversation');
            }
        } else {
            attackChainMenuItem.style.opacity = '0.5';
            attackChainMenuItem.style.cursor = 'not-allowed';
            attackChainMenuItem.onclick = null;
            attackChainMenuItem.title = (typeof window.t === 'function' ? window.t('chat.viewAttackChainSelectConv') : 'Please select a conversation to view the attack chain');
        }
    }
    
    // Fetch the conversation's pinned state and update menu text before showing the menu
    if (convId) {
        try {
            let isPinned = false;
            // Check whether the conversation is actually in the current group
            const conversationGroupId = conversationGroupMappingCache[convId];
            const isInCurrentGroup = currentGroupId && conversationGroupId === currentGroupId;

            if (isInCurrentGroup) {
                // Conversation is in the current group — fetch in-group pinned state
                const response = await apiFetch(`/api/groups/${currentGroupId}/conversations`);
                if (response.ok) {
                    const groupConvs = await response.json();
                    const conv = groupConvs.find(c => c.id === convId);
                    if (conv) {
                        isPinned = conv.groupPinned || false;
                    }
                }
            } else {
                // Not in group detail view, or conversation is not in the current group — fetch global pinned state
                const response = await apiFetch(`/api/conversations/${convId}`);
                if (response.ok) {
                    const conv = await response.json();
                    isPinned = conv.pinned || false;
                }
            }

            // Update menu text
            const pinMenuText = document.getElementById('pin-conversation-menu-text');
            if (pinMenuText && typeof window.t === 'function') {
                pinMenuText.textContent = isPinned ? window.t('contextMenu.unpinConversation') : window.t('contextMenu.pinConversation');
            } else if (pinMenuText) {
                pinMenuText.textContent = isPinned ? 'Unpin' : 'Pin Conversation';
            }
        } catch (error) {
            console.error('Failed to get conversation pinned state:', error);
            const pinMenuText = document.getElementById('pin-conversation-menu-text');
            if (pinMenuText && typeof window.t === 'function') {
                pinMenuText.textContent = window.t('contextMenu.pinConversation');
            } else if (pinMenuText) {
                pinMenuText.textContent = 'Pin Conversation';
            }
        }
    } else {
        const pinMenuText = document.getElementById('pin-conversation-menu-text');
        if (pinMenuText && typeof window.t === 'function') {
            pinMenuText.textContent = window.t('contextMenu.pinConversation');
        } else if (pinMenuText) {
            pinMenuText.textContent = 'Pin Conversation';
        }
    }

    // Show the menu after state is fetched
    menu.style.display = 'block';
    menu.style.visibility = 'visible';
    menu.style.opacity = '1';

    // Force reflow to get correct dimensions
    void menu.offsetHeight;

    // Calculate menu position, ensuring it stays within the viewport
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get submenu width (if present, reuse the submenu variable from above)
    const submenuWidth = submenu ? 180 : 0; // submenu width + gap

    let left = event.clientX;
    let top = event.clientY;

    // If the menu would overflow the right edge, shift it left
    // Account for submenu width
    if (left + menuRect.width + submenuWidth > viewportWidth) {
        left = event.clientX - menuRect.width;
        // If still overflowing, place to the left of the button
        if (left < 0) {
            left = Math.max(8, event.clientX - menuRect.width - submenuWidth);
        }
    }

    // If the menu would overflow the bottom edge, shift it upward
    if (top + menuRect.height > viewportHeight) {
        top = Math.max(8, event.clientY - menuRect.height);
    }

    // Ensure it doesn't overflow the left edge
    if (left < 0) {
        left = 8;
    }

    // Ensure it doesn't overflow the top edge
    if (top < 0) {
        top = 8;
    }

    menu.style.left = left + 'px';
    menu.style.top = top + 'px';

    // If the menu is on the right side, the submenu should open to the left
    if (submenu && left < event.clientX) {
        submenu.style.left = 'auto';
        submenu.style.right = '100%';
        submenu.style.marginLeft = '0';
        submenu.style.marginRight = '4px';
    } else if (submenu) {
        submenu.style.left = '100%';
        submenu.style.right = 'auto';
        submenu.style.marginLeft = '4px';
        submenu.style.marginRight = '0';
    }

    // Close menu on outside click
    const closeMenu = (e) => {
        // Check whether the click is inside the main menu or submenu
        const moveToGroupSubmenuEl = document.getElementById('move-to-group-submenu');
        const clickedInMenu = menu.contains(e.target);
        const clickedInSubmenu = moveToGroupSubmenuEl && moveToGroupSubmenuEl.contains(e.target);

        if (!clickedInMenu && !clickedInSubmenu) {
            // Use closeContextMenu to close both the main menu and the submenu
            closeContextMenu();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
}

// Show group context menu
async function showGroupContextMenu(event, groupId) {
    const menu = document.getElementById('group-context-menu');
    if (!menu) return;

    contextMenuGroupId = groupId;

    // Fetch the group's pinned state and update menu text before showing the menu
    try {
        // Look up in cache first
        let group = groupsCache.find(g => g.id === groupId);
        let isPinned = false;

        if (group) {
            isPinned = group.pinned || false;
        } else {
            // If not in cache, fetch from API
            const response = await apiFetch(`/api/groups/${groupId}`);
            if (response.ok) {
                group = await response.json();
                isPinned = group.pinned || false;
            }
        }

        // Update menu text
        const pinMenuText = document.getElementById('pin-group-menu-text');
        if (pinMenuText && typeof window.t === 'function') {
            pinMenuText.textContent = isPinned ? window.t('contextMenu.unpinGroup') : window.t('contextMenu.pinGroup');
        } else if (pinMenuText) {
            pinMenuText.textContent = isPinned ? 'Unpin' : 'Pin Group';
        }
    } catch (error) {
        console.error('Failed to get group pinned state:', error);
        const pinMenuText = document.getElementById('pin-group-menu-text');
        if (pinMenuText && typeof window.t === 'function') {
            pinMenuText.textContent = window.t('contextMenu.pinGroup');
        } else if (pinMenuText) {
            pinMenuText.textContent = 'Pin Group';
        }
    }

    // Show the menu after state is fetched
    menu.style.display = 'block';
    menu.style.visibility = 'visible';
    menu.style.opacity = '1';

    // Force reflow to get correct dimensions
    void menu.offsetHeight;

    // Calculate menu position, ensuring it stays within the viewport
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.clientX;
    let top = event.clientY;

    // If the menu would overflow the right edge, shift it left
    if (left + menuRect.width > viewportWidth) {
        left = event.clientX - menuRect.width;
    }

    // If the menu would overflow the bottom edge, shift it upward
    if (top + menuRect.height > viewportHeight) {
        top = event.clientY - menuRect.height;
    }
    
    // Ensure it doesn't overflow the left edge
    if (left < 0) {
        left = 8;
    }

    // Ensure it doesn't overflow the top edge
    if (top < 0) {
        top = 8;
    }

    menu.style.left = left + 'px';
    menu.style.top = top + 'px';

    // Close menu on outside click
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
}

// Rename conversation
async function renameConversation() {
    const convId = contextMenuConversationId;
    if (!convId) return;

    const newTitle = prompt(typeof window.t === 'function' ? window.t('chat.enterNewTitle') : 'Enter new title:', '');
    if (newTitle === null || !newTitle.trim()) {
        closeContextMenu();
        return;
    }

    try {
        const response = await apiFetch(`/api/conversations/${convId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: newTitle.trim() }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Update failed');
        }

        // Update the frontend display
        const item = document.querySelector(`[data-conversation-id="${convId}"]`);
        if (item) {
            const titleEl = item.querySelector('.conversation-title');
            if (titleEl) {
                titleEl.textContent = newTitle.trim();
            }
        }

        // Also update if in group detail view
        const groupItem = document.querySelector(`.group-conversation-item[data-conversation-id="${convId}"]`);
        if (groupItem) {
            const groupTitleEl = groupItem.querySelector('.group-conversation-title');
            if (groupTitleEl) {
                groupTitleEl.textContent = newTitle.trim();
            }
        }

        // Reload the conversation list
        loadConversationsWithGroups();
    } catch (error) {
        console.error('Failed to rename conversation:', error);
        const failedLabel = typeof window.t === 'function' ? window.t('chat.renameFailed') : 'Rename failed';
        const unknownErr = typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error';
        alert(failedLabel + ': ' + (error.message || unknownErr));
    }

    closeContextMenu();
}

// Pin/unpin conversation
async function pinConversation() {
    const convId = contextMenuConversationId;
    if (!convId) return;

    try {
        // Check whether the conversation is actually in the current group.
        // If the conversation has been moved out of the group, conversationGroupMappingCache
        // will not have a mapping for it, or the mapped group ID won't match the current group.
        const conversationGroupId = conversationGroupMappingCache[convId];
        const isInCurrentGroup = currentGroupId && conversationGroupId === currentGroupId;

        // If in group detail view and the conversation is actually in this group, use in-group pinning
        if (isInCurrentGroup) {
            // Get the conversation's pinned state within the group
            const response = await apiFetch(`/api/groups/${currentGroupId}/conversations`);
            const groupConvs = await response.json();
            const conv = groupConvs.find(c => c.id === convId);

            // If conversation not found, default to false
            const currentPinned = conv && conv.groupPinned !== undefined ? conv.groupPinned : false;
            const newPinned = !currentPinned;

            // Update in-group pinned state
            await apiFetch(`/api/groups/${currentGroupId}/conversations/${convId}/pinned`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pinned: newPinned }),
            });

            // Reload group conversations
            loadGroupConversations(currentGroupId);
        } else {
            // Not in group detail view, or conversation is not in the current group — use global pinning
            const response = await apiFetch(`/api/conversations/${convId}`);
            const conv = await response.json();
            const newPinned = !conv.pinned;

            // Update global pinned state
            await apiFetch(`/api/conversations/${convId}/pinned`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pinned: newPinned }),
            });

            loadConversationsWithGroups();
        }
    } catch (error) {
        console.error('Failed to pin/unpin conversation:', error);
        alert((typeof window.t === 'function' ? window.t('chat.pinFailed') : 'Pin failed') + ': ' + (error.message || (typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error')));
    }

    closeContextMenu();
}

// Show the "Move to Group" submenu
async function showMoveToGroupSubmenu() {
    const submenu = document.getElementById('move-to-group-submenu');
    if (!submenu) return;

    // If submenu is already visible, no need to re-render
    if (submenuVisible && submenu.style.display === 'block') {
        return;
    }

    // Avoid duplicate calls while loading
    if (submenuLoading) {
        return;
    }

    // Clear the hide timer
    clearSubmenuHideTimeout();

    // Mark as loading
    submenuLoading = true;
    submenu.innerHTML = '';

    // Ensure the group list is loaded — force refresh to guarantee fresh data
    try {
        // If cache is empty, force a load
        if (!Array.isArray(groupsCache) || groupsCache.length === 0) {
            await loadGroups();
        } else {
            // Even if cache is not empty, attempt a silent refresh
            try {
                const response = await apiFetch('/api/groups');
                if (response.ok) {
                    const freshGroups = await response.json();
                    if (Array.isArray(freshGroups)) {
                        groupsCache = freshGroups;
                    }
                }
            } catch (err) {
                // If refresh fails, use cached data
                console.warn('Failed to refresh group list, using cached data:', err);
            }
        }

        // Re-validate the cache
        if (!Array.isArray(groupsCache)) {
            console.warn('groupsCache is not a valid array, resetting to empty array');
            groupsCache = [];
            // If still invalid, attempt reload
            if (groupsCache.length === 0) {
                await loadGroups();
            }
        }
    } catch (error) {
        console.error('Failed to load group list:', error);
        // Continue showing the menu even if loading failed, using the existing cache
    }

    // If currently in group detail view, show "Remove from group" option
    if (currentGroupId && contextMenuConversationId) {
        // Check whether the conversation is in the current group
        const convInGroup = conversationGroupMappingCache[contextMenuConversationId] === currentGroupId;
        if (convInGroup) {
            const removeItem = document.createElement('div');
            removeItem.className = 'context-submenu-item';
            removeItem.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 12l6 6M15 12l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${typeof window.t === 'function' ? window.t('chat.removeFromGroup') : 'Remove from Group'}</span>
            `;
            removeItem.onclick = () => {
                removeConversationFromGroup(contextMenuConversationId, currentGroupId);
            };
            submenu.appendChild(removeItem);
            
            // Add a divider
            const divider = document.createElement('div');
            divider.className = 'context-menu-divider';
            submenu.appendChild(divider);
        }
    }

    // Validate groupsCache is a valid array
    if (!Array.isArray(groupsCache)) {
        console.warn('groupsCache is not a valid array, resetting to empty array');
        groupsCache = [];
    }

    // If there are groups, show all groups (excluding the one the conversation is already in)
    if (groupsCache.length > 0) {
        // Find the group ID the conversation currently belongs to
        const conversationCurrentGroupId = contextMenuConversationId
            ? conversationGroupMappingCache[contextMenuConversationId]
            : null;

        groupsCache.forEach(group => {
            // Validate the group object
            if (!group || !group.id || !group.name) {
                console.warn('Invalid group object:', group);
                return;
            }

            // If the conversation is already in this group, skip it
            if (conversationCurrentGroupId && group.id === conversationCurrentGroupId) {
                return;
            }
            
            const item = document.createElement('div');
            item.className = 'context-submenu-item';
            item.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${group.name}</span>
            `;
            item.onclick = () => {
                moveConversationToGroup(contextMenuConversationId, group.id);
            };
            submenu.appendChild(item);
        });
    } else {
        // If there are still no groups, log for debugging
        console.warn('showMoveToGroupSubmenu: groupsCache is empty, cannot display group list');
    }

    // Always show the "Create Group" option
    const addGroupLabel = typeof window.t === 'function' ? window.t('chat.addNewGroup') : '+ New Group';
    const addItem = document.createElement('div');
    addItem.className = 'context-submenu-item add-group-item';
    addItem.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>${addGroupLabel}</span>
    `;
    addItem.onclick = () => {
        showCreateGroupModal(true);
    };
    submenu.appendChild(addItem);

    submenu.style.display = 'block';
    submenuVisible = true;
    submenuLoading = false;
    
    // Calculate submenu position to prevent overflow
    setTimeout(() => {
        const submenuRect = submenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // If the submenu overflows the right edge, shift it to the left
        if (submenuRect.right > viewportWidth) {
            submenu.style.left = 'auto';
            submenu.style.right = '100%';
            submenu.style.marginLeft = '0';
            submenu.style.marginRight = '4px';
        }

        // If the submenu overflows the bottom edge, adjust position
        if (submenuRect.bottom > viewportHeight) {
            const overflow = submenuRect.bottom - viewportHeight;
            const currentTop = parseInt(submenu.style.top) || 0;
            submenu.style.top = (currentTop - overflow - 8) + 'px';
        }
    }, 0);
}

// Timer for hiding the "Move to Group" submenu
let submenuHideTimeout = null;
// Debounce timer for showing the submenu
let submenuShowTimeout = null;
// Whether the submenu is currently loading
let submenuLoading = false;
// Whether the submenu is currently visible
let submenuVisible = false;

// Hide the "Move to Group" submenu
function hideMoveToGroupSubmenu() {
    const submenu = document.getElementById('move-to-group-submenu');
    if (submenu) {
        submenu.style.display = 'none';
        submenuVisible = false;
    }
}

// Clear the submenu hide timer
function clearSubmenuHideTimeout() {
    if (submenuHideTimeout) {
        clearTimeout(submenuHideTimeout);
        submenuHideTimeout = null;
    }
}

// Clear the submenu show timer
function clearSubmenuShowTimeout() {
    if (submenuShowTimeout) {
        clearTimeout(submenuShowTimeout);
        submenuShowTimeout = null;
    }
}

// Handle mouse enter on "Move to Group" menu item (with debounce)
function handleMoveToGroupSubmenuEnter() {
    // Clear the hide timer
    clearSubmenuHideTimeout();

    // If the submenu is already visible, no need to trigger again
    const submenu = document.getElementById('move-to-group-submenu');
    if (submenu && submenuVisible && submenu.style.display === 'block') {
        return;
    }

    // Clear previous show timer
    clearSubmenuShowTimeout();

    // Debounce the show to avoid frequent triggers
    submenuShowTimeout = setTimeout(() => {
        showMoveToGroupSubmenu();
        submenuShowTimeout = null;
    }, 100);
}

// Handle mouse leave on "Move to Group" menu item
function handleMoveToGroupSubmenuLeave(event) {
    const submenu = document.getElementById('move-to-group-submenu');
    if (!submenu) return;

    // Clear the show timer
    clearSubmenuShowTimeout();

    // Check whether the mouse moved into the submenu
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && submenu.contains(relatedTarget)) {
        // Mouse moved into the submenu, do not hide
        return;
    }

    // Clear any previous hide timer
    clearSubmenuHideTimeout();

    // Delay hiding to give the user time to move into the submenu
    submenuHideTimeout = setTimeout(() => {
        hideMoveToGroupSubmenu();
        submenuHideTimeout = null;
    }, 200);
}

// Move conversation to a group
async function moveConversationToGroup(convId, groupId) {
    try {
        await apiFetch('/api/groups/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationId: convId,
                groupId: groupId,
            }),
        });

        // Update cache
        const oldGroupId = conversationGroupMappingCache[convId];
        conversationGroupMappingCache[convId] = groupId;

        // Add the newly moved conversation to pendingGroupMappings to prevent
        // the mapping from being lost due to backend API delay
        pendingGroupMappings[convId] = groupId;

        // If the moved conversation is the current one, update currentConversationGroupId
        if (currentConversationId === convId) {
            currentConversationGroupId = groupId;
        }

        // If currently in group detail view, reload group conversations
        if (currentGroupId) {
            // Reload if moved out of or into the current group
            if (currentGroupId === oldGroupId || currentGroupId === groupId) {
                await loadGroupConversations(currentGroupId);
            }
        }

        // Regardless of the current view, refresh the recent conversations list.
        // The recent list filters based on the group mapping cache, so it needs to update immediately.
        // loadConversationsWithGroups calls loadConversationGroupMapping internally,
        // which preserves the pendingGroupMappings entries.
        await loadConversationsWithGroups();

        // Note: pendingGroupMappings entries are automatically cleaned up the next time
        // loadConversationGroupMapping successfully loads from the backend.

        // Refresh the group list to update highlight state
        await loadGroups();
    } catch (error) {
        console.error('Failed to move conversation to group:', error);
        alert((typeof window.t === 'function' ? window.t('chat.moveFailed') : 'Move failed') + ': ' + (error.message || (typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error')));
    }

    closeContextMenu();
}

// Remove conversation from a group
async function removeConversationFromGroup(convId, groupId) {
    try {
        await apiFetch(`/api/groups/${groupId}/conversations/${convId}`, {
            method: 'DELETE',
        });

        // Update cache — delete immediately so subsequent loads can identify correctly
        delete conversationGroupMappingCache[convId];
        // Also remove from pending mappings
        delete pendingGroupMappings[convId];

        // If the removed conversation is the current one, clear currentConversationGroupId
        if (currentConversationId === convId) {
            currentConversationGroupId = null;
        }

        // If currently in group detail view, reload group conversations
        if (currentGroupId === groupId) {
            await loadGroupConversations(groupId);
        }

        // Reload group mapping to ensure the cache is up to date
        await loadConversationGroupMapping();

        // Refresh the group list to update highlight state
        await loadGroups();

        // Refresh the recent conversations list so the removed conversation appears immediately.
        // Temporarily set currentGroupId to null to show all non-grouped conversations.
        const savedGroupId = currentGroupId;
        currentGroupId = null;
        await loadConversationsWithGroups();
        currentGroupId = savedGroupId;
    } catch (error) {
        console.error('Failed to remove conversation from group:', error);
        alert((typeof window.t === 'function' ? window.t('chat.removeFailed') : 'Remove failed') + ': ' + (error.message || (typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error')));
    }

    closeContextMenu();
}

// Load conversation-to-group mapping
async function loadConversationGroupMapping() {
    try {
        // Fetch all groups, then fetch conversations for each group
        let groups;
        if (Array.isArray(groupsCache) && groupsCache.length > 0) {
            groups = groupsCache;
        } else {
            const response = await apiFetch('/api/groups');
            if (!response.ok) {
                // If the API request fails, use an empty array (normal error handling, no warning needed)
                groups = [];
            } else {
                groups = await response.json();
                // Ensure groups is a valid array; only warn on genuinely unexpected values
                if (!Array.isArray(groups)) {
                    // Only warn if the returned value is not null/undefined (may be a backend format error)
                    if (groups !== null && groups !== undefined) {
                        console.warn('loadConversationGroupMapping: groups is not a valid array, using empty array', groups);
                    }
                    groups = [];
                }
            }
        }

        // Preserve pending mappings
        const preservedMappings = { ...pendingGroupMappings };

        conversationGroupMappingCache = {};

        for (const group of groups) {
            const response = await apiFetch(`/api/groups/${group.id}/conversations`);
            const conversations = await response.json();
            // Ensure conversations is a valid array
            if (Array.isArray(conversations)) {
                conversations.forEach(conv => {
                    conversationGroupMappingCache[conv.id] = group.id;
                    // If this conversation is in the pending mappings and the group matches, remove it
                    // (it has been successfully loaded from the backend)
                    if (preservedMappings[conv.id] === group.id) {
                        delete pendingGroupMappings[conv.id];
                    }
                });
            }
        }

        // Restore pending mappings (these are mappings not yet synced from the backend)
        Object.assign(conversationGroupMappingCache, preservedMappings);
    } catch (error) {
        console.error('Failed to load conversation group mapping:', error);
    }
}

// View attack chain from context menu
function showAttackChainFromContext() {
    const convId = contextMenuConversationId;
    if (!convId) return;
    
    closeContextMenu();
    showAttackChain(convId);
}

// Delete conversation from context menu
function deleteConversationFromContext() {
    const convId = contextMenuConversationId;
    if (!convId) return;

    const confirmMsg = typeof window.t === 'function' ? window.t('chat.deleteConversationConfirm') : 'Are you sure you want to delete this conversation?';
    if (confirm(confirmMsg)) {
        deleteConversation(convId, true); // Skip internal confirmation since we already confirmed here
    }
    closeContextMenu();
}

// Close the context menu
function closeContextMenu() {
    const menu = document.getElementById('conversation-context-menu');
    if (menu) {
        menu.style.display = 'none';
    }
    const submenu = document.getElementById('move-to-group-submenu');
    if (submenu) {
        submenu.style.display = 'none';
        submenuVisible = false;
    }
    // Clear all timers
    clearSubmenuHideTimeout();
    clearSubmenuShowTimeout();
    submenuLoading = false;
    contextMenuConversationId = null;
}

// Show batch management modal
let allConversationsForBatch = [];

// Update batch management modal title (with count), supports i18n; count is the current number
function updateBatchManageTitle(count) {
    const titleEl = document.getElementById('batch-manage-title');
    if (!titleEl || typeof window.t !== 'function') return;
    const template = window.t('batchManageModal.title', { count: '__C__' });
    const parts = template.split('__C__');
    titleEl.innerHTML = (parts[0] || '') + '<span id="batch-manage-count">' + (count || 0) + '</span>' + (parts[1] || '');
}

async function showBatchManageModal() {
    try {
        const response = await apiFetch('/api/conversations?limit=1000');
        
        // If response is not 200, use empty array (user-friendly handling, no error message)
        if (!response.ok) {
            allConversationsForBatch = [];
        } else {
            const data = await response.json();
            allConversationsForBatch = Array.isArray(data) ? data : [];
        }

        const modal = document.getElementById('batch-manage-modal');
        updateBatchManageTitle(allConversationsForBatch.length);

        renderBatchConversations();
        if (modal) {
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Failed to load conversation list:', error);
        // On error, use empty array and don't show an error message (better user experience)
        allConversationsForBatch = [];
        const modal = document.getElementById('batch-manage-modal');
        updateBatchManageTitle(0);
        if (modal) {
            renderBatchConversations();
            modal.style.display = 'flex';
        }
    }
}

// Safely truncate text without cutting in the middle of a multibyte character
function safeTruncateText(text, maxLength = 50) {
    if (!text || typeof text !== 'string') {
        return text || '';
    }

    // Use Array.from to convert the string to an array of characters (handles Unicode surrogate pairs correctly)
    const chars = Array.from(text);

    // If the text length is within the limit, return as-is
    if (chars.length <= maxLength) {
        return text;
    }

    // Truncate to the maximum length (based on character count, not code units)
    let truncatedChars = chars.slice(0, maxLength);

    // Try to truncate at a punctuation mark or space for a more natural break.
    // Search backward from the truncation point (up to 20% of the length).
    const searchRange = Math.floor(maxLength * 0.2);
    const breakChars = ['，', '。', '、', ' ', ',', '.', ';', ':', '!', '?', '！', '？', '/', '\\', '-', '_'];
    let bestBreakPos = truncatedChars.length;

    for (let i = truncatedChars.length - 1; i >= truncatedChars.length - searchRange && i >= 0; i--) {
        if (breakChars.includes(truncatedChars[i])) {
            bestBreakPos = i + 1; // Break after the punctuation mark
            break;
        }
    }

    // If a suitable break point was found, use it; otherwise use the original truncation position
    if (bestBreakPos < truncatedChars.length) {
        truncatedChars = truncatedChars.slice(0, bestBreakPos);
    }

    // Convert character array back to string and append ellipsis
    return truncatedChars.join('') + '...';
}

// Render the batch management conversation list
function renderBatchConversations(filtered = null) {
    const list = document.getElementById('batch-conversations-list');
    if (!list) return;

    const conversations = filtered || allConversationsForBatch;
    list.innerHTML = '';

    conversations.forEach(conv => {
        const row = document.createElement('div');
        row.className = 'batch-conversation-row';
        row.dataset.conversationId = conv.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'batch-conversation-checkbox';
        checkbox.dataset.conversationId = conv.id;

        const name = document.createElement('div');
        name.className = 'batch-table-col-name';
        const originalTitle = conv.title || (typeof window.t === 'function' ? window.t('batchManageModal.unnamedConversation') : 'Unnamed Conversation');
        // Use safe truncation function, limit to 45 characters (leaving room for ellipsis)
        const truncatedTitle = safeTruncateText(originalTitle, 45);
        name.textContent = truncatedTitle;
        // Set title attribute to show full text on hover
        name.title = originalTitle;

        const time = document.createElement('div');
        time.className = 'batch-table-col-time';
        const dateObj = conv.updatedAt ? new Date(conv.updatedAt) : new Date();
        const locale = (typeof i18next !== 'undefined' && i18next.language) ? i18next.language : 'zh-CN';
        time.textContent = dateObj.toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const action = document.createElement('div');
        action.className = 'batch-table-col-action';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'batch-delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = () => deleteConversation(conv.id);
        action.appendChild(deleteBtn);

        row.appendChild(checkbox);
        row.appendChild(name);
        row.appendChild(time);
        row.appendChild(action);

        list.appendChild(row);
    });
}

// Filter batch management conversations
function filterBatchConversations(query) {
    if (!query || !query.trim()) {
        renderBatchConversations();
        return;
    }

    const filtered = allConversationsForBatch.filter(conv => {
        const title = (conv.title || '').toLowerCase();
        return title.includes(query.toLowerCase());
    });

    renderBatchConversations(filtered);
}

// Select all / deselect all
function toggleSelectAllBatch() {
    const selectAll = document.getElementById('batch-select-all');
    const checkboxes = document.querySelectorAll('.batch-conversation-checkbox');
    
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
    });
}

// Delete selected conversations
async function deleteSelectedConversations() {
    const checkboxes = document.querySelectorAll('.batch-conversation-checkbox:checked');
    if (checkboxes.length === 0) {
        alert(typeof window.t === 'function' ? window.t('batchManageModal.confirmDeleteNone') : 'Please select conversations to delete first');
        return;
    }

    const confirmMsg = typeof window.t === 'function' ? window.t('batchManageModal.confirmDeleteN', { count: checkboxes.length }) : 'Are you sure you want to delete the selected ' + checkboxes.length + ' conversation(s)?';
    if (!confirm(confirmMsg)) {
        return;
    }

    const ids = Array.from(checkboxes).map(cb => cb.dataset.conversationId);

    try {
        for (const id of ids) {
            await deleteConversation(id, true); // Skip internal confirmation since batch delete was already confirmed
        }
        closeBatchManageModal();
        loadConversationsWithGroups();
    } catch (error) {
        console.error('Delete failed:', error);
        const failedMsg = typeof window.t === 'function' ? window.t('batchManageModal.deleteFailed') : 'Delete failed';
        const unknownErr = typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error';
        alert(failedMsg + ': ' + (error.message || unknownErr));
    }
}

// Close the batch management modal
function closeBatchManageModal() {
    const modal = document.getElementById('batch-manage-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const selectAll = document.getElementById('batch-select-all');
    if (selectAll) {
        selectAll.checked = false;
    }
    allConversationsForBatch = [];
}

// On language change, refresh batch modal title (if open) and conversation list timestamps
document.addEventListener('languagechange', function () {
    refreshSystemReadyMessageBubbles();
    const modal = document.getElementById('batch-manage-modal');
    if (modal && modal.style.display === 'flex') {
        updateBatchManageTitle(allConversationsForBatch.length);
    }
    // Timestamps in the sidebar conversation list vary by language (24h/12h etc.),
    // so reload the list to unify the format
    if (typeof loadConversationsWithGroups === 'function') {
        loadConversationsWithGroups();
    } else if (typeof loadConversations === 'function') {
        loadConversations();
    }
});

// Show create group modal
function showCreateGroupModal(andMoveConversation = false) {
    const modal = document.getElementById('create-group-modal');
    const input = document.getElementById('create-group-name-input');
    const iconBtn = document.getElementById('create-group-icon-btn');
    const iconPicker = document.getElementById('group-icon-picker');
    const customInput = document.getElementById('custom-icon-input');
    
    if (input) {
        input.value = '';
    }
    // Reset icon to default
    if (iconBtn) {
        iconBtn.textContent = '📁';
    }
    // Clear custom icon input
    if (customInput) {
        customInput.value = '';
    }
    // Close icon picker
    if (iconPicker) {
        iconPicker.style.display = 'none';
    }
    if (modal) {
        modal.style.display = 'flex';
        modal.dataset.moveConversation = andMoveConversation ? 'true' : 'false';
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
}

// Close create group modal
function closeCreateGroupModal() {
    const modal = document.getElementById('create-group-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const input = document.getElementById('create-group-name-input');
    if (input) {
        input.value = '';
    }
    // Reset icon to default
    const iconBtn = document.getElementById('create-group-icon-btn');
    if (iconBtn) {
        iconBtn.textContent = '📁';
    }
    // Clear custom icon input
    const customInput = document.getElementById('custom-icon-input');
    if (customInput) {
        customInput.value = '';
    }
    // Close icon picker
    const iconPicker = document.getElementById('group-icon-picker');
    if (iconPicker) {
        iconPicker.style.display = 'none';
    }
}

// Select suggestion tag
function selectSuggestion(name) {
    const input = document.getElementById('create-group-name-input');
    if (input) {
        input.value = name;
        input.focus();
    }
}

// Select suggestion tag by i18n key (fills in the current language text for internationalization)
function selectSuggestionByKey(i18nKey) {
    const input = document.getElementById('create-group-name-input');
    if (input && typeof window.t === 'function') {
        input.value = window.t(i18nKey);
        input.focus();
    }
}

// Toggle icon picker visibility
function toggleGroupIconPicker() {
    const picker = document.getElementById('group-icon-picker');
    if (picker) {
        const isVisible = picker.style.display !== 'none';
        picker.style.display = isVisible ? 'none' : 'block';
    }
}

// Select group icon
function selectGroupIcon(icon) {
    const iconBtn = document.getElementById('create-group-icon-btn');
    if (iconBtn) {
        iconBtn.textContent = icon;
    }
    // Clear custom icon input
    const customInput = document.getElementById('custom-icon-input');
    if (customInput) {
        customInput.value = '';
    }
    // Close picker
    const picker = document.getElementById('group-icon-picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

// Apply custom icon
function applyCustomIcon() {
    const customInput = document.getElementById('custom-icon-input');
    if (!customInput) return;

    const customIcon = customInput.value.trim();
    if (!customIcon) {
        return;
    }

    const iconBtn = document.getElementById('create-group-icon-btn');
    if (iconBtn) {
        iconBtn.textContent = customIcon;
    }

    // Clear input and close picker
    customInput.value = '';
    const picker = document.getElementById('group-icon-picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

// Handle Enter key in custom icon input
document.addEventListener('DOMContentLoaded', function() {
    const customInput = document.getElementById('custom-icon-input');
    if (customInput) {
        customInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCustomIcon();
            }
        });
    }
});

// Close icon picker on outside click
document.addEventListener('click', function(event) {
    const picker = document.getElementById('group-icon-picker');
    const iconBtn = document.getElementById('create-group-icon-btn');
    if (picker && iconBtn) {
        // If the click is outside the icon button and picker, close the picker
        if (!picker.contains(event.target) && !iconBtn.contains(event.target)) {
            picker.style.display = 'none';
        }
    }
});

// Create group
async function createGroup(event) {
    // Prevent event bubbling
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const input = document.getElementById('create-group-name-input');
    if (!input) {
        console.error('Input element not found');
        return;
    }

    const name = input.value.trim();
    if (!name) {
        alert(typeof window.t === 'function' ? window.t('createGroupModal.groupNamePlaceholder') : 'Please enter a group name');
        return;
    }

    // Frontend validation: check if the name already exists
    try {
        let groups;
        if (Array.isArray(groupsCache) && groupsCache.length > 0) {
            groups = groupsCache;
        } else {
            const response = await apiFetch('/api/groups');
            groups = await response.json();
        }

        // Ensure groups is a valid array
        if (!Array.isArray(groups)) {
            groups = [];
        }

        const nameExists = groups.some(g => g.name === name);
        if (nameExists) {
            alert(typeof window.t === 'function' ? window.t('createGroupModal.nameExists') : 'Group name already exists, please use a different name');
            return;
        }
    } catch (error) {
        console.error('Failed to check group name:', error);
    }

    // Get the selected icon
    const iconBtn = document.getElementById('create-group-icon-btn');
    const selectedIcon = iconBtn ? iconBtn.textContent.trim() : '📁';

    try {
        const response = await apiFetch('/api/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                icon: selectedIcon,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            const nameExistsMsg = typeof window.t === 'function' ? window.t('createGroupModal.nameExists') : 'Group name already exists, please use a different name';
            if (error.error && (error.error.includes('already exists'))) {
                alert(nameExistsMsg);
                return;
            }
            const createFailedMsg = typeof window.t === 'function' ? window.t('createGroupModal.createFailed') : 'Create failed';
            throw new Error(error.error || createFailedMsg);
        }

        const newGroup = await response.json();

        // Check if the "Move to Group" submenu is open
        const submenu = document.getElementById('move-to-group-submenu');
        const isSubmenuOpen = submenu && submenu.style.display !== 'none';

        await loadGroups();

        const modal = document.getElementById('create-group-modal');
        const shouldMove = modal && modal.dataset.moveConversation === 'true';

        closeCreateGroupModal();

        if (shouldMove && contextMenuConversationId) {
            moveConversationToGroup(contextMenuConversationId, newGroup.id);
        }

        // If the submenu is open, refresh it so the newly created group appears immediately
        if (isSubmenuOpen) {
            await showMoveToGroupSubmenu();
        }
    } catch (error) {
        console.error('Failed to create group:', error);
        const createFailedMsg = typeof window.t === 'function' ? window.t('createGroupModal.createFailed') : 'Create failed';
        const unknownErr = typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error';
        alert(createFailedMsg + ': ' + (error.message || unknownErr));
    }
}

// Enter group detail view
async function enterGroupDetail(groupId) {
    currentGroupId = groupId;
    // When entering the group detail view, clear the current conversation's group ID
    // to avoid highlight conflicts, since the user is viewing the group, not a conversation in it.
    currentConversationGroupId = null;

    try {
        const response = await apiFetch(`/api/groups/${groupId}`);
        const group = await response.json();

        if (!group) {
            currentGroupId = null;
            return;
        }

        // Show group detail page, hide chat area, keep sidebar visible
        const sidebar = document.querySelector('.conversation-sidebar');
        const groupDetailPage = document.getElementById('group-detail-page');
        const chatContainer = document.querySelector('.chat-container');
        const titleEl = document.getElementById('group-detail-title');

        // Keep sidebar visible
        if (sidebar) sidebar.style.display = 'flex';
        // Hide chat area, show group detail page
        if (chatContainer) chatContainer.style.display = 'none';
        if (groupDetailPage) groupDetailPage.style.display = 'flex';
        if (titleEl) titleEl.textContent = group.name;

        // Refresh group list to ensure the current group is highlighted
        await loadGroups();

        // Load group conversations (use search query if provided)
        loadGroupConversations(groupId, currentGroupSearchQuery);
    } catch (error) {
        console.error('Failed to load group:', error);
        currentGroupId = null;
    }
}

// Exit group detail view
function exitGroupDetail() {
    currentGroupId = null;
    currentGroupSearchQuery = ''; // Clear search state

    // Hide search box and clear search content
    const searchContainer = document.getElementById('group-search-container');
    const searchInput = document.getElementById('group-search-input');
    if (searchContainer) searchContainer.style.display = 'none';
    if (searchInput) searchInput.value = '';

    const sidebar = document.querySelector('.conversation-sidebar');
    const groupDetailPage = document.getElementById('group-detail-page');
    const chatContainer = document.querySelector('.chat-container');

    // Keep sidebar visible
    if (sidebar) sidebar.style.display = 'flex';
    // Hide group detail page, show chat area
    if (groupDetailPage) groupDetailPage.style.display = 'none';
    if (chatContainer) chatContainer.style.display = 'flex';

    loadConversationsWithGroups();
}

// Load conversations in a group
async function loadGroupConversations(groupId, searchQuery = '') {
    try {
        if (!groupId) {
            console.error('loadGroupConversations: groupId is null or undefined');
            return;
        }

        // Ensure group mapping is loaded
        if (Object.keys(conversationGroupMappingCache).length === 0) {
            await loadConversationGroupMapping();
        }

        // Clear the list first to avoid showing stale data
        const list = document.getElementById('group-conversations-list');
        if (!list) {
            console.error('group-conversations-list element not found');
            return;
        }

        // Show loading state
        if (searchQuery) {
            list.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">' + (typeof window.t === 'function' ? window.t('chat.searching') : 'Searching...') + '</div>';
        } else {
            list.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">' + (typeof window.t === 'function' ? window.t('chat.loading') : 'Loading...') + '</div>';
        }

        // Build URL, add search parameter if there is a search query
        let url = `/api/groups/${groupId}/conversations`;
        if (searchQuery && searchQuery.trim()) {
            url += '?search=' + encodeURIComponent(searchQuery.trim());
        }

        const response = await apiFetch(url);
        if (!response.ok) {
            console.error(`Failed to load conversations for group ${groupId}:`, response.statusText);
            list.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">' + (typeof window.t === 'function' ? window.t('chat.loadFailedRetry') : 'Load failed, please try again') + '</div>';
            return;
        }

        let groupConvs = await response.json();

        // Treat null or undefined as an empty array
        if (!groupConvs) {
            groupConvs = [];
        }

        // Validate the returned data type
        if (!Array.isArray(groupConvs)) {
            console.error(`Invalid response for group ${groupId}:`, groupConvs);
            list.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">' + (typeof window.t === 'function' ? window.t('chat.dataFormatError') : 'Data format error') + '</div>';
            return;
        }

        // Update group mapping cache (only for the current group)
        // First clean up old mappings for this group (in case conversations were moved out)
        Object.keys(conversationGroupMappingCache).forEach(convId => {
            if (conversationGroupMappingCache[convId] === groupId) {
                // If this conversation is not in the new list, it has been moved out
                if (!groupConvs.find(c => c.id === convId)) {
                    delete conversationGroupMappingCache[convId];
                }
            }
        });

        // Update mapping for conversations in the current group
        groupConvs.forEach(conv => {
            conversationGroupMappingCache[conv.id] = groupId;
        });

        // Clear the list again (remove the "Loading..." message)
        list.innerHTML = '';

        if (groupConvs.length === 0) {
            const emptyMsg = typeof window.t === 'function' ? window.t('chat.emptyGroupConversations') : 'No conversations in this group';
            const noMatchMsg = typeof window.t === 'function' ? window.t('chat.noMatchingConversationsInGroup') : 'No matching conversations found';
            if (searchQuery && searchQuery.trim()) {
                list.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">' + noMatchMsg + '</div>';
            } else {
                list.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">' + emptyMsg + '</div>';
            }
            return;
        }

        // Load detailed info for each conversation to get messages
        for (const conv of groupConvs) {
            try {
                // Validate conversation ID exists
                if (!conv.id) {
                    console.warn('Conversation missing id:', conv);
                    continue;
                }

                const convResponse = await apiFetch(`/api/conversations/${conv.id}`);
                if (!convResponse.ok) {
                    console.error(`Failed to load conversation ${conv.id}:`, convResponse.statusText);
                    continue;
                }

                const fullConv = await convResponse.json();

                const item = document.createElement('div');
                item.className = 'group-conversation-item';
                item.dataset.conversationId = conv.id;
                // Only show active state when in group detail view and the conversation ID matches.
                // If not in group detail view, do not show active state.
                if (currentGroupId && conv.id === currentConversationId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }

                // Create content wrapper
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'group-conversation-content-wrapper';

                const titleWrapper = document.createElement('div');
                titleWrapper.style.display = 'flex';
                titleWrapper.style.alignItems = 'center';
                titleWrapper.style.gap = '4px';

                const title = document.createElement('div');
                title.className = 'group-conversation-title';
                const titleText = fullConv.title || conv.title || (typeof window.t === 'function' ? window.t('chat.unnamedConversation') : 'Unnamed Conversation');
                title.textContent = safeTruncateText(titleText, 60);
                title.title = titleText; // Set full title for hover tooltip
                titleWrapper.appendChild(title);

                // If the conversation is pinned within the group, show the pin icon
                if (conv.groupPinned) {
                    const pinIcon = document.createElement('span');
                    pinIcon.className = 'conversation-item-pinned';
                    pinIcon.innerHTML = '📌';
                    pinIcon.title = typeof window.t === 'function' ? window.t('chat.pinnedInGroup') : 'Pinned in group';
                    titleWrapper.appendChild(pinIcon);
                }

                contentWrapper.appendChild(titleWrapper);

                const timeWrapper = document.createElement('div');
                timeWrapper.className = 'group-conversation-time';
                const dateObj = fullConv.updatedAt ? new Date(fullConv.updatedAt) : new Date();
                const convListLocale = (typeof window.__locale === 'string' && window.__locale.startsWith('zh')) ? 'zh-CN' : 'en-US';
                timeWrapper.textContent = dateObj.toLocaleString(convListLocale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                contentWrapper.appendChild(timeWrapper);

                // If there is a first message, show a content preview
                if (fullConv.messages && fullConv.messages.length > 0) {
                    const firstMsg = fullConv.messages.find(m => m.role === 'user' && m.content);
                    if (firstMsg && firstMsg.content) {
                        const content = document.createElement('div');
                        content.className = 'group-conversation-content';
                        let preview = firstMsg.content.substring(0, 200);
                        if (firstMsg.content.length > 200) {
                            preview += '...';
                        }
                        content.textContent = preview;
                        contentWrapper.appendChild(content);
                    }
                }

                item.appendChild(contentWrapper);

                // Add three-dot menu button
                const menuBtn = document.createElement('button');
                menuBtn.className = 'conversation-item-menu';
                menuBtn.innerHTML = '⋯';
                menuBtn.onclick = (e) => {
                    e.stopPropagation();
                    contextMenuConversationId = conv.id;
                    showConversationContextMenu(e);
                };
                item.appendChild(menuBtn);

                item.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Switch to the chat view while keeping the group detail state
                    const groupDetailPage = document.getElementById('group-detail-page');
                    const chatContainer = document.querySelector('.chat-container');
                    if (groupDetailPage) groupDetailPage.style.display = 'none';
                    if (chatContainer) chatContainer.style.display = 'flex';
                    loadConversation(conv.id);
                };

                list.appendChild(item);
            } catch (err) {
                console.error(`Failed to load conversation ${conv.id}:`, err);
            }
        }
    } catch (error) {
        console.error('Failed to load group conversations:', error);
    }
}

// Edit group
async function editGroup() {
    if (!currentGroupId) return;

    try {
        const response = await apiFetch(`/api/groups/${currentGroupId}`);
        const group = await response.json();
        if (!group) return;

        const renamePrompt = typeof window.t === 'function' ? window.t('chat.renameGroupPrompt') : 'Enter new name:';
        const newName = prompt(renamePrompt, group.name);
        if (newName === null || !newName.trim()) return;

        const trimmedName = newName.trim();

        // Frontend validation: check if the name already exists (excluding the current group)
        let groups;
        if (Array.isArray(groupsCache) && groupsCache.length > 0) {
            groups = groupsCache;
        } else {
            const response = await apiFetch('/api/groups');
            groups = await response.json();
        }

        // Ensure groups is a valid array
        if (!Array.isArray(groups)) {
            groups = [];
        }

        const nameExists = groups.some(g => g.name === trimmedName && g.id !== currentGroupId);
        if (nameExists) {
            alert(typeof window.t === 'function' ? window.t('createGroupModal.nameExists') : 'Group name already exists, please use a different name');
            return;
        }

        const updateResponse = await apiFetch(`/api/groups/${currentGroupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: trimmedName,
                icon: group.icon || '📁',
            }),
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            if (error.error && (error.error.includes('already exists'))) {
                alert(typeof window.t === 'function' ? window.t('createGroupModal.nameExists') : 'Group name already exists, please use a different name');
                return;
            }
            throw new Error(error.error || 'Update failed');
        }

        loadGroups();

        const titleEl = document.getElementById('group-detail-title');
        if (titleEl) {
            titleEl.textContent = trimmedName;
        }
    } catch (error) {
        console.error('Failed to edit group:', error);
        alert((typeof window.t === 'function' ? window.t('chat.editFailed') : 'Edit failed') + ': ' + (error.message || (typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error')));
    }
}

// Delete group
async function deleteGroup() {
    if (!currentGroupId) return;

    const deleteConfirmMsg = typeof window.t === 'function' ? window.t('chat.deleteGroupConfirm') : 'Are you sure you want to delete this group? Conversations in the group will not be deleted but will be removed from the group.';
    if (!confirm(deleteConfirmMsg)) {
        return;
    }

    try {
        await apiFetch(`/api/groups/${currentGroupId}`, {
            method: 'DELETE',
        });

        // Update cache
        groupsCache = groupsCache.filter(g => g.id !== currentGroupId);
        Object.keys(conversationGroupMappingCache).forEach(convId => {
            if (conversationGroupMappingCache[convId] === currentGroupId) {
                delete conversationGroupMappingCache[convId];
            }
        });

        // If the "Move to Group" submenu is open, refresh it
        const submenu = document.getElementById('move-to-group-submenu');
        if (submenu && submenu.style.display !== 'none') {
            // Submenu is open — reload group list and refresh the submenu
            await loadGroups();
            await showMoveToGroupSubmenu();
        } else {
            exitGroupDetail();
            await loadGroups();
        }

        // Refresh conversation list to immediately show previously grouped conversations
        await loadConversationsWithGroups();
    } catch (error) {
        console.error('Failed to delete group:', error);
        alert((typeof window.t === 'function' ? window.t('chat.deleteFailed') : 'Delete failed') + ': ' + (error.message || (typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error')));
    }
}

// Rename group from context menu
async function renameGroupFromContext() {
    const groupId = contextMenuGroupId;
    if (!groupId) return;

    try {
        const response = await apiFetch(`/api/groups/${groupId}`);
        const group = await response.json();
        if (!group) return;

        const renamePrompt = typeof window.t === 'function' ? window.t('chat.renameGroupPrompt') : 'Enter new name:';
        const newName = prompt(renamePrompt, group.name);
        if (newName === null || !newName.trim()) {
            closeGroupContextMenu();
            return;
        }

        const trimmedName = newName.trim();

        // Frontend validation: check if the name already exists (excluding the current group)
        let groups;
        if (Array.isArray(groupsCache) && groupsCache.length > 0) {
            groups = groupsCache;
        } else {
            const response = await apiFetch('/api/groups');
            groups = await response.json();
        }

        // Ensure groups is a valid array
        if (!Array.isArray(groups)) {
            groups = [];
        }

        const nameExists = groups.some(g => g.name === trimmedName && g.id !== groupId);
        if (nameExists) {
            alert(typeof window.t === 'function' ? window.t('createGroupModal.nameExists') : 'Group name already exists, please use a different name');
            return;
        }

        const updateResponse = await apiFetch(`/api/groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: trimmedName,
                icon: group.icon || '📁',
            }),
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            if (error.error && (error.error.includes('already exists'))) {
                alert(typeof window.t === 'function' ? window.t('createGroupModal.nameExists') : 'Group name already exists, please use a different name');
                return;
            }
            throw new Error(error.error || 'Update failed');
        }

        loadGroups();

        // If currently in group detail view, update the title
        if (currentGroupId === groupId) {
            const titleEl = document.getElementById('group-detail-title');
            if (titleEl) {
                titleEl.textContent = trimmedName;
            }
        }
    } catch (error) {
        console.error('Failed to rename group:', error);
        const failedLabel = typeof window.t === 'function' ? window.t('chat.renameFailed') : 'Rename failed';
        const unknownErr = typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error';
        alert(failedLabel + ': ' + (error.message || unknownErr));
    }

    closeGroupContextMenu();
}

// Pin/unpin group from context menu
async function pinGroupFromContext() {
    const groupId = contextMenuGroupId;
    if (!groupId) return;

    try {
        // Get current group info
        const response = await apiFetch(`/api/groups/${groupId}`);
        const group = await response.json();
        if (!group) return;

        const newPinnedState = !group.pinned;

        // Call API to update pinned state
        const updateResponse = await apiFetch(`/api/groups/${groupId}/pinned`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pinned: newPinnedState,
            }),
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(error.error || 'Update failed');
        }

        // Reload group list to update display order
        loadGroups();
    } catch (error) {
        console.error('Failed to pin/unpin group:', error);
        alert((typeof window.t === 'function' ? window.t('chat.pinFailed') : 'Pin failed') + ': ' + (error.message || (typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error')));
    }

    closeGroupContextMenu();
}

// Delete group from context menu
async function deleteGroupFromContext() {
    const groupId = contextMenuGroupId;
    if (!groupId) return;

    const deleteConfirmMsg = typeof window.t === 'function' ? window.t('chat.deleteGroupConfirm') : 'Are you sure you want to delete this group? Conversations in the group will not be deleted but will be removed from the group.';
    if (!confirm(deleteConfirmMsg)) {
        closeGroupContextMenu();
        return;
    }

    try {
        await apiFetch(`/api/groups/${groupId}`, {
            method: 'DELETE',
        });

        // Update cache
        groupsCache = groupsCache.filter(g => g.id !== groupId);
        Object.keys(conversationGroupMappingCache).forEach(convId => {
            if (conversationGroupMappingCache[convId] === groupId) {
                delete conversationGroupMappingCache[convId];
            }
        });

        // If the "Move to Group" submenu is open, refresh it
        const submenu = document.getElementById('move-to-group-submenu');
        if (submenu && submenu.style.display !== 'none') {
            // Submenu is open — reload group list and refresh the submenu
            await loadGroups();
            await showMoveToGroupSubmenu();
        } else {
            // If currently in group detail view, exit it
            if (currentGroupId === groupId) {
                exitGroupDetail();
            }
            await loadGroups();
        }

        // Refresh conversation list to immediately show previously grouped conversations
        await loadConversationsWithGroups();
    } catch (error) {
        console.error('Failed to delete group:', error);
        alert((typeof window.t === 'function' ? window.t('chat.deleteFailed') : 'Delete failed') + ': ' + (error.message || (typeof window.t === 'function' ? window.t('createGroupModal.unknownError') : 'Unknown error')));
    }

    closeGroupContextMenu();
}

// Close group context menu
function closeGroupContextMenu() {
    const menu = document.getElementById('group-context-menu');
    if (menu) {
        menu.style.display = 'none';
    }
    contextMenuGroupId = null;
}


// Group search variables
let groupSearchTimer = null;
let currentGroupSearchQuery = '';

// Toggle group search box visibility
function toggleGroupSearch() {
    const searchContainer = document.getElementById('group-search-container');
    const searchInput = document.getElementById('group-search-input');
    
    if (!searchContainer || !searchInput) return;
    
    if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'block';
        searchInput.focus();
    } else {
        searchContainer.style.display = 'none';
        clearGroupSearch();
    }
}

// Handle group search input
function handleGroupSearchInput(event) {
    // Support Enter key to search
    if (event.key === 'Enter') {
        event.preventDefault();
        performGroupSearch();
        return;
    }

    // Support Escape key to close search
    if (event.key === 'Escape') {
        clearGroupSearch();
        toggleGroupSearch();
        return;
    }

    const searchInput = document.getElementById('group-search-input');
    const clearBtn = document.getElementById('group-search-clear-btn');

    if (!searchInput) return;

    const query = searchInput.value.trim();

    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
    }

    // Debounce search
    if (groupSearchTimer) {
        clearTimeout(groupSearchTimer);
    }

    groupSearchTimer = setTimeout(() => {
        performGroupSearch();
    }, 300); // 300ms debounce
}

// Perform group search
async function performGroupSearch() {
    const searchInput = document.getElementById('group-search-input');
    if (!searchInput || !currentGroupId) return;

    const query = searchInput.value.trim();
    currentGroupSearchQuery = query;

    // Load search results
    await loadGroupConversations(currentGroupId, query);
}

// Clear group search
function clearGroupSearch() {
    const searchInput = document.getElementById('group-search-input');
    const clearBtn = document.getElementById('group-search-clear-btn');

    if (searchInput) {
        searchInput.value = '';
    }
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }

    currentGroupSearchQuery = '';

    // Reload group conversations (without search)
    if (currentGroupId) {
        loadGroupConversations(currentGroupId, '');
    }
}

// Load groups on initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadGroups();
    // Replace the original loadConversations call
    if (typeof loadConversations === 'function') {
        // Keep the original function, but use the new one
        const originalLoad = loadConversations;
        loadConversations = function(...args) {
            loadConversationsWithGroups(...args);
        };
    }
    await loadConversationsWithGroups();

    // Auto-refresh conversation list when the page gains focus.
    // This ensures new conversations created via OpenAPI are visible when the user returns to the page.
    let lastFocusTime = Date.now();
    const CONVERSATION_REFRESH_INTERVAL = 30000; // Refresh at most once every 30 seconds to avoid excessive calls

    window.addEventListener('focus', () => {
        const now = Date.now();
        // Only refresh if more than 30 seconds have passed since the last refresh
        if (now - lastFocusTime > CONVERSATION_REFRESH_INTERVAL) {
            lastFocusTime = now;
            if (typeof loadConversationsWithGroups === 'function') {
                loadConversationsWithGroups();
            }
        }
    });

    // Listen for page visibility changes (when the user switches back to this tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // When the page becomes visible, check whether a refresh is needed
            const now = Date.now();
            if (now - lastFocusTime > CONVERSATION_REFRESH_INTERVAL) {
                lastFocusTime = now;
                if (typeof loadConversationsWithGroups === 'function') {
                    loadConversationsWithGroups();
                }
            }
        }
    });
});
