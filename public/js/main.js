async function init() {
    const tokenOverlay = document.getElementById('token-overlay');
    const oauthOverlay = document.getElementById('oauth-overlay');
    const wrapper = document.getElementById('main-app-wrapper');

    try {
        const response = await fetch('/auth/status');
        const status = await response.json();

        if (status && status.needsToken === true) {
            if (wrapper) wrapper.style.display = 'none';
            if (status.needsOAuth) {
                if (oauthOverlay) oauthOverlay.style.display = 'flex';
                if (tokenOverlay) tokenOverlay.style.display = 'none';
            } else {
                if (oauthOverlay) oauthOverlay.style.display = 'none';
                if (tokenOverlay) tokenOverlay.style.display = 'flex';
            }
        } else {
            if (oauthOverlay) oauthOverlay.style.display = 'none';
            if (tokenOverlay) tokenOverlay.style.display = 'none';
            if (wrapper) wrapper.style.display = 'block';
            await loadCourses();
        }
    } catch (err) {
        debugLog("Init Error: " + err.message, 'error');
    }
}

async function submitCredentials() {
    const canvasUrl = document.getElementById('canvas-url-input').value;
    const token = document.getElementById('token-input').value;

    if (!canvasUrl || !token) {
        alert("Both Canvas URL and Token are required.");
        return;
    }

    try {
        const response = await fetch('/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ canvasUrl, token })
        });

        const result = await response.json();

        if (result.success) {
            location.reload();
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        debugLog("Login error: " + err.message, 'error');
    }
}
function showFlashError(message) {
    const overlay = document.getElementById('token-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.style.background = '';
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    } else {
        alert(message);
    }
}

// Run the function as soon as the window loads
window.onload = init;
let authFailureHandled = false;
function showTokenOverlayForAuthFailure(detailMessage) {
    if (authFailureHandled) return;
    authFailureHandled = true;
    const tok = document.getElementById('token-overlay');
    const oauth = document.getElementById('oauth-overlay');
    const wrap = document.getElementById('main-app-wrapper');
    if (wrap) wrap.style.display = 'none';
    if (oauth) oauth.style.display = 'none';
    if (tok) tok.style.display = 'flex';
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = 'Session expired or token invalid. Re-enter Canvas URL and token.';
        loginError.style.display = 'block';
    }
    debugLog('Session expired or token invalid. Please re-enter Canvas URL and token.', 'warn');
    if (detailMessage) debugLog('ERROR: ' + detailMessage, 'error');
}

const nativeFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    try {
        const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const isAuthRoute = requestUrl.includes('/auth/status') || requestUrl.includes('/auth/set-token');
        if (response.status === 401 && !isAuthRoute) {
            let detail = '';
            try {
                const raw = await response.clone().text();
                if (raw) {
                    try {
                        const body = JSON.parse(raw);
                        detail = String(body?.message || body?.error || raw);
                    } catch {
                        detail = raw;
                    }
                }
            } catch (_) {}
            showTokenOverlayForAuthFailure(detail);
        }
    } catch (_) {}
    return response;
};
let assignmentGroupsCache = {};
let rubricsCache = {};
const undoStack = [];
const EDIT_HISTORY_CAP = 500;
const SNAPSHOT_KEY_PREFIX = 'bulkeditor:snapshots:';
const SNAPSHOT_LIMIT_PER_TAB = 5;
let suppressCellChangeLog = false;
let failedRevertRowIds = new Set();
let pendingRevertSnapshotId = null;
const REQUEST_CONCURRENCY_LIMIT = 6;
const ACCESSIBILITY_FIX_PREVIEW_CONCURRENCY = 3;
const BULK_UPDATE_TABS = new Set(['assignments', 'quizzes', 'discussions', 'pages', 'announcements', 'modules']);

const BULK_EDITOR_GRID_ROW_SELECTION = Object.freeze({
    mode: 'multiRow',
    selectAll: 'filtered',
    headerCheckbox: true,
    checkboxes: true,
    enableClickSelection: false,
});



const FIELD_DEFINITIONS = window.FIELD_DEFINITIONS || window.CANVAS_CONFIG?.FIELD_DEFINITIONS || {};
const REVERT_BLOCKED_FIELDS = new Set([
    'id', 'uuid', 'created_at', 'updated_at', 'items_count', 'items', 'html_url', 'url',
    'workflow_state', 'publish_at', 'course_id', 'context_type', 'context_id', 'lti_context_id',
    'global_id', 'secure_params', 'original_lti_resource_link_id', 'items_url', 'locked_for_user',
    'lock_info', 'lock_explanation', 'permissions', 'submission', 'overrides', 'all_dates', 'can_duplicate'
]);

function getSnapshotStorageKey(tab) {
    return `${SNAPSHOT_KEY_PREFIX}${tab}`;
}

function loadSnapshots(tab) {
    try {
        const raw = localStorage.getItem(getSnapshotStorageKey(tab));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveSnapshots(tab, snapshots) {
    const trimmed = (Array.isArray(snapshots) ? snapshots : []).slice(0, SNAPSHOT_LIMIT_PER_TAB);
    localStorage.setItem(getSnapshotStorageKey(tab), JSON.stringify(trimmed));
}

function clearInMemoryChangeLog() {
    undoStack.length = 0;
}

function pushEditHistoryRecord(record) {
    if (!record || !Array.isArray(record.cells) || !record.cells.length) return;
    undoStack.push({
        type: record.type === 'bulk' ? 'bulk' : 'individual',
        tab: record.tab || currentTab,
        timestamp: Date.now(),
        pending: record.pending === true,
        cells: record.cells.map(c => ({
            rowId: String(c.rowId),
            field: c.field,
            beforeValue: c.beforeValue,
            afterValue: c.afterValue,
        })),
    });
    if (undoStack.length > EDIT_HISTORY_CAP) {
        undoStack.splice(0, undoStack.length - EDIT_HISTORY_CAP);
    }
}

function valuesEqual(a, b) {
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    }
    return false;
}

function createCellSnapshot(rowData, field, beforeValue, afterValue) {
    if (!rowData || !field || isFieldReadOnlyForTab(currentTab, field)) return null;
    if (valuesEqual(beforeValue, afterValue)) return null;
    const rowId = getRowIdForData(rowData);
    if (rowId == null) return null;
    return {
        rowId: String(rowId),
        field,
        beforeValue,
        afterValue,
    };
}

function applyHistoryCells(cells, valueKey) {
    if (!gridApi || !Array.isArray(cells) || !cells.length) return 0;
    const rowMap = new Map();
    gridApi.forEachNode(node => {
        rowMap.set(String(getRowIdForData(node.data)), node);
    });
    const touchedRowIds = new Set();
    const affectedFields = new Set();
    cells.forEach(cell => {
        const node = rowMap.get(String(cell.rowId));
        if (!node) return;
        const nextValue = cell[valueKey];
        node.data[cell.field] = nextValue;
        updateTrackedChangeForCell(currentTab, String(cell.rowId), cell.field, nextValue);
        touchedRowIds.add(String(cell.rowId));
        affectedFields.add(cell.field);
    });
    const touchedNodes = Array.from(touchedRowIds).map(id => rowMap.get(id)).filter(Boolean);
    touchedNodes.forEach(node => {
        const rowId = String(getRowIdForData(node.data));
        const rowChanges = changes[currentTab]?.[rowId] || {};
        const hasChanges = Object.keys(rowChanges).length > 0;
        node.data._edit_status = hasChanges ? 'modified' : 'synced';
    });
    affectedFields.add('_edit_status');
    if (touchedNodes.length) {
        gridApi.refreshCells({ rowNodes: touchedNodes, columns: Array.from(affectedFields), force: true });
        gridApi.redrawRows({ rowNodes: touchedNodes });
    }
    return touchedRowIds.size;
}

function applyBulkCellSnapshots(cells) {
    if (!Array.isArray(cells) || !cells.length) return 0;
    pushEditHistoryRecord({ type: 'bulk', tab: currentTab, cells });
    return applyHistoryCells(cells, 'afterValue');
}

function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.top = '12px';
        container.style.right = '12px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#106c2c' : type === 'error' ? '#8b1a1a' : type === 'warn' ? '#8b5a00' : '#1f3a5f';
    toast.style.background = bg;
    toast.style.color = '#fff';
    toast.style.padding = '10px 12px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
    toast.style.fontSize = '13px';
    toast.textContent = message;
    container.appendChild(toast);
    window.setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration);
}

function stableSerialize(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableSerialize(value[k])}`).join(',')}}`;
}

function toRequestErrorMessage(response, rawText) {
    let errMsg = response.statusText || `HTTP ${response.status}`;
    try {
        const errBody = rawText ? JSON.parse(rawText) : {};
        const msg = errBody.message ?? errBody.error;
        if (typeof msg === 'string') errMsg = msg;
        else if (msg != null) errMsg = JSON.stringify(msg);
        else if (rawText) errMsg = rawText;
    } catch (_) {
        if (rawText) errMsg = rawText.slice(0, 1000);
    }
    return errMsg;
}

async function runWithConcurrency(items, limit, worker) {
    const out = new Array(items.length);
    let next = 0;
    async function runWorker() {
        while (true) {
            const idx = next++;
            if (idx >= items.length) break;
            try {
                out[idx] = { status: 'fulfilled', value: await worker(items[idx], idx) };
            } catch (error) {
                out[idx] = { status: 'rejected', reason: error };
            }
        }
    }
    const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => runWorker());
    await Promise.all(workers);
    return out;
}

function getConfigKey(tabOrType) {
    if (!tabOrType) return tabOrType;
    if (FIELD_DEFINITIONS[tabOrType]) return tabOrType;
    if (tabOrType === 'discussions') return 'discussion_topics';
    return tabOrType;
}

function getRubricAssociationIdForRow(rowData, tabName) {
    if (!rowData) return null;
    if (tabName === 'assignments') return Number(rowData.id) || null;
    if (tabName === 'quizzes') return Number(rowData.assignment_id) || null;
    if (tabName === 'new_quizzes') return Number(rowData.id) || null;
    if (tabName === 'discussions') return Number(rowData.assignment_id) || null;
    return null;
}

function getRubricTitleForRow(rowData) {
    const base = (rowData?.name || rowData?.title || 'Item').toString().trim();
    return `Rubric - ${base}`;
}

async function loadRubricsForCourse(courseId) {
    if (!courseId) return;
    try {
        const res = await fetch(`/canvas/courses/${courseId}/rubrics`);
        if (!res.ok) throw new Error(await res.text());
        const list = await res.json();
        const map = {};
        (Array.isArray(list) ? list : []).forEach(r => {
            const id = Number(r?.id);
            if (Number.isFinite(id)) map[id] = { title: r.title || `Rubric ${id}`, url: r.url || '' };
        });
        rubricsCache[courseId] = map;
    } catch (_) {
        rubricsCache[courseId] = rubricsCache[courseId] || {};
    }
}

async function createRubricForRow(params) {
    const rowData = params?.data;
    if (!selectedCourseId || !rowData) return;
    const associationId = getRubricAssociationIdForRow(rowData, currentTab);
    if (!associationId) {
        alert('This item does not support rubric scoring.');
        params.node.setDataValue('rubric_id', rowData.rubric_id || null);
        return;
    }
    const title = getRubricTitleForRow(rowData);
    const res = await fetch(`/canvas/courses/${selectedCourseId}/rubrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, association_id: associationId, association_type: 'Assignment' })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || res.statusText);
    }
    const created = await res.json();
    const rid = Number(created?.id);
    if (!Number.isFinite(rid)) throw new Error('Rubric ID not returned');
    rubricsCache[selectedCourseId] = rubricsCache[selectedCourseId] || {};
    rubricsCache[selectedCourseId][rid] = { title: created.title || title, url: created.url || '' };
    params.node.setDataValue('rubric_id', rid);
    params.node.setDataValue('rubric_summary', created.title || title);
    params.node.setDataValue('rubric_url', created.url || '');
    params.node.setDataValue('_edit_status', 'synced');
    const itemId = params.data?.id || params.data?.url;
    const baseline = originalData[currentTab]?.find(item => String(item.id || item.url) === String(itemId));
    if (baseline) {
        baseline.rubric_id = rid;
        baseline.rubric_summary = created.title || title;
        baseline.rubric_url = created.url || '';
    }
    if (changes[currentTab] && changes[currentTab][itemId]) {
        delete changes[currentTab][itemId].rubric_id;
        delete changes[currentTab][itemId].rubric_summary;
        delete changes[currentTab][itemId].rubric_url;
        if (Object.keys(changes[currentTab][itemId]).length === 0) delete changes[currentTab][itemId];
    }
    params.api.refreshCells({ rowNodes: [params.node], force: true });
    if (created.url) {
        const openNow = window.confirm('Rubric created. Open it in Canvas to edit criteria now?');
        if (openNow) window.open(created.url, '_blank', 'noopener');
    }
}

function debugLog(message, type = 'info') {
    const debugContent = document.getElementById('debugContent');
    if (!debugContent) return;

    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    const logEntry = document.createElement('div');
    logEntry.className = 'debug-entry';
    
    const typeColors = {
        info: '#00ff00',
        warn: '#ffb000',
        error: '#ff0000',
        success: '#00ffff'
    };
    
    logEntry.style.color = typeColors[type] || typeColors.info;
    
    const logPrefix = type !== 'info' ? ` ${type.toUpperCase()}:` : '';
    logEntry.textContent = `[${timestamp}]${logPrefix} ${message}`;
    
    debugContent.appendChild(logEntry);
    debugContent.scrollTop = debugContent.scrollHeight;

    if (type === 'warn' || type === 'error') console.log(`%c[${type.toUpperCase()}] ${message}`, `color: ${typeColors[type]}`);
}

function toggleDebugPanel() {
    const debugPanel = document.getElementById('debugPanel');
    const debugToggleBtn = document.getElementById('debugToggle');
    if (!debugPanel || !debugToggleBtn) return;

    debugPanel.classList.toggle('collapsed');
    debugToggleBtn.textContent = debugPanel.classList.contains('collapsed') ? '▲' : '▼';
}

async function copyDebugLogToClipboard(ev) {
    if (ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }
    const debugContent = document.getElementById('debugContent');
    if (!debugContent) return;
    const lines = Array.from(debugContent.querySelectorAll('.debug-entry'))
        .map((n) => (n.textContent || '').trim())
        .filter(Boolean);
    const text = lines.length ? lines.join('\n') : (debugContent.innerText || '').trim();
    if (!text) {
        alert('No debug log entries to copy.');
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
    } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
        } finally {
            document.body.removeChild(ta);
        }
    }
    const btn = document.getElementById('debugCopyBtn');
    if (btn) {
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = prev; }, 1500);
    }
}

function clearDebugLog(ev) {
    if (ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }
    const debugContent = document.getElementById('debugContent');
    if (!debugContent) return;
    debugContent.innerHTML = '';
}

// Debug Panel Drag and Drop
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

function dragStart(e) {
    if (e.target.closest('.debug-copy-btn')) return;
    if (e.target.closest('.debug-panel-header')) {
        isDragging = true;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }
}

function dragEnd() {
    isDragging = false;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        const debugPanel = document.getElementById('debugPanel');
        debugPanel.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
}

// Initialize debug panel drag functionality
document.addEventListener('DOMContentLoaded', function() {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        debugPanel.addEventListener('mousedown', dragStart);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('mousemove', drag);
    }
});

// Keyboard shortcut for debug panel toggle (Ctrl+Alt+D)
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        toggleDebugPanel();
    }
});

const SPINNER_DELAY_MS_DEFAULT = 300;

function isElementFullyInViewport(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return false;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= vh && rect.right <= vw;
}

function scrollIntoViewIfNeeded(el, opts = {}) {
    if (!el) return;
    if (isElementFullyInViewport(el)) return;
    const behavior = opts.behavior || 'smooth';
    const block = opts.block || 'start';
    el.scrollIntoView({ behavior, block, inline: 'nearest' });
}

function ensureUniversalOverlayRoot() {
    let overlay = document.getElementById('universalAsyncOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'universalAsyncOverlay';
    overlay.className = 'universal-spinner-overlay';
    overlay.innerHTML = `
        <div class="universal-spinner-box">
            <div class="universal-spinner-wheel"></div>
            <div class="universal-spinner-label">Loading...</div>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function setOverlayLabel(overlayEl, label) {
    if (!overlayEl) return;
    const labelEl = overlayEl.querySelector('.universal-spinner-label');
    if (labelEl) labelEl.textContent = String(label || 'Loading...');
}

function ensurePanelOverlay(panelEl) {
    if (!panelEl) return null;
    if (!panelEl.dataset.spinnerPrevPosition) {
        const prev = window.getComputedStyle(panelEl).position;
        panelEl.dataset.spinnerPrevPosition = prev;
        if (!prev || prev === 'static') panelEl.style.position = 'relative';
    }
    let overlay = panelEl.querySelector(':scope > .universal-spinner-panel-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'universal-spinner-panel-overlay';
        overlay.innerHTML = `
            <div class="universal-spinner-box">
                <div class="universal-spinner-wheel"></div>
                <div class="universal-spinner-label">Loading...</div>
            </div>
        `;
        panelEl.appendChild(overlay);
    }
    return overlay;
}

function cleanupPanelOverlay(panelEl) {
    if (!panelEl) return;
    const overlay = panelEl.querySelector(':scope > .universal-spinner-panel-overlay');
    if (overlay) overlay.remove();
    const prev = panelEl.dataset.spinnerPrevPosition;
    if (prev) {
        if (prev === 'static') panelEl.style.position = '';
        else panelEl.style.position = prev;
        delete panelEl.dataset.spinnerPrevPosition;
    }
}

function resolveSpinnerSurface(options = {}) {
    const triggerEl = options.triggerEl || null;
    const panelEl = options.panelEl || null;
    const mode = options.mode || '';
    if (triggerEl) return { type: 'button', triggerEl, panelEl };
    if (mode === 'grid' || panelEl?.id === 'myGrid' || panelEl?.classList?.contains('ag-theme-quartz')) {
        return { type: 'grid', panelEl };
    }
    if (panelEl) return { type: 'panel', panelEl };
    return { type: 'global', panelEl: null };
}

function showButtonSpinner(triggerEl, label) {
    if (!triggerEl) return null;
    const state = {
        disabled: triggerEl.disabled,
        html: triggerEl.innerHTML,
        text: triggerEl.textContent,
    };
    triggerEl.disabled = true;
    triggerEl.innerHTML = `<span class="universal-btn-spinner-wrap"><span class="universal-btn-spinner"></span><span>${label || state.text || 'Working...'}</span></span>`;
    return state;
}

function hideButtonSpinner(triggerEl, state) {
    if (!triggerEl || !state) return;
    triggerEl.disabled = Boolean(state.disabled);
    if (state.html != null) triggerEl.innerHTML = state.html;
}

function showSpinnerSurface(surface, label) {
    if (!surface) return null;
    if (surface.type === 'button') {
        const buttonState = showButtonSpinner(surface.triggerEl, label);
        return { surfaceType: 'button', buttonState };
    }
    if (surface.type === 'grid') {
        if (gridApi) {
            gridApi.setGridOption('loading', true);
            const textEl = document.getElementById('custom-loading-text');
            if (textEl) textEl.textContent = label || 'Loading...';
        }
        return { surfaceType: 'grid' };
    }
    if (surface.type === 'panel') {
        const overlay = ensurePanelOverlay(surface.panelEl);
        setOverlayLabel(overlay, label);
        return { surfaceType: 'panel', overlay, panelEl: surface.panelEl };
    }
    const overlay = ensureUniversalOverlayRoot();
    setOverlayLabel(overlay, label);
    overlay.classList.add('active');
    return { surfaceType: 'global', overlay };
}

function hideSpinnerSurface(handle, surface) {
    if (!handle || !surface) return;
    if (handle.surfaceType === 'button') {
        hideButtonSpinner(surface.triggerEl, handle.buttonState);
        return;
    }
    if (handle.surfaceType === 'grid') {
        if (gridApi) {
            gridApi.setGridOption('loading', false);
            gridApi.hideOverlay();
        }
        return;
    }
    if (handle.surfaceType === 'panel') {
        cleanupPanelOverlay(handle.panelEl || surface.panelEl);
        return;
    }
    if (handle.surfaceType === 'global' && handle.overlay) {
        handle.overlay.classList.remove('active');
    }
}

function updateSpinnerLabel(handle, label) {
    if (!handle || !label) return;
    if (handle.surfaceType === 'button') return;
    if (handle.surfaceType === 'grid') {
        const textEl = document.getElementById('custom-loading-text');
        if (textEl) textEl.textContent = String(label);
        return;
    }
    if (handle.surfaceType === 'panel' || handle.surfaceType === 'global') {
        setOverlayLabel(handle.overlay, String(label));
    }
}

async function withSpinner(asyncFn, options = {}) {
    const label = options.label || 'Loading...';
    const delayMs = Number.isFinite(options.delayMs) ? options.delayMs : SPINNER_DELAY_MS_DEFAULT;
    const surface = resolveSpinnerSurface(options);
    let shown = false;
    let spinnerHandle = null;
    let timer = null;
    let currentLabel = label;
    const setLabel = (nextLabel) => {
        currentLabel = nextLabel || currentLabel;
        if (shown) updateSpinnerLabel(spinnerHandle, currentLabel);
    };
    const scheduleShow = () => {
        timer = window.setTimeout(() => {
            shown = true;
            spinnerHandle = showSpinnerSurface(surface, currentLabel);
        }, Math.max(0, delayMs));
    };
    scheduleShow();
    let result;
    try {
        if (typeof asyncFn === 'function') result = await asyncFn({ setLabel });
        else result = await asyncFn;
        return result;
    } finally {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (shown) hideSpinnerSurface(spinnerHandle, surface);
        const explicitTarget = options.scrollTargetEl || null;
        const resolvedTarget = typeof options.getScrollTarget === 'function' ? options.getScrollTarget(result) : null;
        const target = explicitTarget || resolvedTarget;
        if (target) {
            const behavior = options.scrollBehavior || 'smooth';
            scrollIntoViewIfNeeded(target, { behavior, block: options.scrollBlock || 'start' });
        }
    }
}

let gridApi, currentTab = 'assignments', originalData = {}, changes = {}, selectedCourseId = null, lastGridColumnTab = null;
let accessibilityLastReport = null;
const ACCESSIBILITY_RUN_HISTORY_KEY = 'accessibility:runHistory:v1';
let accessibilityGridApi = null;
let accessibilityQaReportGridApi = null;
let accessibilityFixPreviewActions = null;
let accessibilityFixGenerationInProgress = false;
let accessibilityFixQueueFilters = { ruleId: '', resourceType: '', tier: '' };
const ACCESSIBILITY_CANVAS_PARITY_RULES = [
    'adjacent_duplicate_links',
    'heading_skipped_level',
    'img_missing_alt',
    'img_alt_too_long',
    'img_alt_filename',
    'small_text_contrast',
    'large_text_contrast',
    'table_missing_caption',
    'table_missing_header'
];
const ACCESSIBILITY_ADDITIONAL_RULES = [
    'table_header_scope_missing',
    'heading_h1_in_body',
    'heading_too_long',
    'lang_missing',
    'lang_invalid',
    'lang_inline_missing',
    'color_only_information',
    'sensory_only_instructions',
    'text_justified',
    'font_size_too_small',
    'iframe_missing_title',
    'session_timeout_no_warning',
    'link_broken',
    'list_not_semantic',
    'link_split_or_broken',
    'link_empty_name',
    'link_ambiguous_text',
    'link_new_tab_no_warning',
    'link_file_missing_type_size_hint',
    'heading_empty',
    'heading_duplicate_h1',
    'heading_visual_only_style',
    'landmark_structure_quality',
    'list_empty_item',
    'table_layout_heuristic',
    'table_complex_assoc_missing',
    'img_decorative_misuse',
    'img_meaningful_empty_alt',
    'img_text_in_image_warning',
    'video_missing_captions',
    'audio_missing_transcript',
    'media_autoplay',
    'motion_gif_warning',
    'video_embed_caption_unknown',
    'form_control_missing_label',
    'form_placeholder_as_label',
    'form_required_not_programmatic',
    'form_error_unassociated',
    'aria_invalid_role',
    'aria_hidden_focusable',
    'duplicate_id',
    'keyboard_focus_trap_heuristic',
    'doc_pdf_accessibility_unknown',
    'doc_office_structure_unknown',
    'doc_spreadsheet_headers_unknown',
    'button_empty_name'
];
const ACCESSIBILITY_RULE_LABELS = {
    adjacent_duplicate_links: 'Duplicate links',
    heading_skipped_level: 'Skipped headings',
    img_missing_alt: 'Missing image alt',
    img_alt_too_long: 'Image alt too long',
    img_alt_filename: 'Image alt is filename',
    small_text_contrast: 'Small text contrast',
    large_text_contrast: 'Large text contrast',
    table_missing_caption: 'Missing table captions',
    table_missing_header: 'Missing table headers',
    table_header_scope_missing: 'Missing table header scope',
    heading_h1_in_body: 'H1 in body',
    heading_too_long: 'Heading too long',
    lang_missing: 'Missing document language',
    lang_invalid: 'Invalid document language',
    lang_inline_missing: 'Missing inline language override',
    color_only_information: 'Color-only information',
    sensory_only_instructions: 'Sensory-only instructions',
    text_justified: 'Justified text',
    font_size_too_small: 'Font size too small',
    iframe_missing_title: 'Iframe missing title',
    session_timeout_no_warning: 'Session timeout without warning',
    link_broken: 'Broken link',
    list_not_semantic: 'Non-semantic list',
    link_split_or_broken: 'Split/broken link',
    link_empty_name: 'Empty link name',
    link_ambiguous_text: 'Ambiguous link text',
    link_new_tab_no_warning: 'New-tab warning missing',
    link_file_missing_type_size_hint: 'File link hint missing',
    heading_empty: 'Empty heading',
    heading_duplicate_h1: 'Duplicate H1',
    heading_visual_only_style: 'Visual heading style only',
    landmark_structure_quality: 'Landmark quality',
    list_empty_item: 'Empty list item',
    table_layout_heuristic: 'Layout table heuristic',
    table_complex_assoc_missing: 'Complex table associations',
    img_decorative_misuse: 'Decorative image misuse',
    img_meaningful_empty_alt: 'Meaningful image empty alt',
    img_text_in_image_warning: 'Text-in-image warning',
    video_missing_captions: 'Video captions missing',
    audio_missing_transcript: 'Audio transcript missing',
    media_autoplay: 'Autoplay media',
    motion_gif_warning: 'Motion GIF warning',
    video_embed_caption_unknown: 'Embedded video caption unknown',
    form_control_missing_label: 'Form control missing label',
    form_placeholder_as_label: 'Placeholder as label',
    form_required_not_programmatic: 'Required state not programmatic',
    form_error_unassociated: 'Error not associated to control',
    aria_invalid_role: 'Invalid ARIA role',
    aria_hidden_focusable: 'aria-hidden focusable element',
    duplicate_id: 'Duplicate IDs',
    keyboard_focus_trap_heuristic: 'Keyboard focus-trap heuristic',
    doc_pdf_accessibility_unknown: 'PDF accessibility unknown',
    doc_office_structure_unknown: 'Office file accessibility unknown',
    doc_spreadsheet_headers_unknown: 'Spreadsheet accessibility unknown',
    button_empty_name: 'Empty button name'
};

function DurationPickerCellEditor() {}
DurationPickerCellEditor.prototype.init = function(params) {
    const total = params.value != null && params.value !== '' ? Math.max(0, parseInt(Number(params.value), 10) || 0) : 0;
    this.gui = document.createElement('div');
    this.gui.className = 'duration-picker';
    this.gui.innerHTML = '<div class="row" style="display:flex;align-items:center;gap:8px;"><div class="dp-seg"><input type="number" id="dp-min" min="0" step="1" value="' + total + '"><span class="dp-unit">min</span></div></div>';
};
DurationPickerCellEditor.prototype.getGui = function() { return this.gui; };
DurationPickerCellEditor.prototype.getValue = function() {
    const inp = this.gui.querySelector('#dp-min');
    const total = parseInt(inp?.value, 10);
    if (isNaN(total) || total < 0) return null;
    return total === 0 ? null : total;
};
DurationPickerCellEditor.prototype.afterGuiAttached = function() {
    const inp = this.gui.querySelector('#dp-min');
    if (inp) { inp.focus(); inp.select(); }
};

function createDurationPickerDOM(initialMinutes) {
    const total = initialMinutes != null && initialMinutes !== '' ? Math.max(0, parseInt(Number(initialMinutes), 10) || 0) : 0;
    const wrap = document.createElement('div');
    wrap.className = 'duration-picker';
    wrap.innerHTML = '<div class="row" style="display:flex;align-items:center;gap:8px;"><div class="dp-seg"><input type="number" id="tl-min" min="0" step="1" value="' + total + '"><span class="dp-unit">min</span></div></div>';
    const inp = wrap.querySelector('#tl-min');
    wrap.getMinutes = () => { const v = parseInt(inp?.value, 10); return isNaN(v) || v < 0 ? 0 : v; };
    wrap.setMinutes = (mins) => { if (inp) inp.value = Math.max(0, parseInt(mins, 10) || 0); };
    return wrap;
}

const gridOptions = {
    components: { durationPickerCellEditor: DurationPickerCellEditor },
    sortingOrder: ['asc', 'desc'],
    rowSelection: BULK_EDITOR_GRID_ROW_SELECTION,
    selectionColumnDef: {
        pinned: 'left',
        lockPosition: 'left',
        width: 52,
        minWidth: 52,
        maxWidth: 52,
        resizable: false,
        suppressHeaderMenuButton: true,
    },
    defaultColDef: {
        minWidth: 150,
        flex: 1,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        sortable: true,
        resizable: true,
        editable: true,
        singleClickEdit: false
    },
    getRowId: (params) => {
        return String(params.data.id || params.data.url || Math.random());
    },
    getRowStyle: params => {
        const rowId = String(getRowIdForData(params.data) || '');
        if (failedRevertRowIds.has(rowId)) {
            return { backgroundColor: '#ffd6d6', color: '#9f1d1d', fontWeight: 'bold' };
        }
        if (params.data?._edit_status === 'modified') {
            return { backgroundColor: '#fff9c4', fontWeight: 'bold', color: '#d35400' };
        }
        return null;
    },
    onCellEditingStarted: params => {
        if (params.colDef.field === '_edit_status') return;
        if (suppressCellChangeLog) return;
        if (isFieldReadOnlyForTab(currentTab, params.colDef.field)) return;
        const rowId = getRowIdForData(params.data);
        if (rowId == null) return;
        pushEditHistoryRecord({
            type: 'individual',
            tab: currentTab,
            pending: true,
            cells: [{
                rowId: String(rowId),
                field: params.colDef.field,
                beforeValue: params.value,
                afterValue: params.value,
            }],
        });
    },
    onCellValueChanged: params => {
        if (suppressCellChangeLog) return;
        if (params.colDef.field !== '_edit_status') {
            if (params.colDef.field === 'rubric_id' && params.newValue === '__create_new__') {
                createRubricForRow(params).catch(err => alert('Failed to create rubric: ' + (err?.message || err)));
                return;
            }
            const rowId = String(getRowIdForData(params.data));
            const committedValue = params.data?.[params.colDef.field];
            updateTrackedChangeForCell(currentTab, rowId, params.colDef.field, committedValue);
            const rowChanges = changes[currentTab]?.[rowId] || {};
            const hasChanges = Object.keys(rowChanges).length > 0;
            params.node.setDataValue('_edit_status', hasChanges ? 'modified' : 'synced');
            if (!suppressCellChangeLog && !isFieldReadOnlyForTab(currentTab, params.colDef.field)) {
                const oldValue = params.oldValue;
                const newValue = params.newValue;
                const changed = !valuesEqual(oldValue, newValue);
                const top = undoStack[undoStack.length - 1];
                const isTopPendingMatch = !!(
                    top &&
                    top.pending &&
                    top.type === 'individual' &&
                    top.tab === currentTab &&
                    top.cells?.length === 1 &&
                    String(top.cells[0].rowId) === rowId &&
                    top.cells[0].field === params.colDef.field
                );
                if (changed) {
                    if (isTopPendingMatch) {
                        top.pending = false;
                        top.cells[0].afterValue = newValue;
                    } else {
                        const snapshot = createCellSnapshot(params.data, params.colDef.field, oldValue, newValue);
                        if (snapshot) pushEditHistoryRecord({ type: 'individual', tab: currentTab, cells: [snapshot] });
                    }
                } else if (isTopPendingMatch) {
                    undoStack.pop();
                }
            }
            params.api.redrawRows({ rowNodes: [params.node] });
        }
    },
    // Additional event handler to catch programmatic changes
    onRowDataUpdated: params => {
        if (!gridApi || currentTab === 'files') return;
        const configKey = getConfigKey(currentTab);
        const tabConfig = FIELD_DEFINITIONS[configKey];
        const trackKeys = tabConfig?.fields?.map(f => f.key).filter(Boolean) || [];
        const keysToCompare = trackKeys.filter(k => !['_edit_status', 'id', 'url'].includes(k));
        if (!keysToCompare.length) return;

        const valuesEqual = (a, b) => {
            if (a === b) return true;
            if (a == null && b == null) return true;
            if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
                try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
            }
            return false;
        };

        gridApi.forEachNode(node => {
            const originalRow = originalData[currentTab]?.find(item => String(item.id || item.url) === String(node.data?.id || node.data?.url));
            if (!originalRow) return;
            const rowId = String(node.data?.id || node.data?.url);
            keysToCompare.forEach(key => {
                updateTrackedChangeForCell(currentTab, rowId, key, node.data[key]);
            });
            const rowChanges = changes[currentTab]?.[rowId] || {};
            const hasChanges = Object.keys(rowChanges).length > 0;
            node.setDataValue('_edit_status', hasChanges ? 'modified' : 'synced');
        });
        updateDeleteMenuState();
    },
    onSelectionChanged: () => {
        updateDeleteMenuState();
    },
    onGridReady: params => {
        window.gridApi = params.api;
        gridApi = params.api;
        
        // Hide internal columns by default based on project definitions
        const internalColumns = ['_edit_status', 'id', 'uuid', 'created_at', 'updated_at', 'items_count', 'html_url', 'url', 'workflow_state', 'course_id', 'context_type', 'context_id', 'lti_context_id', 'global_id', 'secure_params', 'original_lti_resource_link_id', 'items_url', 'locked_for_user', 'lock_info', 'lock_explanation', 'permissions', 'submission', 'overrides', 'all_dates', 'can_duplicate'];
        
        // Get current column definitions and hide internal columns
        const columnDefs = params.api.getColumnDefs() || [];
        const columnsToHide = columnDefs
            .map(col => col.field || col.colId)
            .filter(field => internalColumns.includes(field));
        
        if (columnsToHide.length > 0) {
            params.api.setColumnsVisible(columnsToHide, false);
        }
        
        // Enable sorting and filtering for all columns
        params.api.setGridOption('sorting', true);
        params.api.setGridOption('filtering', true);
        updateDeleteMenuState();
    },
    overlayLoadingTemplate: 
        '<div class="ag-overlay-loading-wrapper">' +
        '  <div class="ag-overlay-loading-center">' +
        '    <span class="ag-icon ag-icon-loading" style="font-size: 24px;"></span>' + 
        '    <span id="custom-loading-text" style="margin-left: 10px; font-weight: bold;">Loading...</span>' +
        '  </div>' +
        '</div>',
    overlayNoRowsTemplate:
        '<div class="ag-overlay-no-rows-center" style="padding: 20px; text-align: center;">' +
        '  <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No course selected</p>' +
        '  <p style="font-size: 14px; color: #666;">Use the Course Selection dropdown above to load course contents.</p>' +
        '</div>'
};
const NEEDS_TOKEN = Boolean('<%= needsToken %>' === 'true');

function extractNumericCourseId(val) {
    if (!val || typeof val !== 'string') return null;
    const s = val.trim();
    if (!s || s === 'null' || s === 'undefined') return null;
    const numeric = /^\d+$/.test(s) ? s : (s.match(/\/(\d+)(?:\?|$)/) || s.match(/(\d+)$/))?.[1] || null;
    return numeric;
}

function logCourseContextAtLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const raw = {
        SERVER_DATA_courseId: (window.SERVER_DATA && window.SERVER_DATA.courseId) || '(none)',
        url_courseId: urlParams.get('courseId') || '(none)',
        url_course_id: urlParams.get('course_id') || '(none)',
        url_context_id: urlParams.get('context_id') || '(none)'
    };
}

function initializeGrid() {
    const gridDiv = document.querySelector('#myGrid');
    if (gridDiv && !gridApi) {
        gridApi = agGrid.createGrid(gridDiv, gridOptions);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (NEEDS_TOKEN) return;

    initializeGrid();
});

async function submitToken() {
    const tokenInput = document.getElementById('token-input');
    const token = tokenInput.value.trim();
    
    if (!token) {
        alert('Please enter a valid token');
        return;
    }

    try {
        const response = await fetch('/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (response.ok) {
            // This hides the overlay and reloads the page to trigger loadCourses()
            window.location.reload();
        } else {
            alert('Failed to save token to session');
        }
    } catch (error) {
        console.error('Error submitting token:', error);
        alert('Error connecting to the server');
    }
}

function generateColumnDefs(tabName) {
    const configKey = getConfigKey(tabName);
    const tabConfig = FIELD_DEFINITIONS[configKey];
    if (!tabConfig) {
        debugLog(`ERROR: No config found for tab: ${tabName}`);
        return [];
    }

    const defs = tabConfig.fields;

    const statusCol = {
        headerName: 'edit_status',
        field: '_edit_status',
        width: 120,
        minWidth: 90,
        sortable: true,
        editable: false,
        cellClass: 'ag-read-only-cell',
        cellRenderer: params => {
            if (params.value === 'modified') {
                return `<span class="status-pending">Modified</span>`;
            }
            return `<span class="status-synced">Synced</span>`;
        }
    };

    const mapping = defs.map((field) => {
        const colDef = {
            headerName: field.label,
            field: field.key,
            sortable: true,
            editable: field.editable !== false
        };

        if (field.type === 'select' && Array.isArray(field.options)) {
            const optMap = Object.fromEntries(field.options.map(o => [o.value, o.label]));
            colDef.valueFormatter = params => {
                const v = params.value;
                if (v == null || v === '') return '';
                return optMap[v] || String(v);
            };
            colDef.cellEditor = 'agSelectCellEditor';
            colDef.cellEditorParams = {
                values: field.options.map(o => o.value),
                formatValue: (value) => optMap[value] ?? String(value)
            };
        }
        else if (field.type === 'assignment_group_dropdown') {
            const groups = assignmentGroupsCache[selectedCourseId] || {};

            colDef.valueFormatter = params => {
                if (!params.value) return '';
                const name = groups[params.value];
                return name || `Unknown Group (${params.value})`;
            };

            colDef.cellEditor = 'agSelectCellEditor';
            colDef.cellEditorParams = {
                values: Object.keys(groups).map(id => parseInt(id)),
                formatValue: (value) => {
                    return groups[value] || `ID: ${value}`;
                },
                valueListGap: 0,
                valueListMaxHeight: 220
            };

            colDef.valueParser = params => {
                return parseInt(params.newValue);
            };
        }
        else if (field.type === 'rubric_dropdown') {
            const rubrics = rubricsCache[selectedCourseId] || {};
            const rubricIds = Object.keys(rubrics).map(id => parseInt(id, 10)).filter(n => !isNaN(n));
            const values = ['', ...rubricIds, '__create_new__'];
            colDef.valueFormatter = params => {
                const v = params.value;
                if (v === '__create_new__') return '+ Create New...';
                if (v == null || v === '') return '';
                const r = rubrics[v];
                return r?.title || params.data?.rubric_summary || `Rubric ${v}`;
            };
            colDef.cellEditor = 'agSelectCellEditor';
            colDef.cellEditorParams = {
                values,
                formatValue: (value) => {
                    if (value === '') return '(None / Clear)';
                    if (value === '__create_new__') return '+ Create New...';
                    const r = rubrics[value];
                    return r?.title || `Rubric ${value}`;
                },
                valueListGap: 0,
                valueListMaxHeight: 240
            };
            colDef.valueParser = params => {
                if (params.newValue === '__create_new__') return '__create_new__';
                if (params.newValue === '' || params.newValue == null) return null;
                const n = parseInt(params.newValue, 10);
                return isNaN(n) ? null : n;
            };
        }
        else if (field.type === 'discussion_points') {
            colDef.cellDataType = 'number';
            colDef.valueParser = params => {
                if (params.newValue === '' || params.newValue == null) return null;
                const n = Number(params.newValue);
                return isNaN(n) ? null : n;
            };
            colDef.editable = (params) => Boolean(params?.data?.graded);
            colDef.valueFormatter = params => {
                const v = params.value;
                if (v == null || v === '') return '';
                const n = Number(v);
                return isNaN(n) ? '' : String(n);
            };
        }
        else if (field.type === 'date' || field.type === 'datetime') {
            colDef.cellDataType = 'dateTimeString';
            colDef.cellEditor = 'agDateStringCellEditor';
            colDef.cellEditorParams = { min: '1900-01-01', includeTime: true };
            colDef.comparator = (a, b) => {
                const dA = a ? new Date(a).getTime() : 0;
                const dB = b ? new Date(b).getTime() : 0;
                return isNaN(dA) && isNaN(dB) ? 0 : (isNaN(dA) ? 1 : isNaN(dB) ? -1 : dA - dB);
            };
            colDef.valueFormatter = params => {
                if (!params.value) return '';
                const date = new Date(params.value);
                if (isNaN(date.getTime())) return params.value;
                return date.toISOString().slice(0, 19);
            };
            colDef.valueParser = params => DateUtils.parseForCanvas(params.newValue);
        } else if (field.type === 'boolean') {
            colDef.editable = false;
            colDef.cellRenderer = params => {
                const isTrue = params.value === true;
                const button = document.createElement('button');
                button.className = `btn-toggle ${isTrue ? 'active' : 'inactive'}`;
                button.textContent = isTrue ? (field.activeLabel || 'Active') : (field.inactiveLabel || 'Inactive');
                button.onclick = () => {
                    const newValue = !isTrue;
                    params.node.setDataValue(field.key, newValue);
                    const rowId = String(params.data?.id || params.data?.url);
                    updateTrackedChangeForCell(currentTab, rowId, field.key, newValue);
                    const rowChanges = changes[currentTab]?.[rowId] || {};
                    const hasChanges = Object.keys(rowChanges).length > 0;
                    params.node.setDataValue('_edit_status', hasChanges ? 'modified' : 'synced');
                    params.api.redrawRows({ rowNodes: [params.node] });
                };
                return button;
            };
        } else if (field.type === 'time_limit' || field.key === 'time_limit') {
            colDef.cellEditor = 'durationPickerCellEditor';
            colDef.minWidth = 120;
            colDef.valueGetter = params => {
                const v = params.data?.[field.key];
                if (v === null || v === undefined || v === '') return null;
                const n = Number(v);
                return isNaN(n) ? null : Math.max(0, Math.floor(n));
            };
            colDef.valueFormatter = params => {
                const v = params.value ?? params.data?.[field.key];
                if (v === null || v === undefined || v === '') return 'No limit';
                const n = Number(v);
                if (isNaN(n) || n < 0) return 'No limit';
                if (n === 0) return '0 min';
                const h = Math.floor(n / 60);
                const m = n % 60;
                return h > 0 ? `${h}h ${m}m` : `${m} min`;
            };
            colDef.valueParser = params => {
                const s = params.newValue != null ? String(params.newValue).trim() : '';
                if (s === '') return null;
                const n = parseInt(s, 10);
                return isNaN(n) || n < 0 ? null : n;
            };
            colDef.comparator = (a, b) => {
                const va = a != null ? Number(a) : -1;
                const vb = b != null ? Number(b) : -1;
                return (isNaN(va) ? -1 : va) - (isNaN(vb) ? -1 : vb);
            };
        } else if (field.type === 'accommodations') {
            colDef.editable = false;
            colDef.autoHeight = true;
            colDef.cellRenderer = params => {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '4px';
                container.style.padding = '4px';

                const options = ['Time: 1.25x', 'Time: 1.5x', 'Time: 2x', 'Extra attempts: 1', 'Extra Attempts: 2', 'Quiet Room', 'Other'];
                options.forEach(option => {
                    const label = document.createElement('label');
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    label.style.gap = '6px';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = option;
                    checkbox.disabled = true;

                    const span = document.createElement('span');
                    span.textContent = option;

                    label.appendChild(checkbox);
                    label.appendChild(span);
                    container.appendChild(label);
                });

                return container;
            };
        }
        if (colDef.editable === false) colDef.cellClass = 'ag-read-only-cell';
        return colDef;
    });

    if (tabName === 'files') {
        mapping.unshift({
            headerName: 'Type',
            field: 'is_folder',
            sortable: true,
            editable: false,
            cellClass: 'ag-read-only-cell',
            width: 70,
            minWidth: 70,
            valueGetter: params => params.data?.is_folder ? 'Folder' : 'File',
            cellRenderer: params => {
                const isFolder = params.data?.is_folder;
                const icon = isFolder ? '📁' : '📄';
                const label = isFolder ? 'Folder' : 'File';
                return `<span title="${label}" style="font-size: 1.1em;">${icon} ${label}</span>`;
            }
        });
    }

    const idCol = {
        headerName: 'ID',
        field: 'id',
        valueGetter: params => params.data?.id ?? params.data?.url ?? '',
        width: 100,
        minWidth: 70,
        sortable: true,
        editable: false,
        cellClass: 'ag-read-only-cell',
        hide: false,
        pinned: 'left'
    };

    const allColumns = [statusCol, idCol, ...mapping];
    return allColumns;
}
if (typeof window !== 'undefined') window.generateColumnDefs = generateColumnDefs;

const GRID_DATA_TABS = ['assignments', 'new_quizzes', 'quizzes', 'discussions', 'announcements', 'pages', 'modules', 'files'];

function setGridColumnDefsForTab(tabName) {
    if (!gridApi || !GRID_DATA_TABS.includes(tabName)) return;
    gridApi.setGridOption('columnDefs', generateColumnDefs(tabName));
    if (lastGridColumnTab !== tabName) {
        // Column definitions already contain full state; resetting destroys headerCheckboxSelection
        // if (typeof gridApi.resetColumnState === 'function') gridApi.resetColumnState();
        lastGridColumnTab = tabName;
    }
}

async function refreshCurrentTab() {
    if (!selectedCourseId) { alert('Select course first.'); return; }
    if (currentTab === 'standards_sync') {
        loadStandardsSyncTab();
        return;
    }
    if (currentTab === 'ada_compliance') {
        runAccessibilityScan();
        return;
    }
    delete originalData[currentTab];
    if (changes[currentTab]) changes[currentTab] = {};
    const refreshBtn = document.querySelector('button[onclick="refreshCurrentTab()"]');
    try {
        await withSpinner(async () => {
        const configKey = getConfigKey(currentTab);
        const tabConfig = FIELD_DEFINITIONS[configKey];
        if (!tabConfig) { throw new Error(`No config for: ${currentTab}`); }

        const response = await fetch(`/canvas/courses/${selectedCourseId}/${tabConfig.endpoint}`, { credentials: 'include' });
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`${response.status} ${response.statusText}${errText ? ': ' + errText.slice(0, 200) : ''}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Unexpected response format');
        const baselineDataWithStatus = data.map(x => ({ ...x, _edit_status: 'synced' }));
        const workingDataWithStatus = baselineDataWithStatus.map(x => ({ ...x }));
        originalData[currentTab] = baselineDataWithStatus;

        if (gridApi) {
            setGridColumnDefsForTab(currentTab);
            gridApi.setGridOption('rowData', workingDataWithStatus);
            gridApi.redrawRows();
            if (currentTab === 'students') setTimeout(() => gridApi.resetRowHeights(), 100);
        }
        updateSyncHistoryIndicator();
        }, {
            triggerEl: refreshBtn,
            mode: 'grid',
            panelEl: document.getElementById('myGrid'),
            label: 'Refreshing...',
            scrollTargetEl: document.getElementById('myGrid'),
        });
    } catch (event) {
        console.error(`Error refreshing:`, event);
        alert('Refresh failed.');
    }
}

document.addEventListener('change', event => {
    if (event.target.name === 'ipPosition') {
        const markerContainer = document.getElementById('markerInputContainer');
        if (markerContainer) markerContainer.style.display = (event.target.value === 'beforeMarker' || event.target.value === 'afterMarker') ? 'block' : 'none';
    }
});

async function loadCourses() {
    logCourseContextAtLoad();
    try {
        await withSpinner(async () => {
            const courseSelect = document.getElementById('courseSelect');
            if (!courseSelect) {
                debugLog('ERROR: courseSelect element not found', 'error');
                return;
            }

            courseSelect.innerHTML = '<option value="">Select a Course</option>';
            const response = await fetch('/canvas/courses');
            
            if (response.status === 401) {
                debugLog('Session expired or token invalid. Redirecting to auth.', 'warn');
                const tok = document.getElementById('token-overlay');
                const oauth = document.getElementById('oauth-overlay');
                const wrap = document.getElementById('main-app-wrapper');
                if (wrap) wrap.style.display = 'none';
                if (oauth) oauth.style.display = 'none';
                if (tok) tok.style.display = 'flex';
                let detail = '';
                try {
                    const j = await response.clone().json();
                    if (j?.message) detail = String(j.message);
                } catch (_) {}
                if (detail) debugLog('ERROR: ' + detail, 'error');
                return;
            }

            if (!response.ok) {
                let detail = '';
                try {
                    const j = await response.clone().json();
                    if (j?.message) detail = String(j.message);
                } catch (_) {
                    try {
                        detail = (await response.clone().text()).slice(0, 300);
                    } catch (_) {}
                }
                const line = `ERROR: Failed to load courses: ${response.status} ${response.statusText}${detail ? ' — ' + detail : ''}`;
                debugLog(line, 'error');
                alert(`Could not load courses (${response.status}).\n\n${detail || response.statusText || 'See debug log for details.'}`);
                courseSelect.innerHTML = '<option value="">Select a Course</option>';
                return;
            }

            courseSelect.innerHTML = '<option value="">Select a Course</option>';
            const courseGroups = await response.json();
            if (!Array.isArray(courseGroups)) {
                debugLog('ERROR: Expected array of course groups', 'error');
                courseSelect.innerHTML = '<option value="">Select a Course</option>';
                return;
            }

            courseSelect.innerHTML = '<option value="">Select a Course</option>';

            if (courseGroups.length === 0) {
                debugLog('No courses available', 'warn');
                return;
            }

            let totalCourses = 0;
            courseGroups.forEach(group => {
                if (!group.term || !Array.isArray(group.courses)) return;
                const optgroup = document.createElement('optgroup');
                optgroup.label = group.term;
                group.courses.forEach(course => {
                    if (!course.id) return;
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = `${course.name || course.course_code || 'Untitled'} (${course.course_code || 'No Code'})`;
                    optgroup.appendChild(option);
                    totalCourses++;
                });
                if (optgroup.children.length > 0) {
                    courseSelect.appendChild(optgroup);
                }
            });

            const urlParams = new URLSearchParams(window.location.search);
            const rawServer = (window.SERVER_DATA && window.SERVER_DATA.courseId) || null;
            const rawUrlCourseId = urlParams.get('courseId') || urlParams.get('course_id') || urlParams.get('context_id');
            const rawAuto = rawServer || rawUrlCourseId;
            const autoCourseId = extractNumericCourseId(rawAuto) || (rawAuto && rawAuto !== 'null' && rawAuto !== 'undefined' ? String(rawAuto).trim() : null);

            const validId = autoCourseId && autoCourseId !== 'null' && autoCourseId !== '' && autoCourseId !== 'undefined';
            const optionValues = Array.from(courseSelect.options).map(o => o.value).filter(Boolean);
            const hasOption = validId && optionValues.includes(String(autoCourseId));

            if (validId && !hasOption) debugLog(`Context course ${autoCourseId} not in dropdown`, 'warn');

            if (validId && hasOption) {
                courseSelect.value = autoCourseId;
                if (typeof onCourseSelected === 'function') onCourseSelected();
            } else {
                const firstOpt = Array.from(courseSelect.options).find(opt => opt.value && opt.value !== '');
                if (firstOpt) {
                    courseSelect.value = firstOpt.value;
                    if (typeof onCourseSelected === 'function') onCourseSelected();
                } else {
                    courseSelect.value = '';
                    if (gridApi) gridApi.showNoRowsOverlay();
                }
            }
        }, {
            panelEl: document.getElementById('tabContentArea') || document.getElementById('main-app-wrapper'),
            label: 'Loading courses...',
            scrollTargetEl: document.getElementById('courseSelect'),
        });

    } catch (error) {
        debugLog(`ERROR in loadCourses: ${error.message}`, 'error');
        console.error('Error loading courses:', error);
        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect) courseSelect.innerHTML = '<option value="">Select a Course</option>';
    }
}

function onCourseSelected() {
    const courseSelect = document.getElementById('courseSelect');
    const courseId = courseSelect.value;
    
    if (!courseId) {
        selectedCourseId = null;
        if (gridApi) {
            gridApi.setGridOption('rowData', []);
            gridApi.showNoRowsOverlay();
        }
        return;
    }
    
    selectedCourseId = courseId;

    // Update URL to match current selection without refreshing
    const url = new URL(window.location);
    url.searchParams.set('courseId', courseId);
    window.history.pushState({}, '', url);
    
    // Reset state and reload
    originalData = {};
    if (gridApi) gridApi.setGridOption('rowData', []);
    switchTab(currentTab);
}

function getTabNameFromButton(tabEl) {
    const dataTab = tabEl?.getAttribute('data-tab');
    if (dataTab) return dataTab;
    const onclick = tabEl?.getAttribute('onclick') || '';
    const match = onclick.match(/switchTab\('([^']+)'\)/);
    return match ? match[1] : '';
}

function updatePointsUiLabels(tabName) {
    const isModules = tabName === 'modules';
    const isFiles = tabName === 'files';
    const pointsItem = document.getElementById('pointsMenuItem');
    const positionItem = document.getElementById('positionMenuItem');
    const agItem = document.getElementById('assignmentGroupMenuItem');
    const publishItem = document.getElementById('publishMenuItem');
    if (pointsItem) pointsItem.style.display = (isModules || isFiles) ? 'none' : '';
    if (positionItem) positionItem.style.display = isModules ? 'block' : 'none';
    if (agItem) agItem.style.display = isFiles ? 'none' : '';
    if (publishItem) publishItem.style.display = isFiles ? 'none' : '';
    const title = document.getElementById('pointsModalTitle');
    if (title) title.textContent = isModules ? 'Position' : 'Points/Weighting';
    const actionBtn = document.getElementById('pointsActionBtn');
    if (actionBtn) actionBtn.textContent = isModules ? 'Update Position' : 'Update Points';
}

function updateDeleteMenuState() {
    const deleteItem = document.getElementById('deleteMenuItem');
    if (!deleteItem) return;
    const selected = gridApi ? (gridApi.getSelectedRows() || []) : [];
    const folderSelectedInFiles = currentTab === 'files' && selected.some(r => r?.is_folder === true);
    if (folderSelectedInFiles) {
        deleteItem.style.opacity = '0.45';
        deleteItem.style.cursor = 'not-allowed';
        deleteItem.style.pointerEvents = 'none';
        deleteItem.title = 'Folders must be deleted directly in Canvas';
    } else {
        deleteItem.style.opacity = '';
        deleteItem.style.cursor = '';
        deleteItem.style.pointerEvents = '';
        deleteItem.title = '';
    }
}

function applyBulkActionMenuVisibility(tabName) {
    const isAdaTab = tabName === 'ada_compliance';
    const fixMenuItem = document.getElementById('fixMenuItem');
    const bulkDropdown = document.getElementById('bulkActionsDropdown');
    if (!bulkDropdown) return;

    bulkDropdown.querySelectorAll('.dropdown-item').forEach((el) => {
        if (isAdaTab) {
            el.style.display = el.id === 'fixMenuItem' ? 'block' : 'none';
            return;
        }
        if (el.id === 'fixMenuItem') {
            el.style.display = 'none';
            return;
        }
        el.style.display = '';
    });

    if (fixMenuItem) fixMenuItem.style.display = isAdaTab ? 'block' : 'none';
}

function switchTab(tabName) {
    // Security Check: Enforce tab interception guard clause
    const allowedTabs = ['assignments', 'discussions', 'announcements', 'pages', 'quizzes', 'new_quizzes', 'modules', 'files', 'standards_sync', 'ada_compliance'];
    if (tabInterceptionEnabled && !allowedTabs.includes(tabName)) {
        const message = 'Module Integration Pending: This feature is planned for a future development phase.';
        alert(message);

        // Clear the grid to prevent ghost data
        if (gridApi) {
            gridApi.setGridOption('rowData', []);
            gridApi.hideOverlay();
        }
        
        // Reset currentTab to previous tab to maintain state
        const previousTab = currentTab;
        currentTab = previousTab;
        
        // Re-activate the previous tab
        const allTabs = document.querySelectorAll('.tab-btn');
        allTabs.forEach(tab => {
            const btnTab = getTabNameFromButton(tab);
            const isTarget = btnTab === previousTab;
            tab.classList.toggle('active', isTarget);
            tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        
        return false; // Stop execution immediately
    } else {
        // Normal tab switching logic for allowed tabs
        const allTabs = document.querySelectorAll('.tab-btn');
        
        allTabs.forEach(tab => {
            const btnTab = getTabNameFromButton(tab);
            const isTarget = btnTab === tabName;
            tab.classList.toggle('active', isTarget);
            tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });

        const previousTab = currentTab;
        currentTab = tabName;
        if (previousTab !== tabName) {
            clearInMemoryChangeLog();
            clearFailedRevertRows();
        }

        const gridEl = document.getElementById('myGrid');
        const standardsPanelEl = document.getElementById('standardsSyncPanel');
        const accessibilityPanelEl = document.getElementById('accessibilityPanel');
        if (tabName === 'standards_sync') {
            if (gridEl) gridEl.style.display = 'none';
            if (standardsPanelEl) standardsPanelEl.style.display = 'block';
            if (accessibilityPanelEl) accessibilityPanelEl.style.display = 'none';
            destroyAccessibilityGrid();
            loadStandardsSyncTab();
        } else if (tabName === 'ada_compliance') {
            if (gridEl) gridEl.style.display = 'none';
            if (standardsPanelEl) standardsPanelEl.style.display = 'none';
            if (accessibilityPanelEl) accessibilityPanelEl.style.display = 'block';
            loadAccessibilityTab();
        } else {
            if (gridEl) gridEl.style.display = '';
            if (standardsPanelEl) standardsPanelEl.style.display = 'none';
            if (accessibilityPanelEl) accessibilityPanelEl.style.display = 'none';
            destroyAccessibilityGrid();
        }

        const isAdaTab = tabName === 'ada_compliance';
        applyBulkActionMenuVisibility(tabName);
        if (!isAdaTab) {
            const mergeMenuItem = document.getElementById('mergeMenuItem');
            if (mergeMenuItem) mergeMenuItem.style.display = (tabName === 'modules') ? 'block' : 'none';
            const timeLimitMenuItem = document.getElementById('timeLimitMenuItem');
            if (timeLimitMenuItem) timeLimitMenuItem.style.display = (tabName === 'quizzes') ? 'block' : 'none';
            const allowedAttemptsMenuItem = document.getElementById('allowedAttemptsMenuItem');
            if (allowedAttemptsMenuItem) allowedAttemptsMenuItem.style.display = (tabName === 'quizzes') ? 'block' : 'none';
            const allowRatingMenuItem = document.getElementById('allowRatingMenuItem');
            if (allowRatingMenuItem) allowRatingMenuItem.style.display = (tabName === 'discussions') ? 'block' : 'none';
        }
        updatePointsUiLabels(tabName);
        updateSyncHistoryIndicator();
        updateDeleteMenuState();

        if (tabName !== 'standards_sync' && tabName !== 'ada_compliance' && typeof loadTabData === 'function') {
            loadTabData(tabName);
        }
    }
}

// Tab Interception System (off by default: all tabs including ADA Compliance + Standards Sync work in Demo and Production)
let tabInterceptionEnabled = false;

function handleTabClick(event) {
    const tab = event.currentTarget;
    const tabName = tab.getAttribute('data-tab');
    
    const allowedTabs = ['assignments', 'discussions', 'announcements', 'pages', 'quizzes', 'new_quizzes', 'modules', 'files', 'standards_sync', 'ada_compliance'];
    if (tabInterceptionEnabled && !allowedTabs.includes(tabName)) {
        event.preventDefault();
        event.stopPropagation();

        const message = 'Module Integration Pending: This feature is planned for a future development phase.';
        alert(message);

        // Clear the grid to prevent ghost data
        if (gridApi) {
            gridApi.setGridOption('rowData', []);
            gridApi.hideOverlay();
        }
        
        // Reset currentTab to previous tab to maintain state
        const previousTab = currentTab;
        currentTab = previousTab;
        
        // Re-activate the previous tab
        const allTabs = document.querySelectorAll('.tab-btn');
        allTabs.forEach(tab => {
            const btnTab = getTabNameFromButton(tab);
            const isTarget = btnTab === previousTab;
            tab.classList.toggle('active', isTarget);
            tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        
        return false; // Stop execution immediately
    }
    
    // Allow normal navigation for Assignments or when interception is disabled
    return true;
}

// Hidden Toggle System
function toggleTabInterception() {
    tabInterceptionEnabled = !tabInterceptionEnabled;

    // Visual feedback - flash the active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        activeTab.style.boxShadow = tabInterceptionEnabled ? '0 0 10px red inset' : 'none';
        setTimeout(() => {
            activeTab.style.boxShadow = 'none';
        }, 500);
    }
}

// Keyboard Shortcut Handler
document.addEventListener('keydown', function(event) {
    // Ctrl+Shift+L to toggle tab interception
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        toggleTabInterception();
    }
});

document.addEventListener('keydown', function(event) {
    if (!(event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z')) return;
    const tag = (event.target?.tagName || '').toLowerCase();
    const isEditableTarget = tag === 'input' || tag === 'textarea' || event.target?.isContentEditable;
    if (isEditableTarget) return;
    event.preventDefault();
    undoLastCellEdit();
});

// Initialize tab interception system
document.addEventListener('DOMContentLoaded', function() {
    clearInMemoryChangeLog();
    // Add data-tab attributes to existing tab buttons for interception system
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        // Extract tab name from onclick attribute
        const onclickAttr = tab.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes("switchTab('")) {
            const tabName = onclickAttr.match(/switchTab\('([^']+)'\)/)[1];
            tab.setAttribute('data-tab', tabName);
            tab.addEventListener('click', handleTabClick);
        }
    });
    
});

async function loadStandardsSyncTab() {
    debugLog('[AccStandards] loadStandardsSyncTab started', 'info');
    const profileEl = document.getElementById('accProfileContent');
    const workflowEl = document.getElementById('accWorkflowContent');
    const outcomesEl = document.getElementById('accOutcomesContent');
    const alignmentEl = document.getElementById('accAlignmentContent');
    if (!selectedCourseId) {
        if (profileEl) profileEl.innerHTML = '<p>Select a course to view the accreditation profile.</p>';
        if (workflowEl) workflowEl.innerHTML = '<p>Select a course to view workflow.</p>';
        if (outcomesEl) outcomesEl.innerHTML = '<p>Select a course to view outcomes.</p>';
        if (alignmentEl) alignmentEl.innerHTML = '<p>Select a course to analyze content alignment.</p>';
        return;
    }
    const getEffectiveCip = () => {
        const progEl = document.getElementById('accProgram');
        const focusEl = document.getElementById('accProgramFocus');
        const programCip4 = progEl?.value?.trim() || '';
        const focusChecked = focusEl ? Array.from(focusEl.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).filter(Boolean) : [];
        return (focusChecked[0] || programCip4) || '';
    };
    const sourceLabel = (s) => {
        const v = String(s || '').toLowerCase();
        if (v === 'db') return 'Database';
        if (v === 'api') return 'API';
        if (v === 'file') return 'File';
        if (v === 'scrape') return 'Scrape';
        if (v === 'ai') return 'AI fallback';
        if (v === 'lookup_service') return 'Lookup service';
        if (v === 'stub') return 'Stub';
        return v ? v : 'Unknown';
    };
    const formatConfidence = (n) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return 'n/a';
        return Math.max(0, Math.min(100, Math.round(v * 100))) + '%';
    };
    const buildStandardsBlockHtml = (payload, selectedIds, prevChecked) => {
        const preferred = prevChecked && prevChecked.size ? prevChecked : new Set(Array.isArray(selectedIds) ? selectedIds : []);
        const orgs = Array.isArray(payload?.organizations) ? payload.organizations : [];
        const total = Number(payload?.total_standards) || 0;
        const fallbackMsg = total === 0 ? '<div class="acc-source-notice">No standards were retrieved. Showing organization-level fallback IDs.</div>' : '';
        if (!orgs.length) {
            return '<h4 class="acc-standards-heading">Accreditation standards for this course</h4><p class="acc-no-focus">No accreditation standards found for this program focus. Select a different program or focus above.</p>';
        }
        const groupsHtml = orgs.map(org => {
            const orgId = (org?.id || '').toString();
            const orgLabel = escapeHtml((org?.abbreviation ? org.abbreviation + ' — ' : '') + (org?.name || orgId || 'Organization'));
            const orgSource = sourceLabel(org?.standards_source || payload?.accreditors_source);
            const orgConfidence = formatConfidence(org?.standards_confidence);
            const warnings = Array.isArray(org?.warnings) && org.warnings.length
                ? '<div style="font-size:12px;color:#7a4b00;margin:2px 0 6px 0;">' + escapeHtml(org.warnings.join(' | ')) + '</div>'
                : '';
            let standards = Array.isArray(org?.standards) && org.standards.length
                ? org.standards
                : [{ id: orgId, title: org?.name || orgId, sourceType: org?.standards_source || payload?.accreditors_source, confidence: org?.standards_confidence }];
            const standardsNodes = standards.map(std => {
                const sid = String(std?.id || '').trim();
                const stitle = String(std?.title || sid || 'Untitled standard').trim();
                const stdSource = sourceLabel(std?.sourceType || org?.standards_source || payload?.accreditors_source);
                const stdConf = formatConfidence(std?.confidence ?? org?.standards_confidence);
                return {
                    id: sid,
                    parentId: std?.parentId != null ? String(std.parentId).trim() : (std?.parent_id != null ? String(std.parent_id).trim() : ''),
                    label: sid + (stitle && stitle !== sid ? ' — ' + stitle : ''),
                    meta: '[' + stdSource + ', ' + stdConf + ']'
                };
            }).filter(n => n.id);
            const tree = buildAccSelectionTree(standardsNodes);
            const abbrev = (org?.abbreviation || orgId || 'org').toString();
            const selectedSeed = new Set(Array.from(preferred).map(x => String(x || '').trim()).filter(Boolean));
            const selectedSet = new Set();
            selectedSeed.forEach(id => {
                if (tree.nodeById.has(id)) {
                    const leaves = getAccTreeLeafIds(tree, id, (_, kids) => !kids.length);
                    if (leaves.length) leaves.forEach(x => selectedSet.add(x));
                }
                if (selectedSeed.has(id)) selectedSet.add(id);
            });
            const itemsHtml = renderAccSelectionTree(tree, {
                checkboxName: 'accStd',
                selectedSet,
                leafFn: (_, kids) => !kids.length
            });
            return '<div class="acc-org-block" style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin:8px 0;">' +
                '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">' +
                '<strong>' + orgLabel + '</strong>' +
                '<span style="font-size:12px;color:#555;">source: ' + escapeHtml(orgSource) + ' | confidence: ' + escapeHtml(orgConfidence) + '</span>' +
                '</div>' +
                warnings +
                '<div style="display:flex;gap:8px;margin:6px 0;">' +
                '<button type="button" class="secondary-btn acc-std-expand-all">Expand all</button>' +
                '<button type="button" class="secondary-btn acc-std-collapse-all">Collapse all</button>' +
                '<button type="button" class="secondary-btn acc-std-select-all">Select all leaves</button>' +
                '<button type="button" class="secondary-btn acc-std-clear-all">Clear all leaves</button>' +
                '</div>' +
                '<div class="acc-org-standards acc-tree-container" style="margin-top:6px;">' + itemsHtml + '</div>' +
                '</div>';
        }).join('');
        return '<h4 class="acc-standards-heading">Accreditation standards for this course</h4>' +
            fallbackMsg +
            '<p class="acc-standards-hint">Select branches (full tree appears in Apply to course for leaf selection).</p>' +
            '<div id="accStandardsList" class="acc-program-focus">' + groupsHtml + '</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:0.75rem;">' +
            '<button type="button" id="accApplyStandardsBtn" class="primary-btn" onclick="applyAccreditationStandards()">Apply to course</button>' +
            '<button type="button" id="accGetAiSuggestionsBtn" class="primary-btn" onclick="openAiSuggestFlow()">Get AI suggestions</button>' +
            '<button type="button" id="accFinalizeStandardsBtn" class="primary-btn" onclick="finalizeStandards()">Finalize standards</button>' +
            '<button type="button" id="accCreateOutcomesBtn" class="primary-btn" onclick="createOutcomesFromSelectedStandards()">Approve selected & create outcomes</button>' +
            '</div>';
    };
    const refreshAccreditorsStandards = async (keepSelections) => {
        if (!selectedCourseId || !outcomesEl) return;
        const cip = getEffectiveCip();
        if (!cip) return;
        const block = outcomesEl.querySelector('.acc-standards-block');
        if (!block) return;
        const listEl = document.getElementById('accStandardsList');
        const prevChecked = keepSelections && listEl ? new Set(Array.from(listEl.querySelectorAll('input[name="accStd"]:checked')).map(cb => cb.value)) : new Set();
        const standardsUrl = `/canvas/courses/${selectedCourseId}/accreditation/standards?cip=${encodeURIComponent(cip)}`;
        debugLog('[AccStandards] refreshAccreditorsStandards fetching: ' + standardsUrl, 'info');
        try {
            let payload = {};
            const res = await fetch(standardsUrl);
            if (res.ok) {
                payload = await res.json();
                const orgs = Array.isArray(payload?.organizations) ? payload.organizations : [];
                debugLog('[AccStandards] refreshAccreditorsStandards received: orgs=' + orgs.length + ', total=' + (payload?.total_standards ?? 0), 'info');
            } else {
                debugLog('[AccStandards] refreshAccreditorsStandards failed: status=' + res.status + ', falling back to accreditors', 'warn');
                const accreditorsUrl = `/canvas/courses/${selectedCourseId}/accreditation/accreditors?cip=${encodeURIComponent(cip)}`;
                const accRes = await fetch(accreditorsUrl);
                const acc = accRes.ok ? await accRes.json() : {};
                payload = {
                    accreditors_source: acc?.source || 'stub',
                    organizations: Array.isArray(acc?.accreditors) ? acc.accreditors.map(a => ({
                        id: a.id,
                        name: a.name,
                        abbreviation: a.abbreviation,
                        standards_source: acc?.source || 'stub',
                        standards_confidence: 0.25,
                        warnings: ['standards endpoint unavailable; using organization fallback'],
                        standards: [{ id: a.id, title: a.name, sourceType: acc?.source || 'stub', confidence: 0.25 }]
                    })) : [],
                    total_standards: 0
                };
            }
            block.innerHTML = buildStandardsBlockHtml(payload, [], prevChecked);
            bindAccStandardsTreeBlocks(block);
        } catch (_) {}
    };
    const loadProfile = async (profile) => {
        if (!profileEl) return null;
        try {
            const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
            const stateOpts = states.map(s => '<option value="' + s + '"' + (profile.state === s ? ' selected' : '') + '>' + s + '</option>').join('');
            profileEl.innerHTML = '<div class="acc-profile-form">' +
                '<div class="acc-form-row acc-row-state"><label>State</label><select id="accState">' +
                '<option value="">Select state...</option>' + stateOpts + '</select></div>' +
                '<div class="acc-form-row acc-row-city"><label>City</label><div id="accCityWrap"><select id="accCity" disabled><option value="">Select state first</option></select></div></div>' +
                '<div class="acc-form-row acc-row-institution"><label>Institution</label><div id="accInstWrap"><select id="accInstitution" disabled><option value="">Select city first</option></select></div></div>' +
                '<div class="acc-form-row acc-row-program"><label>Program</label><div id="accProgWrap"><select id="accProgram" disabled><option value="">Select institution first</option></select></div></div>' +
                '<div class="acc-form-row acc-row-focus" id="accProgramFocusRow"><label>Program Focus</label><div id="accProgramFocus" class="acc-program-focus">Select program first</div></div>' +
                '<div class="acc-form-actions"><button type="button" id="accSaveProfileBtn" class="primary-btn" onclick="saveAccreditationProfileForm()">Save Profile</button></div>' +
                '</div>';
            document.getElementById('accState').onchange = () => { wipeAccreditationProfilePage(); onAccStateChange(); };
            document.getElementById('accCity').onchange = () => { wipeAccreditationProfilePage(); onAccCityChange(); };
            document.getElementById('accInstitution').onchange = () => { wipeAccreditationProfilePage(); onAccInstitutionChange(); };
            document.getElementById('accProgram').onchange = () => { wipeAccreditationProfilePage(); onAccProgramChange().then(() => refreshAccreditorsStandards(false)); };
            const focusRow = document.getElementById('accProgramFocusRow');
            if (focusRow) focusRow.addEventListener('change', () => { wipeAccreditationProfilePage(); clearOutcomesAndStandardsSelections(); refreshAccreditorsStandards(false); });
            const hasSaved = profile.state && profile.city && (profile.institutionId || profile.institutionName) && (profile.program || profile.programCip4);
            if (hasSaved) {
                const cityEl = document.getElementById('accCity');
                const instEl = document.getElementById('accInstitution');
                const progEl = document.getElementById('accProgram');
                const focusEl = document.getElementById('accProgramFocus');
                cityEl.innerHTML = '<option value="' + escapeHtml(profile.city) + '" selected>' + escapeHtml(profile.city) + '</option>';
                cityEl.disabled = false;
                instEl.innerHTML = '<option value="' + String(profile.institutionId || '') + '" selected>' + escapeHtml(profile.institutionName || '') + '</option>';
                instEl.disabled = false;
                const progVal = profile.programCip4 || profile.program || '';
                const progLabel = profile.programCip4 ? (profile.programCip4 + (profile.programTitle || profile.program ? ' - ' + (profile.programTitle || profile.program) : '')) : (profile.program || '');
                progEl.innerHTML = '<option value="' + escapeHtml(progVal) + '" selected>' + escapeHtml(progLabel) + '</option>';
                progEl.disabled = false;
                if (profile.programCip4 && focusEl) {
                    fetch('/college-scorecard/cip6-options?cip4=' + encodeURIComponent(profile.programCip4))
                        .then(r => r.json())
                        .then(d => {
                            const opts = (d && d.options) ? d.options : [];
                            if (!opts.length) {
                                focusEl.innerHTML = '<span class="acc-no-focus">No specializations for this program</span>';
                            } else {
                                focusEl.innerHTML = opts.map(o => {
                                    const checked = Array.isArray(profile.programFocusCip6) && profile.programFocusCip6.includes(o.code) ? ' checked' : '';
                                    return '<label class="acc-focus-check"><input type="checkbox" value="' + escapeHtml(o.code) + '"' + checked + '> ' + escapeHtml(o.code + ' - ' + (o.title || '')) + '</label>';
                                }).join('');
                            }
                        })
                        .catch(() => { focusEl.innerHTML = '<span class="acc-focus-err">Failed to load</span>'; });
                } else if (focusEl) {
                    focusEl.innerHTML = 'Select program first';
                }
            } else if (profile.state) {
                onAccStateChange().then(() => {
                    if (profile.city) {
                        document.getElementById('accCity').value = profile.city;
                        onAccCityChange().then(() => {
                            if (profile.institutionId) {
                                document.getElementById('accInstitution').value = String(profile.institutionId);
                                onAccInstitutionChange().then(() => {
                                    const progEl = document.getElementById('accProgram');
                                    const focusEl = document.getElementById('accProgramFocus');
                                    const cip4 = profile.programCip4 || (profile.program && /^\d{2}\.\d{2}$/.test(String(profile.program).trim()) ? profile.program.trim() : null);
                                    const matchByTitle = profile.program && !cip4 ? Array.from(progEl.options).find(o => o.value && (o.textContent || '').includes(String(profile.program))) : null;
                                    const progVal = cip4 || (matchByTitle ? matchByTitle.value : profile.program);
                                    if (progVal) {
                                        progEl.value = progVal;
                                        if (cip4 || matchByTitle) {
                                            onAccProgramChange().then(() => {
                                                const arr = profile.programFocusCip6;
                                                if (Array.isArray(arr) && arr.length && focusEl) {
                                                    focusEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                                                        if (arr.includes(cb.value)) cb.checked = true;
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
            return profile;
        } catch (e) {
            profileEl.innerHTML = '<p style="color:#c62828;">Failed to load profile: ' + escapeHtml(e.message) + '</p>';
            return null;
        }
    };
    const loadOutcomes = async (profile, outcomesPreloaded) => {
        if (!outcomesEl) return;
        const cip = getAccreditationCipFromProfile(profile);
        const standardsUrl = `/canvas/courses/${selectedCourseId}/accreditation/standards${cip ? '?cip=' + encodeURIComponent(cip) : ''}`;
        debugLog('[AccStandards] loadOutcomes fetching standards: ' + standardsUrl, 'info');
        try {
            let standardsRes;
            let outcomesRes;
            if (outcomesPreloaded !== undefined) {
                standardsRes = await fetch(standardsUrl);
                outcomesRes = { ok: true };
            } else {
                [standardsRes, outcomesRes] = await Promise.all([
                    fetch(standardsUrl),
                    fetch(`/canvas/courses/${selectedCourseId}/accreditation/outcomes`)
                ]);
            }
            let standardsPayload = standardsRes.ok ? await standardsRes.json() : null;
            if (!standardsRes.ok) {
                debugLog('[AccStandards] Standards fetch failed: status=' + standardsRes.status, 'error');
            } else if (standardsPayload) {
                const orgs = Array.isArray(standardsPayload?.organizations) ? standardsPayload.organizations : [];
                const total = Number(standardsPayload?.total_standards) ?? 0;
                const sources = orgs.map(o => (o.abbreviation || o.id) + ':' + (o.standards_source || '?')).join('; ');
                debugLog('[AccStandards] Standards received: orgs=' + orgs.length + ', total_standards=' + total + ', sources=' + sources, 'info');
                const firstOrg = orgs[0];
                const firstStd = Array.isArray(firstOrg?.standards) ? firstOrg.standards[0] : null;
                if (firstStd) {
                    const hasParentId = (firstStd.parentId ?? firstStd.parent_id) != null;
                    debugLog('[AccStandards] First standard sample: id=' + (firstStd.id || '?') + ', hasParentId=' + hasParentId + ', keys=' + Object.keys(firstStd).join(','), 'info');
                }
                if (standardsPayload._debug) {
                    debugLog('[AccStandards] Backend _debug: ' + JSON.stringify(standardsPayload._debug), 'info');
                }
            }
            if (!standardsPayload) {
                debugLog('[AccStandards] Using accreditors fallback (standards endpoint failed or returned null)', 'warn');
                const accreditorsUrl = `/canvas/courses/${selectedCourseId}/accreditation/accreditors${cip ? '?cip=' + encodeURIComponent(cip) : ''}`;
                const accreditorsRes = await fetch(accreditorsUrl);
                const acc = accreditorsRes.ok ? await accreditorsRes.json() : {};
                standardsPayload = {
                    accreditors_source: acc?.source || 'stub',
                    organizations: Array.isArray(acc?.accreditors) ? acc.accreditors.map(a => ({
                        id: a.id,
                        name: a.name,
                        abbreviation: a.abbreviation,
                        standards_source: acc?.source || 'stub',
                        standards_confidence: 0.25,
                        warnings: ['standards endpoint unavailable; using organization fallback'],
                        standards: [{ id: a.id, title: a.name, sourceType: acc?.source || 'stub', confidence: 0.25 }]
                    })) : [],
                    total_standards: 0
                };
            }
            const outcomes = outcomesPreloaded !== undefined
                ? (Array.isArray(outcomesPreloaded) ? outcomesPreloaded : [])
                : (outcomesRes.ok ? await outcomesRes.json() : []);
            const selectedIds = Array.isArray(profile?.selectedStandards) ? profile.selectedStandards : [];
            const standardsHtml = '<div class="acc-standards-block">' + buildStandardsBlockHtml(standardsPayload, selectedIds, null) + '</div>';
            let previewHtml = '';
            if (selectedIds.length) {
                try {
                    const cip = getAccreditationCipFromProfile(profile) || '';
                    const previewRes = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/outcomes/preview' + (cip ? '?cip=' + encodeURIComponent(cip) : ''));
                    const preview = previewRes.ok ? await previewRes.json() : {};
                    const orgs = Array.isArray(preview?.orgs) ? preview.orgs : [];
                    if (orgs.length) {
                        window.__accPreviewOrgs = {};
                        orgs.forEach(o => { window.__accPreviewOrgs[o.orgId] = o; });
                        previewHtml = '<div class="acc-outcomes-preview" style="margin-top:1rem;padding:10px;border:1px solid #e5e7eb;border-radius:8px;">' +
                            '<h4 style="margin:0 0 8px 0;">Submit outcomes by org</h4>' +
                            orgs.map(o => {
                                const n = Number(o.toCreateCount || 0);
                                const exist = Number(o.existingCount || 0);
                                const label = (o.orgAbbrev || o.orgId || '') + ': ' + n + ' to create' + (exist ? ', ' + exist + ' exist' : '') + '.';
                                return '<div style="display:flex;align-items:center;gap:8px;margin:6px 0;">' +
                                    '<span>' + escapeHtml(label) + '</span>' +
                                    '<button type="button" class="primary-btn" onclick="openOutcomeSelectModal(\'' + escapeHtml(o.orgId || '') + '\', \'' + escapeHtml(o.orgAbbrev || '') + '\', \'' + escapeHtml(o.orgName || '').replace(/'/g, "\\'") + '\')"' + (n === 0 ? ' disabled' : '') + '>Submit to Canvas</button>' +
                                    '</div>';
                            }).join('') + '</div>';
                    }
                } catch (_) {}
            }
            const outcomesHtml = !Array.isArray(outcomes) || !outcomes.length
                ? '<p>No learning outcomes in this course.</p>'
                : '<h4 class="acc-outcomes-heading">Course outcomes</h4>' + outcomes.map(o => {
                    const stdStr = (o.standards || []).join(', ');
                    return '<div class="acc-outcome-row" data-outcome-id="' + o.id + '">' +
                        '<div class="acc-outcome-title">' + escapeHtml(o.title || 'Untitled') + '</div>' +
                        '<div class="acc-outcome-standards">' +
                        '<input type="text" class="acc-std-input" value="' + escapeHtml(stdStr) + '" placeholder="QM-2.1, ABET-1a" />' +
                        '<button type="button" class="primary-btn acc-save-std" onclick="saveOutcomeStandards(' + o.id + ')">Save</button>' +
                        '</div></div>';
                }).join('');
            outcomesEl.innerHTML = standardsHtml + previewHtml + '<div class="acc-outcomes-block" style="margin-top: 1.5rem;">' + outcomesHtml + '</div>';
            bindAccStandardsTreeBlocks(outcomesEl);
            await loadAccreditationAlignment(profile);
        } catch (e) {
            outcomesEl.innerHTML = '<p style="color:#c62828;">Failed to load: ' + escapeHtml(e.message) + '</p>';
        }
    };
    await withSpinner(async () => {
        const [profileRes, outcomesRes, workflowRes] = await Promise.all([
            fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`),
            fetch(`/canvas/courses/${selectedCourseId}/accreditation/outcomes`),
            fetch(`/canvas/courses/${selectedCourseId}/accreditation/workflow`)
        ]);
        if (!profileRes.ok) {
            const msg = profileRes.statusText;
            if (profileEl) profileEl.innerHTML = '<p style="color:#c62828;">Failed to load profile: ' + escapeHtml(msg) + '</p>';
            if (workflowEl) workflowEl.innerHTML = '<p style="color:#c62828;">Failed to load profile.</p>';
            if (outcomesEl) outcomesEl.innerHTML = '<p style="color:#c62828;">Failed to load profile.</p>';
            return;
        }
        const profile = await profileRes.json();
        const outcomesPreloaded = outcomesRes.ok ? await outcomesRes.json() : [];
        const workflow = workflowRes.ok ? await workflowRes.json() : { stages: {}, operationLog: [], lockInfo: {} };
        if (workflowEl) {
            const stages = workflow.stages || {};
            const lockInfo = workflow.lockInfo || {};
            const log = Array.isArray(workflow.operationLog) ? workflow.operationLog : [];
            const stageLabels = { '0': 'Workflow', '1': 'Standards', '2': 'Outcomes', '3': 'Rubrics', '3b': 'Instruction', '4': 'Resources', '5': 'Quizzes' };
            const stageHtml = ['0','1','2','3','3b','4','5'].map(sid => {
                const state = stages[sid] || 'draft';
                const info = lockInfo[sid] || {};
                const label = stageLabels[sid] || sid;
                const locked = info.locked ? ' <span style="font-size:11px;color:#999;">(locked)</span>' : '';
                return '<span style="margin-right:12px;"><strong>' + escapeHtml(label) + ':</strong> ' + escapeHtml(state) + locked + '</span>';
            }).join('');
            const logHtml = log.length
                ? '<details style="margin-top:8px;"><summary style="cursor:pointer;font-size:12px;">Operation log (' + log.length + ')</summary><div style="max-height:120px;overflow:auto;font-size:11px;margin-top:4px;">' +
                  log.slice(0, 20).map(e => '<div style="padding:2px 0;border-bottom:1px solid #eee;">' + escapeHtml(e.timestamp || '') + ' | ' + escapeHtml(e.operation || '') + ' (Stage ' + escapeHtml(e.stage || '') + ')</div>').join('') + '</div></details>'
                : '<p style="font-size:12px;color:#666;margin:0;">No operations logged yet.</p>';
            workflowEl.innerHTML = '<div style="font-size:13px;"><div>' + stageHtml + '</div>' + logHtml + '</div>';
        }
        await loadProfile(profile);
        await loadOutcomes(profile, outcomesPreloaded);
    }, {
        panelEl: document.getElementById('standardsSyncPanel'),
        label: 'Loading accreditation...',
        scrollTargetEl: document.getElementById('accProfileContent'),
    });
}

function destroyAccessibilityQaReportGrid() {
    if (accessibilityQaReportGridApi && typeof accessibilityQaReportGridApi.destroy === 'function') {
        accessibilityQaReportGridApi.destroy();
    }
    accessibilityQaReportGridApi = null;
}

function renderAccessibilityQaReportGrid(report) {
    const gridEl = document.getElementById('accessibilityQaReportGrid');
    if (!gridEl || typeof agGrid === 'undefined') return;
    destroyAccessibilityQaReportGrid();
    const rows = Array.isArray(report?.results) ? report.results : [];
    const rowData = rows.map((r) => ({
        fixture_id: r?.fixture_id || '',
        rule_id: r?.rule_id || '',
        content_type: r?.content_type || '',
        scanner_status: r?.scanner_status || '',
        fix_status: r?.fix_status || '',
        expectation_tier: r?.expectation_tier || '',
        notes: r?.notes || '',
    }));
    gridEl.style.display = 'block';
    accessibilityQaReportGridApi = agGrid.createGrid(gridEl, {
        columnDefs: [
            { field: 'fixture_id', headerName: 'Fixture', minWidth: 160 },
            { field: 'rule_id', headerName: 'Rule', minWidth: 140 },
            { field: 'content_type', headerName: 'Type', width: 120 },
            { field: 'scanner_status', headerName: 'Scan', width: 100 },
            { field: 'fix_status', headerName: 'Fix', width: 90 },
            { field: 'expectation_tier', headerName: 'Tier', width: 100 },
            { field: 'notes', headerName: 'Notes', flex: 1, minWidth: 220 },
        ],
        rowData,
        defaultColDef: {
            sortable: true,
            resizable: true,
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            minWidth: 100,
        },
        animateRows: true,
    });
}

function wireAccessibilityQaReportFileInput() {
    const inp = document.getElementById('accessibilityQaReportFile');
    if (!inp) return;
    inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const obj = JSON.parse(String(reader.result || '{}'));
                renderAccessibilityQaReportGrid(obj);
                showToast('Loaded QA report: ' + (obj.run_id || ''), 'success', 2000);
            } catch (e) {
                showToast('Invalid QA report JSON', 'error');
            }
        };
        reader.readAsText(f);
        inp.value = '';
    };
}

function renderAccessibilityPanelSkeleton() {
    const summaryEl = document.getElementById('accessibilitySummaryContent');
    const findingsEl = document.getElementById('accessibilityFindingsContent');
    if (!summaryEl || !findingsEl) return;
    summaryEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;flex-direction:column;gap:4px;">
                <label for="accessibilityBaselineMs" style="font-size:13px;font-weight:600;">Canvas baseline (ms, optional)</label>
                <input id="accessibilityBaselineMs" type="number" min="1" step="1" style="max-width:200px;" placeholder="e.g. 120000" />
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <button id="runAccessibilityScanBtn" class="primary-btn">Run Scan</button>
                <button id="exportAccessibilityCsvBtn" class="primary-btn" disabled>Export CSV</button>
            </div>
        </div>
        <div id="accessibilityOptionsPanel" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
            ${buildAccessibilityTypesControls()}
            ${buildAccessibilityRuleControls(getAllAccessibilityRuleIds())}
        </div>
        <div id="accessibilityMetrics" style="margin-top:10px;color:#444;">Ready to scan.</div>
        <div id="accessibilityRunHistory" style="margin-top:10px;"></div>
        <div id="accessibilityQaReportWrap" style="margin-top:14px;padding-top:12px;border-top:1px solid #e5e5e5;">
            <div style="font-weight:600;margin-bottom:6px;">QA automation report (JSON)</div>
            <input type="file" id="accessibilityQaReportFile" accept="application/json,.json" style="font-size:13px;" />
            <div id="accessibilityQaReportGrid" class="ag-theme-quartz" style="display:none;height:380px;width:100%;margin-top:10px;"></div>
        </div>
    `;
    findingsEl.innerHTML = '<p>No scan has been run yet.</p>';

    const runBtn = document.getElementById('runAccessibilityScanBtn');
    const exportBtn = document.getElementById('exportAccessibilityCsvBtn');
    if (runBtn) runBtn.onclick = () => runAccessibilityScan();
    if (exportBtn) exportBtn.onclick = () => downloadAccessibilityCsv();
    wireAccessibilityOptionToggles();
    wireAccessibilityQaReportFileInput();
}

function loadAccessibilityRunHistory() {
    try {
        const raw = localStorage.getItem(ACCESSIBILITY_RUN_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}

function saveAccessibilityRunHistory(entries) {
    try {
        localStorage.setItem(ACCESSIBILITY_RUN_HISTORY_KEY, JSON.stringify(entries));
    } catch (_) {}
}

function formatResourcesScannedByType(map) {
    const data = map && typeof map === 'object' ? map : {};
    const items = Object.keys(data)
        .sort()
        .map((k) => `${k}:${data[k]}`);
    return items.length ? items.join(', ') : 'none';
}

function recordAccessibilityRun(report) {
    const summary = report?.summary || {};
    const benchmark = report?.benchmark || {};
    const entry = {
        ran_at: new Date().toISOString(),
        resources_scanned_by_type: summary.resources_scanned_by_type || {},
        total_findings: Number(summary.total_findings || 0),
        rule_version: String(report?.rule_version || 'unknown'),
        total_ms: Number(benchmark.total_ms || 0)
    };
    const next = [entry, ...loadAccessibilityRunHistory()].slice(0, 25);
    saveAccessibilityRunHistory(next);
}

function renderAccessibilityRunHistory() {
    const host = document.getElementById('accessibilityRunHistory');
    if (!host) return;
    const rows = loadAccessibilityRunHistory();
    if (!rows.length) {
        host.innerHTML = '';
        return;
    }
    const htmlRows = rows.slice(0, 10).map((r) => `
        <tr>
            <td style="padding:6px;border-bottom:1px solid #eee;white-space:nowrap;">${escapeHtml(new Date(r.ran_at).toLocaleString())}</td>
            <td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(formatResourcesScannedByType(r.resources_scanned_by_type))}</td>
            <td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(String(r.total_findings))}</td>
            <td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(String(r.rule_version || 'unknown'))}</td>
            <td style="padding:6px;border-bottom:1px solid #eee;white-space:nowrap;">${escapeHtml(String(r.total_ms))} ms</td>
        </tr>
    `).join('');
    host.innerHTML = `
        <div style="margin-top:8px;">
            <strong>Recent runs (comparison set)</strong>
            <div style="overflow:auto;max-height:220px;border:1px solid #ddd;border-radius:6px;margin-top:6px;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="position:sticky;top:0;background:#f8f8f8;">
                            <th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Run</th>
                            <th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Resources Scanned By Type</th>
                            <th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Total Findings</th>
                            <th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Rule Version</th>
                            <th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Total Ms</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows}</tbody>
                </table>
            </div>
        </div>
    `;
}

function getSelectedAccessibilityTypes() {
    return Array.from(document.querySelectorAll('.acc-type-checkbox:checked')).map((el) => el.value);
}

function getAllAccessibilityRuleIds() {
    return Array.from(new Set([...ACCESSIBILITY_CANVAS_PARITY_RULES, ...ACCESSIBILITY_ADDITIONAL_RULES]));
}

function getSelectedAccessibilityRuleIds() {
    return Array.from(document.querySelectorAll('.acc-rule-checkbox:checked')).map((el) => el.value);
}

function buildAccessibilityRuleControls(selectedRuleIds) {
    const all = getAllAccessibilityRuleIds();
    const selected = new Set(Array.isArray(selectedRuleIds) && selectedRuleIds.length ? selectedRuleIds : all);
    const renderRule = (id, cls) => `
        <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border:1px solid #e8e8e8;border-radius:6px;background:#fff;">
            <input type="checkbox" class="acc-rule-checkbox ${cls}" value="${id}" ${selected.has(id) ? 'checked' : ''}>
            <span>${escapeHtml(ACCESSIBILITY_RULE_LABELS[id] || id)}</span>
        </label>
    `;
    return `
        <details id="accessibilityRuleControlsCanvas" open style="border:1px solid #ddd;border-radius:8px;padding:10px 12px;background:#fafafa;">
            <summary style="cursor:pointer;font-weight:600;">Canvas parity checks</summary>
            <div style="margin-top:10px;display:flex;justify-content:flex-end;gap:8px;">
                <button type="button" id="accCanvasSelectAllBtn" class="primary-btn">Select all</button>
                <button type="button" id="accCanvasUnselectAllBtn" class="primary-btn">Unselect all</button>
            </div>
            <div style="margin-top:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 10px;">
                ${ACCESSIBILITY_CANVAS_PARITY_RULES.map((id) => renderRule(id, 'acc-rule-canvas')).join('')}
            </div>
        </details>
        <details id="accessibilityRuleControlsAdditional" open style="border:1px solid #ddd;border-radius:8px;padding:10px 12px;background:#fafafa;">
            <summary style="cursor:pointer;font-weight:600;">Additional checks</summary>
            <div style="margin-top:10px;display:flex;justify-content:flex-end;gap:8px;">
                <button type="button" id="accAdditionalSelectAllBtn" class="primary-btn">Select all</button>
                <button type="button" id="accAdditionalUnselectAllBtn" class="primary-btn">Unselect all</button>
            </div>
            <div style="margin-top:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 10px;">
                ${ACCESSIBILITY_ADDITIONAL_RULES.map((id) => renderRule(id, 'acc-rule-additional')).join('')}
            </div>
        </details>
    `;
}

function setCheckedBySelector(selector, checked) {
    document.querySelectorAll(selector).forEach((el) => { el.checked = checked; });
}

function wireAccessibilityOptionToggles() {
    const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };
    bind('accTypeSelectAllBtn', () => setCheckedBySelector('.acc-type-checkbox', true));
    bind('accTypeUnselectAllBtn', () => setCheckedBySelector('.acc-type-checkbox', false));
    bind('accCanvasSelectAllBtn', () => setCheckedBySelector('.acc-rule-canvas', true));
    bind('accCanvasUnselectAllBtn', () => setCheckedBySelector('.acc-rule-canvas', false));
    bind('accAdditionalSelectAllBtn', () => setCheckedBySelector('.acc-rule-additional', true));
    bind('accAdditionalUnselectAllBtn', () => setCheckedBySelector('.acc-rule-additional', false));
}

function buildAccessibilityTypesControls(selectedTypes) {
    const allAccTypes = ['pages', 'assignments', 'announcements', 'discussions', 'syllabus', 'quizzes', 'modules'];
    const selected = new Set(Array.isArray(selectedTypes) && selectedTypes.length ? selectedTypes : allAccTypes);
    const row = (value, label) => `
        <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border:1px solid #e8e8e8;border-radius:6px;background:#fff;">
            <input type="checkbox" class="acc-type-checkbox" value="${value}" ${selected.has(value) ? 'checked' : ''}>
            <span>${label}</span>
        </label>
    `;
    return `
        <details id="accessibilityScopeControls" open style="border:1px solid #ddd;border-radius:8px;padding:10px 12px;background:#fafafa;">
            <summary style="cursor:pointer;font-weight:600;">Resource types</summary>
            <div style="margin-top:10px;display:flex;justify-content:flex-end;gap:8px;">
                <button type="button" id="accTypeSelectAllBtn" class="primary-btn">Select all</button>
                <button type="button" id="accTypeUnselectAllBtn" class="primary-btn">Unselect all</button>
            </div>
            <div style="margin-top:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 10px;">
                ${row('pages', 'Pages')}
                ${row('assignments', 'Assignments')}
                ${row('announcements', 'Announcements')}
                ${row('discussions', 'Discussions')}
                ${row('syllabus', 'Syllabus')}
                ${row('quizzes', 'Quizzes')}
                ${row('modules', 'Modules (Page/Assignment items)')}
            </div>
        </details>
    `;
}

function renderAccessibilityReport(report) {
    const summaryEl = document.getElementById('accessibilitySummaryContent');
    const findingsEl = document.getElementById('accessibilityFindingsContent');
    const exportBtn = document.getElementById('exportAccessibilityCsvBtn');
    if (!summaryEl || !findingsEl) return;

    const summary = report?.summary || {};
    const benchmark = report?.benchmark || {};
    const bySeverity = summary.by_severity || {};
    const allAccTypes = ['pages', 'assignments', 'announcements', 'discussions', 'syllabus', 'quizzes', 'modules'];
    const selectedTypes = Array.isArray(report?.requested_resource_types) && report.requested_resource_types.length
        ? report.requested_resource_types
        : (Object.keys(summary.resources_scanned_by_type || {}).length
            ? Object.keys(summary.resources_scanned_by_type || {})
            : allAccTypes);
    const selectedRuleIds = report?.requested_rule_ids || getAllAccessibilityRuleIds();
    const metricsHtml = `
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;flex-direction:column;gap:4px;">
                <label for="accessibilityBaselineMs" style="font-size:13px;font-weight:600;">Canvas baseline (ms, optional)</label>
                <input id="accessibilityBaselineMs" type="number" min="1" step="1" style="max-width:200px;" value="${benchmark.canvas_native_baseline_ms || ''}" placeholder="e.g. 120000" />
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <button id="runAccessibilityScanBtn" class="primary-btn">Run Scan</button>
                <button id="exportAccessibilityCsvBtn" class="primary-btn">Export CSV</button>
            </div>
        </div>
        <div id="accessibilityOptionsPanel" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
            ${buildAccessibilityTypesControls(selectedTypes)}
            ${buildAccessibilityRuleControls(selectedRuleIds)}
        </div>
        <div id="accessibilityMetrics" style="margin-top:10px;line-height:1.5;">
            <strong>Findings:</strong> ${summary.total_findings || 0}
            &nbsp;|&nbsp; <strong>High:</strong> ${bySeverity.high || 0}
            &nbsp;|&nbsp; <strong>Medium:</strong> ${bySeverity.medium || 0}
            &nbsp;|&nbsp; <strong>Low:</strong> ${bySeverity.low || 0}
            &nbsp;|&nbsp; <strong>Resources scanned:</strong> ${summary.resources_scanned || 0}
            <br/>
            <strong>Scan time:</strong> ${benchmark.total_ms || 0} ms
            ${benchmark.canvas_native_baseline_ms ? `&nbsp;|&nbsp; <strong>Canvas baseline:</strong> ${benchmark.canvas_native_baseline_ms} ms` : ''}
            ${benchmark.ratio_vs_canvas ? `&nbsp;|&nbsp; <strong>Ratio vs Canvas:</strong> ${benchmark.ratio_vs_canvas}x` : ''}
            ${benchmark.slower_than_canvas === true ? '&nbsp;|&nbsp; <span style="color:#a94442;"><strong>Slower than Canvas baseline</strong></span>' : ''}
            ${benchmark.slower_than_canvas === false ? '&nbsp;|&nbsp; <span style="color:#2b7a0b;"><strong>Faster than Canvas baseline</strong></span>' : ''}
        </div>
        <div id="accessibilityRunHistory" style="margin-top:10px;"></div>
        <div id="accessibilityQaReportWrap" style="margin-top:14px;padding-top:12px;border-top:1px solid #e5e5e5;">
            <div style="font-weight:600;margin-bottom:6px;">QA automation report (JSON)</div>
            <input type="file" id="accessibilityQaReportFile" accept="application/json,.json" style="font-size:13px;" />
            <div id="accessibilityQaReportGrid" class="ag-theme-quartz" style="display:none;height:380px;width:100%;margin-top:10px;"></div>
        </div>
    `;
    summaryEl.innerHTML = metricsHtml;
    renderAccessibilityRunHistory();
    wireAccessibilityQaReportFileInput();

    const findings = Array.isArray(report?.findings) ? report.findings : [];
    if (!findings.length) {
        destroyAccessibilityGrid();
        findingsEl.innerHTML = '<p>No findings. Tier 1 checks passed for scanned resources.</p>';
    } else {
        findingsEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                <div><strong>Rows:</strong> ${findings.length}</div>
                <button id="generateFixPreviewBtn" class="primary-btn">Generate Fix Preview</button>
            </div>
            <div id="accessibilityResultsGrid" class="ag-theme-quartz" style="height: 420px; width: 100%;"></div>
            <div id="accessibilityFixQueue" style="display:none;margin-top:16px;border:1px solid #ddd;border-radius:6px;padding:12px;">
                <h4 style="margin:0 0 8px 0;">Fix Queue</h4>
                <div id="accessibilityFixQueueCapNotice" style="display:none;font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:8px 10px;margin-bottom:8px;"></div>
                <div id="accessibilityFixQueueFilters" style="display:none;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:10px;"></div>
                <div id="accessibilityFixPreviewCostSummary" style="display:none;font-size:12px;color:#374151;margin-bottom:8px;"></div>
                <div id="accessibilityFixQueueTableWrap" style="overflow:auto;max-height:240px;margin-bottom:8px;"></div>
                <div id="accessibilityFixPreviewPane" style="display:none;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;padding:12px;background:#fafafa;"></div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button id="applyApprovedFixesBtn" class="primary-btn" disabled>Apply Approved Fixes</button>
                    <span id="accessibilityFixQueueStatus"></span>
                </div>
            </div>
        `;
        initializeAccessibilityGrid(findings);
        const genFixBtn = document.getElementById('generateFixPreviewBtn');
        if (genFixBtn) genFixBtn.onclick = () => generateAccessibilityFixPreview();
    }

    const runBtn = document.getElementById('runAccessibilityScanBtn');
    const newExportBtn = document.getElementById('exportAccessibilityCsvBtn');
    if (runBtn) runBtn.onclick = () => runAccessibilityScan();
    if (newExportBtn) newExportBtn.onclick = () => downloadAccessibilityCsv();
    if (exportBtn) exportBtn.disabled = false;
    wireAccessibilityOptionToggles();
}

async function runAccessibilityScan() {
    if (!selectedCourseId) {
        showToast('Select a course before running accessibility scan.', 'warn');
        return;
    }
    const summaryEl = document.getElementById('accessibilitySummaryContent');
    const findingsEl = document.getElementById('accessibilityFindingsContent');
    const baselineInput = document.getElementById('accessibilityBaselineMs');
    const baselineMs = baselineInput && baselineInput.value ? Number(baselineInput.value) : null;
    const selectedTypes = getSelectedAccessibilityTypes();
    const selectedRuleIds = getSelectedAccessibilityRuleIds();
    if (!selectedTypes.length) {
        showToast('Select at least one resource type.', 'warn');
        return;
    }
    if (!selectedRuleIds.length) {
        showToast('Select at least one accessibility check.', 'warn');
        return;
    }
    const queryParts = [];
    if (baselineMs && Number.isFinite(baselineMs) && baselineMs > 0) {
        queryParts.push(`baseline_ms=${encodeURIComponent(String(baselineMs))}`);
    }
    if (selectedTypes.length) {
        queryParts.push(`resource_types=${encodeURIComponent(selectedTypes.join(','))}`);
    }
    if (selectedRuleIds.length) {
        queryParts.push(`rule_ids=${encodeURIComponent(selectedRuleIds.join(','))}`);
    }
    const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
    if (summaryEl) {
        const metrics = document.getElementById('accessibilityMetrics');
        if (metrics) metrics.textContent = metrics.textContent || 'Ready to scan.';
    }
    if (findingsEl) findingsEl.innerHTML = '<p>Scan in progress...</p>';
    const runBtn = document.getElementById('runAccessibilityScanBtn');
    try {
        await withSpinner(async () => {
            const response = await fetch(`/canvas/courses/${selectedCourseId}/accessibility/scan${qs}`, { credentials: 'include' });
            if (!response.ok) {
                const errText = await response.text().catch(() => '');
                throw new Error(`${response.status} ${response.statusText}${errText ? ': ' + errText.slice(0, 300) : ''}`);
            }
            const report = await response.json();
            accessibilityLastReport = report;
            recordAccessibilityRun(report);
            renderAccessibilityReport(report);
            showToast('Accessibility scan complete.', 'success', 1800);
        }, {
            triggerEl: runBtn,
            label: 'Running scan...',
            panelEl: document.getElementById('accessibilityPanel'),
            scrollTargetEl: document.getElementById('accessibilityFindingsContent'),
        });
    } catch (error) {
        if (findingsEl) findingsEl.innerHTML = `<p style="color:#a94442;">Failed to run scan: ${escapeHtml(error.message || String(error))}</p>`;
        showToast('Accessibility scan failed.', 'error');
    }
}

function downloadAccessibilityCsv() {
    if (!selectedCourseId) {
        showToast('Select a course before exporting CSV.', 'warn');
        return;
    }
    const selectedTypes = getSelectedAccessibilityTypes();
    const selectedRuleIds = getSelectedAccessibilityRuleIds();
    if (!selectedTypes.length) {
        showToast('Select at least one resource type before export.', 'warn');
        return;
    }
    if (!selectedRuleIds.length) {
        showToast('Select at least one accessibility check before export.', 'warn');
        return;
    }
    const parts = [];
    if (selectedTypes.length) parts.push(`resource_types=${encodeURIComponent(selectedTypes.join(','))}`);
    if (selectedRuleIds.length) parts.push(`rule_ids=${encodeURIComponent(selectedRuleIds.join(','))}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    const url = `/canvas/courses/${selectedCourseId}/accessibility/export.csv${qs}`;
    window.open(url, '_blank');
}

function emptyAccessibilityFixPreviewRunMeter() {
    return {
        requests: 0,
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
        estimated_input_usd: 0,
        estimated_output_usd: 0,
        estimated_total_usd: 0,
    };
}

function addAccessibilityFixPreviewRunMeters(agg, m) {
    if (!m || typeof m !== 'object') return agg;
    return {
        requests: (agg.requests || 0) + (Number(m.requests) || 0),
        input_tokens: (agg.input_tokens || 0) + (Number(m.input_tokens) || 0),
        output_tokens: (agg.output_tokens || 0) + (Number(m.output_tokens) || 0),
        cache_read_input_tokens: (agg.cache_read_input_tokens || 0) + (Number(m.cache_read_input_tokens) || 0),
        cache_creation_input_tokens: (agg.cache_creation_input_tokens || 0) + (Number(m.cache_creation_input_tokens) || 0),
        estimated_input_usd: (agg.estimated_input_usd || 0) + (Number(m.estimated_input_usd) || 0),
        estimated_output_usd: (agg.estimated_output_usd || 0) + (Number(m.estimated_output_usd) || 0),
        estimated_total_usd: (agg.estimated_total_usd || 0) + (Number(m.estimated_total_usd) || 0),
    };
}

function formatAccessibilityFixPreviewCostSummary(m) {
    const req = Number(m?.requests) || 0;
    const inUsd = Number(m?.estimated_input_usd) || 0;
    const outUsd = Number(m?.estimated_output_usd) || 0;
    const tot = Number(m?.estimated_total_usd) || 0;
    const fmt = (x) => (Number.isFinite(x) ? x.toFixed(4) : '0.0000');
    const cr = Number(m?.cache_read_input_tokens) || 0;
    const cc = Number(m?.cache_creation_input_tokens) || 0;
    const cacheBit = cr + cc > 0 ? ` · cache read ${cr} tok · cache write ${cc} tok` : '';
    return `AI (this run): ${req} request(s) · input $${fmt(inUsd)} · output $${fmt(outUsd)} · total $${fmt(tot)}${cacheBit}`;
}

function accFixQueueRowVisible(tr) {
    if (!tr || !tr.classList.contains('acc-fix-row')) return false;
    return tr.style.display !== 'none';
}

function getVisibleAccFixApproveCheckboxes() {
    return Array.from(document.querySelectorAll('.acc-fix-approve')).filter((cb) => {
        const tr = cb.closest('tr');
        return tr && accFixQueueRowVisible(tr);
    });
}

function syncAccFixSelectAllState() {
    const sel = document.getElementById('accFixSelectAll');
    if (!sel) return;
    const vis = getVisibleAccFixApproveCheckboxes();
    if (!vis.length) {
        sel.checked = false;
        sel.indeterminate = false;
        return;
    }
    const checked = vis.filter((c) => c.checked).length;
    sel.checked = checked === vis.length;
    sel.indeterminate = checked > 0 && checked < vis.length;
}

function applyAccessibilityFixQueueFilters() {
    const rule = accessibilityFixQueueFilters.ruleId || '';
    const rt = accessibilityFixQueueFilters.resourceType || '';
    const tier = (accessibilityFixQueueFilters.tier || '').toLowerCase();
    const wrap = document.getElementById('accessibilityFixQueueTableWrap');
    if (!wrap) return;
    wrap.querySelectorAll('tr.acc-fix-row').forEach((tr) => {
        const okRule = !rule || tr.getAttribute('data-rule-id') === rule;
        const okRt = !rt || tr.getAttribute('data-resource-type') === rt;
        const okTier = !tier || String(tr.getAttribute('data-confidence-tier') || '').toLowerCase() === tier;
        const show = okRule && okRt && okTier;
        tr.style.display = show ? '' : 'none';
    });
    syncAccFixSelectAllState();
    updateApplyButtonState();
}

function clearAccessibilityFixQueueFilters() {
    accessibilityFixQueueFilters = { ruleId: '', resourceType: '', tier: '' };
    const r = document.getElementById('accFixFilterRule');
    const t = document.getElementById('accFixFilterResourceType');
    const z = document.getElementById('accFixFilterTier');
    if (r) r.value = '';
    if (t) t.value = '';
    if (z) z.value = '';
    applyAccessibilityFixQueueFilters();
}

async function generateAccessibilityFixPreview() {
    if (!selectedCourseId) {
        showToast('Select a course first.', 'warn');
        if (typeof debugLog === 'function') debugLog('[Accessibility Fix] Preview aborted: no course selected', 'warn');
        return;
    }
    let rowsData = [];
    if (accessibilityGridApi && typeof accessibilityGridApi.getSelectedRows === 'function') {
        rowsData = accessibilityGridApi.getSelectedRows() || [];
    }
    if (!rowsData.length && accessibilityGridApi?.forEachNodeAfterFilterAndSort) {
        const filteredRows = [];
        accessibilityGridApi.forEachNodeAfterFilterAndSort((node) => {
            if (node?.data) filteredRows.push(node.data);
        });
        rowsData = filteredRows;
    }
    if (!rowsData.length) {
        showToast('Select at least one finding row or apply a filter to preview fixes.', 'warn');
        if (typeof debugLog === 'function') debugLog('[Accessibility Fix] Preview aborted: no selected or filtered rows', 'warn');
        return;
    }
    if (typeof debugLog === 'function') debugLog(`[Accessibility Fix] Preview request starting: selected_rows=${rowsData.length}`, 'info');
    const rows = rowsData.map((r) => ({
        resource_type: r?.resource_type || '',
        resource_id: r?.resource_id || '',
        resource_title: r?.resource_title || '',
        rule_id: r?.rule_id || '',
        snippet: r?.snippet || null
    }));
    const previewSessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const btn = document.getElementById('generateFixPreviewBtn');
    try {
        await withSpinner(async ({ setLabel }) => {
            accessibilityFixGenerationInProgress = true;
            accessibilityFixPreviewActions = [];
            const costEl = document.getElementById('accessibilityFixPreviewCostSummary');
            const capNoticeEl = document.getElementById('accessibilityFixQueueCapNotice');
            if (costEl) {
                costEl.style.display = 'none';
                costEl.textContent = '';
            }
            if (capNoticeEl) {
                capNoticeEl.style.display = 'none';
                capNoticeEl.textContent = '';
            }
            let runMeter = emptyAccessibilityFixPreviewRunMeter();
            let aiPreviewCap = null;
            renderAccessibilityFixQueue(accessibilityFixPreviewActions);
            const total = rows.length;
            let completed = 0;
            const updateProgress = () => {
                const msg = `Generating suggestions ${completed} of ${total}...`;
                const statusEl = document.getElementById('accessibilityFixQueueStatus');
                if (statusEl) statusEl.textContent = msg;
                setLabel(msg);
            };
            updateProgress();
            const maxConcurrent = ACCESSIBILITY_FIX_PREVIEW_CONCURRENCY;
            let index = 0;
            const workers = new Array(Math.min(maxConcurrent, total)).fill(null).map(async () => {
                while (index < total) {
                    const current = index++;
                    const finding = rows[current];
                    try {
                        const res = await fetch(`/canvas/courses/${selectedCourseId}/accessibility/fix-preview-item`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ finding, preview_session_id: previewSessionId })
                        });
                        const data = await res.json().catch(() => ({}));
                        if (typeof data?.accessibility_ai_preview_cap === 'number') aiPreviewCap = data.accessibility_ai_preview_cap;
                        runMeter = addAccessibilityFixPreviewRunMeters(runMeter, data?.meter);
                        if (!res.ok) {
                            const errText = typeof data?.error === 'string' ? data.error : res.statusText;
                            throw new Error(errText);
                        }
                        const action = data?.action || null;
                        if (action) accessibilityFixPreviewActions.push(action);
                        else {
                            accessibilityFixPreviewActions.push({
                                action_id: `failed:${finding.resource_type}:${finding.resource_id}:${finding.rule_id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
                                resource_type: finding.resource_type,
                                resource_id: finding.resource_id,
                                resource_title: finding.resource_title || '',
                                rule_id: finding.rule_id,
                                risk: 'medium',
                                fix_strategy: 'manual_only',
                                before_snippet: finding.snippet || '',
                                suggestion: '',
                                edited_suggestion: '',
                                reasoning: '',
                                confidence: 0.2,
                                confidence_tier: 'low',
                                requires_review: true,
                                error_note: data?.error || 'No preview available for this item.',
                            });
                        }
                    } catch (e) {
                        accessibilityFixPreviewActions.push({
                            action_id: `failed:${finding.resource_type}:${finding.resource_id}:${finding.rule_id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
                            resource_type: finding.resource_type,
                            resource_id: finding.resource_id,
                            resource_title: finding.resource_title || '',
                            rule_id: finding.rule_id,
                            risk: 'medium',
                            fix_strategy: 'manual_only',
                            before_snippet: finding.snippet || '',
                            suggestion: '',
                            edited_suggestion: '',
                            reasoning: '',
                            confidence: 0.2,
                            confidence_tier: 'low',
                            requires_review: true,
                            error_note: e?.message || 'Suggestion generation failed.',
                        });
                    } finally {
                        completed++;
                        updateProgress();
                        renderAccessibilityFixQueue(accessibilityFixPreviewActions);
                    }
                }
            });
            await Promise.all(workers);
            accessibilityFixGenerationInProgress = false;
            const showCost = Number(runMeter.requests) > 0 || Number(runMeter.estimated_total_usd) > 0;
            if (costEl && showCost) {
                costEl.style.display = 'block';
                costEl.textContent = formatAccessibilityFixPreviewCostSummary(runMeter);
            } else if (costEl) {
                costEl.style.display = 'none';
                costEl.textContent = '';
            }
            const capSkipped = (accessibilityFixPreviewActions || []).filter((a) => a?.skip_reason === 'ai_cap_reached').length;
            if (capNoticeEl && capSkipped > 0 && typeof aiPreviewCap === 'number') {
                capNoticeEl.style.display = 'block';
                capNoticeEl.textContent = `AI suggestions limited to ${aiPreviewCap} item(s) per session during development. Remaining items require manual review. ${capSkipped} item(s) were not sent to the model.`;
            } else if (capNoticeEl) {
                capNoticeEl.style.display = 'none';
                capNoticeEl.textContent = '';
            }
            if (typeof debugLog === 'function') debugLog(`[Accessibility Fix] Preview success: actions=${accessibilityFixPreviewActions.length}`, 'info');
            if (!accessibilityFixPreviewActions.length) {
                showToast('No fix suggestions available for current findings.', 'info');
            }
        }, {
            triggerEl: btn,
            label: 'Generating preview...',
            panelEl: document.getElementById('accessibilityPanel'),
            scrollTargetEl: document.getElementById('accessibilityFixQueue'),
        });
    } catch (e) {
        accessibilityFixGenerationInProgress = false;
        if (typeof debugLog === 'function') debugLog('[Accessibility Fix] Preview failed: ' + (e?.stack || e?.message || String(e)), 'error');
        showToast('Fix preview failed: ' + (e?.message || String(e)), 'error');
    }
}

function getConfidenceMeta(action) {
    const tier = String(action?.confidence_tier || '').toLowerCase();
    if (tier === 'high') return { label: 'High', color: '#166534', border: '#86efac', bg: '#ecfdf3', icon: 'H' };
    if (tier === 'medium') return { label: 'Medium', color: '#854d0e', border: '#facc15', bg: '#fefce8', icon: 'M' };
    return { label: 'Low', color: '#991b1b', border: '#fca5a5', bg: '#fef2f2', icon: 'L' };
}

function setActionEditedSuggestion(actionId, text) {
    const actions = Array.isArray(accessibilityFixPreviewActions) ? accessibilityFixPreviewActions : [];
    const action = actions.find((x) => String(x?.action_id) === String(actionId));
    if (!action) return;
    action.edited_suggestion = String(text || '');
}

function approveAccessibilityAction(actionId) {
    const cb = Array.from(document.querySelectorAll('.acc-fix-approve')).find((x) => String(x.getAttribute('data-action-id') || '') === String(actionId));
    if (!cb) return;
    cb.checked = true;
    syncAccFixSelectAllState();
    updateApplyButtonState();
}

function skipAccessibilityAction(actionId) {
    const cb = Array.from(document.querySelectorAll('.acc-fix-approve')).find((x) => String(x.getAttribute('data-action-id') || '') === String(actionId));
    if (!cb) return;
    cb.checked = false;
    syncAccFixSelectAllState();
    updateApplyButtonState();
}

function approveAllAccessibilityHighConfidence() {
    const actions = Array.isArray(accessibilityFixPreviewActions) ? accessibilityFixPreviewActions : [];
    const highIds = new Set(actions.filter((a) => String(a?.confidence_tier) === 'high' && String(a?.fix_strategy) !== 'manual_only').map((a) => String(a.action_id)));
    const wrap = document.getElementById('accessibilityFixQueueTableWrap');
    if (!wrap) return;
    wrap.querySelectorAll('tr.acc-fix-row').forEach((tr) => {
        if (!accFixQueueRowVisible(tr)) return;
        const cb = tr.querySelector('.acc-fix-approve');
        if (!cb || cb.disabled) return;
        cb.checked = highIds.has(String(cb.getAttribute('data-action-id') || ''));
    });
    syncAccFixSelectAllState();
    updateApplyButtonState();
}

function approveAllAccessibilitySuggestions() {
    const wrap = document.getElementById('accessibilityFixQueueTableWrap');
    if (!wrap) return;
    wrap.querySelectorAll('tr.acc-fix-row').forEach((tr) => {
        if (!accFixQueueRowVisible(tr)) return;
        const cb = tr.querySelector('.acc-fix-approve');
        if (cb && !cb.disabled) cb.checked = true;
    });
    syncAccFixSelectAllState();
    updateApplyButtonState();
}

function renderAccessibilityFixQueue(actions) {
    const wrap = document.getElementById('accessibilityFixQueueTableWrap');
    const queue = document.getElementById('accessibilityFixQueue');
    const applyBtn = document.getElementById('applyApprovedFixesBtn');
    const statusEl = document.getElementById('accessibilityFixQueueStatus');
    const filterHost = document.getElementById('accessibilityFixQueueFilters');
    if (!wrap || !queue) return;
    if (!actions || !actions.length) {
        queue.style.display = 'none';
        if (filterHost) {
            filterHost.style.display = 'none';
            filterHost.innerHTML = '';
        }
        wrap.innerHTML = '';
        return;
    }
    queue.style.display = 'block';
    if (filterHost) {
        filterHost.style.display = 'flex';
        const ruleIds = [...new Set(actions.map((x) => String(x.rule_id || '').trim()).filter(Boolean))].sort((x, y) => x.localeCompare(y));
        const resourceTypes = [...new Set(actions.map((x) => String(x.resource_type || '').trim()).filter(Boolean))].sort((x, y) => x.localeCompare(y));
        const tierChoices = ['high', 'medium', 'low'];
        if (accessibilityFixQueueFilters.ruleId && !ruleIds.includes(accessibilityFixQueueFilters.ruleId)) accessibilityFixQueueFilters.ruleId = '';
        if (accessibilityFixQueueFilters.resourceType && !resourceTypes.includes(accessibilityFixQueueFilters.resourceType)) accessibilityFixQueueFilters.resourceType = '';
        const tf = String(accessibilityFixQueueFilters.tier || '').toLowerCase();
        if (tf && !tierChoices.includes(tf)) accessibilityFixQueueFilters.tier = '';
        const ruleOpts = ruleIds.map((rid) => `<option value="${escapeHtml(rid)}">${escapeHtml(ACCESSIBILITY_RULE_LABELS[rid] || rid)}</option>`).join('');
        const rtOpts = resourceTypes.map((rt) => `<option value="${escapeHtml(rt)}">${escapeHtml(rt)}</option>`).join('');
        const tierOpts = tierChoices.map((ti) => `<option value="${ti}">${ti}</option>`).join('');
        filterHost.innerHTML = `
            <label style="font-size:12px;display:flex;flex-direction:column;gap:4px;">Rule
                <select id="accFixFilterRule" style="min-width:180px;padding:4px;"><option value="">All</option>${ruleOpts}</select>
            </label>
            <label style="font-size:12px;display:flex;flex-direction:column;gap:4px;">Resource type
                <select id="accFixFilterResourceType" style="min-width:140px;padding:4px;"><option value="">All</option>${rtOpts}</select>
            </label>
            <label style="font-size:12px;display:flex;flex-direction:column;gap:4px;">Confidence
                <select id="accFixFilterTier" style="min-width:120px;padding:4px;"><option value="">All</option>${tierOpts}</select>
            </label>
            <button type="button" class="primary-btn" id="accFixFilterClear" style="align-self:flex-end;">Clear filters</button>
        `;
        const fr = document.getElementById('accFixFilterRule');
        const frt = document.getElementById('accFixFilterResourceType');
        const fz = document.getElementById('accFixFilterTier');
        const fc = document.getElementById('accFixFilterClear');
        if (fr) fr.value = accessibilityFixQueueFilters.ruleId || '';
        if (frt) frt.value = accessibilityFixQueueFilters.resourceType || '';
        if (fz) fz.value = accessibilityFixQueueFilters.tier || '';
        if (fr) fr.onchange = (e) => { accessibilityFixQueueFilters.ruleId = e.target.value || ''; applyAccessibilityFixQueueFilters(); };
        if (frt) frt.onchange = (e) => { accessibilityFixQueueFilters.resourceType = e.target.value || ''; applyAccessibilityFixQueueFilters(); };
        if (fz) fz.onchange = (e) => { accessibilityFixQueueFilters.tier = e.target.value || ''; applyAccessibilityFixQueueFilters(); };
        if (fc) fc.onclick = () => clearAccessibilityFixQueueFilters();
    }
    const rows = actions.map((a, i) => {
        const isManualOnly = String(a.fix_strategy || '') === 'manual_only';
        const checkedAttr = isManualOnly ? '' : ' checked';
        const disabledAttr = isManualOnly ? ' disabled' : '';
        const choices = Array.isArray(a.fix_choices) && a.fix_choices.length ? a.fix_choices : null;
        const suggestion = String(a.edited_suggestion ?? a.suggestion ?? a.after_snippet ?? '').trim();
        const confidence = getConfidenceMeta(a);
        const imgLowConfidence = String(a?.confidence_tier || 'low') === 'low' && String(a?.image_url || '').trim();
        const beforeValue = String(a.before_snippet || '').trim();
        const reasoning = String(a.reasoning || '').trim();
        const tierAttr = String(a.confidence_tier || 'low').toLowerCase();
        return `
        <tr class="acc-fix-row" style="background:${confidence.bg}; border-left:4px solid ${confidence.border};" data-rule-id="${escapeHtml(String(a.rule_id || ''))}" data-resource-type="${escapeHtml(String(a.resource_type || ''))}" data-confidence-tier="${escapeHtml(tierAttr)}">
            <td style="padding:6px;"><input type="checkbox" class="acc-fix-approve" data-action-id="${escapeHtml(a.action_id)}" data-index="${i}"${checkedAttr}${disabledAttr}></td>
            <td style="padding:6px;">${escapeHtml(ACCESSIBILITY_RULE_LABELS[a.rule_id] || a.rule_id)}</td>
            <td style="padding:6px;">${escapeHtml(a.resource_type)}</td>
            <td style="padding:6px;">${escapeHtml(a.resource_title || '').slice(0, 60)}</td>
            <td style="padding:6px;">
                <span style="display:inline-flex;align-items:center;gap:6px;color:${confidence.color};font-weight:700;">
                    <span style="display:inline-flex;width:18px;height:18px;border-radius:999px;border:1px solid ${confidence.border};justify-content:center;align-items:center;background:#fff;">${confidence.icon}</span>
                    ${confidence.label}
                </span>
                ${a.confidence_override_reason ? `<div style="font-size:11px;color:#7f1d1d;margin-top:3px;">override: ${escapeHtml(a.confidence_override_reason)}</div>` : ''}
            </td>
            <td style="padding:6px;max-width:260px;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(beforeValue)}">${escapeHtml(beforeValue || '(none)').slice(0, 120)}</td>
            <td style="padding:6px;min-width:280px;">
                ${choices ? `
                ${a.fix_choice_intro ? `<div style="font-size:12px;color:#374151;margin-bottom:8px;line-height:1.45;">${escapeHtml(String(a.fix_choice_intro))}</div>` : ''}
                <div class="acc-fix-choices-wrap" data-acc-fix-index="${i}" data-action-id="${escapeHtml(a.action_id)}">
                ${choices.map((c, j) => {
        const val = String(c.value || '');
        const cur = suggestion || String(a.suggestion || '');
        const sel = (cur && cur === val) || (!cur && j === 0) ? ' checked' : '';
        return `<label style="display:block;margin:8px 0;font-size:12px;line-height:1.35;"><input type="radio" class="acc-fix-choice" name="acc-fix-choice-${i}" data-action-id="${escapeHtml(a.action_id)}" value="${escapeHtml(val)}"${sel}${isManualOnly ? ' disabled' : ''}/> ${escapeHtml(String(c.label || val))}</label>${c.help ? `<div style="font-size:11px;color:#6b7280;margin:-4px 0 4px 22px;line-height:1.35;">${escapeHtml(String(c.help))}</div>` : ''}`;
    }).join('')}
                </div>
                ` : `
                <textarea class="acc-fix-edit-input" data-action-id="${escapeHtml(a.action_id)}" rows="3" style="width:100%;font-size:12px;border:1px solid ${confidence.border};border-radius:6px;padding:6px;" ${isManualOnly ? 'disabled' : ''}>${escapeHtml(suggestion)}</textarea>
                `}
                ${imgLowConfidence ? `<div style="margin-top:6px;"><img src="${escapeHtml(String(a.image_url))}" alt="" style="max-width:220px;max-height:120px;border:1px solid #ddd;border-radius:4px;"></div>` : ''}
                ${reasoning ? `<details style="margin-top:6px;"><summary style="cursor:pointer;font-size:12px;">Reasoning</summary><div style="font-size:12px;color:#374151;">${escapeHtml(reasoning)}</div></details>` : ''}
                ${Number(a.ai_dedupe_shared_with) > 0 ? `<div style="font-size:11px;color:#1e40af;margin-top:6px;">Shared with ${Number(a.ai_dedupe_shared_with)} other instance(s) (one AI analysis).</div>` : ''}
                ${a.rate_limited ? `<div style="font-size:12px;color:#92400e;margin-top:6px;font-weight:600;">Rate limited — retry individually</div>` : ''}
                ${a.error_note ? `<div style="font-size:12px;color:#991b1b;margin-top:6px;">${escapeHtml(a.error_note)}</div>` : ''}
            </td>
            <td style="padding:6px;">
                <button type="button" class="primary-btn" style="margin-right:6px;" ${isManualOnly ? 'disabled' : ''} onclick="approveAccessibilityAction('${escapeHtml(a.action_id)}')">Approve</button>
                <button type="button" class="primary-btn" onclick="skipAccessibilityAction('${escapeHtml(a.action_id)}')">Skip</button>
                <div style="margin-top:6px;"><a href="#" onclick="openAccessibilityFixPreviewInline(${i}); return false;">Open Preview</a></div>
            </td>
        </tr>
    `;
    }).join('');
    wrap.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
                <tr style="background:#f8f8f8;">
                    <th style="text-align:left;padding:6px;"><input type="checkbox" id="accFixSelectAll" checked></th>
                    <th style="text-align:left;padding:6px;">Rule</th>
                    <th style="text-align:left;padding:6px;">Type</th>
                    <th style="text-align:left;padding:6px;">Resource</th>
                    <th style="text-align:left;padding:6px;">Confidence</th>
                    <th style="text-align:left;padding:6px;">Current Value</th>
                    <th style="text-align:left;padding:6px;">Suggested Fix (Editable)</th>
                    <th style="text-align:left;padding:6px;">Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div style="display:flex;gap:8px;margin-top:8px;">
            <button type="button" class="primary-btn" onclick="approveAllAccessibilityHighConfidence()">Approve all high confidence</button>
            <button type="button" class="primary-btn" onclick="approveAllAccessibilitySuggestions()">Approve all suggestions</button>
        </div>
    `;
    const selectAll = document.getElementById('accFixSelectAll');
    if (selectAll) {
        selectAll.onchange = () => {
            getVisibleAccFixApproveCheckboxes().forEach((cb) => { cb.checked = selectAll.checked; });
            updateApplyButtonState();
        };
    }
    wrap.querySelectorAll('.acc-fix-approve').forEach((cb) => { cb.onchange = () => { syncAccFixSelectAllState(); updateApplyButtonState(); }; });
    wrap.querySelectorAll('.acc-fix-edit-input').forEach((el) => {
        el.addEventListener('input', (evt) => {
            const target = evt.target;
            setActionEditedSuggestion(target.getAttribute('data-action-id'), target.value);
        });
    });
    wrap.querySelectorAll('.acc-fix-choice').forEach((el) => {
        el.addEventListener('change', (evt) => {
            const target = evt.target;
            if (target && target.checked) setActionEditedSuggestion(target.getAttribute('data-action-id'), target.value);
        });
    });
    actions.forEach((a, i) => {
        if (!Array.isArray(a.fix_choices) || !a.fix_choices.length) return;
        const wrapEl = wrap.querySelector(`[data-acc-fix-index="${i}"]`);
        if (!wrapEl) return;
        const checked = wrapEl.querySelector('.acc-fix-choice:checked');
        const v = checked && checked.value ? checked.value : String(a.fix_choices[0]?.value || '');
        if (v) setActionEditedSuggestion(a.action_id, v);
    });
    if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.onclick = applyApprovedAccessibilityFixes;
    }
    if (statusEl && !accessibilityFixGenerationInProgress) statusEl.textContent = `${actions.length} fix(es) ready`;
    applyAccessibilityFixQueueFilters();
}

function openAccessibilityFixPreviewInline(actionRef) {
    const actions = Array.isArray(accessibilityFixPreviewActions) ? accessibilityFixPreviewActions : [];
    const pane = document.getElementById('accessibilityFixPreviewPane');
    if (!pane) {
        showToast('Inline preview panel is not available.', 'warn');
        if (typeof debugLog === 'function') debugLog('[Accessibility Fix] Inline preview failed: panel missing', 'warn');
        return;
    }
    let action = null;
    if (Number.isInteger(actionRef) && actionRef >= 0 && actionRef < actions.length) {
        action = actions[actionRef];
    } else {
        action = actions.find((x) => String(x?.action_id) === String(actionRef));
    }
    if (!action) {
        showToast('Preview not found for this action.', 'warn');
        if (typeof debugLog === 'function') debugLog('[Accessibility Fix] Inline preview failed: action not found ' + String(actionRef), 'warn');
        return;
    }
    const title = `${ACCESSIBILITY_RULE_LABELS[action.rule_id] || action.rule_id} • ${action.resource_type}`;
    const beforeRaw = String(action.before_snippet || '').trim();
    const afterRaw = String(action.after_snippet || '').trim();
    const before = escapeHtml(beforeRaw);
    const after = escapeHtml(afterRaw);
    const beforeBlock = beforeRaw ? `<pre>${before}</pre>` : '<div style="padding:12px;border:1px solid #ddd;border-radius:6px;background:#fffbe6;">No visible before-snippet was captured for this action.</div>';
    const afterBlock = afterRaw ? `<pre>${after}</pre>` : '<div style="padding:12px;border:1px solid #ddd;border-radius:6px;background:#fffbe6;">No visible after-snippet was captured for this action.</div>';
    pane.style.display = 'block';
    pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <strong>${escapeHtml(title)}</strong>
            <button type="button" class="primary-btn" onclick="document.getElementById('accessibilityFixPreviewPane').style.display='none'">Close Preview</button>
        </div>
        <div style="color:#444;margin-bottom:6px;font-size:13px;">Resource: ${escapeHtml(String(action.resource_title || ''))}</div>
        <div style="color:#444;margin-bottom:10px;font-size:13px;">Risk: ${escapeHtml(String(action.risk || ''))}</div>
        <h5 style="margin:0 0 6px 0;">Before</h5>
        ${beforeBlock}
        <h5 style="margin:12px 0 6px 0;">After</h5>
        ${afterBlock}
    `;
    pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (typeof debugLog === 'function') debugLog('[Accessibility Fix] Rendered inline preview for action ' + String(action.action_id || actionRef), 'info');
}

function updateApplyButtonState() {
    const n = getVisibleAccFixApproveCheckboxes().filter((c) => c.checked).length;
    const applyBtn = document.getElementById('applyApprovedFixesBtn');
    if (applyBtn) applyBtn.disabled = !n;
}

async function applyApprovedAccessibilityFixes() {
    if (!selectedCourseId || !accessibilityFixPreviewActions?.length) return;
    const wrap = document.getElementById('accessibilityFixQueueTableWrap');
    const checked = getVisibleAccFixApproveCheckboxes().filter((c) => c.checked);
    const approvedIds = new Set(Array.from(checked).map((el) => el.getAttribute('data-action-id')));
    const approved = accessibilityFixPreviewActions
        .filter((a) => approvedIds.has(a.action_id))
        .map((a) => {
            const row = wrap
                ? Array.from(wrap.querySelectorAll('tr.acc-fix-row')).find((tr) => {
                    const id = tr.querySelector('.acc-fix-approve')?.getAttribute('data-action-id');
                    return String(id || '') === String(a.action_id);
                })
                : null;
            const scope = row || document;
            const radio = Array.from(scope.querySelectorAll('.acc-fix-choice')).find(
                (el) => el.checked && String(el.getAttribute('data-action-id') || '') === String(a.action_id),
            );
            if (radio && typeof radio.value === 'string' && radio.value) {
                return { ...a, edited_suggestion: radio.value };
            }
            const input = Array.from(scope.querySelectorAll('.acc-fix-edit-input'))
                .find((el) => String(el.getAttribute('data-action-id') || '') === String(a.action_id));
            const editedSuggestion = input && typeof input.value === 'string' ? input.value : (a.edited_suggestion || a.suggestion || '');
            return { ...a, edited_suggestion: editedSuggestion };
        });
    if (!approved.length) {
        showToast('Select at least one fix to apply.', 'warn');
        return;
    }
    const applyBtn = document.getElementById('applyApprovedFixesBtn');
    const statusEl = document.getElementById('accessibilityFixQueueStatus');
    if (statusEl) statusEl.textContent = 'Applying...';
    if (typeof debugLog === 'function') debugLog(`[Accessibility Fix] Apply request starting: approved_actions=${approved.length}`, 'info');
    try {
        await withSpinner(async ({ setLabel }) => {
            const batches = [];
            const chunkSize = 25;
            for (let i = 0; i < approved.length; i += chunkSize) batches.push(approved.slice(i, i + chunkSize));
            let fixed = 0;
            let skipped = 0;
            let failed = 0;
            const fixedResultKeys = new Set();
            for (let i = 0; i < batches.length; i++) {
                const progress = `Applying... (${i + 1}/${batches.length})`;
                if (statusEl) statusEl.textContent = progress;
                setLabel(progress);
                const res = await fetch(`/canvas/courses/${selectedCourseId}/accessibility/fix-apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ actions: batches[i] })
                });
                if (!res.ok) {
                    const errText = await res.text().catch(() => res.statusText);
                    if (typeof debugLog === 'function') debugLog(`[Accessibility Fix] Apply HTTP failed: status=${res.status} body=${String(errText).slice(0, 600)}`, 'error');
                    throw new Error(errText);
                }
                const data = await res.json();
                fixed += Number(data?.fixed || 0);
                skipped += Number(data?.skipped || 0);
                failed += Number(data?.failed || 0);
                const batchResults = Array.isArray(data?.results) ? data.results : [];
                batchResults.forEach((r) => {
                    if (String(r?.status || '') !== 'fixed') return;
                    fixedResultKeys.add(`${r?.resource_type || ''}:${r?.resource_id || ''}:${r?.rule_id || ''}`);
                });
            }
            if (typeof debugLog === 'function') debugLog(`[Accessibility Fix] Apply success: fixed=${fixed} skipped=${skipped} failed=${failed}`, failed > 0 ? 'warn' : 'info');
            if (statusEl) statusEl.textContent = `Fixed: ${fixed}, Skipped: ${skipped}, Failed: ${failed}`;
            showToast(`Applied fixes: ${fixed} fixed, ${skipped} skipped, ${failed} failed.`, fixed > 0 ? 'success' : 'info');
            if (fixed > 0) {
                const approvedKeySet = new Set(approved.map(a => `${a.resource_type}:${a.resource_id}:${a.rule_id}`));
                const keysToRemove = fixedResultKeys.size ? fixedResultKeys : approvedKeySet;
                accessibilityFixPreviewActions = (accessibilityFixPreviewActions || []).filter(
                    a => !keysToRemove.has(`${a.resource_type}:${a.resource_id}:${a.rule_id}`)
                );
                renderAccessibilityFixQueue(accessibilityFixPreviewActions);
                if (accessibilityGridApi?.forEachNode && accessibilityGridApi?.applyTransaction) {
                    const toRemove = [];
                    accessibilityGridApi.forEachNode((node) => {
                        const d = node?.data || {};
                        const key = `${d.resource_type || ''}:${d.resource_id || ''}:${d.rule_id || ''}`;
                        if (keysToRemove.has(key)) toRemove.push(d);
                    });
                    if (toRemove.length) accessibilityGridApi.applyTransaction({ remove: toRemove });
                }
            }
        }, {
            triggerEl: applyBtn,
            label: 'Applying fixes...',
            panelEl: document.getElementById('accessibilityPanel'),
            scrollTargetEl: document.getElementById('accessibilityFixQueueStatus') || document.getElementById('accessibilityFindingsContent'),
        });
    } catch (e) {
        if (typeof debugLog === 'function') debugLog('[Accessibility Fix] Apply failed: ' + (e?.stack || e?.message || String(e)), 'error');
        showToast('Apply failed: ' + (e?.message || String(e)), 'error');
        if (statusEl) statusEl.textContent = 'Apply failed';
    }
}

function loadAccessibilityTab() {
    renderAccessibilityPanelSkeleton();
    renderAccessibilityRunHistory();
    if (accessibilityLastReport) {
        renderAccessibilityReport(accessibilityLastReport);
        return;
    }
}

function destroyAccessibilityGrid() {
    if (accessibilityGridApi && typeof accessibilityGridApi.destroy === 'function') {
        accessibilityGridApi.destroy();
    }
    accessibilityGridApi = null;
}

function initializeAccessibilityGrid(findings) {
    const gridEl = document.getElementById('accessibilityResultsGrid');
    if (!gridEl) return;
    destroyAccessibilityGrid();
    const rowData = (Array.isArray(findings) ? findings : []).map((f) => ({
        resource_id: f?.resource_id || '',
        tier: f?.tier != null ? f.tier : '',
        severity: f?.severity || '',
        fix_strategy: f?.fix_strategy || 'manual_only',
        rule_id: f?.rule_id || '',
        resource_type: f?.resource_type || '',
        resource_title: f?.resource_title || '',
        message: f?.message || '',
        snippet: f?.snippet || '',
        resource_url: f?.resource_url || ''
    }));
    const columnDefs = [
        { field: 'tier', headerName: 'Tier', width: 72 },
        { field: 'severity', headerName: 'Severity', width: 120, sort: 'asc' },
        {
            field: 'fix_strategy',
            headerName: 'Fix Strategy',
            width: 160,
            valueFormatter: (p) => {
                const v = p.value || '';
                if (v === 'manual_only') return 'Manual only (open URL)';
                if (v === 'auto') return 'Auto';
                if (v === 'suggested') return 'Suggested (AI preview)';
                return v;
            },
        },
        { field: 'rule_id', headerName: 'Rule', minWidth: 180 },
        { field: 'resource_type', headerName: 'Type', width: 140 },
        { field: 'resource_title', headerName: 'Resource', minWidth: 220 },
        { field: 'message', headerName: 'Message', minWidth: 280 },
        { field: 'snippet', headerName: 'Snippet', minWidth: 260 },
        {
            field: 'resource_url',
            headerName: 'URL',
            minWidth: 220,
            cellRenderer: (params) => {
                const url = params.value || '';
                if (!url) return '';
                return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open</a>`;
            }
        }
    ];
    const options = {
        columnDefs,
        rowData,
        rowSelection: BULK_EDITOR_GRID_ROW_SELECTION,
        defaultColDef: {
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            sortable: true,
            resizable: true,
            minWidth: 120,
            flex: 1,
        },
        animateRows: true,
    };
    accessibilityGridApi = agGrid.createGrid(gridEl, options);
}

async function onAccStateChange() {
    const stateEl = document.getElementById('accState');
    const cityWrap = document.getElementById('accCityWrap');
    const instWrap = document.getElementById('accInstWrap');
    const progWrap = document.getElementById('accProgWrap');
    const focusEl = document.getElementById('accProgramFocus');
    if (!stateEl || !cityWrap) return;
    if (instWrap) instWrap.innerHTML = '<select id="accInstitution" disabled><option value="">Select city first</option></select>';
    if (progWrap) progWrap.innerHTML = '<select id="accProgram" disabled><option value="">Select institution first</option></select>';
    if (focusEl) focusEl.innerHTML = 'Select program first';
    const instEl = document.getElementById('accInstitution');
    if (instEl) instEl.onchange = onAccInstitutionChange;
    const progEl = document.getElementById('accProgram');
    if (progEl) progEl.onchange = onAccProgramChange;
    const state = stateEl.value;
    if (!state) {
        cityWrap.innerHTML = '<select id="accCity" disabled><option value="">Select state first</option></select>';
        return;
    }
    try {
        await withSpinner(async () => {
            const url = '/college-scorecard/cities?state=' + encodeURIComponent(state);
            const res = await fetch(url);
            const data = await res.json();
            let html;
            if (data && data.error) {
                html = '<select id="accCity"><option value="">' + escapeHtml(data.error) + '</option></select>';
            } else if (Array.isArray(data)) {
                html = '<select id="accCity"><option value="">Select city...</option>' +
                    data.map(c => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('') + '</select>';
            } else {
                html = '<select id="accCity"><option value="">No cities found</option></select>';
            }
            cityWrap.innerHTML = html;
            document.getElementById('accCity').onchange = onAccCityChange;
        }, {
            panelEl: cityWrap,
            label: 'Loading cities...',
            delayMs: 200,
        });
    } catch (e) {
        if (typeof debugLog === 'function') debugLog('[AccProfile] Cities fetch error: ' + e.message, 'error');
        cityWrap.innerHTML = '<select id="accCity"><option value="">Error: ' + escapeHtml(e.message || 'Request failed') + '</option></select>';
        document.getElementById('accCity').onchange = onAccCityChange;
    }
}

async function onAccCityChange() {
    const stateEl = document.getElementById('accState');
    const cityEl = document.getElementById('accCity');
    const instWrap = document.getElementById('accInstWrap');
    const progWrap = document.getElementById('accProgWrap');
    const focusEl = document.getElementById('accProgramFocus');
    if (!stateEl || !cityEl || !instWrap) return;
    if (progWrap) progWrap.innerHTML = '<select id="accProgram" disabled><option value="">Select institution first</option></select>';
    if (focusEl) focusEl.innerHTML = 'Select program first';
    const progEl = document.getElementById('accProgram');
    if (progEl) progEl.onchange = onAccProgramChange;
    const state = stateEl.value, city = cityEl.value;
    if (!state || !city) {
        instWrap.innerHTML = '<select id="accInstitution" disabled><option value="">Select city first</option></select>';
        document.getElementById('accInstitution').onchange = onAccInstitutionChange;
        return;
    }
    try {
        await withSpinner(async () => {
            const res = await fetch('/college-scorecard/institutions?state=' + encodeURIComponent(state) + '&city=' + encodeURIComponent(city));
            const data = await res.json();
            let html;
            if (data && data.error) {
                html = '<select id="accInstitution"><option value="">' + escapeHtml(data.error) + '</option></select>';
            } else if (Array.isArray(data)) {
                html = '<select id="accInstitution"><option value="">Select institution...</option>' +
                    data.map(i => '<option value="' + i.id + '">' + escapeHtml(i.name) + '</option>').join('') + '</select>';
            } else {
                html = '<select id="accInstitution"><option value="">No institutions found</option></select>';
            }
            instWrap.innerHTML = html;
            document.getElementById('accInstitution').onchange = onAccInstitutionChange;
        }, {
            panelEl: instWrap,
            label: 'Loading institutions...',
            delayMs: 200,
        });
    } catch (e) {
        instWrap.innerHTML = '<select id="accInstitution"><option value="">Error: ' + escapeHtml(e.message || 'Request failed') + '</option></select>';
        document.getElementById('accInstitution').onchange = onAccInstitutionChange;
    }
}

async function onAccInstitutionChange() {
    const instEl = document.getElementById('accInstitution');
    const progWrap = document.getElementById('accProgWrap');
    const focusEl = document.getElementById('accProgramFocus');
    if (!instEl || !progWrap) return;
    if (focusEl) focusEl.innerHTML = 'Select program first';
    const schoolId = instEl.value;
    if (!schoolId) {
        progWrap.innerHTML = '<select id="accProgram" disabled><option value="">Select institution first</option></select>';
        document.getElementById('accProgram').onchange = onAccProgramChange;
        return;
    }
    try {
        await withSpinner(async () => {
            const res = await fetch('/college-scorecard/programs-cip4?schoolId=' + encodeURIComponent(schoolId));
            const data = await res.json();
            let html;
            if (data && data.error) {
                html = '<select id="accProgram"><option value="">' + escapeHtml(data.error) + '</option></select>';
            } else if (Array.isArray(data)) {
                html = '<select id="accProgram"><option value="">Select program...</option>' +
                    data.map(p => '<option value="' + escapeHtml(p.cip4) + '">' + escapeHtml(p.cip4 + ' - ' + (p.title || '')) + '</option>').join('') + '</select>';
            } else {
                html = '<select id="accProgram"><option value="">No programs found</option></select>';
            }
            progWrap.innerHTML = html;
            document.getElementById('accProgram').onchange = onAccProgramChange;
        }, {
            panelEl: progWrap,
            label: 'Loading programs...',
            delayMs: 200,
        });
    } catch (e) {
        progWrap.innerHTML = '<select id="accProgram"><option value="">Error: ' + escapeHtml(e.message || 'Request failed') + '</option></select>';
        document.getElementById('accProgram').onchange = onAccProgramChange;
    }
}

async function onAccProgramChange() {
    const progEl = document.getElementById('accProgram');
    const focusEl = document.getElementById('accProgramFocus');
    if (!progEl || !focusEl) return;
    const cip4 = (progEl.value || '').trim();
    if (!cip4) {
        focusEl.innerHTML = 'Select program first';
        return;
    }
    try {
        await withSpinner(async () => {
            const res = await fetch('/college-scorecard/cip6-options?cip4=' + encodeURIComponent(cip4));
            const data = await res.json();
            const opts = data && data.options ? data.options : [];
            if (!opts.length) {
                focusEl.innerHTML = '<span class="acc-no-focus">No specializations for this program</span>';
            } else {
                focusEl.innerHTML = opts.map(o => '<label class="acc-focus-check"><input type="checkbox" value="' + escapeHtml(o.code) + '"> ' + escapeHtml(o.code + ' - ' + (o.title || '')) + '</label>').join('');
            }
        }, {
            panelEl: focusEl,
            label: 'Loading focus options...',
            delayMs: 200,
        });
    } catch (e) {
        focusEl.innerHTML = '<span class="acc-focus-err">Error: ' + escapeHtml(e.message || 'Request failed') + '</span>';
    }
}

function clearOutcomesAndStandardsSelections() {
    const list = document.getElementById('accStandardsList');
    if (list) list.querySelectorAll('input[name="accStd"]').forEach(cb => { cb.checked = false; });
}

async function wipeAccreditationProfilePage() {
    if (!selectedCourseId) return;
    clearOutcomesAndStandardsSelections();
    try {
        await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile: { v: 1 } })
        });
    } catch (_) {}
}

async function saveAccreditationProfileForm() {
    if (!selectedCourseId) return;
    const stateEl = document.getElementById('accState');
    const cityEl = document.getElementById('accCity');
    const instEl = document.getElementById('accInstitution');
    const progEl = document.getElementById('accProgram');
    const focusEl = document.getElementById('accProgramFocus');
    const instOpt = instEl?.options[instEl.selectedIndex];
    const progOpt = progEl?.options[progEl.selectedIndex];
    const progTitle = progOpt ? (progOpt.text || '').replace(/^\d{2}\.\d{2}\s*-\s*/, '') : '';
    const programFocusCip6 = [];
    if (focusEl) {
        focusEl.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => { programFocusCip6.push(cb.value); });
    }
    const profile = {
        v: 1,
        state: stateEl?.value || undefined,
        city: cityEl?.value || undefined,
        institutionId: instEl?.value ? parseInt(instEl.value, 10) : undefined,
        institutionName: instOpt?.text || undefined,
        program: progEl?.value || undefined,
        programCip4: progEl?.value || undefined,
        programTitle: progTitle || undefined,
        programFocusCip6: programFocusCip6.length ? programFocusCip6 : undefined,
        selectedStandards: undefined
    };
    const btn = document.getElementById('accSaveProfileBtn');
    try {
        await withSpinner(async () => {
            const res = await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile })
            });
            if (!res.ok) throw new Error(res.statusText);
            loadStandardsSyncTab();
            if (typeof openModal === 'function') openModal('profileSavedModal');
        }, {
            triggerEl: btn,
            panelEl: document.getElementById('standardsSyncPanel'),
            label: 'Saving profile...',
            scrollTargetEl: document.getElementById('accWorkflowContent'),
        });
    } catch (e) {
        alert('Save failed: ' + e.message);
    }
}

function getAccreditationEffectiveCip() {
    const progEl = document.getElementById('accProgram');
    const focusEl = document.getElementById('accProgramFocus');
    const programCip4 = progEl?.value?.trim() || '';
    const focusChecked = focusEl ? Array.from(focusEl.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).filter(Boolean) : [];
    return (focusChecked[0] || programCip4) || '';
}

function getAccreditationCipFromProfile(profile) {
    if (!profile || typeof profile !== 'object') return '';
    return (Array.isArray(profile.programFocusCip6) && profile.programFocusCip6[0]) || profile.programCip4 || profile.program || '';
}

function formatAccScore(score) {
    const v = Number(score);
    if (!Number.isFinite(v)) return 'n/a';
    return Math.max(0, Math.min(100, Math.round(v * 100))) + '%';
}

function parseStandardsInputValue(input) {
    return Array.from(new Set(String(input || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)));
}

function setOutcomeStandardsInput(outcomeId, standards) {
    const row = document.querySelector('.acc-outcome-row[data-outcome-id="' + outcomeId + '"]');
    if (!row) return false;
    const input = row.querySelector('.acc-std-input');
    if (!input) return false;
    input.value = Array.isArray(standards) ? standards.join(', ') : '';
    return true;
}

async function applyAccreditationTagging(resourceType, resourceId, standards) {
    if (!selectedCourseId || !Array.isArray(standards) || !standards.length) return;
    try {
        const res = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/tagging/resource', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resource_type: resourceType, resource_id: resourceId, standards })
        });
        if (!res.ok) throw new Error(await res.text().then(t => t || res.statusText));
        if (typeof showToast === 'function') showToast('Tagging applied.', 'success');
        loadAccreditationAlignment({});
    } catch (e) {
        if (typeof showToast === 'function') showToast('Failed: ' + (e?.message || e), 'error');
    }
}

async function applyQuizAccreditationTagging(quizType, id, standards) {
    if (!selectedCourseId || !Array.isArray(standards) || !standards.length) return;
    try {
        const url = quizType === 'new_quiz'
            ? '/canvas/courses/' + selectedCourseId + '/accreditation/tagging/new-quiz'
            : '/canvas/courses/' + selectedCourseId + '/accreditation/tagging/quiz';
        const body = quizType === 'new_quiz'
            ? { assignment_id: Number(id), standards }
            : { quiz_id: Number(id), standards };
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await res.text().then(t => t || res.statusText));
        if (typeof showToast === 'function') showToast('Tagging applied.', 'success');
        loadAccreditationAlignment({});
    } catch (e) {
        if (typeof showToast === 'function') showToast('Failed: ' + (e?.message || e), 'error');
    }
}

function applySuggestedOutcomeStandards(outcomeId, standardsCsv) {
    const standards = parseStandardsInputValue(standardsCsv);
    const ok = setOutcomeStandardsInput(outcomeId, standards);
    if (!ok) return;
    if (typeof showToast === 'function') showToast('Applied suggested standards to outcome input. Click Save to persist.', 'success');
}

async function saveOutcomeStandards(outcomeId) {
    const row = document.querySelector('.acc-outcome-row[data-outcome-id="' + outcomeId + '"]');
    if (!row) return;
    const input = row.querySelector('.acc-std-input');
    const btn = row.querySelector('.acc-save-std');
    if (!input || !btn) return;
    const standards = parseStandardsInputValue(input.value);
    try {
        await withSpinner(async () => {
            const res = await fetch('/canvas/outcomes/' + encodeURIComponent(outcomeId) + '/standards', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ standards })
            });
            if (!res.ok) throw new Error(res.statusText || ('HTTP ' + res.status));
            if (typeof showToast === 'function') showToast('Outcome standards saved.', 'success');
        }, {
            triggerEl: btn,
            panelEl: row,
            label: 'Saving standards...',
            delayMs: 200,
        });
    } catch (e) {
        if (typeof showToast === 'function') showToast('Failed to save outcome standards: ' + (e?.message || e), 'error');
        else alert('Failed to save outcome standards: ' + (e?.message || e));
    }
}

function renderAccSuggestionBadges(items) {
    const arr = Array.isArray(items) ? items : [];
    if (!arr.length) return '<span class="acc-align-muted">No strong matches</span>';
    return arr.map(s => {
        const id = escapeHtml(String(s?.id || ''));
        const title = escapeHtml(String(s?.title || id));
        const score = escapeHtml(formatAccScore(s?.score));
        const reason = escapeHtml(String(s?.reason || ''));
        return '<span class="acc-align-badge" title="' + reason + '"><strong>' + id + '</strong> · ' + title + ' (' + score + ')</span>';
    }).join('');
}

async function loadAccreditationAlignment(profile) {
    const host = document.getElementById('accAlignmentContent');
    if (!host) return;
    if (!selectedCourseId) {
        host.innerHTML = '<p>Select a course to analyze content alignment.</p>';
        return;
    }
    const cip = getAccreditationCipFromProfile(profile) || getAccreditationEffectiveCip();
    const qs = cip ? ('?cip=' + encodeURIComponent(cip)) : '';
    try {
        await withSpinner(async () => {
            const res = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/alignment' + qs);
            if (!res.ok) throw new Error(res.statusText || ('HTTP ' + res.status));
            const payload = await res.json();
        const outcomes = Array.isArray(payload?.outcome_mappings) ? payload.outcome_mappings : [];
        const rubrics = Array.isArray(payload?.rubric_mappings) ? payload.rubric_mappings : [];
        const resources = Array.isArray(payload?.resource_mappings) ? payload.resource_mappings : [];
        const quizMappings = Array.isArray(payload?.quiz_mappings) ? payload.quiz_mappings : [];
        const newQuizMappings = Array.isArray(payload?.new_quiz_mappings) ? payload.new_quiz_mappings : [];
        const summary = payload?.summary || {};
        const outcomesHtml = outcomes.length
            ? outcomes.map(o => {
                const existing = Array.isArray(o?.existing_standards) ? o.existing_standards : [];
                const suggested = Array.isArray(o?.suggested_standards) ? o.suggested_standards : [];
                const suggestedCsv = suggested.map(s => String(s?.id || '')).filter(Boolean).join(', ');
                const applyBtn = suggestedCsv
                    ? '<button type="button" class="primary-btn acc-use-suggested-btn" onclick="applySuggestedOutcomeStandards(' + Number(o?.outcome_id || 0) + ', \'' + escapeHtml(suggestedCsv).replace(/'/g, '&#39;') + '\')">Use suggested</button>'
                    : '';
                return '<div class="acc-align-row">' +
                    '<div><strong>' + escapeHtml(String(o?.title || 'Untitled outcome')) + '</strong></div>' +
                    '<div class="acc-align-kv"><span class="acc-align-key">Current</span><span>' + (existing.length ? escapeHtml(existing.join(', ')) : '<span class="acc-align-muted">None</span>') + '</span></div>' +
                    '<div class="acc-align-kv"><span class="acc-align-key">Suggested</span><span class="acc-align-badges">' + renderAccSuggestionBadges(suggested) + '</span></div>' +
                    (applyBtn ? '<div style="margin-top:6px;">' + applyBtn + '</div>' : '') +
                    '</div>';
            }).join('')
            : '<p class="acc-align-muted">No outcomes found.</p>';
        const rubricSuggestions = payload?.rubric_suggestions;
        const withoutRubrics = Array.isArray(rubricSuggestions?.without_rubrics) ? rubricSuggestions.without_rubrics : [];
        const withoutRubricsHtml = withoutRubrics.length
            ? '<div class="acc-align-subsection" style="margin-top:8px;"><strong>Resources without rubrics</strong> (assignments/discussions): ' +
              withoutRubrics.slice(0, 15).map(r => {
                  const stds = Array.isArray(r.suggested_standards) ? r.suggested_standards : [];
                  const criteria = stds.slice(0, 3).map(s => ({ description: (s.id || '') + ' — ' + (s.title || ''), outcome_id: null }));
                  const dataAttr = escapeHtml(JSON.stringify({ resource_type: r.resource_type, resource_id: r.resource_id, criteria }).replace(/"/g, '&quot;'));
                  return '<div style="margin:4px 0;"><span>' + escapeHtml(r.title || '') + '</span> (' + escapeHtml(r.resource_type || '') + ' #' + escapeHtml(r.resource_id || '') + ') ' +
                      '<button type="button" class="primary-btn acc-create-rubric" data-payload="' + dataAttr + '" style="margin-left:8px;">Create rubric</button></div>';
              }).join('') + '</div>'
            : '';
        const rubricsHtml = rubrics.length
            ? rubrics.map(r => {
                const criteria = Array.isArray(r?.criteria) ? r.criteria : [];
                const criteriaWithSuggestions = criteria.filter(c => Array.isArray(c?.suggested_standards) && c.suggested_standards.length);
                return '<div class="acc-align-row">' +
                    '<div><strong>' + escapeHtml(String(r?.title || 'Untitled rubric')) + '</strong></div>' +
                    '<div class="acc-align-kv"><span class="acc-align-key">Rubric-level suggested</span><span class="acc-align-badges">' + renderAccSuggestionBadges(r?.suggested_standards || []) + '</span></div>' +
                    '<div class="acc-align-kv"><span class="acc-align-key">Criteria with matches</span><span>' + escapeHtml(String(criteriaWithSuggestions.length)) + ' of ' + escapeHtml(String(criteria.length)) + '</span></div>' +
                    '</div>';
            }).join('')
            : '<p class="acc-align-muted">No rubrics found.</p>';
        const applyTaggingBtn = (type, id, suggested) => {
            const stds = Array.isArray(suggested) ? suggested : [];
            if (!stds.length || !['assignment','discussion','page','announcement'].includes(type)) return '';
            const data = stds.slice(0, 5).map(s => ({ id: String(s?.id || ''), title: String(s?.title || s?.id || '') }));
            const dataAttr = escapeHtml(JSON.stringify(data).replace(/"/g, '&quot;'));
            return '<button type="button" class="primary-btn acc-apply-tag" data-type="' + escapeHtml(type) + '" data-id="' + escapeHtml(String(id)) + '" data-standards="' + dataAttr + '">Apply tagging</button>';
        };
        const resourcesHtml = resources.length
            ? resources.map(r => {
                const label = (String(r?.resource_type || '').toUpperCase() || 'RESOURCE') + ' #' + String(r?.resource_id || '');
                const title = escapeHtml(String(r?.title || label));
                const url = r?.url ? String(r.url) : '';
                const link = url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">Open</a>' : '<span class="acc-align-muted">No URL</span>';
                const btn = applyTaggingBtn(r.resource_type, r.resource_id, r.suggested_standards);
                return '<div class="acc-align-row">' +
                    '<div><strong>' + title + '</strong> <span class="acc-align-muted">(' + escapeHtml(label) + ')</span></div>' +
                    '<div class="acc-align-kv"><span class="acc-align-key">Suggested</span><span class="acc-align-badges">' + renderAccSuggestionBadges(r?.suggested_standards || []) + '</span></div>' +
                    '<div class="acc-align-kv"><span class="acc-align-key">Link</span><span>' + link + (btn ? ' | ' + btn : '') + '</span></div>' +
                    '</div>';
            }).join('')
            : '<p class="acc-align-muted">No resource matches found yet.</p>';
        const quizBtn = (quizType, id, suggested) => {
            const stds = Array.isArray(suggested) ? suggested : [];
            if (!stds.length) return '';
            const data = stds.slice(0, 5).map(s => ({ id: String(s?.id || ''), title: String(s?.title || s?.id || '') }));
            const dataAttr = escapeHtml(JSON.stringify(data).replace(/"/g, '&quot;'));
            return '<button type="button" class="primary-btn acc-apply-quiz-tag" data-quiz-type="' + escapeHtml(quizType) + '" data-id="' + escapeHtml(String(id)) + '" data-standards="' + dataAttr + '">Apply tagging</button>';
        };
        const quizHtml = (quizMappings.length || newQuizMappings.length)
            ? '<h4 style="margin-top:1rem;">Quizzes</h4>' +
              quizMappings.map(r => '<div class="acc-align-row"><strong>' + escapeHtml(r?.title || '') + '</strong> (Classic #' + escapeHtml(r?.resource_id || '') + ') ' + renderAccSuggestionBadges(r?.suggested_standards || []) + ' ' + quizBtn('quiz', r.resource_id, r.suggested_standards) + '</div>').join('') +
              newQuizMappings.map(r => '<div class="acc-align-row"><strong>' + escapeHtml(r?.title || '') + '</strong> (New Quiz #' + escapeHtml(r?.resource_id || '') + ') ' + renderAccSuggestionBadges(r?.suggested_standards || []) + ' ' + quizBtn('new_quiz', r.resource_id, r.suggested_standards) + '</div>').join('')
            : '';
            host.innerHTML = '<div class="acc-align-summary">' +
                '<span class="acc-align-pill">Standards considered: ' + escapeHtml(String(payload?.standards_considered || 0)) + '</span>' +
                '<span class="acc-align-pill">Outcomes mapped: ' + escapeHtml(String(summary?.outcomes_with_suggestions || 0)) + '/' + escapeHtml(String(summary?.outcomes || 0)) + '</span>' +
                '<span class="acc-align-pill">Resources mapped: ' + escapeHtml(String(summary?.resources_with_suggestions || 0)) + '/' + escapeHtml(String(summary?.resources_scanned || 0)) + '</span>' +
                '</div>' +
                '<div class="acc-align-section"><h4>Outcome Suggestions</h4>' + outcomesHtml + '</div>' +
                '<div class="acc-align-section"><h4>Rubric Suggestions</h4>' + rubricsHtml + withoutRubricsHtml + '</div>' +
                '<div class="acc-align-section"><h4>Resource Suggestions</h4>' + resourcesHtml + '</div>' +
                (quizHtml ? '<div class="acc-align-section">' + quizHtml + '</div>' : '');
        }, {
            panelEl: host,
            label: 'Analyzing alignment...',
            scrollTargetEl: host,
        });
    } catch (e) {
        host.innerHTML = '<p style="color:#c62828;">Alignment analysis failed: ' + escapeHtml(e?.message || String(e)) + '</p>';
    }
}

function buildParsedStandardsPreviewHtml(payload) {
    if (!payload || typeof payload !== 'object') {
        debugLog('[AccStandards] buildParsedStandardsPreviewHtml: no payload', 'warn');
        return '<p style="color:#666;">No standards payload.</p>';
    }
    const orgs = Array.isArray(payload.organizations) ? payload.organizations : [];
    if (!orgs.length) {
        debugLog('[AccStandards] buildParsedStandardsPreviewHtml: no organizations in payload', 'warn');
        return '<p style="color:#666;">No organizations in standards response.</p><details style="margin-top:8px;"><summary>Raw JSON</summary><pre style="font-size:11px;overflow:auto;max-height:240px;">' +
            escapeHtml(JSON.stringify(payload, null, 2)) + '</pre></details>';
    }
    const sortStandards = (arr) => arr.slice().sort((a, b) => {
        const oa = a.sortOrder ?? a.sort_order ?? 0;
        const ob = b.sortOrder ?? b.sort_order ?? 0;
        if (oa !== ob) return Number(oa) - Number(ob);
        return String(a.id || '').localeCompare(String(b.id || ''));
    });
    function renderOrgHtml(org) {
        const orgLabel = escapeHtml((org.abbreviation ? org.abbreviation + ' — ' : '') + (org.name || org.id || 'Organization'));
        const standards = Array.isArray(org.standards) ? org.standards : [];
        if (!standards.length) {
            return '<div class="acc-parsed-org" style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:8px;padding:10px;"><strong>' + orgLabel + '</strong><p style="margin:8px 0 0;color:#666;">No standards array for this org.</p></div>';
        }
        const byId = new Map(standards.map(s => [String(s.id || ''), s]));
        const childrenOf = new Map();
        standards.forEach(s => {
            const pid = String(s.parentId || s.parent_id || '').trim();
            const id = String(s.id || '');
            const parentKey = !pid || !byId.has(pid) ? '__root__' : pid;
            if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
            childrenOf.get(parentKey).push(s);
        });
        for (const k of childrenOf.keys()) {
            childrenOf.set(k, sortStandards(childrenOf.get(k)));
        }
        function rowHtml(s, depth) {
            const id = escapeHtml(String(s.id || ''));
            const title = escapeHtml(String(s.title || ''));
            const kind = (s.kind != null && s.kind !== '') ? escapeHtml(String(s.kind)) : '';
            const gc = (s.groupCode != null && s.groupCode !== '') ? escapeHtml(String(s.groupCode)) : ((s.group_code != null && s.group_code !== '') ? escapeHtml(String(s.group_code)) : '');
            const p = (s.parentId != null && s.parentId !== '') ? escapeHtml(String(s.parentId)) : ((s.parent_id != null && s.parent_id !== '') ? escapeHtml(String(s.parent_id)) : '');
            const meta = [kind && ('kind: ' + kind), gc && ('group: ' + gc), p && ('parentId: ' + p)].filter(Boolean).join(' · ');
            const pad = depth * 14;
            const desc = s.description ? '<div style="font-size:12px;color:#444;margin-top:4px;">' + escapeHtml(String(s.description)) + '</div>' : '';
            return '<label class="acc-parsed-row" style="display:flex;gap:8px;margin:3px 0;padding-left:' + pad + 'px;align-items:flex-start;">' +
                '<input type="checkbox" disabled tabindex="-1" aria-hidden="true">' +
                '<span><strong>' + id + '</strong> — ' + title +
                (meta ? '<div style="font-size:11px;color:#666;margin-top:2px;">' + meta + '</div>' : '') +
                desc + '</span></label>';
        }
        function walk(parentKey, depth) {
            const nodes = childrenOf.get(parentKey) || [];
            let h = '';
            nodes.forEach(s => {
                const sid = String(s.id || '');
                h += rowHtml(s, depth);
                h += walk(sid, depth + 1);
            });
            return h;
        }
        const tree = walk('__root__', 0);
        return '<div class="acc-parsed-org" style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:8px;padding:10px;">' +
            '<strong style="display:block;margin-bottom:8px;">' + orgLabel + '</strong>' +
            '<p style="font-size:12px;color:#666;margin:0 0 8px;">Checkboxes are preview-only (not wired yet).</p>' +
            tree +
            '</div>';
    }
    let html = orgs.map(renderOrgHtml).join('');
    html += '<details style="margin-top:12px;"><summary style="cursor:pointer;font-size:13px;">Raw API JSON</summary><pre style="font-size:11px;overflow:auto;max-height:200px;margin-top:8px;">' +
        escapeHtml(JSON.stringify(payload, null, 2)) + '</pre></details>';
    return html;
}

async function applyAccreditationStandards() {
    if (!selectedCourseId) return;
    debugLog('[AccApply] Apply to course clicked', 'info');
    const checkboxes = document.querySelectorAll('#accStandardsList input[name="accStd"]:checked');
    const selectedStandards = Array.from(new Set(Array.from(checkboxes).map(cb => cb.value).filter(Boolean)));
    debugLog('[AccApply] Selected standards count: ' + selectedStandards.length + ' — ids: ' + selectedStandards.slice(0, 5).join(', ') + (selectedStandards.length > 5 ? '...' : ''), 'info');
    const btn = document.getElementById('accApplyStandardsBtn');
    try {
        await withSpinner(async () => {
            debugLog('[AccApply] 1. Fetching profile GET /accreditation/profile', 'info');
            const getRes = await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`);
            if (!getRes.ok) throw new Error(getRes.statusText);
            const profile = await getRes.json();
            profile.selectedStandards = selectedStandards;
            debugLog('[AccApply] 2. Profile loaded, writing via PUT with selectedStandards', 'info');
            const putRes = await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile })
            });
            if (!putRes.ok) throw new Error(putRes.statusText);
            debugLog('[AccApply] 3. Profile PUT success status=' + putRes.status, 'success');
            debugLog('[AccApply] 4. Calling loadStandardsSyncTab (loads profile + outcomes + standards)', 'info');
            await loadStandardsSyncTab();
            const cip = getAccreditationCipFromProfile(profile);
            const cipDom = getAccreditationEffectiveCip();
            if (cip !== cipDom) {
                debugLog('[AccApply] CIP from profile (' + cip + ') differs from DOM (' + cipDom + '); using profile (same as standards tab)', 'warn');
            }
            const qs = cip ? ('?cip=' + encodeURIComponent(cip)) : '';
            const standardsUrl = `/canvas/courses/${selectedCourseId}/accreditation/standards${qs}`;
            debugLog('[AccApply] 5. Fetching standards: ' + standardsUrl, 'info');
            const stdRes = await fetch(standardsUrl);
            const bodyEl = document.getElementById('accParsedStandardsModalBody');
            if (stdRes.ok && bodyEl) {
                const payload = await stdRes.json();
                const orgs = Array.isArray(payload?.organizations) ? payload.organizations : [];
                const total = Number(payload?.total_standards) ?? 0;
                const sources = orgs.map(o => (o.abbreviation || o.id) + ':' + (o.standards_source || '?')).join('; ');
                debugLog('[AccApply] 6a. Standards response: orgs=' + orgs.length + ', total_standards=' + total + ', sources=' + sources, 'info');
                orgs.forEach((org, i) => {
                    const stds = Array.isArray(org.standards) ? org.standards : [];
                    const sample = stds[0];
                    const keys = sample ? Object.keys(sample).join(',') : 'none';
                    const hasParent = stds.some(s => (s.parentId ?? s.parent_id) != null);
                    debugLog('[AccApply] 6b. Org[' + i + '] ' + (org.abbreviation || org.id) + ': standards=' + stds.length + ', hasParentId=' + hasParent + ', firstStd keys=' + keys, 'info');
                });
                if (payload._debug) {
                    debugLog('[AccApply] 6c. Backend _debug: ' + JSON.stringify(payload._debug), 'info');
                }
                bodyEl.innerHTML = buildParsedStandardsPreviewHtml(payload);
                debugLog('[AccApply] 7. Modal body built, opening accParsedStandardsModal', 'info');
                if (typeof openModal === 'function') openModal('accParsedStandardsModal');
            } else {
                debugLog('[AccApply] 6. Standards fetch failed: status=' + stdRes.status + (bodyEl ? '' : ' (no bodyEl)'), 'error');
                if (typeof openModal === 'function') openModal('profileSavedModal');
            }
        }, {
            triggerEl: btn,
            panelEl: document.getElementById('standardsSyncPanel'),
            label: 'Applying standards...',
            getScrollTarget: () => document.getElementById('accParsedStandardsModalBody'),
        });
    } catch (e) {
        debugLog('[AccApply] Error: ' + (e?.message || e), 'error');
        alert('Apply failed: ' + e.message);
    }
}

async function createOutcomesFromSelectedStandards() {
    if (!selectedCourseId) return;
    const checkboxes = document.querySelectorAll('#accStandardsList input[name="accStd"]:checked');
    const selectedStandards = Array.from(new Set(Array.from(checkboxes).map(cb => cb.value).filter(Boolean)));
    if (!selectedStandards.length) {
        if (typeof showToast === 'function') showToast('Select standards first.', 'warn');
        else alert('Select standards first.');
        return;
    }
    const btn = document.getElementById('accCreateOutcomesBtn');
    try {
        await withSpinner(async () => {
            const profileRes = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/profile');
            if (!profileRes.ok) throw new Error(profileRes.statusText || ('HTTP ' + profileRes.status));
            const profile = await profileRes.json();
            profile.selectedStandards = selectedStandards;
            const putRes = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile })
            });
            if (!putRes.ok) throw new Error(putRes.statusText || ('HTTP ' + putRes.status));
            const cip = getAccreditationCipFromProfile(profile) || getAccreditationEffectiveCip();
            const syncRes = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/outcomes/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cip: cip || undefined, include_groups: false })
            });
            if (!syncRes.ok) throw new Error(syncRes.statusText || ('HTTP ' + syncRes.status));
            const result = await syncRes.json();
            const created = Number(result?.summary?.created || 0);
            const skipped = Number(result?.summary?.skipped || 0);
            const failed = Number(result?.summary?.failed || 0);
            if (typeof showToast === 'function') {
                showToast('Outcomes sync complete: ' + created + ' created, ' + skipped + ' skipped, ' + failed + ' failed.', failed ? 'warn' : 'success');
            } else {
                alert('Outcomes sync complete: ' + created + ' created, ' + skipped + ' skipped, ' + failed + ' failed.');
            }
            await loadStandardsSyncTab();
        }, {
            triggerEl: btn,
            panelEl: document.getElementById('standardsSyncPanel'),
            label: 'Creating outcomes...',
            scrollTargetEl: document.getElementById('accOutcomesContent'),
        });
    } catch (e) {
        if (typeof showToast === 'function') showToast('Failed to create outcomes: ' + (e?.message || e), 'error');
        else alert('Failed to create outcomes: ' + (e?.message || e));
    }
}

function buildAccSelectionTree(nodes) {
    const nodeById = new Map();
    (Array.isArray(nodes) ? nodes : []).forEach(n => {
        const id = String(n?.id || '').trim();
        if (!id) return;
        nodeById.set(id, {
            id,
            label: String(n?.label || n?.title || id),
            parentId: n?.parentId != null ? String(n.parentId).trim() : '',
            isLeafHint: !!n?.isLeaf,
            meta: n?.meta ? String(n.meta) : ''
        });
    });
    const children = new Map();
    nodeById.forEach(n => {
        const pid = n.parentId || '';
        if (!pid || !nodeById.has(pid)) return;
        if (!children.has(pid)) children.set(pid, []);
        children.get(pid).push(n.id);
    });
    children.forEach((arr, k) => children.set(k, arr.sort((a, b) => a.localeCompare(b))));
    const roots = [];
    nodeById.forEach(n => {
        if (!n.parentId || !nodeById.has(n.parentId)) roots.push(n.id);
    });
    roots.sort((a, b) => a.localeCompare(b));
    return { nodeById, children, roots };
}

function getAccTreeLeafIds(tree, startId, leafFn) {
    const out = [];
    const stack = [startId];
    const visited = new Set();
    while (stack.length) {
        const id = stack.pop();
        if (!id || visited.has(id)) continue;
        visited.add(id);
        const kids = tree.children.get(id) || [];
        const node = tree.nodeById.get(id);
        if (node && leafFn(node, kids)) out.push(id);
        kids.forEach(k => stack.push(k));
    }
    return out;
}

function renderAccSelectionTree(tree, opts) {
    const checkboxName = opts?.checkboxName || 'accTreeLeaf';
    const selectedSet = opts?.selectedSet instanceof Set ? opts.selectedSet : new Set();
    const leafFn = typeof opts?.leafFn === 'function' ? opts.leafFn : ((n, kids) => !kids.length || !!n?.isLeafHint);
    const rowClass = opts?.rowClass || 'acc-tree-row';
    const wrapClass = opts?.wrapClass || 'acc-tree-wrap';
    const renderNode = (id, depth, ancestors) => {
        const n = tree.nodeById.get(id);
        if (!n) return '';
        const kids = tree.children.get(id) || [];
        const isLeaf = leafFn(n, kids);
        if (isLeaf) {
            const checked = selectedSet.has(n.id) ? ' checked' : '';
            const dataAnc = ancestors.map(a => ' data-ancestor="' + escapeHtml(a) + '"').join('');
            return '<div class="' + rowClass + '" style="--tree-depth:' + depth + ';">' +
                '<span class="acc-tree-spacer"></span>' +
                '<label class="acc-tree-label"><input type="checkbox" name="' + escapeHtml(checkboxName) + '" value="' + escapeHtml(n.id) + '"' + checked + dataAnc + '> <span class="acc-tree-label-text">' + escapeHtml(n.label) + (n.meta ? '<span class="acc-tree-meta">' + escapeHtml(n.meta) + '</span>' : '') + '</span></label>' +
                '</div>';
        }
        const descendants = getAccTreeLeafIds(tree, n.id, leafFn);
        const allChecked = descendants.length > 0 && descendants.every(x => selectedSet.has(x));
        const indeterminate = descendants.some(x => selectedSet.has(x)) && !allChecked;
        const branchState = allChecked ? ' checked' : '';
        const indAttr = indeterminate ? ' data-indeterminate="1"' : '';
        const row = '<div class="' + rowClass + '" style="--tree-depth:' + depth + ';">' +
            '<button type="button" class="acc-tree-toggle" data-node-id="' + escapeHtml(n.id) + '">▾</button>' +
            '<label class="acc-tree-label"><input type="checkbox" data-role="branch" data-node-id="' + escapeHtml(n.id) + '"' + branchState + indAttr + '> <span class="acc-tree-label-text"><strong>' + escapeHtml(n.label) + '</strong>' + (n.meta ? '<span class="acc-tree-meta">' + escapeHtml(n.meta) + '</span>' : '') + '</span></label>' +
            '</div>';
        const kidsHtml = kids.map(k => renderNode(k, depth + 1, ancestors.concat(n.id))).join('');
        return row + '<div class="' + wrapClass + '" data-children-for="' + escapeHtml(n.id) + '">' + kidsHtml + '</div>';
    };
    return tree.roots.map(id => renderNode(id, 0, [])).join('');
}

function updateAccTreeBranchStates(containerEl, checkboxName) {
    if (!containerEl) return;
    const branchBoxes = containerEl.querySelectorAll('input[data-role="branch"][data-node-id]');
    branchBoxes.forEach(branch => {
        const nodeId = branch.getAttribute('data-node-id');
        if (!nodeId) return;
        const leafBoxes = containerEl.querySelectorAll('input[name="' + checkboxName + '"][data-ancestor="' + nodeId + '"]');
        if (!leafBoxes.length) {
            branch.checked = false;
            branch.indeterminate = false;
            return;
        }
        const checked = Array.from(leafBoxes).filter(cb => cb.checked).length;
        branch.checked = checked > 0 && checked === leafBoxes.length;
        branch.indeterminate = checked > 0 && checked < leafBoxes.length;
    });
}

function bindAccSelectionTree(containerEl, opts) {
    if (!containerEl) return;
    const checkboxName = opts?.checkboxName || 'accTreeLeaf';
    const expandAllBtnId = opts?.expandAllBtnId || '';
    const collapseAllBtnId = opts?.collapseAllBtnId || '';
    containerEl.querySelectorAll('input[data-role="branch"][data-indeterminate="1"]').forEach(cb => { cb.indeterminate = true; });
    containerEl.querySelectorAll('input[name="' + checkboxName + '"]').forEach(cb => {
        cb.addEventListener('change', () => updateAccTreeBranchStates(containerEl, checkboxName));
    });
    containerEl.querySelectorAll('input[data-role="branch"]').forEach(branch => {
        branch.addEventListener('change', function() {
            const nodeId = this.getAttribute('data-node-id');
            if (!nodeId) return;
            const leaves = containerEl.querySelectorAll('input[name="' + checkboxName + '"][data-ancestor="' + nodeId + '"]');
            leaves.forEach(leaf => { leaf.checked = this.checked; });
            updateAccTreeBranchStates(containerEl, checkboxName);
        });
    });
    containerEl.querySelectorAll('.acc-tree-toggle').forEach(btn => {
        btn.addEventListener('click', function() {
            const nodeId = this.getAttribute('data-node-id');
            if (!nodeId) return;
            const target = Array.from(containerEl.querySelectorAll('[data-children-for]')).find(el => el.getAttribute('data-children-for') === nodeId);
            if (!target) return;
            const isOpen = target.style.display !== 'none';
            target.style.display = isOpen ? 'none' : 'block';
            this.textContent = isOpen ? '▸' : '▾';
        });
    });
    if (expandAllBtnId) {
        const btn = document.getElementById(expandAllBtnId);
        if (btn) btn.onclick = () => {
            containerEl.querySelectorAll('[data-children-for]').forEach(el => { el.style.display = 'block'; });
            containerEl.querySelectorAll('.acc-tree-toggle').forEach(el => { el.textContent = '▾'; });
        };
    }
    if (collapseAllBtnId) {
        const btn = document.getElementById(collapseAllBtnId);
        if (btn) btn.onclick = () => {
            containerEl.querySelectorAll('[data-children-for]').forEach(el => { el.style.display = 'none'; });
            containerEl.querySelectorAll('.acc-tree-toggle').forEach(el => { el.textContent = '▸'; });
        };
    }
    updateAccTreeBranchStates(containerEl, checkboxName);
}

function bindAccStandardsTreeBlocks(scopeEl) {
    const root = scopeEl || document;
    root.querySelectorAll('#accStandardsList .acc-org-block').forEach(block => {
        const treeEl = block.querySelector('.acc-tree-container');
        if (!treeEl) return;
        bindAccSelectionTree(treeEl, { checkboxName: 'accStd' });
        const expandBtn = block.querySelector('.acc-std-expand-all');
        if (expandBtn) expandBtn.onclick = () => {
            treeEl.querySelectorAll('[data-children-for]').forEach(el => { el.style.display = 'block'; });
            treeEl.querySelectorAll('.acc-tree-toggle').forEach(el => { el.textContent = '▾'; });
        };
        const collapseBtn = block.querySelector('.acc-std-collapse-all');
        if (collapseBtn) collapseBtn.onclick = () => {
            treeEl.querySelectorAll('[data-children-for]').forEach(el => { el.style.display = 'none'; });
            treeEl.querySelectorAll('.acc-tree-toggle').forEach(el => { el.textContent = '▸'; });
        };
        const selectAllBtn = block.querySelector('.acc-std-select-all');
        if (selectAllBtn) selectAllBtn.onclick = () => {
            treeEl.querySelectorAll('input[name="accStd"]').forEach(cb => { cb.checked = true; });
            updateAccTreeBranchStates(treeEl, 'accStd');
        };
        const clearAllBtn = block.querySelector('.acc-std-clear-all');
        if (clearAllBtn) clearAllBtn.onclick = () => {
            treeEl.querySelectorAll('input[name="accStd"]').forEach(cb => { cb.checked = false; });
            updateAccTreeBranchStates(treeEl, 'accStd');
        };
        treeEl.querySelectorAll('[data-children-for]').forEach(el => { el.style.display = 'none'; });
        treeEl.querySelectorAll('.acc-tree-toggle').forEach(el => { el.textContent = '▸'; });
    });
}

function openOutcomeSelectModal(orgId, orgAbbrev, orgName) {
    const orgs = window.__accPreviewOrgs || {};
    const org = orgs[orgId];
    const toCreate = Array.isArray(org?.toCreate) ? org.toCreate : [];
    if (!toCreate.length) {
        if (typeof showToast === 'function') showToast('No outcomes to create for this org.', 'warn');
        else alert('No outcomes to create.');
        return;
    }
    window.__accOutcomeSelectOrg = { orgId, orgAbbrev, orgName };
    const titleEl = document.getElementById('accOutcomeSelectModalTitle');
    if (titleEl) titleEl.textContent = 'Select outcomes to create — ' + (orgAbbrev || orgId);
    const toCreateTree = Array.isArray(org?.toCreateTree) ? org.toCreateTree : [];
    const tree = buildAccSelectionTree(toCreateTree.map(n => ({
        id: String(n?.id || '').trim(),
        parentId: n?.parentId != null ? String(n.parentId).trim() : '',
        label: String(n?.id || '') + ' — ' + String(n?.title || n?.id || ''),
        isLeaf: !!n?.isLeaf
    })).filter(n => n.id));
    const leafSet = new Set(toCreate.map(s => String(s?.id || '').trim()).filter(Boolean));
    const selectedSet = new Set(Array.from(leafSet));
    const bodyEl = document.getElementById('accOutcomeSelectModalBody');
    if (bodyEl) {
        const treeHtml = renderAccSelectionTree(tree, {
            checkboxName: 'accOutcomeStd',
            selectedSet,
            leafFn: (n) => leafSet.has(String(n?.id || '').trim())
        });
        bodyEl.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
            '<button type="button" class="secondary-btn" id="accOutcomeExpandAllBtn">Expand all</button>' +
            '<button type="button" class="secondary-btn" id="accOutcomeCollapseAllBtn">Collapse all</button>' +
            '<button type="button" class="secondary-btn" id="accOutcomeSelectAllBtn">Select all</button>' +
            '<button type="button" class="secondary-btn" id="accOutcomeSelectNoneBtn">Clear all</button>' +
            '</div>' +
            '<div class="acc-tree-container" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;">' + treeHtml + '</div>';
        bindAccSelectionTree(bodyEl, {
            checkboxName: 'accOutcomeStd',
            expandAllBtnId: 'accOutcomeExpandAllBtn',
            collapseAllBtnId: 'accOutcomeCollapseAllBtn'
        });
        const allBtn = document.getElementById('accOutcomeSelectAllBtn');
        if (allBtn) allBtn.onclick = () => {
            bodyEl.querySelectorAll('input[name="accOutcomeStd"]').forEach(cb => { cb.checked = true; });
            updateAccTreeBranchStates(bodyEl, 'accOutcomeStd');
        };
        const noneBtn = document.getElementById('accOutcomeSelectNoneBtn');
        if (noneBtn) noneBtn.onclick = () => {
            bodyEl.querySelectorAll('input[name="accOutcomeStd"]').forEach(cb => { cb.checked = false; });
            updateAccTreeBranchStates(bodyEl, 'accOutcomeStd');
        };
        updateAccTreeBranchStates(bodyEl, 'accOutcomeStd');
    }
    const createBtn = document.getElementById('accOutcomeSelectCreateBtn');
    if (createBtn) createBtn.onclick = doCreateSelectedOutcomes;
    if (typeof openModal === 'function') openModal('accOutcomeSelectModal');
}

async function doCreateSelectedOutcomes() {
    const info = window.__accOutcomeSelectOrg;
    if (!info || !selectedCourseId) return;
    const checkboxes = document.querySelectorAll('#accOutcomeSelectModalBody input[name="accOutcomeStd"]:checked');
    const selectedStandardIds = Array.from(checkboxes).map(cb => cb.value).filter(Boolean);
    if (!selectedStandardIds.length) {
        if (typeof showToast === 'function') showToast('Select at least one outcome to create.', 'warn');
        else alert('Select at least one outcome.');
        return;
    }
    const cip = getAccreditationEffectiveCip();
    const createBtn = document.getElementById('accOutcomeSelectCreateBtn');
    if (typeof debugLog === 'function') debugLog('[sync-org] submit ' + (info.orgAbbrev || info.orgId) + ' selected=' + selectedStandardIds.length, 'info');
    try {
        await withSpinner(async () => {
            const res = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/outcomes/sync-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId: info.orgId, orgAbbrev: info.orgAbbrev, orgName: info.orgName, cip: cip || undefined, selectedStandardIds })
            });
            const bodyText = await res.text();
            let result;
            try { result = bodyText ? JSON.parse(bodyText) : {}; } catch { result = {}; }
            if (!res.ok) {
                const errMsg = result?.message || result?.error || bodyText || res.statusText || 'Failed';
                if (typeof debugLog === 'function') debugLog('sync-org failed: ' + res.status + ' — ' + errMsg, 'error');
                throw new Error(errMsg);
            }
            const created = Number(result?.summary?.created || 0);
            const skipped = Number(result?.summary?.skipped || 0);
            const failed = Number(result?.summary?.failed || 0);
            if (typeof debugLog === 'function') debugLog('[sync-org] result created=' + created + ' skipped=' + skipped + ' failed=' + failed, failed ? 'warn' : 'success');
            if (failed > 0 && Array.isArray(result?.failed)) {
                const details = result.failed.slice(0, 3).map(f => (f?.standard_id || '?') + ': ' + (f?.error || 'failed')).join(' | ');
                if (typeof debugLog === 'function') debugLog('[sync-org] failed details: ' + details, 'error');
            }
            if (typeof showToast === 'function') showToast(info.orgAbbrev + ': ' + created + ' created, ' + skipped + ' skipped, ' + failed + ' failed.', failed ? 'warn' : 'success');
            else alert(info.orgAbbrev + ': ' + created + ' created, ' + skipped + ' skipped, ' + failed + ' failed.');
            if (typeof closeActiveModal === 'function') closeActiveModal();
            await loadStandardsSyncTab();
        }, {
            triggerEl: createBtn,
            panelEl: document.getElementById('standardsSyncPanel'),
            label: 'Submitting outcomes...',
            scrollTargetEl: document.getElementById('accOutcomesContent'),
        });
    } catch (e) {
        const msg = e?.message || String(e);
        if (typeof debugLog === 'function') debugLog('sync-org error: ' + msg, 'error');
        if (typeof showToast === 'function') showToast('Submit failed: ' + msg, 'error');
        else alert('Submit failed: ' + msg);
    }
}

async function submitOutcomesForOrg(orgId, orgAbbrev, orgName, toCreateCount) {
    openOutcomeSelectModal(orgId, orgAbbrev, orgName);
}

async function finalizeStandards() {
    if (!selectedCourseId) return;
    const btn = document.getElementById('accFinalizeStandardsBtn');
    try {
        await withSpinner(async () => {
            const res = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/standards/finalize', { method: 'POST' });
            if (!res.ok) throw new Error(res.statusText || 'Failed');
            if (typeof showToast === 'function') showToast('Standards finalized. Stage 2 is now unlocked.', 'success');
            else alert('Standards finalized.');
            await loadStandardsSyncTab();
        }, {
            triggerEl: btn,
            panelEl: document.getElementById('standardsSyncPanel'),
            label: 'Finalizing standards...',
            scrollTargetEl: document.getElementById('accWorkflowContent'),
        });
    } catch (e) {
        if (typeof showToast === 'function') showToast('Finalize failed: ' + (e?.message || e), 'error');
        else alert('Finalize failed: ' + (e?.message || e));
    }
}

let accAiSuggestQueue = [];
let accAiSuggestIndex = 0;

async function openAiSuggestFlow() {
    if (!selectedCourseId) return;
    const checkboxes = document.querySelectorAll('#accStandardsList input[name="accStd"]:checked');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.value).length;
    if (!selectedCount) {
        if (typeof showToast === 'function') showToast('Select standards first, then get AI suggestions.', 'warn');
        else alert('Select standards first.');
        return;
    }
    const btn = document.getElementById('accGetAiSuggestionsBtn');
    try {
        await withSpinner(async () => {
            const res = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/standards/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ n: 5 })
            });
            if (!res.ok) throw new Error(res.statusText || 'Failed');
            const suggestions = await res.json();
            if (!Array.isArray(suggestions) || !suggestions.length) {
                if (typeof showToast === 'function') showToast('No additional suggestions found.', 'info');
                else alert('No additional suggestions found.');
                return;
            }
            accAiSuggestQueue = suggestions;
            accAiSuggestIndex = 0;
            showNextAiSuggestion();
        }, {
            triggerEl: btn,
            panelEl: document.getElementById('standardsSyncPanel'),
            label: 'Fetching suggestions...',
            scrollTargetEl: document.getElementById('accOutcomesContent'),
        });
    } catch (e) {
        if (typeof showToast === 'function') showToast('AI suggestions failed: ' + (e?.message || e), 'error');
        else alert('AI suggestions failed: ' + (e?.message || e));
    }
}

function showNextAiSuggestion() {
    if (accAiSuggestIndex >= accAiSuggestQueue.length) {
        if (typeof closeActiveModal === 'function') closeActiveModal();
        if (typeof showToast === 'function') showToast('Review complete. Reloading standards.', 'success');
        loadStandardsSyncTab();
        return;
    }
    const s = accAiSuggestQueue[accAiSuggestIndex];
    const titleEl = document.getElementById('accAiSuggestModalTitle');
    const bodyEl = document.getElementById('accAiSuggestModalBody');
    if (titleEl) titleEl.textContent = 'AI Suggestion (' + (accAiSuggestIndex + 1) + ' of ' + accAiSuggestQueue.length + ')';
    if (bodyEl) {
        bodyEl.innerHTML = '<p><strong>' + escapeHtml(s.id || '') + ' — ' + escapeHtml(s.title || '') + '</strong></p>' +
            '<p style="color:#555;">' + escapeHtml(s.reason || 'AI suggested based on course content.') + '</p>';
    }
    if (typeof openModal === 'function') openModal('accAiSuggestModal');
}

function applyAiSuggestAction(action) {
    if (!selectedCourseId || accAiSuggestIndex >= accAiSuggestQueue.length) return;
    const s = accAiSuggestQueue[accAiSuggestIndex];
    fetch('/canvas/courses/' + selectedCourseId + '/accreditation/standards/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardId: s.id, action: action })
    }).then(() => {}).catch(() => {});
    accAiSuggestIndex++;
    if (typeof closeActiveModal === 'function') closeActiveModal();
    if (accAiSuggestIndex >= accAiSuggestQueue.length) {
        if (typeof showToast === 'function') showToast('Review complete. Reloading standards.', 'success');
        loadStandardsSyncTab();
    } else {
        setTimeout(showNextAiSuggestion, 150);
    }
}

function closeAiSuggestFlow() {
    accAiSuggestQueue = [];
    accAiSuggestIndex = 0;
    if (typeof closeActiveModal === 'function') closeActiveModal();
    loadStandardsSyncTab();
}

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

async function loadTabData(tabName) {
    try {
        if (!selectedCourseId) return;

        const configKey = getConfigKey(tabName);
        var tabConfig = FIELD_DEFINITIONS[configKey];
        if (!tabConfig) return;

        var currentBatch = 1;
        var batchSize = 100;
        var displayTab = tabName.charAt(0).toUpperCase() + tabName.slice(1);

        await withSpinner(async ({ setLabel }) => {
            setLabel("Fetching " + displayTab + " 1 to 100...");
            var progressInterval = setInterval(function() {
                var start = (currentBatch * batchSize) + 1;
                var end = (currentBatch + 1) * batchSize;
                setLabel("Fetching " + displayTab + " " + start + " to " + end + "...");
                currentBatch++;
            }, 2000);

            try {
                if (tabName === 'assignments' || tabName === 'quizzes' || tabName === 'new_quizzes') {
                    try {
                        var agUrl = "/canvas/courses/" + selectedCourseId + "/assignment_groups";
                        var agResponse = await fetch(agUrl);
                        if (agResponse.ok) {
                            var agData = await agResponse.json();
                            assignmentGroupsCache[selectedCourseId] = {};
                            agData.forEach(function(group) {
                                assignmentGroupsCache[selectedCourseId][group.id] = group.name;
                            });
                        }
                    } catch (agError) {
                        assignmentGroupsCache[selectedCourseId] = {};
                    }
                }

                const hasRubricField = getFieldsForTab(tabName).some(f => f.type === 'rubric_dropdown');
                if (hasRubricField) {
                    await loadRubricsForCourse(selectedCourseId);
                }

                var dataUrl = "/canvas/courses/" + selectedCourseId + "/" + tabConfig.endpoint;
                var response = await fetch(dataUrl, { credentials: 'include' });

                if (!response.ok) {
                    var errText = '';
                    try { errText = await response.text(); } catch (_) {}
                    var errMsg = errText ? (errText.slice(0, 300) + (errText.length > 300 ? '...' : '')) : response.statusText;
                    alert('Failed to load ' + displayTab + ': ' + response.status + ' ' + errMsg);
                    return;
                }

                var data = await response.json();
                if (!Array.isArray(data)) {
                    alert('Failed to load ' + displayTab + ': unexpected response format');
                    return;
                }
                var baselineDataWithStatus = data.map(function(item) {
                    return Object.assign({}, item, { _edit_status: 'synced' });
                });
                var workingDataWithStatus = baselineDataWithStatus.map(function(item) {
                    return Object.assign({}, item);
                });

                originalData[tabName] = baselineDataWithStatus;

                if (currentTab === tabName && gridApi) {
                    setGridColumnDefsForTab(tabName);
                    gridApi.setGridOption('rowData', workingDataWithStatus);
                    updateSyncHistoryIndicator();
                }
            } finally {
                clearInterval(progressInterval);
            }
        }, {
            mode: 'grid',
            panelEl: document.getElementById('myGrid'),
            label: "Fetching " + displayTab + "...",
            scrollTargetEl: document.getElementById('myGrid'),
        });
    } catch (error) {
        return;
    }
}

function trackChange(tabName, itemId, fieldName, value) {
    CanvasHelpers.trackChange(changes, tabName, itemId, fieldName, value);
}

function updateTrackedChangeForCell(tabName, itemId, fieldName, value) {
    const rows = originalData[tabName] || [];
    const baseline = rows.find(r => String(getRowIdForData(r)) === String(itemId));
    const baseValue = baseline ? baseline[fieldName] : undefined;
    const changed = JSON.stringify(baseValue) !== JSON.stringify(value);
    if (!changes[tabName]) changes[tabName] = {};
    if (!changes[tabName][itemId]) changes[tabName][itemId] = {};
    if (changed) {
        changes[tabName][itemId][fieldName] = value;
    } else {
        delete changes[tabName][itemId][fieldName];
        if (Object.keys(changes[tabName][itemId]).length === 0) delete changes[tabName][itemId];
    }
}

function undoLastCellEdit() {
    while (undoStack.length) {
        const record = undoStack.pop();
        if (!record || record.tab !== currentTab || record.pending) continue;
        const cells = (record.cells || []).filter(c => !isFieldReadOnlyForTab(currentTab, c.field));
        if (!cells.length) continue;
        console.log('[Undo] Applying record:', record.type, 'cells count:', cells.length, 'cells:', cells);
        const rowCount = applyHistoryCells(cells, 'beforeValue');
        showToast(`Undo applied (${record.type}) to ${rowCount} row${rowCount === 1 ? '' : 's'}.`, 'success', 1800);
        return;
    }
    showToast('Nothing to undo for this tab.', 'warn');
}

function getBulkTargetRowData(fillVisibleWhenEmpty) {
    if (!gridApi) return [];
    const rows = gridApi.getSelectedRows();
    if (!rows.length && fillVisibleWhenEmpty) {
        const out = [];
        gridApi.forEachNodeAfterFilter(node => out.push(node.data));
        return out;
    }
    return rows;
}

function applyGridCellChange(rowData, field, value) {
    const beforeValue = rowData?.[field];
    const cell = createCellSnapshot(rowData, field, beforeValue, value);
    if (!cell) return;
    applyHistoryCells([cell], 'afterValue');
}

function applyGridCellChangeToNode(gridNode, field, value) {
    if (!gridNode?.data) return;
    const beforeValue = gridNode.data[field];
    const cell = createCellSnapshot(gridNode.data, field, beforeValue, value);
    if (!cell) return;
    applyHistoryCells([cell], 'afterValue');
}

const CLONE_CREATE_TABS = ['assignments', 'quizzes', 'new_quizzes', 'pages', 'discussions', 'announcements', 'modules', 'files'];

const CREATE_HANDLERS = {
    assignments: (courseId, p) => createAssignments(courseId, p),
    quizzes: (courseId, p) => createQuizzes(courseId, p),
    new_quizzes: (courseId, p) => createNewQuizzes(courseId, p),
    pages: (courseId, p) => createPages(courseId, p),
    discussions: (courseId, p) => createDiscussions(courseId, p),
    announcements: (courseId, p) => createAnnouncements(courseId, p),
    modules: (courseId, p) => createModules(courseId, p.name || 'Module', p.position),
    files: (courseId, p) => createFiles(courseId, p)
};

const ITEM_TYPE_TO_CREATE = {
    Assignment: (p) => createAssignments(selectedCourseId, p),
    Quiz: (p) => createQuizzes(selectedCourseId, p),
    Page: (p) => createPages(selectedCourseId, p),
    Discussion: (p) => createDiscussions(selectedCourseId, p),
    Announcement: (p) => createAnnouncements(selectedCourseId, p),
    Folder: (p) => createFolders(selectedCourseId, p)
};

const ITEM_TYPE_TO_ENDPOINT = {
    Assignment: 'assignments',
    Quiz: 'quizzes',
    Page: 'pages',
    Discussion: 'discussions',
    Announcement: 'discussions'
};

function getItemIdentifier(row, tabOrType) {
    const ck = getConfigKey(tabOrType);
    const cfg = FIELD_DEFINITIONS[ck];
    if (cfg?.usesSlugIdentifier) return row.url || row.page_url;
    return row.id;
}

function getApiEndpoint(itemType) {
    return ITEM_TYPE_TO_ENDPOINT[itemType] || null;
}

function getFieldsForTab(tab, filterFn) {
    const ck = getConfigKey(tab);
    const cfg = FIELD_DEFINITIONS[ck];
    if (!cfg?.fields) return [];
    return filterFn ? cfg.fields.filter(filterFn) : cfg.fields;
}

function isFieldReadOnlyForTab(tab, field) {
    if (!field) return true;
    if (field.startsWith('_')) return true;
    if (REVERT_BLOCKED_FIELDS.has(field)) return true;
    const fields = getFieldsForTab(tab);
    const def = fields.find(f => (f.key || f.name) === field);
    if (!def) return true;
    return def.editable === false;
}

function getRowIdForData(rowData) {
    return rowData?.id ?? rowData?.url ?? null;
}

function updateSyncHistoryIndicator() {
    const btn = document.getElementById('revertLastSyncBtn');
    const ind = document.getElementById('syncHistoryIndicator');
    if (!btn || !ind) return;
    const snaps = loadSnapshots(currentTab);
    if (!snaps.length) {
        btn.style.display = 'none';
        ind.style.display = 'none';
        return;
    }
    const last = snaps[0];
    btn.style.display = '';
    ind.style.display = '';
    const count = Number(last.changeCount ?? last.rowsAffected ?? 0);
    ind.textContent = `Last sync: ${count} changes at ${last.timestamp} — Revert?`;
}

function buildSnapshotForRows(tab, rowIds) {
    const rowIdSet = new Set(Array.from(rowIds || []).map(String));
    const changes = undoStack
        .filter(record => record?.tab === tab && !record?.pending)
        .flatMap(record => (record.cells || []).map(cell => ({
            rowId: String(cell.rowId),
            field: cell.field,
            oldValue: cell.beforeValue,
            newValue: cell.afterValue,
            tab,
        })))
        .filter(entry => rowIdSet.has(String(entry.rowId)));
    if (!changes.length) return null;
    const rowsAffected = new Set(changes.map(c => String(c.rowId))).size;
    return {
        snapshotId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toLocaleString(),
        tab,
        rowsAffected,
        changeCount: changes.length,
        changes,
    };
}

function persistSnapshot(snapshot) {
    if (!snapshot) return;
    const snaps = loadSnapshots(snapshot.tab);
    snaps.unshift(snapshot);
    saveSnapshots(snapshot.tab, snaps);
}

function removeInMemoryEntriesForRows(tab, rowIds) {
    const rowIdSet = new Set(Array.from(rowIds || []).map(String));
    const filtered = undoStack
        .map(record => {
            if (!record || record.tab !== tab) return record;
            const remainingCells = (record.cells || []).filter(cell => !rowIdSet.has(String(cell.rowId)));
            if (!remainingCells.length) return null;
            return { ...record, cells: remainingCells, pending: false };
        })
        .filter(Boolean);
    undoStack.length = 0;
    undoStack.push(...filtered);
}

function collapseSnapshotChanges(snapshot) {
    const collapsed = new Map();
    const ordered = Array.isArray(snapshot?.changes) ? snapshot.changes : [];
    ordered.forEach(entry => {
        const key = `${entry.rowId}::${entry.field}`;
        if (!collapsed.has(key)) {
            collapsed.set(key, { rowId: entry.rowId, field: entry.field, oldValue: entry.oldValue, tab: entry.tab });
        }
    });
    return Array.from(collapsed.values());
}

function markFailedRevertRows(rowIds) {
    failedRevertRowIds = new Set(Array.from(rowIds || []).map(String));
    if (gridApi) gridApi.redrawRows();
}

function clearFailedRevertRows() {
    if (!failedRevertRowIds.size) return;
    failedRevertRowIds.clear();
    if (gridApi) gridApi.redrawRows();
}

function showRevertResultModal(failedItems) {
    const container = document.getElementById('revertResultContent');
    if (!container) return;
    if (!failedItems?.length) {
        container.innerHTML = '<p>Revert complete.</p>';
    } else {
        const rows = failedItems.map(f => `<li><strong>${f.label}</strong>: ${f.message}</li>`).join('');
        container.innerHTML = `<p>Some rows failed to revert:</p><ul>${rows}</ul>`;
    }
    openModal('revertResultModal');
}

const CREATE_EXTRAS = { announcements: ['is_announcement'] };

function buildCreateParams(rowData, tab) {
    const cfg = FIELD_DEFINITIONS[getConfigKey(tab)];
    const fieldKeys = new Set((cfg?.fields || []).map(f => f.key));
    (CREATE_EXTRAS[tab] || []).forEach(k => fieldKeys.add(k));
    ['graded', 'rubric_id', 'rubric_summary', 'rubric_url', 'rubric_association_id'].forEach(k => fieldKeys.delete(k));
    const out = {};
    for (const k of Object.keys(rowData)) {
        if (k.startsWith('_') || ['id', 'isNew', '_edit_status', '_isNew', '_pristine'].includes(k)) continue;
        if (fieldKeys.has(k)) out[k] = rowData[k];
    }
    return out;
}

function openRevertLastSyncModal() {
    const snaps = loadSnapshots(currentTab);
    if (!snaps.length) {
        showToast('No sync snapshot available for this tab.', 'warn');
        updateSyncHistoryIndicator();
        return;
    }
    pendingRevertSnapshotId = snaps[0].snapshotId;
    const msg = document.getElementById('revertConfirmMessage');
    const count = Number(snaps[0].changeCount ?? snaps[0].rowsAffected ?? 0);
    if (msg) msg.textContent = `Revert ${count} changes synced at ${snaps[0].timestamp}? This will push previous values back to Canvas.`;
    const btn = document.getElementById('confirmRevertBtn');
    if (btn) btn.onclick = () => executeRevertSnapshot(pendingRevertSnapshotId);
    openModal('revertConfirmModal');
}

function openSyncHistoryModal() {
    const list = document.getElementById('syncHistoryList');
    if (!list) return;
    const snaps = loadSnapshots(currentTab);
    if (!snaps.length) {
        list.innerHTML = '<p>No snapshots for this tab yet.</p>';
        openModal('syncHistoryModal');
        return;
    }
    list.innerHTML = snaps.map(s => `
        <div style="border:1px solid #ddd;border-radius:6px;padding:8px;margin-bottom:8px;">
            <div><strong>${Number(s.changeCount ?? s.rowsAffected ?? 0)}</strong> changes at <strong>${s.timestamp}</strong></div>
            <div style="margin-top:8px;">
                <button class="primary-btn" onclick="executeRevertSnapshot('${s.snapshotId}')">Revert</button>
            </div>
        </div>
    `).join('');
    openModal('syncHistoryModal');
}

async function executeRevertSnapshot(snapshotId) {
    if (!snapshotId) return;
    if (!selectedCourseId) {
        showToast('Select a course before reverting.', 'warn');
        return;
    }
    const snaps = loadSnapshots(currentTab);
    const snapshot = snaps.find(s => s.snapshotId === snapshotId);
    if (!snapshot) {
        showToast('Snapshot not found.', 'error');
        updateSyncHistoryIndicator();
        return;
    }
    const configKey = getConfigKey(currentTab);
    const config = FIELD_DEFINITIONS[configKey];
    if (!config) {
        showToast('Invalid tab configuration for revert.', 'error');
        return;
    }

    const collapsed = collapseSnapshotChanges(snapshot).filter(c => !isFieldReadOnlyForTab(currentTab, c.field));
    const grouped = new Map();
    collapsed.forEach(c => {
        const key = String(c.rowId);
        if (!grouped.has(key)) grouped.set(key, {});
        grouped.get(key)[c.field] = c.oldValue;
    });
    const endpoint = config.endpoint;
    const failed = [];
    const succeededRows = [];
    const revertItems = Array.from(grouped.entries()).map(([rowId, updates]) => ({ rowId, updates }));
    const revertResults = await runWithConcurrency(revertItems, REQUEST_CONCURRENCY_LIMIT, async (item) => {
        const pathSegment = config.usesSlugIdentifier ? encodeURIComponent(item.rowId) : item.rowId;
        const url = `/canvas/courses/${selectedCourseId}/${endpoint}/${pathSegment}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.updates),
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(toRequestErrorMessage(res, txt));
        }
        return item;
    });
    revertResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
            const { rowId, updates } = result.value;
            succeededRows.push(rowId);
            gridApi?.forEachNode(node => {
                if (String(getRowIdForData(node.data)) !== String(rowId)) return;
                suppressCellChangeLog = true;
                try {
                    Object.entries(updates).forEach(([k, v]) => node.setDataValue(k, v));
                    node.setDataValue('_edit_status', 'synced');
                } finally {
                    suppressCellChangeLog = false;
                }
            });
        } else {
            const failedItem = revertItems[idx];
            const rowId = failedItem?.rowId;
            const message = result.reason?.message || String(result.reason);
            let label = rowId;
            gridApi?.forEachNode(node => {
                if (String(getRowIdForData(node.data)) === String(rowId)) {
                    label = node.data?.name || node.data?.title || node.data?.display_name || rowId;
                }
            });
            failed.push({ rowId, label, message });
        }
    });

    if (!failed.length) {
        const next = snaps.filter(s => s.snapshotId !== snapshotId);
        saveSnapshots(currentTab, next);
        clearFailedRevertRows();
        closeActiveModal();
        showToast(`Revert complete — ${collapsed.length} changes restored.`, 'success');
    } else {
        markFailedRevertRows(failed.map(f => f.rowId));
        showToast(`Partial revert failed — ${failed.length} row(s) need attention.`, 'warn');
        showRevertResultModal(failed);
    }
    updateSyncHistoryIndicator();
}

function ensureSyncResultSummaryEl() {
    let el = document.getElementById('syncResultSummary');
    if (el) return el;
    const header = document.querySelector('.toolbar');
    if (!header || !header.parentElement) return null;
    el = document.createElement('div');
    el.id = 'syncResultSummary';
    el.style.display = 'none';
    el.style.margin = '8px 0 0 0';
    el.style.padding = '8px 10px';
    el.style.borderRadius = '6px';
    el.style.fontSize = '13px';
    header.parentElement.insertBefore(el, header.nextSibling);
    return el;
}

async function syncChanges() {
    if (!selectedCourseId) return alert('Select course first.');
    const tabChanges = changes[currentTab] || {};
    const itemIds = Object.keys(tabChanges);
    const newItemIds = itemIds.filter(id => String(id).startsWith('TEMP_'));
    const updateItemIds = itemIds.filter(id => !String(id).startsWith('TEMP_'));
    if (!itemIds.length) return alert('No changes.');

    const syncBtn = document.querySelector('button[onclick="syncChanges()"]');
    const syncSummaryEl = ensureSyncResultSummaryEl();
    if (syncSummaryEl) {
        syncSummaryEl.style.display = 'none';
        syncSummaryEl.textContent = '';
    }
    showToast(`Sync started for ${itemIds.length} item(s).`, 'info', 1800);

    await withSpinner(async () => {
        const configKey = getConfigKey(currentTab);
        const config = FIELD_DEFINITIONS[configKey];
        if (!config) {
            showToast('Invalid tab configuration.', 'error');
            return;
        }
        const endpoint = config.endpoint;
        const snapshotTargetRows = new Set(updateItemIds.map(String));
        const snapshot = buildSnapshotForRows(currentTab, snapshotTargetRows);
        if (snapshot) {
            persistSnapshot(snapshot);
            updateSyncHistoryIndicator();
        }

        const errors = [];
        if (newItemIds.length && CLONE_CREATE_TABS.includes(currentTab)) {
            for (const itemId of newItemIds) {
                let rowData = null;
                gridApi.forEachNode(node => {
                    if (String(node.data?.id) === String(itemId)) rowData = node.data;
                });
                if (!rowData) {
                    delete changes[currentTab][itemId];
                    continue;
                }
                const createParams = currentTab === 'files'
                    ? {
                        source_file_id: rowData._source_file_id,
                        parent_folder_id: rowData.folder_id ?? rowData._source_folder_id ?? null,
                        display_name: rowData.display_name || rowData.filename || rowData.name
                    }
                    : buildCreateParams(rowData, currentTab);
                try {
                    const handler = CREATE_HANDLERS[currentTab];
                    const created = handler ? await handler(selectedCourseId, createParams) : null;
                    if (!created) throw new Error('Create returned no data');
                    const cfg = FIELD_DEFINITIONS[getConfigKey(currentTab)];
                    const realId = cfg?.usesSlugIdentifier ? (created.url || created.id) : (created.id || created.url);
                    const updatedNodes = [];
                    gridApi.forEachNode(node => {
                        if (String(node.data?.id) === String(itemId)) {
                            node.setDataValue('id', created.id != null ? created.id : realId);
                            if (cfg?.usesSlugIdentifier) node.setDataValue('url', created.url || realId);
                            node.setDataValue('_edit_status', 'synced');
                            node.data._edit_status = 'synced';
                            delete node.data.isNew;
                            updatedNodes.push(node);
                            const syncedRow = { ...node.data };
                            if (cfg?.usesSlugIdentifier) syncedRow.url = created.url || realId;
                            syncedRow.id = created.id != null ? created.id : realId;
                            syncedRow._edit_status = 'synced';
                            if (originalData[currentTab]) originalData[currentTab].push(syncedRow);
                        }
                    });
                    if (updatedNodes.length) {
                        gridApi.refreshCells({ rowNodes: updatedNodes, columns: ['_edit_status'], force: true });
                    }
                    delete changes[currentTab][itemId];
                } catch (error) {
                    console.error(error);
                    debugLog('[Sync] Create FAILED - ' + (error.message || error), 'error');
                    errors.push({ itemId, label: rowData.name || rowData.title || itemId, message: error.message || String(error) });
                }
            }
        } else if (newItemIds.length) {
            const msg = currentTab === 'modules'
                ? 'Use Deep Clone for modules.'
                : `Create not supported for ${currentTab} tab.`;
            for (const id of newItemIds) {
                debugLog('[Sync] Create FAILED - item=' + id + ' tab=' + currentTab + ' message=' + msg, 'error');
                errors.push({ itemId: id, label: id, message: msg });
            }
            newItemIds.forEach(id => delete changes[currentTab][id]);
        }

        const prepared = updateItemIds.map(itemId => {
            const updates = { ...tabChanges[itemId] };
            delete updates._isNew;
            if (currentTab === 'files') {
                gridApi.forEachNode(node => {
                    if (String(node.data?.id) === String(itemId) && node.data?.is_folder) {
                        updates.isFolder = true;
                    }
                });
            }
            return { itemId, updates };
        });

        const bulkEligible = BULK_UPDATE_TABS.has(currentTab);
        const groupedBySignature = new Map();
        if (bulkEligible) {
            prepared.forEach(entry => {
                const sig = stableSerialize(entry.updates);
                if (!groupedBySignature.has(sig)) groupedBySignature.set(sig, []);
                groupedBySignature.get(sig).push(entry);
            });
        }

        const bulkRequests = [];
        const perItemRequests = [];
        const bulkCoveredItemIds = new Set();

        if (bulkEligible) {
            groupedBySignature.forEach((entries) => {
                if (entries.length < 2) return;
                const updates = entries[0].updates || {};
                if (!Object.keys(updates).length) return;
                const ids = entries.map(e => currentTab === 'pages' ? String(e.itemId) : Number(e.itemId));
                if (ids.some(v => v === null || v === undefined || Number.isNaN(v))) return;
                bulkRequests.push({
                    itemIds: ids,
                    originalItemIds: entries.map(e => String(e.itemId)),
                    updates,
                });
                entries.forEach(e => bulkCoveredItemIds.add(String(e.itemId)));
            });
        }

        prepared.forEach(entry => {
            if (!bulkCoveredItemIds.has(String(entry.itemId))) perItemRequests.push(entry);
        });

        const bulkResults = await runWithConcurrency(bulkRequests, REQUEST_CONCURRENCY_LIMIT, async (req) => {
            const url = `/canvas/courses/${selectedCourseId}/${endpoint}/_bulk/update`;
            debugLog('[Sync] Bulk Request: tab=' + currentTab + ' endpoint=' + url + ' itemIds=' + JSON.stringify(req.itemIds) + ' payload=' + JSON.stringify(req.updates), 'info');
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemIds: req.itemIds, updates: req.updates }),
            });
            if (!response.ok) {
                const rawText = await response.text().catch(() => '');
                debugLog('[Sync] BULK HTTP FAILED: tab=' + currentTab + ' status=' + response.status + ' endpoint=' + url + ' response=' + rawText.slice(0, 1000), 'error');
                throw new Error(toRequestErrorMessage(response, rawText));
            }
            let payload = null;
            try { payload = await response.json(); } catch { payload = null; }
            const failedById = new Map();
            if (Array.isArray(payload)) {
                payload.forEach((entry) => {
                    if (entry?.success === false) failedById.set(String(entry?.id), String(entry?.error || 'Bulk item failed'));
                });
            }
            return { req, failedById };
        });

        const perItemResults = await runWithConcurrency(perItemRequests, REQUEST_CONCURRENCY_LIMIT, async (req) => {
            const pathSegment = config.usesSlugIdentifier ? encodeURIComponent(req.itemId) : req.itemId;
            const url = `/canvas/courses/${selectedCourseId}/${endpoint}/${pathSegment}`;
            debugLog('[Sync] Request: ' + currentTab + ' ' + req.itemId + ' PUT ' + url + ' payload=' + JSON.stringify(req.updates), 'info');
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req.updates),
            });
            if (!response.ok) {
                const rawText = await response.text().catch(() => '');
                const errMsg = toRequestErrorMessage(response, rawText);
                debugLog(
                    '[Sync] HTTP FAILED: item=' + req.itemId +
                    ' tab=' + currentTab +
                    ' status=' + response.status +
                    ' endpoint=' + url +
                    ' payload=' + JSON.stringify(req.updates) +
                    ' response=' + rawText.slice(0, 1000),
                    'error'
                );
                throw new Error(errMsg);
            }
            return req;
        });

        const redrawNodes = [];
        const succeededRowIds = new Set();

        bulkResults.forEach((result, idx) => {
            const fallbackReq = bulkRequests[idx];
            if (result.status === 'fulfilled') {
                const req = result.value?.req || fallbackReq;
                const failedById = result.value?.failedById || new Map();
                req.originalItemIds.forEach(id => {
                    if (failedById.has(String(id))) {
                        let label = id;
                        gridApi.forEachNode(nd => {
                            if (String(nd.data?.id || nd.data?.url) === String(id)) label = nd.data?.name ?? nd.data?.title ?? nd.data?.display_name ?? id;
                        });
                        errors.push({ itemId: id, label, message: failedById.get(String(id)) });
                        return;
                    }
                    succeededRowIds.add(String(id));
                    delete changes[currentTab][id];
                    gridApi.forEachNode(node => {
                        const nodeId = String(node.data.id || node.data.url);
                        if (nodeId === String(id)) {
                            node.setDataValue('_edit_status', 'synced');
                            redrawNodes.push(node);
                            if (originalData[currentTab]) {
                                const originalRow = originalData[currentTab].find(item => String(item.id || item.url) === String(id));
                                if (originalRow) Object.keys(req.updates).forEach(fieldKey => originalRow[fieldKey] = req.updates[fieldKey]);
                            }
                        }
                    });
                });
            } else {
                fallbackReq.originalItemIds.forEach(id => {
                    let label = id;
                    gridApi.forEachNode(nd => {
                        if (String(nd.data?.id || nd.data?.url) === String(id)) label = nd.data?.name ?? nd.data?.title ?? nd.data?.display_name ?? id;
                    });
                    errors.push({ itemId: id, label, message: result.reason?.message || String(result.reason) });
                });
            }
        });

        perItemResults.forEach((result, idx) => {
            const req = perItemRequests[idx];
            const itemId = String(req.itemId);
            if (result.status === 'fulfilled') {
                succeededRowIds.add(itemId);
                gridApi.forEachNode(node => {
                    const nodeId = node.data.id || node.data.url;
                    if (String(nodeId) === itemId) {
                        node.setDataValue('_edit_status', 'synced');
                        redrawNodes.push(node);
                        if (originalData[currentTab]) {
                            const originalRow = originalData[currentTab].find(item => String(item.id || item.url) === itemId);
                            if (originalRow) Object.keys(req.updates).forEach(fieldKey => originalRow[fieldKey] = req.updates[fieldKey]);
                        }
                    }
                });
                delete changes[currentTab][itemId];
            } else {
                debugLog('[Sync] Return: ' + itemId + ' FAILED - ' + (result.reason?.message || result.reason), 'error');
                let label = itemId;
                gridApi.forEachNode(nd => {
                    if (String(nd.data?.id || nd.data?.url) === itemId) label = nd.data?.name ?? nd.data?.title ?? nd.data?.display_name ?? itemId;
                });
                errors.push({ itemId, label, message: result.reason?.message || String(result.reason) });
            }
        });

        if (redrawNodes.length) gridApi.redrawRows({ rowNodes: redrawNodes });
        if (succeededRowIds.size) removeInMemoryEntriesForRows(currentTab, succeededRowIds);

        const successCount = succeededRowIds.size;
        if (errors.length) {
            debugLog('[Sync] Summary FAILED count=' + errors.length + ' details=' + JSON.stringify(errors).slice(0, 3000), 'error');
            if (syncSummaryEl) {
                syncSummaryEl.style.display = 'block';
                syncSummaryEl.style.background = '#fff4e5';
                syncSummaryEl.style.border = '1px solid #f5c26b';
                syncSummaryEl.style.color = '#8a4b00';
                syncSummaryEl.textContent = `Sync complete with issues — ${successCount} succeeded, ${errors.length} failed.`;
            }
            showToast(`Sync complete with issues — ${successCount} succeeded, ${errors.length} failed.`, 'warn', 5000);
            alert(`Sync failed for ${errors.length} item(s):\n\n${errors.map(e => `• ${e.label}: ${e.message}`).join('\n')}`);
            return;
        }
        if (syncSummaryEl) {
            syncSummaryEl.style.display = 'block';
            syncSummaryEl.style.background = '#ecfdf3';
            syncSummaryEl.style.border = '1px solid #86efac';
            syncSummaryEl.style.color = '#166534';
            syncSummaryEl.textContent = `Sync complete — ${successCount} item(s) synced.`;
        }
        showToast(`Sync complete — ${successCount} item(s) synced.`, 'success', 3000);
    }, {
        triggerEl: syncBtn,
        mode: 'grid',
        panelEl: document.getElementById('myGrid'),
        label: 'Syncing...',
        getScrollTarget: () => (syncSummaryEl && syncSummaryEl.style.display !== 'none') ? syncSummaryEl : null,
    });
}
async function handleDeleteClick() {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) { alert("Select at least one item."); return; }

    if (currentTab === 'modules') {
        const count = selectedItems.length;
        const plural = count !== 1 ? 's' : '';
        const messageEl = document.getElementById('moduleDeleteMessage');
        if (messageEl) messageEl.textContent = `You are about to delete ${count} module${plural}. Choose an option:`;
        openModal('moduleDeleteOptionsModal');
    } else {
        openModal('deleteModal');
        document.getElementById('deleteConfirmInput').value = '';
    }
}

function handleCloneClick() {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) { alert("Select at least one item."); return; }
    if (currentTab === 'modules') {
        const count = selectedItems.length;
        const plural = count !== 1 ? 's' : '';
        const messageEl = document.getElementById('moduleCloneMessage');
        if (messageEl) messageEl.textContent = `Choose how to clone ${count} module${plural}:`;
        const pref = document.getElementById('moduleClonePrefix');
        const baseEl = document.getElementById('moduleCloneBaseName');
        const suf = document.getElementById('moduleCloneSuffix');
        const copiesEl = document.getElementById('moduleCloneCopies');
        const autoIncEl = document.getElementById('moduleCloneAutoIncrement');
        if (pref) pref.value = '';
        if (baseEl) baseEl.value = selectedItems[0]?.name || selectedItems[0]?.title || '';
        if (suf) suf.value = '';
        if (copiesEl) copiesEl.value = '1';
        if (autoIncEl) autoIncEl.checked = true;
        const placementEl = document.getElementById('moduleClonePlacement');
        if (placementEl) placementEl.value = 'bottom';
        openModal('moduleCloneOptionsModal');
    } else {
        openModal('cloneModal');
    }
}

async function executeFilesFolderClone(cloneMode, selectedRows, prefix, suffix, numCopies = 1, serialize = true) {
    if (!selectedCourseId) throw new Error('No course selected.');
    const folders = selectedRows.filter(r => r?.is_folder);
    if (!folders.length) throw new Error('Select at least one folder for folder cloning.');

    const existingNames = new Set((originalData.files || []).map(r => r?.display_name || r?.name).filter(Boolean));
    for (const folder of folders) {
        const base = folder.display_name || folder.name || `Folder ${folder.id}`;
        for (let c = 0; c < numCopies; c++) {
            const requestedName = serialize
                ? getSerializedName(base, c, prefix, suffix)
                : `${prefix}${base}${suffix}`.trim();
            const newName = getUniqueName(requestedName || base, existingNames, '', '');
            const payload = {
                source_folder_id: folder.id,
                parent_folder_id: folder.folder_id ?? null,
                name: newName,
            };
            const url = cloneMode === 'deep'
                ? `/canvas/courses/${selectedCourseId}/folders/copy`
                : `/canvas/courses/${selectedCourseId}/folders`;
            const body = cloneMode === 'deep'
                ? payload
                : { name: newName, parent_folder_id: folder.folder_id ?? null };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const raw = await response.text().catch(() => '');
                throw new Error(raw || response.statusText || 'Folder clone failed');
            }
        }
    }
}

async function executeModuleDelete(option) {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) { alert("No items selected."); return; }
    const courseId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!courseId) { alert("No course selected."); return; }

    closeActiveModal();

    try {
        for (const module of selectedItems) {
            if (option === 'module-and-items') {
                const itemsRes = await fetch(`/canvas/courses/${courseId}/modules/${module.id}/items`);
                if (itemsRes.ok) {
                    const items = await itemsRes.json();
                    const deletable = ['Assignment', 'Quiz', 'Page', 'Discussion', 'File', 'Attachment'];
                    for (const item of items) {
                        if (!deletable.includes(item.type)) continue;
                        const contentId = (item.type === 'Page') ? (item.page_url || item.url || item.content_id) : (item.content_id || item.id);
                        if (!contentId) continue;
                        try {
                            await fetch(`/canvas/courses/${courseId}/modules/${module.id}/items/${item.id}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: item.type, content_id: contentId })
                            });
                        } catch (e) { console.warn('Delete item:', e); }
                    }
                }
            }
            await deleteCanvasItem('modules', courseId, module.id);
            const rowNode = gridApi?.getRowNode(module.id?.toString());
            if (rowNode) gridApi.applyTransaction({ remove: [rowNode.data] });
        }

        delete originalData[currentTab];
        if (changes[currentTab]) changes[currentTab] = {};
        await refreshCurrentTab();
    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
}

function formatNameWithCopyIndex(baseName, copyIndex, prefix, suffix, autoIncrement = true) {
    const base = (baseName || 'Untitled').replace(/\s+\d+$/, '').trim();
    const inc = autoIncrement ? ` ${copyIndex}` : '';
    return `${prefix}${base}${inc}${suffix}`.trim();
}

function getClonePosition(placement, copyIndex, copies, selectedPos, maxPos) {
    if (placement === 'bottom') return null;
    if (placement === 'top') {
        return 1;
    }
    if (placement === 'before' && selectedPos != null) {
        return selectedPos;
    }
    if (placement === 'after' && selectedPos != null) {
        return selectedPos + copyIndex;
    }
    return null;
}

async function executeModuleClone(option) {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) { alert("No items selected."); return; }
    const courseId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!courseId) { alert("No course selected."); return; }
    const prefix = (document.getElementById('moduleClonePrefix') || {}).value || '';
    const baseName = (document.getElementById('moduleCloneBaseName') || {}).value || '';
    const suffix = (document.getElementById('moduleCloneSuffix') || {}).value || '';
    const copies = Math.max(1, parseInt((document.getElementById('moduleCloneCopies') || {}).value || '1', 10));
    const placement = (document.getElementById('moduleClonePlacement') || {}).value || 'bottom';
    const autoIncrement = (document.getElementById('moduleCloneAutoIncrement') || {}).checked !== false;

    closeActiveModal();

    try {
        const allModulesRes = await fetch(`/canvas/courses/${courseId}/modules?per_page=100`);
        const allModules = allModulesRes.ok ? await allModulesRes.json() : [];
        const maxPos = allModules.length ? Math.max(...allModules.map(m => m.position || 0)) : 0;

        if (option === 'deepCopy') {
            for (const module of selectedItems) {
                let items = module.items || [];
                if (!items.length) {
                    const itemsRes = await fetch(`/canvas/courses/${courseId}/modules/${module.id}/items`);
                    if (itemsRes.ok) items = await itemsRes.json();
                }
                const selectedPos = module.position != null ? module.position : maxPos + 1;
                const createOrder = (placement === 'top' || placement === 'before') && copies > 1
                    ? Array.from({ length: copies }, (_, i) => copies - i)
                    : Array.from({ length: copies }, (_, i) => i + 1);
                for (const c of createOrder) {
                    const pos = getClonePosition(placement, c, copies, selectedPos, maxPos);
                    await performDeepCloneWithIndex({ ...module, items }, prefix, baseName || module.name, suffix, c, pos, allModules, autoIncrement);
                }
            }
            await refreshCurrentTab();
            return;
        }

        const existingNames = new Set(allModules.map(m => m.name));

        for (const module of selectedItems) {
            let items = [];
            if (option === 'structureShared') {
                items = module.items || [];
                if (!items.length) {
                    const itemsRes = await fetch(`/canvas/courses/${courseId}/modules/${module.id}/items`);
                    if (itemsRes.ok) items = await itemsRes.json();
                }
            }
            const selectedPos = module.position != null ? module.position : maxPos + 1;
            const createOrder = (placement === 'top' || placement === 'before') && copies > 1
                ? Array.from({ length: copies }, (_, i) => copies - i)
                : Array.from({ length: copies }, (_, i) => i + 1);
            for (const c of createOrder) {
                const base = baseName || module.name || "Module";
                const newModuleName = (copies > 1 && autoIncrement)
                    ? formatNameWithCopyIndex(base, c, prefix, suffix, true)
                    : getUniqueName(base, existingNames, prefix, suffix);
                existingNames.add(newModuleName);
                const pos = getClonePosition(placement, c, copies, selectedPos, maxPos);
                const newModule = await createModules(courseId, newModuleName, pos);
                if (!newModule) continue;
                if (option === 'structureShared') {
                    for (const item of items) {
                        const skip = ['SubHeader', 'ExternalUrl', 'ExternalTool', 'ContextExternalTool'];
                        if (skip.includes(item.type)) continue;
                        const itemPayload = { type: item.type, position: item.position || 0, indent: item.indent || 0 };
                        if (item.type === 'Page' || item.type === 'WikiPage') {
                            itemPayload.page_url = item.page_url || item.url || item.content_id;
                        } else if (item.content_id) {
                            itemPayload.content_id = item.content_id;
                        }
                        try {
                            await addModuleItem(courseId, newModule.id, itemPayload);
                        } catch (e) { console.warn('Add item:', e); }
                    }
                }
            }
        }
        await refreshCurrentTab();
    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
}

function handleOverlayClick(event) {
    if (event.target.id === 'modalOverlay') closeActiveModal();
}

function populateColumnSelector() {
    const container = document.getElementById('columnListContainer');
    if (!container || !gridApi) return;
    container.innerHTML = '';
    const allDefs = generateColumnDefs(currentTab);
    const columnDefinitions = allDefs.filter((colDef) => {
        const id = colDef.colId || colDef.field;
        return id && id !== '_edit_status' && id !== 'id';
    });
    if (!columnDefinitions.length) {
        container.innerHTML = '<p style="padding:12px;color:#666">No columns for this tab.</p>';
        return;
    }

    const selectAllRow = document.createElement('div');
    selectAllRow.className = 'checkbox-group';
    selectAllRow.style.cssText = 'flex-direction:row;justify-content:space-between;padding:8px 12px;margin-bottom:10px;border-bottom:2px solid #eee';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.textContent = 'Select All / None';
    selectAllLabel.style.fontWeight = 'bold';

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.checked = columnDefinitions.every((colDef) => {
        const id = colDef.colId || colDef.field;
        const column = gridApi.getColumn(id);
        return column ? column.isVisible() : true;
    });

    selectAllCheckbox.onchange = (event) => {
        container.querySelectorAll('.col-toggle-input').forEach((checkbox) => {
            checkbox.checked = event.target.checked;
        });
    };

    selectAllRow.append(selectAllLabel, selectAllCheckbox);
    container.appendChild(selectAllRow);

    columnDefinitions.forEach((colDef) => {
        const id = colDef.colId || colDef.field;
        const row = document.createElement('div');
        row.className = 'checkbox-group';
        row.style.cssText = 'flex-direction:row;justify-content:space-between;padding:8px 12px;margin-bottom:5px';
        const label = document.createElement('label');
        label.textContent = colDef.headerName || id;
        label.style.fontWeight = '500';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'col-toggle-input';
        checkbox.value = id;
        const liveColumn = gridApi.getColumn(id);
        checkbox.checked = liveColumn ? liveColumn.isVisible() : true;
        row.append(label, checkbox);
        container.appendChild(row);
    });
}

function populateColumnDropdown(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
    selectElement.innerHTML = '';
    const fields = getFieldsForTab(currentTab, f => f.key);
    fields.forEach((field) => {
        const id = field.key;
        if (!id) return;
        const option = document.createElement('option');
        option.value = id;
        option.innerText = field.label || id;
        selectElement.appendChild(option);
    });
    if (currentTab === 'files') {
        const typeOpt = document.createElement('option');
        typeOpt.value = 'is_folder';
        typeOpt.innerText = 'Type';
        selectElement.insertBefore(typeOpt, selectElement.firstChild);
    }
}

function populateMergeSelector() {
    const selectElement = document.getElementById('mergeTargetSelect');
    if (!selectElement || !gridApi) return;
    selectElement.innerHTML = '';
    const selectedRows = gridApi.getSelectedRows();
    if (selectedRows.length < 2) {
        selectElement.innerHTML = '<option>Select 2+ rows...</option>';
        return;
    }
    selectedRows.forEach(row => {
        const option = document.createElement('option');
        option.value = row.id || row.url;
        option.innerText = row.name || row.title || row.display_name || option.value;
        selectElement.appendChild(option);
    });
}

function populateDateColumnSelector() {
    const container = document.getElementById('dateColumnSelector');
    if (!container) return;
    container.innerHTML = '';
    const fields = getFieldsForTab(currentTab, f => (f.type === 'date' || f.type === 'datetime') && f.editable === true);
    let matchCount = 0;
    fields.forEach(field => {
        matchCount++;
        const row = document.createElement('div');
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
        row.className = 'checkbox-group';
        row.style.cssText = 'flex-direction:row;justify-content:space-between;padding:8px 12px;margin-bottom:5px';
        label.textContent = field.label || field.key;
        label.style.fontWeight = '500';
        checkbox.type = 'checkbox';
        checkbox.className = 'date-col-checkbox';
        checkbox.value = field.key;
        checkbox.checked = true;
        row.append(label, checkbox);
        container.appendChild(row);
    });
    if (!matchCount) container.innerHTML = '<div style="text-align:center;padding:10px;color:#666">No date fields</div>';
}

function populateNumericColumnSelector(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
    selectElement.innerHTML = '';
    const fields = getFieldsForTab(currentTab, f => {
        if (f.editable === false) return false;
        if (f.type === 'number' || f.type === 'time_limit') return true;
        const k = (f.key || f.name || '').toLowerCase();
        return k.includes('points') || k === 'position';
    });
    fields.forEach(field => {
        const option = document.createElement('option');
        option.value = field.key;
        option.textContent = field.label || field.key;
        selectElement.appendChild(option);
    });
}

async function populateAssignmentGroupSelector() {
    const selectEl = document.getElementById('assignmentGroupTarget');
    const helpEl = document.getElementById('assignmentGroupHelp');
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Select assignment group...</option>';
    const hasAgField = getFieldsForTab(currentTab).some(f => f.key === 'assignment_group_id');
    if (!hasAgField) {
        selectEl.innerHTML = '<option value="">This tab does not support assignment groups</option>';
        if (helpEl) helpEl.textContent = 'Use Assignments, New Quizzes, or Quizzes tab.';
        return;
    }
    if (!selectedCourseId) {
        selectEl.innerHTML = '<option value="">Select a course first</option>';
        if (helpEl) helpEl.textContent = '';
        return;
    }
    let groups = assignmentGroupsCache[selectedCourseId] || {};
    if (Object.keys(groups).length === 0) {
        try {
            await withSpinner(async () => {
                const res = await fetch('/canvas/courses/' + selectedCourseId + '/assignment_groups');
                if (res.ok) {
                    const agData = await res.json();
                    groups = {};
                    agData.forEach(g => { groups[g.id] = g.name; });
                    assignmentGroupsCache[selectedCourseId] = groups;
                }
            }, {
                panelEl: document.getElementById('assignmentGroupModal'),
                label: 'Loading assignment groups...',
                delayMs: 200,
            });
        } catch (e) {}
    }
    selectEl.innerHTML = '';
    const createOpt = document.createElement('option');
    createOpt.value = '__create_new__';
    createOpt.textContent = '+ Create New...';
    selectEl.appendChild(createOpt);
    const ids = Object.keys(groups).map(id => parseInt(id, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    ids.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = groups[id] || 'Group ' + id;
        selectEl.appendChild(opt);
    });
    const createRow = document.getElementById('assignmentGroupCreateNewRow');
    const nameInput = document.getElementById('assignmentGroupNewName');
    selectEl.onchange = () => {
        const show = selectEl.value === '__create_new__';
        if (createRow) createRow.style.display = show ? 'block' : 'none';
        if (nameInput) { nameInput.value = ''; nameInput.placeholder = 'Enter name...'; }
    };
    if (createRow) createRow.style.display = selectEl.value === '__create_new__' ? 'block' : 'none';
    if (helpEl) helpEl.textContent = 'Select a group or Create New, then click Apply. Selected rows will be moved. Use Sync Changes to save to Canvas.';
}

async function executeMoveToAssignmentGroup() {
    const selectEl = document.getElementById('assignmentGroupTarget');
    let targetGroupId = selectEl ? parseInt(selectEl.value, 10) : NaN;
    if (!selectEl) return;
    if (selectEl.value === '__create_new__') {
        const nameInput = document.getElementById('assignmentGroupNewName');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
            if (nameInput) nameInput.placeholder = 'Enter a name for the new group';
            return;
        }
        if (!selectedCourseId) return;
        try {
            const res = await fetch(`/canvas/courses/${selectedCourseId}/assignment_groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            targetGroupId = created.id;
            assignmentGroupsCache[selectedCourseId] = assignmentGroupsCache[selectedCourseId] || {};
            assignmentGroupsCache[selectedCourseId][created.id] = created.name || name;
        } catch (e) {
            alert('Failed to create assignment group: ' + (e.message || e));
            return;
        }
    }
    if (isNaN(targetGroupId)) return;
    const hasAgField = getFieldsForTab(currentTab).some(f => f.key === 'assignment_group_id');
    if (!hasAgField) return;
    if (!gridApi) return;
    const fieldKey = 'assignment_group_id';
    const cells = getBulkTargetRowData(true)
        .map(rowData => createCellSnapshot(rowData, fieldKey, rowData?.[fieldKey], targetGroupId))
        .filter(Boolean);
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function openModal(modalId) {
    const overlay = document.getElementById('modalOverlay');
    const targetModal = document.getElementById(modalId);
    if (!targetModal || !overlay) return;
    document.querySelectorAll('.modal-content-wrapper').forEach(m => m.classList.remove('active'));
    if (modalId === 'searchReplaceModal') populateColumnDropdown('srColumnTarget');
    else if (modalId === 'insertPasteModal') populateColumnDropdown('ipColumnTarget');
    else if (modalId === 'bulkEditModal') populateColumnDropdown('beColumnTarget');
    else if (modalId === 'mergeModal') populateMergeSelector();
    else if (modalId === 'columnVisibilityModal') populateColumnSelector();
    else if (modalId === 'dateShiftModal') populateDateColumnSelector();
    else if (modalId === 'pointsModal') populateNumericColumnSelector('pointsColumnTarget');
    else if (modalId === 'timeLimitModal') {
        const opSel = document.getElementById('timeLimitOp');
        const valRow = document.getElementById('timeLimitValueRow');
        const pickerContainer = document.getElementById('timeLimitDurationPicker');
        if (pickerContainer) {
            pickerContainer.innerHTML = '';
            const picker = createDurationPickerDOM(0);
            pickerContainer.appendChild(picker);
            window._timeLimitPicker = picker;
        }
        const toggle = () => { if (valRow) valRow.style.display = (opSel?.value === 'remove') ? 'none' : 'block'; };
        if (opSel) opSel.onchange = toggle;
        toggle();
    }
    else if (modalId === 'allowedAttemptsModal') {
        const opSel = document.getElementById('allowedAttemptsOp');
        const valRow = document.getElementById('allowedAttemptsValueRow');
        const toggle = () => { if (valRow) valRow.style.display = (opSel?.value === 'unlimited') ? 'none' : 'block'; };
        if (opSel) opSel.onchange = toggle;
        toggle();
    }
    else if (modalId === 'assignmentGroupModal') populateAssignmentGroupSelector();
    else if (modalId === 'deleteModal') {
        const input = document.getElementById('deleteConfirmInput');
        if (input) {
            input.value = '';
            input.dataset.mode = (currentTab === 'modules') ? 'deep' : 'individual';
        }
    } else if (modalId === 'cloneModal') {
        const methodSelect = document.getElementById('cloneMethod');
        const isModuleTab = (currentTab === 'modules');
        const isFilesTab = (currentTab === 'files');
        const selectedRows = getSelectedItems();
        const hasFolderSelected = isFilesTab && selectedRows.some(r => r?.is_folder);
        if (methodSelect) {
            if (isModuleTab) {
                methodSelect.innerHTML = '<option value="structural">Structural Clone (Empty Shell)</option><option value="deep">Deep Clone (Modules only)</option>';
                methodSelect.value = 'structural';
            } else if (hasFolderSelected) {
                methodSelect.innerHTML = '<option value="surface">Surface Clone (Folder shell only)</option><option value="deep">Deep Clone (Folder + contents)</option><option value="item">Add to Grid (then Sync to Canvas)</option>';
                methodSelect.value = 'surface';
            } else {
                methodSelect.innerHTML = '<option value="item">Add to Grid (then Sync to Canvas)</option>';
                methodSelect.value = 'item';
            }
        }
    }
    overlay.classList.add('active');
    targetModal.classList.add('active');
}

function closeActiveModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    document.querySelectorAll('.modal-content-wrapper').forEach(m => m.classList.remove('active'));
}

function executeBulkEdit() {
    const targetColumn = document.getElementById('beColumnTarget').value;
    const newValue = document.getElementById('beValueInput').value;
    if (!gridApi) return;
    const cells = getBulkTargetRowData(true)
        .map(rowData => createCellSnapshot(rowData, targetColumn, rowData?.[targetColumn], newValue))
        .filter(Boolean);
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function executeSearchReplace() {
    const targetColumn = document.getElementById('srColumnTarget').value;
    const searchText = document.getElementById('srSearchInput').value;
    const replaceText = document.getElementById('srReplaceInput').value;
    const useRegex = document.getElementById('srUseRegex').checked;
    if (!searchText || !gridApi) return;
    const cells = [];
    getBulkTargetRowData(true).forEach(rowData => {
        const currentValue = rowData[targetColumn];
        if (currentValue && typeof currentValue === 'string') {
            let updatedValue;
            if (useRegex) {
                try { updatedValue = currentValue.replace(new RegExp(searchText, 'g'), replaceText); }
                catch { return; }
            } else updatedValue = currentValue.split(searchText).join(replaceText);
            const snap = createCellSnapshot(rowData, targetColumn, currentValue, updatedValue);
            if (snap) cells.push(snap);
        }
    });
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function executeInsertPaste() {
    const targetColumn = document.getElementById('ipColumnTarget').value;
    const textToInsert = document.getElementById('ipTextInput').value;
    const position = document.querySelector('input[name="ipPosition"]:checked')?.value;
    const marker = document.getElementById('ipMarkerInput').value;
    if (!gridApi) return;
    const cells = [];
    getBulkTargetRowData(true).forEach(rowData => {
        const currentValue = rowData[targetColumn] || "";
        let updatedValue = currentValue;
        if (position === 'start') updatedValue = textToInsert + currentValue;
        else if (position === 'end') updatedValue = currentValue + textToInsert;
        else if (marker && currentValue.includes(marker)) {
            const parts = currentValue.split(marker);
            updatedValue = position === 'beforeMarker' ? (parts[0] + textToInsert + marker + parts.slice(1).join(marker)) : (parts[0] + marker + textToInsert + parts.slice(1).join(marker));
        }
        const snap = createCellSnapshot(rowData, targetColumn, currentValue, updatedValue);
        if (snap) cells.push(snap);
    });
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function executePublishStatus() {
    if (!gridApi) return;
    const selectedStatus = document.querySelector('input[name="pubStatus"]:checked')?.value;
    if (!selectedStatus) return;
    const publishValue = selectedStatus === 'true';
    const nodesToUpdate = getBulkTargetRowData(true);
    if (!nodesToUpdate.length) { alert('No rows.'); return; }
    const cells = nodesToUpdate
        .map(rowData => createCellSnapshot(rowData, 'published', rowData?.published, publishValue))
        .filter(Boolean);
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function executeDateShift() {
    if (!gridApi) return;
    const offsetDays = parseInt(document.getElementById('dateOffsetDays').value, 10);
    const offsetDaysNum = (offsetDays === 0 || isNaN(offsetDays)) ? 0 : offsetDays;
    const timeOverride = (document.getElementById('timeOverride') || {}).value || '';
    const manualDate = (document.getElementById('manualFixedDate') || {}).value || '';
    const manualTime = (document.getElementById('manualFixedTime') || {}).value || '';
    const selectedDateColumns = Array.from(document.querySelectorAll('.date-col-checkbox:checked')).map(checkbox => checkbox.value);
    if (!selectedDateColumns.length) { alert('Select date columns.'); return; }
    const isClearMode = !manualDate && !timeOverride && offsetDaysNum === 0;
    let rowNodes = [];
    const selected = gridApi.getSelectedRows();
    if (selected.length) {
        const selectedSet = new Set(selected);
        gridApi.forEachNode(node => {
            if (node.data && selectedSet.has(node.data)) rowNodes.push(node);
        });
    } else {
        gridApi.forEachNodeAfterFilter(node => rowNodes.push(node));
    }
    const refreshedNodes = [];
    const cells = [];
    rowNodes.forEach(gridNode => {
        const rowData = gridNode.data;
        if (!rowData) return;
        selectedDateColumns.forEach(field => {
            const currentValue = rowData[field];
            let newDateValue = null;
            if (isClearMode) {
                newDateValue = null;
            } else if (manualDate) {
                const dateObj = new Date(manualDate);
                const timeStr = manualTime || timeOverride;
                if (timeStr) { const [hours, mins] = timeStr.split(':'); dateObj.setHours(parseInt(hours, 10) || 0, parseInt(mins, 10) || 0, 0, 0); }
                else dateObj.setHours(23, 59, 0, 0);
                if (field === 'unlock_at') dateObj.setHours(dateObj.getHours() - 1, dateObj.getMinutes(), 0, 0);
                else if (field === 'lock_at') dateObj.setHours(dateObj.getHours() + 1, dateObj.getMinutes(), 0, 0);
                newDateValue = DateUtils.parseForCanvas(dateObj);
            } else if (currentValue) {
                const currentDate = new Date(currentValue);
                if (!isNaN(currentDate.getTime())) {
                    const shiftedDate = new Date(currentDate);
                    shiftedDate.setDate(shiftedDate.getDate() + offsetDaysNum);
                    if (timeOverride) { const [hours, mins] = timeOverride.split(':'); shiftedDate.setHours(parseInt(hours, 10) || 0, parseInt(mins, 10) || 0, 0, 0); }
                    newDateValue = DateUtils.parseForCanvas(shiftedDate);
                }
            } else if (offsetDaysNum !== 0) {
                const baseDate = new Date();
                baseDate.setDate(baseDate.getDate() + offsetDaysNum);
                if (timeOverride) { const [hours, mins] = timeOverride.split(':'); baseDate.setHours(parseInt(hours, 10) || 0, parseInt(mins, 10) || 0, 0, 0); }
                else baseDate.setHours(23, 59, 0, 0);
                if (field === 'unlock_at') baseDate.setHours(baseDate.getHours() - 1, baseDate.getMinutes(), 0, 0);
                else if (field === 'lock_at') baseDate.setHours(baseDate.getHours() + 1, baseDate.getMinutes(), 0, 0);
                newDateValue = DateUtils.parseForCanvas(baseDate);
            }
            if (isClearMode || newDateValue !== null) {
                const snap = createCellSnapshot(rowData, field, currentValue, newDateValue);
                if (snap) cells.push(snap);
                refreshedNodes.push({ node: gridNode, field });
            }
        });
    });
    applyBulkCellSnapshots(cells);
    if (refreshedNodes.length && gridApi.refreshCells) {
        const nodesToRefresh = [...new Set(refreshedNodes.map(r => r.node))];
        const fieldsToRefresh = [...new Set(refreshedNodes.map(r => r.field))];
        gridApi.refreshCells({ rowNodes: nodesToRefresh, columns: fieldsToRefresh, force: true });
    }
    gridApi.redrawRows();
    closeActiveModal();
}

function executeTimeLimitUpdate() {
    const op = document.getElementById('timeLimitOp')?.value;
    const picker = window._timeLimitPicker;
    if (!gridApi) return;
    const nodesToUpdate = getBulkTargetRowData(true);
    if (!nodesToUpdate.length) { alert('Select rows or filter to target.'); return; }
    const val = picker ? picker.getMinutes() : 0;
    const cells = [];
    if (op === 'remove') {
        nodesToUpdate.forEach(rowData => {
            const snap = createCellSnapshot(rowData, 'time_limit', rowData?.time_limit, null);
            if (snap) cells.push(snap);
        });
    } else {
        if (op === 'set' && (isNaN(val) || val < 0)) { alert('Enter valid duration (hours and minutes).'); return; }
        if (op === 'add' && (isNaN(val) || val < 0)) { alert('Enter valid duration to add.'); return; }
        nodesToUpdate.forEach(rowData => {
            const current = rowData.time_limit;
            const curNum = (current != null && current !== '') ? Math.max(0, parseInt(Number(current), 10) || 0) : 0;
            let newVal = op === 'set' ? val : curNum + val;
            if (newVal < 0) newVal = 0;
            if (op === 'set' && newVal === 0) newVal = null;
            const snap = createCellSnapshot(rowData, 'time_limit', rowData?.time_limit, newVal);
            if (snap) cells.push(snap);
        });
    }
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function executePointsUpdate() {
    const targetField = document.getElementById('pointsColumnTarget').value;
    const operation = document.getElementById('pointsOp').value;
    const pointsValue = parseFloat(document.getElementById('pointsValue').value);
    const selectedRows = getBulkTargetRowData(false);
    if (!selectedRows.length) { alert("Select rows."); return; }
    if (isNaN(pointsValue)) { alert("Enter valid number."); return; }
    const cells = [];
    selectedRows.forEach(rowData => {
        const currentValue = parseFloat(rowData[targetField]) || 0;
        let finalValue = operation === 'set' ? pointsValue : operation === 'scale' ? currentValue * pointsValue : currentValue + pointsValue;
        const pointsResult = Number(finalValue.toFixed(2));
        const snap = createCellSnapshot(rowData, targetField, rowData?.[targetField], pointsResult);
        if (snap) cells.push(snap);
    });
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function executeAllowedAttemptsUpdate() {
    const op = document.getElementById('allowedAttemptsOp')?.value;
    const valueInput = document.getElementById('allowedAttemptsValue');
    if (!gridApi) return;
    const nodesToUpdate = getBulkTargetRowData(true);
    if (!nodesToUpdate.length) { alert('Select rows or filter to target.'); return; }
    const cells = [];
    if (op === 'unlimited') {
        nodesToUpdate.forEach(rowData => {
            const snap = createCellSnapshot(rowData, 'allowed_attempts', rowData?.allowed_attempts, -1);
            if (snap) cells.push(snap);
        });
    } else {
        const val = valueInput ? parseInt(valueInput.value, 10) : 0;
        if (op === 'set' && (isNaN(val) || val < -1)) { alert('Enter valid number of attempts (-1 for unlimited, or positive number).'); return; }
        if (op === 'add' && isNaN(val)) { alert('Enter valid number to add.'); return; }
        nodesToUpdate.forEach(rowData => {
            const current = rowData.allowed_attempts;
            const curNum = (current != null && current !== '') ? parseInt(Number(current), 10) : 1;
            let newVal = op === 'set' ? val : curNum + val;
            if (newVal < -1) newVal = -1;
            if (newVal === 0) newVal = 1;
            const snap = createCellSnapshot(rowData, 'allowed_attempts', rowData?.allowed_attempts, newVal);
            if (snap) cells.push(snap);
        });
    }
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

function executeAllowRatingUpdate() {
    if (!gridApi) return;
    const valueEl = document.getElementById('allowRatingValue');
    if (!valueEl) return;
    const allowRating = valueEl.value === 'true';
    const nodesToUpdate = getBulkTargetRowData(true);
    if (!nodesToUpdate.length) { alert('Select rows or filter to target.'); return; }
    const cells = nodesToUpdate
        .map(rowData => createCellSnapshot(rowData, 'allow_rating', rowData?.allow_rating, allowRating))
        .filter(Boolean);
    applyBulkCellSnapshots(cells);
    gridApi.redrawRows();
    closeActiveModal();
}

async function executeClone() {
    const selectedRows = gridApi.getSelectedRows();
    const method = document.getElementById('cloneMethod').value;
    const prefix = document.getElementById('clonePrefix').value || '';
    const suffix = document.getElementById('cloneSuffix').value || '';
    const numCopies = Math.max(1, parseInt(document.getElementById('cloneNumCopies')?.value || '1', 10) || 1);
    const serialize = document.getElementById('cloneSerialize')?.checked !== false;
    if (currentTab === 'files' && (method === 'surface' || method === 'deep')) {
        await withSpinner(async () => {
            await executeFilesFolderClone(method, selectedRows, prefix, suffix, numCopies, serialize);
            await refreshCurrentTab();
        }, {
            mode: 'grid',
            panelEl: document.getElementById('myGrid'),
            label: method === 'deep' ? 'Deep cloning folders...' : 'Cloning folder shells...',
            scrollTargetEl: document.getElementById('myGrid'),
        });
    } else if (currentTab === 'modules' && method === 'deep') {
        await withSpinner(async () => {
            for (const rowData of selectedRows) await performDeepClone(rowData, prefix, rowData.name || rowData.title, suffix);
        }, {
            mode: 'grid',
            panelEl: document.getElementById('myGrid'),
            label: 'Cloning modules...',
            scrollTargetEl: document.getElementById('myGrid'),
        });
    } else if (method === 'deep') {
        await withSpinner(async () => {
            const configKey = getConfigKey(currentTab);
            const tabConfig = FIELD_DEFINITIONS[configKey];
            for (const rowData of selectedRows) {
                const endpoint = tabConfig.endpoint;
                const itemIdentifier = getItemIdentifier(rowData, currentTab);
                const pathSegment = tabConfig.usesSlugIdentifier ? encodeURIComponent(itemIdentifier) : itemIdentifier;
                const response = await fetch(`/canvas/courses/${selectedCourseId}/${endpoint}/${pathSegment}`);
                if (response.ok) {
                    const originalFullObject = await response.json();
                    const sanitizedCopy = sanitizeRowData(originalFullObject, endpoint, 'clone');
                    const newName = getUniqueName(originalFullObject.name || originalFullObject.title || originalFullObject.display_name || "Item", new Set(), prefix, suffix);
                    if (sanitizedCopy.name !== undefined) sanitizedCopy.name = newName;
                    if (sanitizedCopy.title !== undefined) sanitizedCopy.title = newName;
                    if (sanitizedCopy.display_name !== undefined) sanitizedCopy.display_name = newName;
                    await createDeepContent(currentTab.charAt(0).toUpperCase() + currentTab.slice(1, -1), sanitizedCopy);
                }
            }
            await refreshCurrentTab();
        }, {
            mode: 'grid',
            panelEl: document.getElementById('myGrid'),
            label: 'Cloning...',
            scrollTargetEl: document.getElementById('myGrid'),
        });
    } else {
        const existingNames = new Set();
        const newItems = [];
        for (const rowData of selectedRows) {
            for (let c = 0; c < numCopies; c++) {
                let clonedCopy = prepareUIClone(rowData, currentTab, prefix, suffix, existingNames, serialize ? c : -1, serialize);
                if (currentTab === 'modules') clonedCopy.items = method === 'structural' ? [] : (rowData.items || []).map(item => ({ ...item }));
                newItems.push(clonedCopy);
                trackChange(currentTab, clonedCopy.id, '_isNew', true);
            }
        }
        gridApi.applyTransaction({ add: newItems });
    }
    closeActiveModal();
}

async function executeDelete() {
    const confirmInput = document.getElementById('deleteConfirmInput');
    const mode = confirmInput.dataset.mode;
    if (confirmInput.value !== 'DELETE') { alert('Type DELETE.'); return; }
    const selectedItems = getSelectedItems();
    if (!selectedItems || !selectedItems.length) { alert('No items.'); return; }
    if (currentTab === 'files' && selectedItems.some(i => i?.is_folder)) {
        showToast('Folders must be deleted directly in Canvas', 'warn');
        debugLog('[Delete] Blocked folder delete request in Files tab', 'warn');
        return;
    }
    const courseId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!courseId) { alert('No course.'); return; }
    try {
        const deleteBtn = document.querySelector('.modal-footer .btn-danger');
        await withSpinner(async () => {
            for (const item of selectedItems) {
                const type = item._originTab || currentTab;
                if (mode === 'deep' && type === 'modules') {
                    await deepPurgeModule(courseId, item);
                } else {
                    const identifier = getItemIdentifier(item, type);
                    const extra = (type === 'files' && item.is_folder) ? { isFolder: true } : undefined;
                    await deleteCanvasItem(type, courseId, identifier, extra);
                }
            }
            closeActiveModal();
            delete originalData['assignments'];
            if (changes['assignments']) changes['assignments'] = {};
            await refreshCurrentTab();
            if (currentTab !== 'assignments') {
                const response = await fetch(`/canvas/courses/${selectedCourseId}/${FIELD_DEFINITIONS['assignments'].endpoint}`);
                const data = await response.json();
                originalData['assignments'] = data.map(record => ({ ...record, _edit_status: 'synced' }));
            }
        }, {
            triggerEl: deleteBtn,
            mode: 'grid',
            panelEl: document.getElementById('myGrid'),
            label: 'Deleting...',
            scrollTargetEl: document.getElementById('myGrid'),
        });
    } catch (error) {
        console.error(error);
        debugLog('[Delete] FAILED - ' + (error?.message || String(error)), 'error');
        alert(`Error: ${error.message}`);
    }
}

async function executeMerge() {
    // Validation
    if (currentTab !== 'modules') {
        alert('Merge is only available for modules.');
        return;
    }

    const selectedModules = getSelectedItems();
    if (!selectedModules || selectedModules.length < 2) {
        alert('Please select at least 2 modules to merge.');
        return;
    }

    const targetModuleId = document.getElementById('mergeTargetSelect').value;
    if (!targetModuleId) {
        alert('Please select a target module.');
        return;
    }

    const courseId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!courseId) {
        alert('No course selected.');
        return;
    }

    // Setup
    const targetModule = selectedModules.find(m => m.id.toString() === targetModuleId);
    const sourceModules = selectedModules.filter(m => m.id.toString() !== targetModuleId);

    if (!targetModule) {
        alert('Target module not found in selection.');
        return;
    }

    const combinedName = selectedModules.map(m => m.name || `Module ${m.id}`).join(' + ');

    // Confirmation
    const confirmMsg = `This will:\n` +
        `- Merge ${sourceModules.length} module(s) into "${targetModule.name}"\n` +
        `- Rename target to: "${combinedName}"\n` +
        `- Move all items from source modules to target\n` +
        `- Delete source modules\n\nContinue?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    // Execution
    try {
        const mergeBtn = document.querySelector('#mergeModal .primary-btn');
        await withSpinner(async () => {
            const targetItemsResponse = await fetch(`/canvas/courses/${courseId}/modules/${targetModuleId}/items`);
            if (!targetItemsResponse.ok) throw new Error('Failed to fetch target module items');
            const targetItems = await targetItemsResponse.json();
            let nextPosition = targetItems.length + 1;

            for (const sourceModule of sourceModules) {
                try {
                    const itemsResponse = await fetch(`/canvas/courses/${courseId}/modules/${sourceModule.id}/items`);
                    if (!itemsResponse.ok) {
                        console.warn(`Failed to fetch items from module ${sourceModule.id}`);
                        continue;
                    }
                    const items = await itemsResponse.json();
                    items.sort((a, b) => (a.position || 0) - (b.position || 0));

                    for (const item of items) {
                        try {
                            const itemParams = {
                                title: item.title,
                                type: item.type,
                                position: nextPosition,
                                indent: item.indent || 0
                            };

                            if (item.type === 'ExternalUrl') {
                                itemParams.external_url = item.external_url;
                            } else if (item.type === 'Page') {
                                itemParams.page_url = item.page_url;
                            } else if (item.content_id) {
                                itemParams.content_id = item.content_id;
                            }

                            await addModuleItem(courseId, targetModuleId, itemParams);
                            nextPosition++;
                        } catch (itemError) {
                            console.error(`Failed to copy item "${item.title}":`, itemError);
                        }
                    }
                } catch (moduleError) {
                    console.error(`Error processing module ${sourceModule.id}:`, moduleError);
                }
            }

            const updateResponse = await fetch(`/canvas/courses/${courseId}/modules/${targetModuleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module: { name: combinedName } })
            });
            if (!updateResponse.ok) console.warn('Failed to update module name');

            for (const sourceModule of sourceModules) {
                try {
                    await deleteCanvasItem('modules', courseId, sourceModule.id);
                } catch (deleteError) {
                    console.error(`Failed to delete module ${sourceModule.id}:`, deleteError);
                }
            }

            closeActiveModal();
            await refreshCurrentTab();
            alert(`Successfully merged ${sourceModules.length} module(s) into "${targetModule.name}"`);
        }, {
            triggerEl: mergeBtn,
            mode: 'grid',
            panelEl: document.getElementById('myGrid'),
            label: 'Merging modules...',
            scrollTargetEl: document.getElementById('myGrid'),
        });

    } catch (error) {
        console.error('Merge error:', error);
        alert(`Merge failed: ${error.message}\n\nSome changes may have been applied. Please refresh to see current state.`);
    }
}

function exportData() {
    if (gridApi) gridApi.exportDataAsCsv({ fileName: `canvas_${currentTab}_export.csv` });
}

function toggleAllDateCheckboxes() {
    const checkboxes = document.querySelectorAll('.date-col-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

function calculateDateOffset() {
    const oldVal = document.getElementById('calcOldDate').value;
    const newVal = document.getElementById('calcNewDate').value;
    if (!oldVal || !newVal) return;
    document.getElementById('dateOffsetDays').value = Math.round((new Date(newVal) - new Date(oldVal)) / 86400000);
}

function clearFixedDateOverride() {
    const dateEl = document.getElementById('manualFixedDate');
    const timeEl = document.getElementById('manualFixedTime');
    if (dateEl) dateEl.value = '';
    if (timeEl) timeEl.value = '';
}

function getUniqueName(originalName, existingNames, prefix = '', suffix = '') {
    let baseName = originalName || "Untitled";
    let trimmedName = baseName;
    let currentCounter = 0;
    const match = baseName.match(/(.*)\s(\d+)$/);
    if (match) { trimmedName = match[1]; currentCounter = parseInt(match[2], 10); }
    const formatName = (name, num) => `${prefix}${num > 0 ? `${name} ${num}` : name}${suffix}`.trim();
    let nextNum = currentCounter;
    let finalName = formatName(trimmedName, nextNum);
    while (existingNames.has(finalName)) { nextNum++; finalName = formatName(trimmedName, nextNum); }
    existingNames.add(finalName);
    return finalName;
}

function sanitizeRowData(rowData, tabType, method = 'sync') {
    const configKey = getConfigKey(tabType);
    const tabConfig = FIELD_DEFINITIONS[configKey];
    if (!tabConfig) return {};

    if (method === 'sync') {
        const dataFields = tabConfig.fields;
        const changedData = {};
        const pristineData = rowData._pristine || {};
        dataFields.forEach(field => {
            const key = field.key;
            const value = rowData[key];
            if (JSON.stringify(value) !== JSON.stringify(pristineData[key])) {
                changedData[key] = value;
            }
        });
        return changedData;
    }

    const systemRestrictedFields = ['id', 'uuid', 'created_at', 'updated_at', 'items_count', 'items', 'html_url', 'url', 'workflow_state', 'publish_at', 'course_id', 'context_type', 'context_id', 'lti_context_id', 'global_id', 'secure_params', 'original_lti_resource_link_id', 'items_url', 'locked_for_user', 'lock_info', 'lock_explanation', 'permissions', 'submission', 'overrides', 'all_dates', 'can_duplicate'];
    const specialIncludedIds = new Set(['assignment_group_id', 'grading_standard_id', 'prerequisite_module_ids']);
    const cloneContentFields = new Set(['description', 'body', 'message']);
    const exclusionSet = new Set(systemRestrictedFields);

    if (tabConfig.fields && method !== 'clone') {
        tabConfig.fields.forEach(field => { if (field.editable === false) exclusionSet.add(field.key || field.name); });
    } else if (tabConfig.fields && method === 'clone') {
        tabConfig.fields.forEach(field => {
            const key = field.key || field.name;
            if (field.editable === false && !cloneContentFields.has(key)) exclusionSet.add(key);
        });
    }

    const sanitizedObject = {};
    Object.keys(rowData).forEach(key => {
        const isInternal = key.startsWith('_');
        const isExcluded = exclusionSet.has(key);
        const isGenericId = key.endsWith('_id') && !specialIncludedIds.has(key);
        if (!isInternal && !isExcluded && !isGenericId && key !== 'position') sanitizedObject[key] = rowData[key];
    });
    return sanitizedObject;
}

async function performDeepClone(moduleRecord, prefix, baseName, suffix) {
    return performDeepCloneWithIndex(moduleRecord, prefix, baseName || moduleRecord.name, suffix, null, null, null, true);
}

async function performDeepCloneWithIndex(moduleRecord, prefix, baseName, suffix, copyIndex, position, allModulesCache, autoIncrement = true) {
    if (!selectedCourseId) { alert('No course.'); return; }
    try {
        const allModules = allModulesCache || (await fetch(`/canvas/courses/${selectedCourseId}/modules?per_page=100`).then(r => r.ok ? r.json() : []));
        const existingNames = new Set(allModules.map(m => m.name));
        const base = baseName || moduleRecord.name || "Module";
        const newModuleName = copyIndex != null && autoIncrement
            ? formatNameWithCopyIndex(base, copyIndex, prefix, suffix, true)
            : getUniqueName(base, existingNames, prefix, suffix);
        existingNames.add(newModuleName);
        const newModule = await createModules(selectedCourseId, newModuleName, position);
        const moduleItems = moduleRecord.items || [];
        for (const item of moduleItems) {
            const itemType = item.type;
            const contentType = itemType.toLowerCase();
            let newContent;
            let displayTitle = item.title;
            let itemParams = { title: item.title, type: itemType, position: item.position, indent: item.indent };
            if (contentType === 'subheader' || contentType === 'externalurl') {
                if (contentType === 'externalurl') itemParams.external_url = item.external_url;
                if (copyIndex != null && autoIncrement) {
                    displayTitle = formatNameWithCopyIndex(item.title || 'Item', copyIndex, prefix, suffix, true);
                    itemParams.title = displayTitle;
                }
                newContent = { id: 'no-content-needed' };
            } else {
                const apiEndpoint = getApiEndpoint(itemType);
                if (apiEndpoint) {
                    const contentIdentifier = itemType === 'Page' ? (item.page_url || item.content_id) : item.content_id;
                    const pathSegment = itemType === 'Page' ? encodeURIComponent(contentIdentifier) : contentIdentifier;
                    const contentResponse = await fetch(`/canvas/courses/${selectedCourseId}/${apiEndpoint}/${pathSegment}`);
                    if (contentResponse.ok) {
                        const originalFullObject = await contentResponse.json();
                        const sanitizedCopy = sanitizeRowData(originalFullObject, apiEndpoint, 'clone');
                        const itemBase = originalFullObject.name || originalFullObject.title || "Item";
                        const uniqueItemName = copyIndex != null && autoIncrement
                            ? formatNameWithCopyIndex(itemBase, copyIndex, prefix, suffix, true)
                            : getUniqueName(itemBase, new Set(), prefix, suffix);
                        if (sanitizedCopy.name !== undefined) sanitizedCopy.name = uniqueItemName;
                        if (sanitizedCopy.title !== undefined) sanitizedCopy.title = uniqueItemName;
                        newContent = await createDeepContent(itemType, sanitizedCopy);
                        if (newContent) {
                            displayTitle = newContent.title || newContent.name || uniqueItemName;
                            itemParams.title = displayTitle;
                        }
                    }
                }
            }
            if (newContent) {
                if (itemType === 'Page') itemParams.page_url = newContent.url || newContent.page_url;
                else if (newContent.id !== 'no-content-needed') itemParams.content_id = newContent.id;
                await addModuleItem(selectedCourseId, newModule.id, itemParams);
            }
        }
        if (copyIndex == null) await refreshCurrentTab();
    } catch (error) { alert(`Cloning failed: ${error.message}`); }
}

const getNewName = (record, prefix, suffix, existingSet = new Set()) => getUniqueName(record.display_name || record.name || record.title || "Untitled", existingSet, prefix, suffix);

function getSerializedName(baseName, copyIndex, prefix, suffix) {
    const base = (baseName || "Untitled").trim();
    const namePart = copyIndex >= 0 ? `${base} ${copyIndex + 1}` : base;
    return `${prefix}${namePart}${suffix}`.trim() || "Untitled";
}

async function createDeepContent(itemType, sanitizedParams) {
    const fn = ITEM_TYPE_TO_CREATE[itemType];
    return fn ? await fn(sanitizedParams) : null;
}

function prepareUIClone(row, type, prefix, suffix, existingSet, copyIndex = -1, serialize = false) {
    let rowCopy = JSON.parse(JSON.stringify(row));
    const baseName = rowCopy.display_name || rowCopy.name || rowCopy.title || "Untitled";
    const uniqueName = serialize && copyIndex >= 0
        ? getSerializedName(baseName, copyIndex, prefix, suffix)
        : getNewName(rowCopy, prefix, suffix, existingSet || new Set());
    if (existingSet && !serialize) existingSet.add(uniqueName);
    if (rowCopy.display_name !== undefined) rowCopy.display_name = uniqueName;
    if (rowCopy.name !== undefined) rowCopy.name = uniqueName;
    if (rowCopy.title !== undefined) rowCopy.title = uniqueName;
    let clonedContent = sanitizeRowData(rowCopy, type, 'clone');
    if (type === 'files') {
        clonedContent._source_file_id = row.id;
        clonedContent._source_folder_id = row.folder_id ?? null;
        clonedContent.folder_id = row.folder_id ?? null;
    }
    clonedContent.id = `TEMP_${Math.random().toString(36).substr(2, 9)}`;
    clonedContent.isNew = true;
    clonedContent._edit_status = 'modified';
    return clonedContent;
}

async function createAssignments(courseId, params) {
    const response = await fetch(`/canvas/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: params })
    });
    return response.ok ? await response.json() : null;
}

async function createQuizzes(courseId, quizParams, assignmentParams = null) {
    const response = await fetch(`/canvas/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: quizParams })
    });
    const newQuiz = response.ok ? await response.json() : null;
    if (newQuiz && assignmentParams && newQuiz.assignment_id) {
        await fetch(`/canvas/courses/${courseId}/assignments/${newQuiz.assignment_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignment: assignmentParams })
        });
    }
    return newQuiz;
}

async function createPages(courseId, params) {
    const response = await fetch(`/canvas/courses/${courseId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wiki_page: params })
    });
    const result = response.ok ? await response.json() : null;
    if (result && result.url && !result.id) result.id = result.url;
    return result;
}

async function createDiscussions(courseId, params) {
    const response = await fetch(`/canvas/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return response.ok ? await response.json() : null;
}

async function createAnnouncements(courseId, params) {
    const response = await fetch(`/canvas/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return response.ok ? await response.json() : null;
}

async function createNewQuizzes(courseId, params) {
    const response = await fetch(`/canvas/courses/${courseId}/new_quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    if (!response.ok) {
        let msg = response.statusText;
        try {
            const err = await response.json();
            msg = err.message || err.error || msg;
        } catch (_) {
            const text = await response.text();
            if (text) msg = text.slice(0, 400);
        }
        throw new Error(msg || 'Failed to create New Quiz');
    }
    return await response.json();
}

async function createFolders(courseId, params) {
    const response = await fetch(`/canvas/courses/${courseId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return response.ok ? await response.json() : null;
}

async function createFiles(courseId, params) {
    if (!params?.source_file_id) throw new Error('Missing source file id for file clone');
    const response = await fetch(`/canvas/courses/${courseId}/files/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    if (!response.ok) {
        const raw = await response.text().catch(() => '');
        let msg = response.statusText || 'Failed to clone file';
        try {
            const j = raw ? JSON.parse(raw) : {};
            msg = j.message || j.error || raw || msg;
        } catch (_) {
            if (raw) msg = raw;
        }
        throw new Error(msg);
    }
    return await response.json();
}

const createModules = async (courseId, moduleName, position) => {
    const body = { module: { name: moduleName } };
    if (position != null) body.module.position = position;
    const response = await fetch(`/canvas/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        let msg = response.statusText;
        try {
            const text = await response.text();
            if (text) {
                try {
                    const j = JSON.parse(text);
                    msg = j.message || j.errors?.[0]?.message || text;
                } catch (_) {
                    msg = text;
                }
            }
        } catch (_) {}
        throw new Error(msg || 'Failed to create module');
    }
    return await response.json();
};

async function addModuleItem(courseId, moduleId, itemParams) {
    const response = await fetch(`/canvas/courses/${courseId}/modules/${moduleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_item: itemParams })
    });
    return response.ok ? await response.json() : null;
}

function getSelectedItems() {
    if (!gridApi) { console.error("No API."); return []; }
    return gridApi.getSelectedRows();
}

async function deleteCanvasItem(type, courseId, identifier, extraBody) {
    const configKey = getConfigKey(type);
    const config = FIELD_DEFINITIONS[configKey];
    const endpoint = config ? config.endpoint : type;
    const pathSegment = config?.usesSlugIdentifier ? encodeURIComponent(identifier) : identifier;
    const url = `/canvas/courses/${courseId}/${endpoint}/${pathSegment}`;
    debugLog('[Delete] Request: type=' + type + ' item=' + identifier + ' DELETE ' + url + ' payload=' + JSON.stringify(extraBody || {}), 'info');
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: extraBody ? JSON.stringify(extraBody) : undefined
    });
    if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        try { errorDetail = JSON.parse(errorText); } catch { errorDetail = { message: errorText }; }
        debugLog(
            '[Delete] HTTP FAILED: type=' + type +
            ' item=' + identifier +
            ' status=' + response.status +
            ' endpoint=' + url +
            ' payload=' + JSON.stringify(extraBody || {}) +
            ' response=' + (errorText || ''),
            'error'
        );
        throw new Error(errorDetail.message || `Failed: ${type} ${identifier}`);
    }
    if (gridApi) {
        const rowNode = gridApi.getRowNode(identifier.toString());
        if (rowNode) gridApi.applyTransaction({ remove: [rowNode.data] });
    }
    return await response.json().catch(() => ({ status: 'success' }));
}

async function deepPurgeModule(courseId, moduleItem) {
    const response = await fetch(`/canvas/courses/${courseId}/modules/${moduleItem.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        try { errorDetail = JSON.parse(errorText); } catch { errorDetail = { message: errorText }; }
        throw new Error(errorDetail.message || `Failed to deep delete module ${moduleItem.id}`);
    }
    if (gridApi) {
        const rowNode = gridApi.getRowNode(moduleItem.id.toString());
        if (rowNode) gridApi.applyTransaction({ remove: [rowNode.data] });
    }
    return await response.json().catch(() => ({ status: 'success' }));
}

async function handleDeepPurge() {
    const selectedItems = getSelectedItems();
    if (!selectedItems || !selectedItems.length) { alert('No items selected.'); return; }
    const courseId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!courseId) { alert('No course ID found.'); return; }
    if (!confirm(`This will delete ${selectedItems.length} module(s) AND all contents inside them. Continue?`)) return;
    try {
        for (const item of selectedItems) await deepPurgeModule(courseId, item);
        closeActiveModal();
        delete originalData['modules'];
        if (changes['modules']) changes['modules'] = {};
        await refreshCurrentTab();
        alert('Deep purge complete.');
    } catch (error) {
        console.error('Purge error:', error);
        alert(`Purge failed: ${error.message}`);
    }
}

function updateColumnVisibility(columnIds, isVisible) {
    if (!gridApi) { console.error('gridApi is not defined or not initialized'); return; }
    if (!columnIds || columnIds.length === 0) { console.warn('No column IDs provided to updateColumnVisibility'); return; }
    const stateUpdates = columnIds.map(id => ({ colId: id, hide: !isVisible }));
    gridApi.applyColumnState({ state: stateUpdates, applyOrder: false });
}

function applyColumnVisibilityFromModal() {
    if (!gridApi) return;
    const checkboxes = Array.from(document.querySelectorAll('#columnListContainer .col-toggle-input'));
    if (!checkboxes.length) {
        closeActiveModal();
        return;
    }
    const hideChecked =
        document.getElementById('columnVisibilityModal')?.querySelector('input[name="colVisApplyMode"]:checked')?.value ===
        'hide';
    const primaryVisible = !hideChecked;
    const stateUpdates = checkboxes.map((cb) => {
        const id = cb.value;
        const visible = cb.checked ? primaryVisible : !primaryVisible;
        return { colId: id, hide: !visible };
    });
    gridApi.applyColumnState({ state: stateUpdates, applyOrder: false });
    closeActiveModal();
}

// Dropdown Functions
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    if (dropdownId === 'bulkActionsDropdown') applyBulkActionMenuVisibility(currentTab);
    
    const isActive = dropdown.classList.contains('active');
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== dropdownId) {
            menu.classList.remove('active');
        }
    });
    
    // Toggle current dropdown
    dropdown.classList.toggle('active', !isActive);
}

function closeDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const dropdownContainer = event.target.closest('.dropdown-container');
    if (!dropdownContainer) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }
});

document.addEventListener('click', function(event) {
    const btn = event.target.closest('.acc-create-rubric, .acc-apply-tag, .acc-apply-quiz-tag');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    if (btn.classList.contains('acc-create-rubric')) {
        let pl = {};
        try { pl = JSON.parse(btn.getAttribute('data-payload') || '{}'); } catch (_) {}
        if (!pl.resource_type || !pl.resource_id || !Array.isArray(pl.criteria) || !pl.criteria.length) {
            if (typeof showToast === 'function') showToast('Invalid rubric data. Try refreshing.', 'error');
            else alert('Invalid rubric data.');
            return;
        }
        handleCreateRubric(pl);
    } else if (btn.classList.contains('acc-apply-tag')) {
        const type = btn.getAttribute('data-type');
        const id = btn.getAttribute('data-id');
        let stds = [];
        try { stds = JSON.parse(btn.getAttribute('data-standards') || '[]'); } catch (_) {}
        if (!type || !id || !stds.length) {
            if (typeof showToast === 'function') showToast('No standards to apply. Try refreshing.', 'error');
            else alert('No standards to apply.');
            return;
        }
        applyAccreditationTagging(type, id, stds);
    } else if (btn.classList.contains('acc-apply-quiz-tag')) {
        const quizType = btn.getAttribute('data-quiz-type');
        const id = btn.getAttribute('data-id');
        let stds = [];
        try { stds = JSON.parse(btn.getAttribute('data-standards') || '[]'); } catch (_) {}
        if (!quizType || !id || !stds.length) {
            if (typeof showToast === 'function') showToast('No standards to apply. Try refreshing.', 'error');
            else alert('No standards to apply.');
            return;
        }
        applyQuizAccreditationTagging(quizType, id, stds);
    }
});

async function handleCreateRubric(pl) {
    if (!selectedCourseId) {
        if (typeof showToast === 'function') showToast('No course selected.', 'error');
        return;
    }
    try {
        const res = await fetch('/canvas/courses/' + selectedCourseId + '/accreditation/rubrics/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pl)
        });
        const text = await res.text();
        if (!res.ok) {
            if (typeof showToast === 'function') showToast('Failed: ' + (text || res.statusText), 'error');
            else alert('Failed: ' + (text || res.statusText));
            return;
        }
        if (typeof showToast === 'function') showToast('Rubric created.', 'success');
        if (typeof loadAccreditationAlignment === 'function') loadAccreditationAlignment({});
    } catch (e) {
        const msg = e?.message || String(e);
        if (typeof showToast === 'function') showToast('Failed: ' + msg, 'error');
        else alert('Failed: ' + msg);
    }
}

// Application Mode Management
let currentAppMode = localStorage.getItem('appMode') || 'demo';

function initializeAppMode() {
    applyAppMode(currentAppMode);
}

function applyAppMode(mode) {
    currentAppMode = mode;
    localStorage.setItem('appMode', mode);

    tabInterceptionEnabled = false;

    const debugPanel = document.getElementById('debugPanel');
    const showDebug = mode === 'developer';
    if (debugPanel) debugPanel.style.display = showDebug ? 'block' : 'none';

    // Update current mode display in modal
    const modeDisplay = document.getElementById('currentModeDisplay');
    if (modeDisplay) {
        modeDisplay.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }
}

function executeModeChange() {
    const selectedMode = document.querySelector('input[name="appMode"]:checked')?.value;
    const passwordInput = document.getElementById('modePassword');
    const modePassword = passwordInput?.value;

    if (!selectedMode) {
        alert('Please select a mode');
        return;
    }

    // Demo mode doesn't need password
    if (selectedMode === 'demo') {
        applyAppMode('demo');
        closeActiveModal();
        if (passwordInput) passwordInput.value = '';
        location.reload(); // Reload to apply tab restrictions
        return;
    }

    // Developer and Production modes need password
    const correctPassword = window.MODE_PASSWORD || 'dev2025';
    if (modePassword !== correctPassword) {
        alert('Incorrect password');
        return;
    }

    applyAppMode(selectedMode);
    closeActiveModal();
    if (passwordInput) passwordInput.value = '';
    location.reload();
}

// Event listener for mode radio buttons to show/hide password field
document.addEventListener('change', function(event) {
    if (event.target.name === 'appMode') {
        const passwordContainer = document.getElementById('modePasswordContainer');
        const selectedMode = event.target.value;

        if (passwordContainer) {
            // Show password field for developer and production modes
            passwordContainer.style.display = (selectedMode !== 'demo') ? 'block' : 'none';
        }
    }
});

// Initialize mode on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAppMode();

    // Set current mode radio button when modal opens
    const modeRadios = document.querySelectorAll('input[name="appMode"]');
    modeRadios.forEach(radio => {
        if (radio.value === currentAppMode) {
            radio.checked = true;
        }
    });
});
