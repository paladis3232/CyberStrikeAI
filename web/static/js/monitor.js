const progressTaskState = new Map();
let activeTaskInterval = null;
const ACTIVE_TASK_REFRESH_INTERVAL = 10000; // Check every 10 seconds
const TASK_FINAL_STATUSES = new Set(['failed', 'timeout', 'cancelled', 'completed']);

// BCP 47 tag for the current UI language (consistent with time formatting)
function getCurrentTimeLocale() {
    if (typeof window.__locale === 'string' && window.__locale.length) {
        return window.__locale.startsWith('zh') ? 'zh-CN' : 'en-US';
    }
    if (typeof i18next !== 'undefined' && i18next.language) {
        return (i18next.language || '').startsWith('zh') ? 'zh-CN' : 'en-US';
    }
    return 'zh-CN';
}

// toLocaleTimeString options: use 24-hour format for Chinese locale to avoid showing AM/PM
function getTimeFormatOptions() {
    const loc = getCurrentTimeLocale();
    const base = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    if (loc === 'zh-CN') {
        base.hour12 = false;
    }
    return base;
}

// Translate progress messages from the backend into the current language (bidirectional CN/EN mapping, keeps up after language switch)
function translateProgressMessage(message) {
    if (!message || typeof message !== 'string') return message;
    if (typeof window.t !== 'function') return message;
    const trim = message.trim();
    const map = {
        // Chinese
        '正在调用AI模型...': 'progress.callingAI',
        '最后一次迭代：正在生成总结和下一步计划...': 'progress.lastIterSummary',
        '总结生成完成': 'progress.summaryDone',
        '正在生成最终回复...': 'progress.generatingFinalReply',
        '达到最大迭代次数，正在生成总结...': 'progress.maxIterSummary',
        // English (matches en-US.json, prevents language switch failure when backend/cache already returns English)
        'Calling AI model...': 'progress.callingAI',
        'Last iteration: generating summary and next steps...': 'progress.lastIterSummary',
        'Summary complete': 'progress.summaryDone',
        'Generating final reply...': 'progress.generatingFinalReply',
        'Max iterations reached, generating summary...': 'progress.maxIterSummary'
    };
    if (map[trim]) return window.t(map[trim]);
    const callingToolPrefixCn = '正在调用工具: ';
    const callingToolPrefixEn = 'Calling tool: ';
    if (trim.indexOf(callingToolPrefixCn) === 0) {
        const name = trim.slice(callingToolPrefixCn.length);
        return window.t('progress.callingTool', { name: name });
    }
    if (trim.indexOf(callingToolPrefixEn) === 0) {
        const name = trim.slice(callingToolPrefixEn.length);
        return window.t('progress.callingTool', { name: name });
    }
    return message;
}
if (typeof window !== 'undefined') {
    window.translateProgressMessage = translateProgressMessage;
}

// Map from tool call ID to DOM element, used to update execution status
const toolCallStatusMap = new Map();

const conversationExecutionTracker = {
    activeConversations: new Set(),
    update(tasks = []) {
        this.activeConversations.clear();
        tasks.forEach(task => {
            if (
                task &&
                task.conversationId &&
                !TASK_FINAL_STATUSES.has(task.status)
            ) {
                this.activeConversations.add(task.conversationId);
            }
        });
    },
    isRunning(conversationId) {
        return !!conversationId && this.activeConversations.has(conversationId);
    }
};

function isConversationTaskRunning(conversationId) {
    return conversationExecutionTracker.isRunning(conversationId);
}

function registerProgressTask(progressId, conversationId = null) {
    const state = progressTaskState.get(progressId) || {};
    state.conversationId = conversationId !== undefined && conversationId !== null
        ? conversationId
        : (state.conversationId ?? currentConversationId);
    state.cancelling = false;
    progressTaskState.set(progressId, state);

    const progressElement = document.getElementById(progressId);
    if (progressElement) {
        progressElement.dataset.conversationId = state.conversationId || '';
    }
}

function updateProgressConversation(progressId, conversationId) {
    if (!conversationId) {
        return;
    }
    registerProgressTask(progressId, conversationId);
}

function markProgressCancelling(progressId) {
    const state = progressTaskState.get(progressId);
    if (state) {
        state.cancelling = true;
    }
}

function finalizeProgressTask(progressId, finalLabel) {
    const stopBtn = document.getElementById(`${progressId}-stop-btn`);
    if (stopBtn) {
        stopBtn.disabled = true;
        if (finalLabel !== undefined && finalLabel !== '') {
            stopBtn.textContent = finalLabel;
        } else {
            stopBtn.textContent = typeof window.t === 'function' ? window.t('tasks.statusCompleted') : 'Completed';
        }
    }
    progressTaskState.delete(progressId);
}

async function requestCancel(conversationId) {
    const response = await apiFetch('/api/agent-loop/cancel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || (typeof window.t === 'function' ? window.t('tasks.cancelFailed') : 'Cancel failed'));
    }
    return result;
}

function addProgressMessage() {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageCounter++;
    const id = 'progress-' + Date.now() + '-' + messageCounter;
    messageDiv.id = id;
    messageDiv.className = 'message system progress-message';
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble progress-container';
    const progressTitleText = typeof window.t === 'function' ? window.t('chat.progressInProgress') : 'Penetration test in progress...';
    const stopTaskText = typeof window.t === 'function' ? window.t('tasks.stopTask') : 'Stop task';
    const collapseDetailText = typeof window.t === 'function' ? window.t('tasks.collapseDetail') : 'Collapse details';
    bubble.innerHTML = `
        <div class="progress-header">
            <span class="progress-title">🔍 ${progressTitleText}</span>
            <div class="progress-actions">
                <button class="progress-stop" id="${id}-stop-btn" onclick="cancelProgressTask('${id}')">${stopTaskText}</button>
                <button class="progress-toggle" onclick="toggleProgressDetails('${id}')">${collapseDetailText}</button>
            </div>
        </div>
        <div class="progress-timeline expanded" id="${id}-timeline"></div>
    `;
    
    contentWrapper.appendChild(bubble);
    messageDiv.appendChild(contentWrapper);
    messageDiv.dataset.conversationId = currentConversationId || '';
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return id;
}

// Toggle progress details display
function toggleProgressDetails(progressId) {
    const timeline = document.getElementById(progressId + '-timeline');
    const toggleBtn = document.querySelector(`#${progressId} .progress-toggle`);
    
    if (!timeline || !toggleBtn) return;
    
    if (timeline.classList.contains('expanded')) {
        timeline.classList.remove('expanded');
        toggleBtn.textContent = typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand details';
    } else {
        timeline.classList.add('expanded');
        toggleBtn.textContent = typeof window.t === 'function' ? window.t('tasks.collapseDetail') : 'Collapse details';
    }
}

// Collapse all progress details
function collapseAllProgressDetails(assistantMessageId, progressId) {
    // Collapse details integrated into the MCP area
    if (assistantMessageId) {
        const detailsId = 'process-details-' + assistantMessageId;
        const detailsContainer = document.getElementById(detailsId);
        if (detailsContainer) {
            const timeline = detailsContainer.querySelector('.progress-timeline');
            if (timeline) {
                // Ensure the expanded class is removed (regardless of whether it is present)
                timeline.classList.remove('expanded');
                const btn = document.querySelector(`#${assistantMessageId} .process-detail-btn`);
                if (btn) {
                    btn.innerHTML = '<span>' + (typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand details') + '</span>';
                }
            }
        }
    }
    
    // Collapse standalone details components (created by convertProgressToDetails)
    // Find all details components whose id starts with "details-"
    const allDetails = document.querySelectorAll('[id^="details-"]');
    allDetails.forEach(detail => {
        const timeline = detail.querySelector('.progress-timeline');
        const toggleBtn = detail.querySelector('.progress-toggle');
        if (timeline) {
            timeline.classList.remove('expanded');
            if (toggleBtn) {
                toggleBtn.textContent = typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand details';
            }
        }
    });

    // Collapse the original progress message (if it still exists)
    if (progressId) {
        const progressTimeline = document.getElementById(progressId + '-timeline');
        const progressToggleBtn = document.querySelector(`#${progressId} .progress-toggle`);
        if (progressTimeline) {
            progressTimeline.classList.remove('expanded');
            if (progressToggleBtn) {
                progressToggleBtn.textContent = typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand details';
            }
        }
    }
}

// Get the current assistant message ID (used for the done event)
function getAssistantId() {
    // Get the ID from the most recent assistant message
    const messages = document.querySelectorAll('.message.assistant');
    if (messages.length > 0) {
        return messages[messages.length - 1].id;
    }
    return null;
}

// Integrate progress details into the tool call area
function integrateProgressToMCPSection(progressId, assistantMessageId) {
    const progressElement = document.getElementById(progressId);
    if (!progressElement) return;

    // Get timeline content
    const timeline = document.getElementById(progressId + '-timeline');
    let timelineHTML = '';
    if (timeline) {
        timelineHTML = timeline.innerHTML;
    }

    // Get the assistant message element
    const assistantElement = document.getElementById(assistantMessageId);
    if (!assistantElement) {
        removeMessage(progressId);
        return;
    }
    
    // Find the MCP call section
    const mcpSection = assistantElement.querySelector('.mcp-call-section');
    if (!mcpSection) {
        // If there is no MCP section, create a details component below the message
        convertProgressToDetails(progressId, assistantMessageId);
        return;
    }
    
    // Get the timeline content
    const hasContent = timelineHTML.trim().length > 0;

    // Check if the timeline contains any error items
    const hasError = timeline && timeline.querySelector('.timeline-item-error');

    // Ensure the buttons container exists
    let buttonsContainer = mcpSection.querySelector('.mcp-call-buttons');
    if (!buttonsContainer) {
        buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'mcp-call-buttons';
        mcpSection.appendChild(buttonsContainer);
    }

    // Create the details container below the MCP buttons area (unified structure)
    const detailsId = 'process-details-' + assistantMessageId;
    let detailsContainer = document.getElementById(detailsId);

    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.id = detailsId;
        detailsContainer.className = 'process-details-container';
        // Ensure the container comes after the buttons container
        if (buttonsContainer.nextSibling) {
            mcpSection.insertBefore(detailsContainer, buttonsContainer.nextSibling);
        } else {
            mcpSection.appendChild(detailsContainer);
        }
    }
    
    // Set the details content (collapsed by default whether or not there is an error)
    detailsContainer.innerHTML = `
        <div class="process-details-content">
            ${hasContent ? `<div class="progress-timeline" id="${detailsId}-timeline">${timelineHTML}</div>` : '<div class="progress-timeline-empty">' + (typeof window.t === 'function' ? window.t('chat.noProcessDetail') : 'No process details available (execution may have been too fast or no detailed events were triggered)') + '</div>'}
        </div>
    `;

    // Ensure the initial state is collapsed (collapsed by default, especially on error)
    if (hasContent) {
        const timeline = document.getElementById(detailsId + '-timeline');
        if (timeline) {
            // Ensure collapsed whether or not there is an error
            timeline.classList.remove('expanded');
        }

        const processDetailBtn = buttonsContainer.querySelector('.process-detail-btn');
        if (processDetailBtn) {
            processDetailBtn.innerHTML = '<span>' + (typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand details') + '</span>';
        }
    }
    
    // Remove the original progress message
    removeMessage(progressId);
}

// Toggle process details display
function toggleProcessDetails(progressId, assistantMessageId) {
    const detailsId = 'process-details-' + assistantMessageId;
    const detailsContainer = document.getElementById(detailsId);
    if (!detailsContainer) return;
    
    const content = detailsContainer.querySelector('.process-details-content');
    const timeline = detailsContainer.querySelector('.progress-timeline');
    const btn = document.querySelector(`#${assistantMessageId} .process-detail-btn`);
    
    const expandT = typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand details';
    const collapseT = typeof window.t === 'function' ? window.t('tasks.collapseDetail') : 'Collapse details';
    if (content && timeline) {
        if (timeline.classList.contains('expanded')) {
            timeline.classList.remove('expanded');
            if (btn) btn.innerHTML = '<span>' + expandT + '</span>';
        } else {
            timeline.classList.add('expanded');
            if (btn) btn.innerHTML = '<span>' + collapseT + '</span>';
        }
    } else if (timeline) {
        if (timeline.classList.contains('expanded')) {
            timeline.classList.remove('expanded');
            if (btn) btn.innerHTML = '<span>' + expandT + '</span>';
        } else {
            timeline.classList.add('expanded');
            if (btn) btn.innerHTML = '<span>' + collapseT + '</span>';
        }
    }
    
    // Scroll to the expanded details position instead of scrolling to the bottom
    if (timeline && timeline.classList.contains('expanded')) {
        setTimeout(() => {
            // Use scrollIntoView to scroll to the details container position
            detailsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Stop the task associated with the current progress
async function cancelProgressTask(progressId) {
    const state = progressTaskState.get(progressId);
    const stopBtn = document.getElementById(`${progressId}-stop-btn`);

    if (!state || !state.conversationId) {
        if (stopBtn) {
            stopBtn.disabled = true;
            setTimeout(() => {
                stopBtn.disabled = false;
            }, 1500);
        }
        alert(typeof window.t === 'function' ? window.t('tasks.taskInfoNotSynced') : 'Task info not yet synced, please try again later.');
        return;
    }

    if (state.cancelling) {
        return;
    }

    markProgressCancelling(progressId);
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.textContent = typeof window.t === 'function' ? window.t('tasks.cancelling') : 'Cancelling...';
    }

    try {
        await requestCancel(state.conversationId);
        loadActiveTasks();
    } catch (error) {
        console.error('Cancel task failed:', error);
        alert((typeof window.t === 'function' ? window.t('tasks.cancelTaskFailed') : 'Cancel task failed') + ': ' + error.message);
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.textContent = typeof window.t === 'function' ? window.t('tasks.stopTask') : 'Stop task';
        }
        const currentState = progressTaskState.get(progressId);
        if (currentState) {
            currentState.cancelling = false;
        }
    }
}

// Convert the progress message into a collapsible details component
function convertProgressToDetails(progressId, assistantMessageId) {
    const progressElement = document.getElementById(progressId);
    if (!progressElement) return;
    
    // Get the timeline content
    const timeline = document.getElementById(progressId + '-timeline');
    // Even if the timeline does not exist, still create the details component (showing empty state)
    let timelineHTML = '';
    if (timeline) {
        timelineHTML = timeline.innerHTML;
    }

    // Get the assistant message element
    const assistantElement = document.getElementById(assistantMessageId);
    if (!assistantElement) {
        removeMessage(progressId);
        return;
    }

    // Create the details component
    const detailsId = 'details-' + Date.now() + '-' + messageCounter++;
    const detailsDiv = document.createElement('div');
    detailsDiv.id = detailsId;
    detailsDiv.className = 'message system progress-details';
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble progress-container completed';
    
    // Get the timeline HTML content
    const hasContent = timelineHTML.trim().length > 0;

    // Check if the timeline contains any error items
    const hasError = timeline && timeline.querySelector('.timeline-item-error');

    // Collapse by default on error; expand by default otherwise
    const shouldExpand = !hasError;
    const expandedClass = shouldExpand ? 'expanded' : '';
    const collapseDetailText = typeof window.t === 'function' ? window.t('tasks.collapseDetail') : 'Collapse details';
    const expandDetailText = typeof window.t === 'function' ? window.t('chat.expandDetail') : 'Expand details';
    const toggleText = shouldExpand ? collapseDetailText : expandDetailText;
    const penetrationDetailText = typeof window.t === 'function' ? window.t('chat.penetrationTestDetail') : 'Penetration test details';
    const noProcessDetailText = typeof window.t === 'function' ? window.t('chat.noProcessDetail') : 'No process details available (execution may have been too fast or no detailed events were triggered)';
    bubble.innerHTML = `
        <div class="progress-header">
            <span class="progress-title">📋 ${penetrationDetailText}</span>
            ${hasContent ? `<button class="progress-toggle" onclick="toggleProgressDetails('${detailsId}')">${toggleText}</button>` : ''}
        </div>
        ${hasContent ? `<div class="progress-timeline ${expandedClass}" id="${detailsId}-timeline">${timelineHTML}</div>` : '<div class="progress-timeline-empty">' + noProcessDetailText + '</div>'}
    `;
    
    contentWrapper.appendChild(bubble);
    detailsDiv.appendChild(contentWrapper);
    
    // Insert the details component after the assistant message
    const messagesDiv = document.getElementById('chat-messages');
    // assistantElement is the message div; insert before its next sibling
    if (assistantElement.nextSibling) {
        messagesDiv.insertBefore(detailsDiv, assistantElement.nextSibling);
    } else {
        // If there is no next sibling, just append
        messagesDiv.appendChild(detailsDiv);
    }

    // Remove the original progress message
    removeMessage(progressId);

    // Scroll to the bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Handle streaming events
function handleStreamEvent(event, progressElement, progressId, 
                          getAssistantId, setAssistantId, getMcpIds, setMcpIds) {
    const timeline = document.getElementById(progressId + '-timeline');
    if (!timeline) return;
    
    switch (event.type) {
        case 'conversation':
            if (event.data && event.data.conversationId) {
                // Before updating, get the original conversation ID associated with the task
                const taskState = progressTaskState.get(progressId);
                const originalConversationId = taskState?.conversationId;

                // Update task state
                updateProgressConversation(progressId, event.data.conversationId);

                // If the user has already started a new conversation (currentConversationId is null),
                // and this conversation event comes from the old conversation, do not update currentConversationId
                if (currentConversationId === null && originalConversationId !== null) {
                    // User has started a new conversation; ignore the conversation event from the old one
                    // but still update task state so task info displays correctly
                    break;
                }

                // Update the current conversation ID
                currentConversationId = event.data.conversationId;
                updateActiveConversation();
                addAttackChainButton(currentConversationId);
                loadActiveTasks();
                // Delay refreshing the conversation list to ensure user messages are saved and updated_at is updated,
                // so that new conversations appear at the top of the recent conversations list.
                // Use loadConversationsWithGroups to ensure the group mapping cache is loaded correctly
                // and can be displayed immediately regardless of whether there are groups
                setTimeout(() => {
                    if (typeof loadConversationsWithGroups === 'function') {
                        loadConversationsWithGroups();
                    } else if (typeof loadConversations === 'function') {
                        loadConversations();
                    }
                }, 200);
            }
            break;
        case 'iteration':
            // Add iteration marker (data attribute allows title to be recalculated on language switch)
            addTimelineItem(timeline, 'iteration', {
                title: typeof window.t === 'function' ? window.t('chat.iterationRound', { n: event.data?.iteration || 1 }) : 'Round ' + (event.data?.iteration || 1) + ' iteration',
                message: event.message,
                data: event.data,
                iterationN: event.data?.iteration || 1
            });
            break;
            
        case 'thinking':
            addTimelineItem(timeline, 'thinking', {
                title: '🤔 ' + (typeof window.t === 'function' ? window.t('chat.aiThinking') : 'AI thinking'),
                message: event.message,
                data: event.data
            });
            break;
            
        case 'tool_calls_detected':
            addTimelineItem(timeline, 'tool_calls_detected', {
                title: '🔧 ' + (typeof window.t === 'function' ? window.t('chat.toolCallsDetected', { count: event.data?.count || 0 }) : 'Detected ' + (event.data?.count || 0) + ' tool call(s)'),
                message: event.message,
                data: event.data
            });
            break;
            
        case 'tool_call':
            const toolInfo = event.data || {};
            const toolName = toolInfo.toolName || (typeof window.t === 'function' ? window.t('chat.unknownTool') : 'Unknown tool');
            const index = toolInfo.index || 0;
            const total = toolInfo.total || 0;
            const toolCallId = toolInfo.toolCallId || null;
            const toolCallTitle = typeof window.t === 'function' ? window.t('chat.callTool', { name: escapeHtml(toolName), index: index, total: total }) : 'Calling tool: ' + escapeHtml(toolName) + ' (' + index + '/' + total + ')';
            const toolCallItemId = addTimelineItem(timeline, 'tool_call', {
                title: '🔧 ' + toolCallTitle,
                message: event.message,
                data: toolInfo,
                expanded: false
            });
            
            // If there is a toolCallId, store the mapping for later status updates
            if (toolCallId && toolCallItemId) {
                toolCallStatusMap.set(toolCallId, {
                    itemId: toolCallItemId,
                    timeline: timeline
                });
                
                // Add running status indicator
                updateToolCallStatus(toolCallId, 'running');
            }
            break;
            
        case 'tool_result':
            const resultInfo = event.data || {};
            const resultToolName = resultInfo.toolName || (typeof window.t === 'function' ? window.t('chat.unknownTool') : 'Unknown tool');
            const success = resultInfo.success !== false;
            const statusIcon = success ? '✅' : '❌';
            const resultToolCallId = resultInfo.toolCallId || null;
            const resultExecText = success ? (typeof window.t === 'function' ? window.t('chat.toolExecComplete', { name: escapeHtml(resultToolName) }) : 'Tool ' + escapeHtml(resultToolName) + ' execution complete') : (typeof window.t === 'function' ? window.t('chat.toolExecFailed', { name: escapeHtml(resultToolName) }) : 'Tool ' + escapeHtml(resultToolName) + ' execution failed');
            if (resultToolCallId && toolCallStatusMap.has(resultToolCallId)) {
                updateToolCallStatus(resultToolCallId, success ? 'completed' : 'failed');
                toolCallStatusMap.delete(resultToolCallId);
            }
            addTimelineItem(timeline, 'tool_result', {
                title: statusIcon + ' ' + resultExecText,
                message: event.message,
                data: resultInfo,
                expanded: false
            });
            break;
            
        case 'progress':
            const progressTitle = document.querySelector(`#${progressId} .progress-title`);
            if (progressTitle) {
                // Save the raw message so translateProgressMessage can re-apply the current language on a language switch
                const progressEl = document.getElementById(progressId);
                if (progressEl) {
                    progressEl.dataset.progressRawMessage = event.message || '';
                }
                const progressMsg = translateProgressMessage(event.message);
                progressTitle.textContent = '🔍 ' + progressMsg;
            }
            break;
        
        case 'cancelled':
            const taskCancelledText = typeof window.t === 'function' ? window.t('chat.taskCancelled') : 'Task cancelled';
            addTimelineItem(timeline, 'cancelled', {
                title: '⛔ ' + taskCancelledText,
                message: event.message,
                data: event.data
            });
            const cancelTitle = document.querySelector(`#${progressId} .progress-title`);
            if (cancelTitle) {
                cancelTitle.textContent = '⛔ ' + taskCancelledText;
            }
            const cancelProgressContainer = document.querySelector(`#${progressId} .progress-container`);
            if (cancelProgressContainer) {
                cancelProgressContainer.classList.add('completed');
            }
            if (progressTaskState.has(progressId)) {
                finalizeProgressTask(progressId, typeof window.t === 'function' ? window.t('tasks.statusCancelled') : 'Cancelled');
            }
            
            // If the cancelled event includes a messageId, an assistant message exists and its cancel content should be displayed
            if (event.data && event.data.messageId) {
                // Check if the assistant message already exists
                let assistantId = event.data.messageId;
                let assistantElement = document.getElementById(assistantId);

                // If the assistant message does not exist, create it
                if (!assistantElement) {
                    assistantId = addMessage('assistant', event.message, null, progressId);
                    setAssistantId(assistantId);
                    assistantElement = document.getElementById(assistantId);
                } else {
                    // If it already exists, update its content
                    const bubble = assistantElement.querySelector('.message-bubble');
                    if (bubble) {
                        bubble.innerHTML = escapeHtml(event.message).replace(/\n/g, '<br>');
                    }
                }
                
                // Integrate progress details into the tool call area (if not already done)
                if (assistantElement) {
                    const detailsId = 'process-details-' + assistantId;
                    if (!document.getElementById(detailsId)) {
                        integrateProgressToMCPSection(progressId, assistantId);
                    }
                    // Immediately collapse details (should be collapsed by default on cancel)
                    setTimeout(() => {
                        collapseAllProgressDetails(assistantId, progressId);
                    }, 100);
                }
            } else {
                // If there is no messageId, create an assistant message and integrate details
                const assistantId = addMessage('assistant', event.message, null, progressId);
                setAssistantId(assistantId);

                // Integrate progress details into the tool call area
                setTimeout(() => {
                    integrateProgressToMCPSection(progressId, assistantId);
                    // Ensure details are collapsed by default
                    collapseAllProgressDetails(assistantId, progressId);
                }, 100);
            }

            // Immediately refresh task status
            loadActiveTasks();
            break;
            
        case 'response':
            // Before updating, get the original conversation ID associated with the task
            const responseTaskState = progressTaskState.get(progressId);
            const responseOriginalConversationId = responseTaskState?.conversationId;

            // Add the assistant reply first
            const responseData = event.data || {};
            const mcpIds = responseData.mcpExecutionIds || [];
            setMcpIds(mcpIds);

            // Update the conversation ID
            if (responseData.conversationId) {
                // If the user has already started a new conversation (currentConversationId is null),
                // and this response event comes from the old conversation, do not update currentConversationId and do not add a message
                if (currentConversationId === null && responseOriginalConversationId !== null) {
                    // User has started a new conversation; ignore the response event from the old one
                    // but still update task state so task info displays correctly
                    updateProgressConversation(progressId, responseData.conversationId);
                    break;
                }
                
                currentConversationId = responseData.conversationId;
                updateActiveConversation();
                addAttackChainButton(currentConversationId);
                updateProgressConversation(progressId, responseData.conversationId);
                loadActiveTasks();
            }
            
            // Add the assistant reply and pass the progress ID to integrate details
            const assistantId = addMessage('assistant', event.message, mcpIds, progressId);
            setAssistantId(assistantId);

            // Integrate progress details into the tool call area
            integrateProgressToMCPSection(progressId, assistantId);

            // Auto-collapse details after a delay (3 seconds)
            setTimeout(() => {
                collapseAllProgressDetails(assistantId, progressId);
            }, 3000);

            // Delay refreshing the conversation list to ensure assistant messages are saved and updated_at is updated
            setTimeout(() => {
                loadConversations();
            }, 200);
            break;
            
        case 'error':
            // Display error
            addTimelineItem(timeline, 'error', {
                title: '❌ ' + (typeof window.t === 'function' ? window.t('chat.error') : 'Error'),
                message: event.message,
                data: event.data
            });
            
            // Update the progress title to error state
            const errorTitle = document.querySelector(`#${progressId} .progress-title`);
            if (errorTitle) {
                errorTitle.textContent = '❌ ' + (typeof window.t === 'function' ? window.t('chat.executionFailed') : 'Execution failed');
            }

            // Update the progress container to completed state (add completed class)
            const progressContainer = document.querySelector(`#${progressId} .progress-container`);
            if (progressContainer) {
                progressContainer.classList.add('completed');
            }

            // Finalize the progress task (mark as failed)
            if (progressTaskState.has(progressId)) {
                finalizeProgressTask(progressId, typeof window.t === 'function' ? window.t('tasks.statusFailed') : 'Execution failed');
            }

            // If the error event includes a messageId, an assistant message exists and its error content should be displayed
            if (event.data && event.data.messageId) {
                // Check if the assistant message already exists
                let assistantId = event.data.messageId;
                let assistantElement = document.getElementById(assistantId);

                // If the assistant message does not exist, create it
                if (!assistantElement) {
                    assistantId = addMessage('assistant', event.message, null, progressId);
                    setAssistantId(assistantId);
                    assistantElement = document.getElementById(assistantId);
                } else {
                    // If it already exists, update its content
                    const bubble = assistantElement.querySelector('.message-bubble');
                    if (bubble) {
                        bubble.innerHTML = escapeHtml(event.message).replace(/\n/g, '<br>');
                    }
                }
                
                // Integrate progress details into the tool call area (if not already done)
                if (assistantElement) {
                    const detailsId = 'process-details-' + assistantId;
                    if (!document.getElementById(detailsId)) {
                        integrateProgressToMCPSection(progressId, assistantId);
                    }
                    // Immediately collapse details (should be collapsed by default on error)
                    setTimeout(() => {
                        collapseAllProgressDetails(assistantId, progressId);
                    }, 100);
                }
            } else {
                // If there is no messageId (e.g. an error while the task was already running), create an assistant message and integrate details
                const assistantId = addMessage('assistant', event.message, null, progressId);
                setAssistantId(assistantId);

                // Integrate progress details into the tool call area
                setTimeout(() => {
                    integrateProgressToMCPSection(progressId, assistantId);
                    // Ensure details are collapsed by default
                    collapseAllProgressDetails(assistantId, progressId);
                }, 100);
            }

            // Immediately refresh task status (task status is updated when execution fails)
            loadActiveTasks();
            break;
            
        case 'done':
            // Done; update the progress title (if the progress message still exists)
            const doneTitle = document.querySelector(`#${progressId} .progress-title`);
            if (doneTitle) {
                doneTitle.textContent = '✅ ' + (typeof window.t === 'function' ? window.t('chat.penetrationTestComplete') : 'Penetration test complete');
            }
            // Update the conversation ID
            if (event.data && event.data.conversationId) {
                currentConversationId = event.data.conversationId;
                updateActiveConversation();
                addAttackChainButton(currentConversationId);
                updateProgressConversation(progressId, event.data.conversationId);
            }
            if (progressTaskState.has(progressId)) {
                finalizeProgressTask(progressId, typeof window.t === 'function' ? window.t('tasks.statusCompleted') : 'Completed');
            }

            // Check if the timeline contains any error items
            const hasError = timeline && timeline.querySelector('.timeline-item-error');

            // Immediately refresh task status (ensure task status is in sync)
            loadActiveTasks();

            // Delay a second refresh of task status (ensure the backend has finished updating status)
            setTimeout(() => {
                loadActiveTasks();
            }, 200);

            // Auto-collapse all details on completion (delay slightly to ensure the response event has been processed)
            setTimeout(() => {
                const assistantIdFromDone = getAssistantId();
                if (assistantIdFromDone) {
                    collapseAllProgressDetails(assistantIdFromDone, progressId);
                } else {
                    // If the assistant ID cannot be obtained, try to collapse all details
                    collapseAllProgressDetails(null, progressId);
                }

                // If there is an error, ensure details are collapsed (should be collapsed by default on error)
                if (hasError) {
                    // Collapse again (slight delay to ensure the DOM has been updated)
                    setTimeout(() => {
                        collapseAllProgressDetails(assistantIdFromDone || null, progressId);
                    }, 200);
                }
            }, 500);
            break;
    }
    
    // Auto-scroll to the bottom
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Update tool call status
function updateToolCallStatus(toolCallId, status) {
    const mapping = toolCallStatusMap.get(toolCallId);
    if (!mapping) return;
    
    const item = document.getElementById(mapping.itemId);
    if (!item) return;
    
    const titleElement = item.querySelector('.timeline-item-title');
    if (!titleElement) return;
    
    // Remove previous status classes
    item.classList.remove('tool-call-running', 'tool-call-completed', 'tool-call-failed');

    const runningLabel = typeof window.t === 'function' ? window.t('timeline.running') : 'Running...';
    const completedLabel = typeof window.t === 'function' ? window.t('timeline.completed') : 'Completed';
    const failedLabel = typeof window.t === 'function' ? window.t('timeline.execFailed') : 'Execution failed';
    let statusText = '';
    if (status === 'running') {
        item.classList.add('tool-call-running');
        statusText = ' <span class="tool-status-badge tool-status-running">' + escapeHtml(runningLabel) + '</span>';
    } else if (status === 'completed') {
        item.classList.add('tool-call-completed');
        statusText = ' <span class="tool-status-badge tool-status-completed">✅ ' + escapeHtml(completedLabel) + '</span>';
    } else if (status === 'failed') {
        item.classList.add('tool-call-failed');
        statusText = ' <span class="tool-status-badge tool-status-failed">❌ ' + escapeHtml(failedLabel) + '</span>';
    }
    
    // Update the title (preserve the original text and append the status)
    const originalText = titleElement.innerHTML;
    // Remove any previously added status badge
    const cleanText = originalText.replace(/\s*<span class="tool-status-badge[^>]*>.*?<\/span>/g, '');
    titleElement.innerHTML = cleanText + statusText;
}

// Add a timeline item
function addTimelineItem(timeline, type, options) {
    const item = document.createElement('div');
    // Generate a unique ID
    const itemId = 'timeline-item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    item.id = itemId;
    item.className = `timeline-item timeline-item-${type}`;
    // Record type and parameters so the title text can be refreshed on a languagechange event
    item.dataset.timelineType = type;
    if (type === 'iteration' && options.iterationN != null) {
        item.dataset.iterationN = String(options.iterationN);
    }
    if (type === 'tool_calls_detected' && options.data && options.data.count != null) {
        item.dataset.toolCallsCount = String(options.data.count);
    }
    // Save the event time as ISO so the time format can be recalculated on language switch
    try {
        item.dataset.createdAtIso = eventTime.toISOString();
    } catch (e) { /* ignore */ }
    
    // Use the provided createdAt time; fall back to the current time if not provided (backward-compatible)
    let eventTime;
    if (options.createdAt) {
        // Handle string or Date object
        if (typeof options.createdAt === 'string') {
            eventTime = new Date(options.createdAt);
        } else if (options.createdAt instanceof Date) {
            eventTime = options.createdAt;
        } else {
            eventTime = new Date(options.createdAt);
        }
        // If parsing fails, use the current time
        if (isNaN(eventTime.getTime())) {
            eventTime = new Date();
        }
    } else {
        eventTime = new Date();
    }
    
    const timeLocale = getCurrentTimeLocale();
    const timeOpts = getTimeFormatOptions();
    const time = eventTime.toLocaleTimeString(timeLocale, timeOpts);
    
    let content = `
        <div class="timeline-item-header">
            <span class="timeline-item-time">${time}</span>
            <span class="timeline-item-title">${escapeHtml(options.title || '')}</span>
        </div>
    `;
    
    // Add detailed content based on type
    if (type === 'thinking' && options.message) {
        content += `<div class="timeline-item-content">${formatMarkdown(options.message)}</div>`;
    } else if (type === 'tool_call' && options.data) {
        const data = options.data;
        const args = data.argumentsObj || (data.arguments ? JSON.parse(data.arguments) : {});
        const paramsLabel = typeof window.t === 'function' ? window.t('timeline.params') : 'Parameters:';
        content += `
            <div class="timeline-item-content">
                <div class="tool-details">
                    <div class="tool-arg-section">
                        <strong>${escapeHtml(paramsLabel)}</strong>
                        <pre class="tool-args">${escapeHtml(JSON.stringify(args, null, 2))}</pre>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'tool_result' && options.data) {
        const data = options.data;
        const isError = data.isError || !data.success;
        const noResultText = typeof window.t === 'function' ? window.t('timeline.noResult') : 'No result';
        const result = data.result || data.error || noResultText;
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
        const execResultLabel = typeof window.t === 'function' ? window.t('timeline.executionResult') : 'Execution result:';
        const execIdLabel = typeof window.t === 'function' ? window.t('timeline.executionId') : 'Execution ID:';
        content += `
            <div class="timeline-item-content">
                <div class="tool-result-section ${isError ? 'error' : 'success'}">
                    <strong>${escapeHtml(execResultLabel)}</strong>
                    <pre class="tool-result">${escapeHtml(resultStr)}</pre>
                    ${data.executionId ? `<div class="tool-execution-id">${escapeHtml(execIdLabel)} <code>${escapeHtml(data.executionId)}</code></div>` : ''}
                </div>
            </div>
        `;
    } else if (type === 'cancelled') {
        const taskCancelledLabel = typeof window.t === 'function' ? window.t('chat.taskCancelled') : 'Task cancelled';
        content += `
            <div class="timeline-item-content">
                ${escapeHtml(options.message || taskCancelledLabel)}
            </div>
        `;
    }
    
    item.innerHTML = content;
    timeline.appendChild(item);
    
    // Auto-expand details
    const expanded = timeline.classList.contains('expanded');
    if (!expanded && (type === 'tool_call' || type === 'tool_result')) {
        // For tool calls and results, show summary by default
    }

    // Return item ID for subsequent updates
    return itemId;
}

// Load active task list
async function loadActiveTasks(showErrors = false) {
    const bar = document.getElementById('active-tasks-bar');
    try {
        const response = await apiFetch('/api/agent-loop/tasks');
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || (typeof window.t === 'function' ? window.t('tasks.loadActiveTasksFailed') : 'Failed to load active tasks'));
        }

        renderActiveTasks(result.tasks || []);
    } catch (error) {
        console.error('Failed to load active tasks:', error);
        if (showErrors && bar) {
            bar.style.display = 'block';
            const cannotGetStatus = typeof window.t === 'function' ? window.t('tasks.cannotGetTaskStatus') : 'Unable to get task status:';
            bar.innerHTML = `<div class="active-task-error">${escapeHtml(cannotGetStatus)}${escapeHtml(error.message)}</div>`;
        }
    }
}

function renderActiveTasks(tasks) {
    const bar = document.getElementById('active-tasks-bar');
    if (!bar) return;

    const normalizedTasks = Array.isArray(tasks) ? tasks : [];
    conversationExecutionTracker.update(normalizedTasks);
    if (typeof updateAttackChainAvailability === 'function') {
        updateAttackChainAvailability();
    }

    if (normalizedTasks.length === 0) {
        bar.style.display = 'none';
        bar.innerHTML = '';
        return;
    }

    bar.style.display = 'flex';
    bar.innerHTML = '';

    normalizedTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'active-task-item';

        const startedTime = task.startedAt ? new Date(task.startedAt) : null;
        const taskTimeLocale = getCurrentTimeLocale();
        const timeOpts = getTimeFormatOptions();
        const timeText = startedTime && !isNaN(startedTime.getTime())
            ? startedTime.toLocaleTimeString(taskTimeLocale, timeOpts)
            : '';

        const _t = function (k) { return typeof window.t === 'function' ? window.t(k) : k; };
        const statusMap = {
            'running': _t('tasks.statusRunning'),
            'cancelling': _t('tasks.statusCancelling'),
            'failed': _t('tasks.statusFailed'),
            'timeout': _t('tasks.statusTimeout'),
            'cancelled': _t('tasks.statusCancelled'),
            'completed': _t('tasks.statusCompleted')
        };
        const statusText = statusMap[task.status] || _t('tasks.statusRunning');
        const isFinalStatus = ['failed', 'timeout', 'cancelled', 'completed'].includes(task.status);
        const unnamedTaskText = _t('tasks.unnamedTask');
        const stopTaskBtnText = _t('tasks.stopTask');

        item.innerHTML = `
            <div class="active-task-info">
                <span class="active-task-status">${statusText}</span>
                <span class="active-task-message">${escapeHtml(task.message || unnamedTaskText)}</span>
            </div>
            <div class="active-task-actions">
                ${timeText ? `<span class="active-task-time">${timeText}</span>` : ''}
                ${!isFinalStatus ? '<button class="active-task-cancel">' + stopTaskBtnText + '</button>' : ''}
            </div>
        `;

        // Only show stop button for tasks not in a final state
        if (!isFinalStatus) {
            const cancelBtn = item.querySelector('.active-task-cancel');
            if (cancelBtn) {
                cancelBtn.onclick = () => cancelActiveTask(task.conversationId, cancelBtn);
                if (task.status === 'cancelling') {
                    cancelBtn.disabled = true;
                    cancelBtn.textContent = typeof window.t === 'function' ? window.t('tasks.cancelling') : 'Cancelling...';
                }
            }
        }

        bar.appendChild(item);
    });
}

async function cancelActiveTask(conversationId, button) {
    if (!conversationId) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = typeof window.t === 'function' ? window.t('tasks.cancelling') : 'Cancelling...';

    try {
        await requestCancel(conversationId);
        loadActiveTasks();
    } catch (error) {
        console.error('Failed to cancel task:', error);
        alert((typeof window.t === 'function' ? window.t('tasks.cancelTaskFailed') : 'Failed to cancel task') + ': ' + error.message);
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Monitor panel state
const monitorState = {
    executions: [],
    stats: {},
    lastFetchedAt: null,
    pagination: {
        page: 1,
        pageSize: (() => {
            // Read saved page size from localStorage, default is 20
            const saved = localStorage.getItem('monitorPageSize');
            return saved ? parseInt(saved, 10) : 20;
        })(),
        total: 0,
        totalPages: 0
    }
};

function openMonitorPanel() {
    // Switch to MCP monitor page
    if (typeof switchPage === 'function') {
        switchPage('mcp-monitor');
    }
    // Initialize page size selector
    initializeMonitorPageSize();
}

// Initialize page size selector
function initializeMonitorPageSize() {
    const pageSizeSelect = document.getElementById('monitor-page-size');
    if (pageSizeSelect) {
        pageSizeSelect.value = monitorState.pagination.pageSize;
    }
}

// Change page size
function changeMonitorPageSize() {
    const pageSizeSelect = document.getElementById('monitor-page-size');
    if (!pageSizeSelect) {
        return;
    }
    
    const newPageSize = parseInt(pageSizeSelect.value, 10);
    if (isNaN(newPageSize) || newPageSize <= 0) {
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('monitorPageSize', newPageSize.toString());

    // Update state
    monitorState.pagination.pageSize = newPageSize;
    monitorState.pagination.page = 1; // Reset to first page

    // Refresh data
    refreshMonitorPanel(1);
}

function closeMonitorPanel() {
    // Close functionality no longer needed since this is now a page, not a modal
    // If needed, can switch back to the chat page
    if (typeof switchPage === 'function') {
        switchPage('chat');
    }
}

async function refreshMonitorPanel(page = null) {
    const statsContainer = document.getElementById('monitor-stats');
    const execContainer = document.getElementById('monitor-executions');

    try {
        // If a page number is specified use it; otherwise use the current page number
        const currentPage = page !== null ? page : monitorState.pagination.page;
        const pageSize = monitorState.pagination.pageSize;

        // Get current filter conditions
        const statusFilter = document.getElementById('monitor-status-filter');
        const toolFilter = document.getElementById('monitor-tool-filter');
        const currentStatusFilter = statusFilter ? statusFilter.value : 'all';
        const currentToolFilter = toolFilter ? (toolFilter.value.trim() || 'all') : 'all';

        // Build request URL
        let url = `/api/monitor?page=${currentPage}&page_size=${pageSize}`;
        if (currentStatusFilter && currentStatusFilter !== 'all') {
            url += `&status=${encodeURIComponent(currentStatusFilter)}`;
        }
        if (currentToolFilter && currentToolFilter !== 'all') {
            url += `&tool=${encodeURIComponent(currentToolFilter)}`;
        }
        
        const response = await apiFetch(url, { method: 'GET' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch monitor data');
        }

        monitorState.executions = Array.isArray(result.executions) ? result.executions : [];
        monitorState.stats = result.stats || {};
        monitorState.lastFetchedAt = new Date();
        
        // Update pagination info
        if (result.total !== undefined) {
            monitorState.pagination = {
                page: result.page || currentPage,
                pageSize: result.page_size || pageSize,
                total: result.total || 0,
                totalPages: result.total_pages || 1
            };
        }

        renderMonitorStats(monitorState.stats, monitorState.lastFetchedAt);
        renderMonitorExecutions(monitorState.executions, currentStatusFilter);
        renderMonitorPagination();
        
        // Initialize page size selector
        initializeMonitorPageSize();
    } catch (error) {
        console.error('Failed to refresh monitor panel:', error);
        if (statsContainer) {
            statsContainer.innerHTML = `<div class="monitor-error">${escapeHtml(typeof window.t === 'function' ? window.t('mcpMonitor.loadStatsError') : 'Failed to load statistics')}: ${escapeHtml(error.message)}</div>`;
        }
        if (execContainer) {
            execContainer.innerHTML = `<div class="monitor-error">${escapeHtml(typeof window.t === 'function' ? window.t('mcpMonitor.loadExecutionsError') : 'Failed to load execution records')}: ${escapeHtml(error.message)}</div>`;
        }
    }
}

// Handle tool search input (debounce)
let toolFilterDebounceTimer = null;
function handleToolFilterInput() {
    // Clear previous timer
    if (toolFilterDebounceTimer) {
        clearTimeout(toolFilterDebounceTimer);
    }

    // Set new timer, execute filter after 500ms
    toolFilterDebounceTimer = setTimeout(() => {
        applyMonitorFilters();
    }, 500);
}

async function applyMonitorFilters() {
    const statusFilter = document.getElementById('monitor-status-filter');
    const toolFilter = document.getElementById('monitor-tool-filter');
    const status = statusFilter ? statusFilter.value : 'all';
    const tool = toolFilter ? (toolFilter.value.trim() || 'all') : 'all';
    // When filter conditions change, re-fetch data from backend
    await refreshMonitorPanelWithFilter(status, tool);
}

async function refreshMonitorPanelWithFilter(statusFilter = 'all', toolFilter = 'all') {
    const statsContainer = document.getElementById('monitor-stats');
    const execContainer = document.getElementById('monitor-executions');

    try {
        const currentPage = 1; // Reset to first page when filtering
        const pageSize = monitorState.pagination.pageSize;

        // Build request URL
        let url = `/api/monitor?page=${currentPage}&page_size=${pageSize}`;
        if (statusFilter && statusFilter !== 'all') {
            url += `&status=${encodeURIComponent(statusFilter)}`;
        }
        if (toolFilter && toolFilter !== 'all') {
            url += `&tool=${encodeURIComponent(toolFilter)}`;
        }
        
        const response = await apiFetch(url, { method: 'GET' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch monitor data');
        }

        monitorState.executions = Array.isArray(result.executions) ? result.executions : [];
        monitorState.stats = result.stats || {};
        monitorState.lastFetchedAt = new Date();
        
        // Update pagination info
        if (result.total !== undefined) {
            monitorState.pagination = {
                page: result.page || currentPage,
                pageSize: result.page_size || pageSize,
                total: result.total || 0,
                totalPages: result.total_pages || 1
            };
        }

        renderMonitorStats(monitorState.stats, monitorState.lastFetchedAt);
        renderMonitorExecutions(monitorState.executions, statusFilter);
        renderMonitorPagination();
        
        // Initialize page size selector
        initializeMonitorPageSize();
    } catch (error) {
        console.error('Failed to refresh monitor panel:', error);
        if (statsContainer) {
            statsContainer.innerHTML = `<div class="monitor-error">${escapeHtml(typeof window.t === 'function' ? window.t('mcpMonitor.loadStatsError') : 'Failed to load statistics')}: ${escapeHtml(error.message)}</div>`;
        }
        if (execContainer) {
            execContainer.innerHTML = `<div class="monitor-error">${escapeHtml(typeof window.t === 'function' ? window.t('mcpMonitor.loadExecutionsError') : 'Failed to load execution records')}: ${escapeHtml(error.message)}</div>`;
        }
    }
}


function renderMonitorStats(statsMap = {}, lastFetchedAt = null) {
    const container = document.getElementById('monitor-stats');
    if (!container) {
        return;
    }

    const entries = Object.values(statsMap);
    if (entries.length === 0) {
        const noStats = typeof window.t === 'function' ? window.t('mcpMonitor.noStatsData') : 'No statistics data';
        container.innerHTML = '<div class="monitor-empty">' + escapeHtml(noStats) + '</div>';
        return;
    }

    // Calculate overall summary
    const totals = entries.reduce(
        (acc, item) => {
            acc.total += item.totalCalls || 0;
            acc.success += item.successCalls || 0;
            acc.failed += item.failedCalls || 0;
            const lastCall = item.lastCallTime ? new Date(item.lastCallTime) : null;
            if (lastCall && (!acc.lastCallTime || lastCall > acc.lastCallTime)) {
                acc.lastCallTime = lastCall;
            }
            return acc;
        },
        { total: 0, success: 0, failed: 0, lastCallTime: null }
    );

    const successRate = totals.total > 0 ? ((totals.success / totals.total) * 100).toFixed(1) : '0.0';
    const locale = (typeof window.__locale === 'string' && window.__locale.startsWith('zh')) ? 'zh-CN' : undefined;
    const lastUpdatedText = lastFetchedAt ? (lastFetchedAt.toLocaleString ? lastFetchedAt.toLocaleString(locale || 'en-US') : String(lastFetchedAt)) : 'N/A';
    const noCallsYet = typeof window.t === 'function' ? window.t('mcpMonitor.noCallsYet') : 'No calls yet';
    const lastCallText = totals.lastCallTime ? (totals.lastCallTime.toLocaleString ? totals.lastCallTime.toLocaleString(locale || 'en-US') : String(totals.lastCallTime)) : noCallsYet;
    const totalCallsLabel = typeof window.t === 'function' ? window.t('mcpMonitor.totalCalls') : 'Total calls';
    const successFailedLabel = typeof window.t === 'function' ? window.t('mcpMonitor.successFailed', { success: totals.success, failed: totals.failed }) : `Success ${totals.success} / Failed ${totals.failed}`;
    const successRateLabel = typeof window.t === 'function' ? window.t('mcpMonitor.successRate') : 'Success rate';
    const statsFromAll = typeof window.t === 'function' ? window.t('mcpMonitor.statsFromAllTools') : 'Stats from all tool calls';
    const lastCallLabel = typeof window.t === 'function' ? window.t('mcpMonitor.lastCall') : 'Last call';
    const lastRefreshLabel = typeof window.t === 'function' ? window.t('mcpMonitor.lastRefreshTime') : 'Last refresh time';

    let html = `
        <div class="monitor-stat-card">
            <h4>${escapeHtml(totalCallsLabel)}</h4>
            <div class="monitor-stat-value">${totals.total}</div>
            <div class="monitor-stat-meta">${escapeHtml(successFailedLabel)}</div>
        </div>
        <div class="monitor-stat-card">
            <h4>${escapeHtml(successRateLabel)}</h4>
            <div class="monitor-stat-value">${successRate}%</div>
            <div class="monitor-stat-meta">${escapeHtml(statsFromAll)}</div>
        </div>
        <div class="monitor-stat-card">
            <h4>${escapeHtml(lastCallLabel)}</h4>
            <div class="monitor-stat-value" style="font-size:1rem;">${escapeHtml(lastCallText)}</div>
            <div class="monitor-stat-meta">${escapeHtml(lastRefreshLabel)}: ${escapeHtml(lastUpdatedText)}</div>
        </div>
    `;

    // Show stats for up to the top 4 tools (filter out tools with totalCalls = 0)
    const topTools = entries
        .filter(tool => (tool.totalCalls || 0) > 0)
        .slice()
        .sort((a, b) => (b.totalCalls || 0) - (a.totalCalls || 0))
        .slice(0, 4);

    const unknownToolLabel = typeof window.t === 'function' ? window.t('mcpMonitor.unknownTool') : 'Unknown tool';
    topTools.forEach(tool => {
        const toolSuccessRate = tool.totalCalls > 0 ? ((tool.successCalls || 0) / tool.totalCalls * 100).toFixed(1) : '0.0';
        const toolMeta = typeof window.t === 'function' ? window.t('mcpMonitor.successFailedRate', { success: tool.successCalls || 0, failed: tool.failedCalls || 0, rate: toolSuccessRate }) : `Success ${tool.successCalls || 0} / Failed ${tool.failedCalls || 0} · Rate ${toolSuccessRate}%`;
        html += `
            <div class="monitor-stat-card">
                <h4>${escapeHtml(tool.toolName || unknownToolLabel)}</h4>
                <div class="monitor-stat-value">${tool.totalCalls || 0}</div>
                <div class="monitor-stat-meta">
                    ${escapeHtml(toolMeta)}
                </div>
            </div>
        `;
    });

    container.innerHTML = `<div class="monitor-stats-grid">${html}</div>`;
}

function renderMonitorExecutions(executions = [], statusFilter = 'all') {
    const container = document.getElementById('monitor-executions');
    if (!container) {
        return;
    }

    if (!Array.isArray(executions) || executions.length === 0) {
        // Show different message depending on whether filters are applied
        const toolFilter = document.getElementById('monitor-tool-filter');
        const currentToolFilter = toolFilter ? toolFilter.value : 'all';
        const hasFilter = (statusFilter && statusFilter !== 'all') || (currentToolFilter && currentToolFilter !== 'all');
        const noRecordsFilter = typeof window.t === 'function' ? window.t('mcpMonitor.noRecordsWithFilter') : 'No records match current filters';
        const noExecutions = typeof window.t === 'function' ? window.t('mcpMonitor.noExecutions') : 'No execution records';
        if (hasFilter) {
            container.innerHTML = '<div class="monitor-empty">' + escapeHtml(noRecordsFilter) + '</div>';
        } else {
            container.innerHTML = '<div class="monitor-empty">' + escapeHtml(noExecutions) + '</div>';
        }
        // Hide batch action bar
        const batchActions = document.getElementById('monitor-batch-actions');
        if (batchActions) {
            batchActions.style.display = 'none';
        }
        return;
    }

    // Since filtering is done on the backend, use all execution records passed in
    // No need to filter again on the frontend, since the backend already returned filtered data
    const unknownLabel = typeof window.t === 'function' ? window.t('mcpMonitor.unknown') : 'Unknown';
    const unknownToolLabel = typeof window.t === 'function' ? window.t('mcpMonitor.unknownTool') : 'Unknown tool';
    const viewDetailLabel = typeof window.t === 'function' ? window.t('mcpMonitor.viewDetail') : 'View details';
    const deleteLabel = typeof window.t === 'function' ? window.t('mcpMonitor.delete') : 'Delete';
    const deleteExecTitle = typeof window.t === 'function' ? window.t('mcpMonitor.deleteExecTitle') : 'Delete this execution record';
    const statusKeyMap = { pending: 'statusPending', running: 'statusRunning', completed: 'statusCompleted', failed: 'statusFailed' };
    const locale = (typeof window.__locale === 'string' && window.__locale.startsWith('zh')) ? 'zh-CN' : undefined;
    const rows = executions
        .map(exec => {
            const status = (exec.status || 'unknown').toLowerCase();
            const statusClass = `monitor-status-chip ${status}`;
            const statusKey = statusKeyMap[status];
            const statusLabel = (typeof window.t === 'function' && statusKey) ? window.t('mcpMonitor.' + statusKey) : getStatusText(status);
            const startTime = exec.startTime ? (new Date(exec.startTime).toLocaleString ? new Date(exec.startTime).toLocaleString(locale || 'en-US') : String(exec.startTime)) : unknownLabel;
            const duration = formatExecutionDuration(exec.startTime, exec.endTime);
            const toolName = escapeHtml(exec.toolName || unknownToolLabel);
            const executionId = escapeHtml(exec.id || '');
            return `
                <tr>
                    <td>
                        <input type="checkbox" class="monitor-execution-checkbox" value="${executionId}" onchange="updateBatchActionsState()" />
                    </td>
                    <td>${toolName}</td>
                    <td><span class="${statusClass}">${escapeHtml(statusLabel)}</span></td>
                    <td>${escapeHtml(startTime)}</td>
                    <td>${escapeHtml(duration)}</td>
                    <td>
                        <div class="monitor-execution-actions">
                            <button class="btn-secondary" onclick="showMCPDetail('${executionId}')">${escapeHtml(viewDetailLabel)}</button>
                            <button class="btn-secondary btn-delete" onclick="deleteExecution('${executionId}')" title="${escapeHtml(deleteExecTitle)}">${escapeHtml(deleteLabel)}</button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join('');

    // First remove old table container and loading message (keep pagination controls)
    const oldTableContainer = container.querySelector('.monitor-table-container');
    if (oldTableContainer) {
        oldTableContainer.remove();
    }
    // Clear "Loading..." and similar messages
    const oldEmpty = container.querySelector('.monitor-empty');
    if (oldEmpty) {
        oldEmpty.remove();
    }
    
    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'monitor-table-container';
    const colTool = typeof window.t === 'function' ? window.t('mcpMonitor.columnTool') : 'Tool';
    const colStatus = typeof window.t === 'function' ? window.t('mcpMonitor.columnStatus') : 'Status';
    const colStartTime = typeof window.t === 'function' ? window.t('mcpMonitor.columnStartTime') : 'Start time';
    const colDuration = typeof window.t === 'function' ? window.t('mcpMonitor.columnDuration') : 'Duration';
    const colActions = typeof window.t === 'function' ? window.t('mcpMonitor.columnActions') : 'Actions';
    tableContainer.innerHTML = `
        <table class="monitor-table">
            <thead>
                <tr>
                    <th style="width: 40px;">
                        <input type="checkbox" id="monitor-select-all" onchange="toggleSelectAll(this)" />
                    </th>
                    <th>${escapeHtml(colTool)}</th>
                    <th>${escapeHtml(colStatus)}</th>
                    <th>${escapeHtml(colStartTime)}</th>
                    <th>${escapeHtml(colDuration)}</th>
                    <th>${escapeHtml(colActions)}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
    
    // Insert table before pagination controls (if they exist)
    const existingPagination = container.querySelector('.monitor-pagination');
    if (existingPagination) {
        container.insertBefore(tableContainer, existingPagination);
    } else {
        container.appendChild(tableContainer);
    }
    
    // Update batch action state
    updateBatchActionsState();
}

// Render monitor panel pagination controls
function renderMonitorPagination() {
    const container = document.getElementById('monitor-executions');
    if (!container) return;
    
    // Remove old pagination controls
    const oldPagination = container.querySelector('.monitor-pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
    
    const { page, totalPages, total, pageSize } = monitorState.pagination;
    
    // Always show pagination controls
    const pagination = document.createElement('div');
    pagination.className = 'monitor-pagination';
    
    // Handle case with no data
    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = total === 0 ? 0 : Math.min(page * pageSize, total);
    const paginationInfoText = typeof window.t === 'function' ? window.t('mcpMonitor.paginationInfo', { start: startItem, end: endItem, total: total }) : `Showing ${startItem}-${endItem} of ${total} records`;
    const perPageLabel = typeof window.t === 'function' ? window.t('mcpMonitor.perPageLabel') : 'Per page';
    const firstPageLabel = typeof window.t === 'function' ? window.t('mcp.firstPage') : 'First';
    const prevPageLabel = typeof window.t === 'function' ? window.t('mcp.prevPage') : 'Previous';
    const pageInfoText = typeof window.t === 'function' ? window.t('mcp.pageInfo', { page: page, total: totalPages || 1 }) : `Page ${page} / ${totalPages || 1}`;
    const nextPageLabel = typeof window.t === 'function' ? window.t('mcp.nextPage') : 'Next';
    const lastPageLabel = typeof window.t === 'function' ? window.t('mcp.lastPage') : 'Last';
    pagination.innerHTML = `
        <div class="pagination-info">
            <span>${escapeHtml(paginationInfoText)}</span>
            <label class="pagination-page-size">
                ${escapeHtml(perPageLabel)}
                <select id="monitor-page-size" onchange="changeMonitorPageSize()">
                    <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                    <option value="20" ${pageSize === 20 ? 'selected' : ''}>20</option>
                    <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
                </select>
            </label>
        </div>
        <div class="pagination-controls">
            <button class="btn-secondary" onclick="refreshMonitorPanel(1)" ${page === 1 || total === 0 ? 'disabled' : ''}>${escapeHtml(firstPageLabel)}</button>
            <button class="btn-secondary" onclick="refreshMonitorPanel(${page - 1})" ${page === 1 || total === 0 ? 'disabled' : ''}>${escapeHtml(prevPageLabel)}</button>
            <span class="pagination-page">${escapeHtml(pageInfoText)}</span>
            <button class="btn-secondary" onclick="refreshMonitorPanel(${page + 1})" ${page >= totalPages || total === 0 ? 'disabled' : ''}>${escapeHtml(nextPageLabel)}</button>
            <button class="btn-secondary" onclick="refreshMonitorPanel(${totalPages || 1})" ${page >= totalPages || total === 0 ? 'disabled' : ''}>${escapeHtml(lastPageLabel)}</button>
        </div>
    `;
    
    container.appendChild(pagination);
    
    // Initialize page size selector
    initializeMonitorPageSize();
}

// Delete execution record
async function deleteExecution(executionId) {
    if (!executionId) {
        return;
    }
    
    const deleteConfirmMsg = typeof window.t === 'function' ? window.t('mcpMonitor.deleteExecConfirmSingle') : 'Are you sure you want to delete this execution record? This action cannot be undone.';
    appConfirm(deleteConfirmMsg, async function() {
        try {
            const response = await apiFetch(`/api/monitor/execution/${executionId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const deleteFailedMsg = typeof window.t === 'function' ? window.t('mcpMonitor.deleteExecFailed') : 'Failed to delete execution record';
                throw new Error(error.error || deleteFailedMsg);
            }

            // Refresh current page after successful deletion
            const currentPage = monitorState.pagination.page;
            await refreshMonitorPanel(currentPage);

            const execDeletedMsg = typeof window.t === 'function' ? window.t('mcpMonitor.execDeleted') : 'Execution record deleted';
            alert(execDeletedMsg);
        } catch (error) {
            console.error('Failed to delete execution record:', error);
            const deleteFailedMsg = typeof window.t === 'function' ? window.t('mcpMonitor.deleteExecFailed') : 'Failed to delete execution record';
            alert(deleteFailedMsg + ': ' + error.message);
        }
    });
    return;
}

// Update batch action state
function updateBatchActionsState() {
    const checkboxes = document.querySelectorAll('.monitor-execution-checkbox:checked');
    const selectedCount = checkboxes.length;
    const batchActions = document.getElementById('monitor-batch-actions');
    const selectedCountSpan = document.getElementById('monitor-selected-count');
    
    if (selectedCount > 0) {
        if (batchActions) {
            batchActions.style.display = 'flex';
        }
    } else {
        if (batchActions) {
            batchActions.style.display = 'none';
        }
    }
    if (selectedCountSpan) {
        selectedCountSpan.textContent = typeof window.t === 'function' ? window.t('mcp.selectedCount', { count: selectedCount }) : 'Selected ' + selectedCount + ' item(s)';
    }
    
    // Update select-all checkbox state
    const selectAllCheckbox = document.getElementById('monitor-select-all');
    if (selectAllCheckbox) {
        const allCheckboxes = document.querySelectorAll('.monitor-execution-checkbox');
        const allChecked = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < allCheckboxes.length;
    }
}

// Toggle select all
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.monitor-execution-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateBatchActionsState();
}

// Select all
function selectAllExecutions() {
    const checkboxes = document.querySelectorAll('.monitor-execution-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = true;
    });
    const selectAllCheckbox = document.getElementById('monitor-select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    }
    updateBatchActionsState();
}

// Deselect all
function deselectAllExecutions() {
    const checkboxes = document.querySelectorAll('.monitor-execution-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
    const selectAllCheckbox = document.getElementById('monitor-select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    updateBatchActionsState();
}

// Batch delete execution records
async function batchDeleteExecutions() {
    const checkboxes = document.querySelectorAll('.monitor-execution-checkbox:checked');
    if (checkboxes.length === 0) {
        const selectFirstMsg = typeof window.t === 'function' ? window.t('mcpMonitor.selectExecFirst') : 'Please select execution records to delete first';
        alert(selectFirstMsg);
        return;
    }
    
    const ids = Array.from(checkboxes).map(cb => cb.value);
    const count = ids.length;
    const batchConfirmMsg = typeof window.t === 'function' ? window.t('mcpMonitor.batchDeleteConfirm', { count: count }) : `Are you sure you want to delete ${count} selected execution record(s)? This action cannot be undone.`;
    appConfirm(batchConfirmMsg, async function() {
        try {
            const response = await apiFetch('/api/monitor/executions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: ids })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const batchFailedMsg = typeof window.t === 'function' ? window.t('mcp.batchDeleteFailed') : 'Failed to batch delete execution records';
                throw new Error(error.error || batchFailedMsg);
            }

            const result = await response.json().catch(() => ({}));
            const deletedCount = result.deleted || count;

            // Refresh current page after successful deletion
            const currentPage = monitorState.pagination.page;
            await refreshMonitorPanel(currentPage);

            const batchSuccessMsg = typeof window.t === 'function' ? window.t('mcpMonitor.batchDeleteSuccess', { count: deletedCount }) : `Successfully deleted ${deletedCount} execution record(s)`;
            alert(batchSuccessMsg);
        } catch (error) {
            console.error('Failed to batch delete execution records:', error);
            const batchFailedMsg = typeof window.t === 'function' ? window.t('mcp.batchDeleteFailed') : 'Failed to batch delete execution records';
            alert(batchFailedMsg + ': ' + error.message);
        }
    });
    return;
}

function formatExecutionDuration(start, end) {
    const unknownLabel = typeof window.t === 'function' ? window.t('mcpMonitor.unknown') : 'Unknown';
    if (!start) {
        return unknownLabel;
    }
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
        return unknownLabel;
    }
    const diffMs = Math.max(0, endTime - startTime);
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) {
        return typeof window.t === 'function' ? window.t('mcpMonitor.durationSeconds', { n: seconds }) : seconds + 's';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        const remain = seconds % 60;
        if (remain > 0) {
            return typeof window.t === 'function' ? window.t('mcpMonitor.durationMinutes', { minutes: minutes, seconds: remain }) : minutes + 'm ' + remain + 's';
        }
        return typeof window.t === 'function' ? window.t('mcpMonitor.durationMinutesOnly', { minutes: minutes }) : minutes + 'm';
    }
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    if (remainMinutes > 0) {
        return typeof window.t === 'function' ? window.t('mcpMonitor.durationHours', { hours: hours, minutes: remainMinutes }) : hours + 'h ' + remainMinutes + 'm';
    }
    return typeof window.t === 'function' ? window.t('mcpMonitor.durationHoursOnly', { hours: hours }) : hours + 'h';
}

/**
 * After a language switch, refresh rendered progress bars, timeline titles, and time formats
 * in the chat page (avoids still showing old language or AM/PM)
 */
function refreshProgressAndTimelineI18n() {
    const _t = function (k, o) {
        return typeof window.t === 'function' ? window.t(k, o) : k;
    };
    const timeLocale = getCurrentTimeLocale();
    const timeOpts = getTimeFormatOptions();

    // Progress block stop buttons: when not disabled, update to current language's "Stop task" text
    document.querySelectorAll('.progress-message .progress-stop').forEach(function (btn) {
        if (!btn.disabled && btn.id && btn.id.indexOf('-stop-btn') !== -1) {
            const cancelling = _t('tasks.cancelling');
            if (btn.textContent !== cancelling) {
                btn.textContent = _t('tasks.stopTask');
            }
        }
    });
    document.querySelectorAll('.progress-toggle').forEach(function (btn) {
        const timeline = btn.closest('.progress-container, .message-bubble') &&
            btn.closest('.progress-container, .message-bubble').querySelector('.progress-timeline');
        const expanded = timeline && timeline.classList.contains('expanded');
        btn.textContent = expanded ? _t('tasks.collapseDetail') : _t('chat.expandDetail');
    });
    document.querySelectorAll('.progress-message').forEach(function (msgEl) {
        const raw = msgEl.dataset.progressRawMessage;
        const titleEl = msgEl.querySelector('.progress-title');
        if (titleEl && raw) {
            titleEl.textContent = '\uD83D\uDD0D ' + translateProgressMessage(raw);
        }
    });

    // Timeline items: recalculate title by type, and redraw timestamps
    document.querySelectorAll('.timeline-item').forEach(function (item) {
        const type = item.dataset.timelineType;
        const titleSpan = item.querySelector('.timeline-item-title');
        const timeSpan = item.querySelector('.timeline-item-time');
        if (!titleSpan) return;
        if (type === 'iteration' && item.dataset.iterationN) {
            const n = parseInt(item.dataset.iterationN, 10) || 1;
            titleSpan.textContent = _t('chat.iterationRound', { n: n });
        } else if (type === 'thinking') {
            titleSpan.textContent = '\uD83E\uDD14 ' + _t('chat.aiThinking');
        } else if (type === 'tool_calls_detected' && item.dataset.toolCallsCount != null) {
            const count = parseInt(item.dataset.toolCallsCount, 10) || 0;
            titleSpan.textContent = '\uD83D\uDD27 ' + _t('chat.toolCallsDetected', { count: count });
        }
        if (timeSpan && item.dataset.createdAtIso) {
            const d = new Date(item.dataset.createdAtIso);
            if (!isNaN(d.getTime())) {
                timeSpan.textContent = d.toLocaleTimeString(timeLocale, timeOpts);
            }
        }
    });

    // Details area "Expand/Collapse" button
    document.querySelectorAll('.process-detail-btn span').forEach(function (span) {
        const btn = span.closest('.process-detail-btn');
        const assistantId = btn && btn.closest('.message.assistant') && btn.closest('.message.assistant').id;
        if (!assistantId) return;
        const detailsId = 'process-details-' + assistantId;
        const timeline = document.getElementById(detailsId) && document.getElementById(detailsId).querySelector('.progress-timeline');
        const expanded = timeline && timeline.classList.contains('expanded');
        span.textContent = expanded ? _t('tasks.collapseDetail') : _t('chat.expandDetail');
    });
}

document.addEventListener('languagechange', function () {
    updateBatchActionsState();
    loadActiveTasks();
    refreshProgressAndTimelineI18n();
});
