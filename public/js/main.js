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
    overlay.style.display = 'flex';
    overlay.style.background = 'rgba(139, 0, 0, 0.95)';
    overlay.innerHTML = `
        <div style="background: white; padding: 3rem; border-radius: 8px; border: 5px solid red;">
            <h1 style="color: red; margin: 0;">ACCESS BLOCKED</h1>
            <p style="font-size: 1.2rem; font-weight: bold;">${message}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">Retry Connection</button>
        </div>
    `;
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

const FIELD_DEFINITIONS = window.FIELD_DEFINITIONS || window.CANVAS_CONFIG?.FIELD_DEFINITIONS || {};

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

function setGridStatus(tabName, message, color = '#00ff00') {
    if (!gridApi) return;
    
    const overlayTemplate = `
        <div style="text-align: center; background: rgba(0,0,0,0.8); padding: 20px; border: 2px solid ${color}; border-radius: 8px; color: white; font-family: monospace;">
            <div class="retro-spinner" style="margin-bottom: 15px;"></div>
            <div style="font-size: 1.2em; margin-bottom: 8px; font-weight: bold; color: ${color}; uppercase;">
                LOADING ${tabName}
            </div>
            <div style="font-size: 1em; color: #ddd;">
                ${message}
            </div>
            <div style="margin-top: 15px; font-size: 0.8em; color: #666;">
                System responding... Please wait
            </div>
        </div>
    `;
    
    gridApi.setGridOption('overlayLoadingTemplate', overlayTemplate);
    gridApi.showLoadingOverlay();
}

let gridApi, currentTab = 'assignments', originalData = {}, changes = {}, selectedCourseId = null, lastGridColumnTab = null;

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
    rowSelection: {
        mode: 'multiRow',
        selectAll: 'filtered',
        headerCheckbox: true,
        checkboxes: true,
        enableClickSelection: false
    },
    defaultColDef: {
        minWidth: 150,
        flex: 1,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        sortable: true,
        resizable: true,
        editable: true,
        singleClickEdit: true
    },
    getRowId: (params) => {
        return String(params.data.id || params.data.url || Math.random());
    },
    getRowStyle: params => params.data?._edit_status === 'modified' ? { backgroundColor: '#fff9c4', fontWeight: 'bold', color: '#d35400' } : null,
    onCellValueChanged: params => {
        if (params.colDef.field !== '_edit_status') {
            if (params.colDef.field === 'rubric_id' && params.newValue === '__create_new__') {
                createRubricForRow(params).catch(err => alert('Failed to create rubric: ' + (err?.message || err)));
                return;
            }
            params.node.setDataValue('_edit_status', 'modified');
            const committedValue = params.data?.[params.colDef.field];
            trackChange(currentTab, params.data.id || params.data.url, params.colDef.field, committedValue);
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
            const hasChanges = keysToCompare.some(key => !valuesEqual(node.data[key], originalRow[key]));
            if (hasChanges && node.data._edit_status !== 'modified') {
                node.setDataValue('_edit_status', 'modified');
                keysToCompare.forEach(key => {
                    if (!valuesEqual(node.data[key], originalRow[key])) {
                        trackChange(currentTab, node.data.id || node.data.url, key, node.data[key]);
                    }
                });
            }
        });
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
                    params.node.setDataValue('_edit_status', 'modified');
                    trackChange(currentTab, params.data.id || params.data.url, field.key, newValue);
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
        if (typeof gridApi.resetColumnState === 'function') gridApi.resetColumnState();
        lastGridColumnTab = tabName;
    }
}

async function refreshCurrentTab() {
    if (!selectedCourseId) { alert('Select course first.'); return; }
    if (currentTab === 'standards_sync') {
        loadStandardsSyncTab();
        return;
    }
    delete originalData[currentTab];
    if (changes[currentTab]) changes[currentTab] = {};
    try {
        if (gridApi) gridApi.setGridOption('loading', true);

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
        const dataWithStatus = data.map(x => ({ ...x, _edit_status: 'synced' }));
        originalData[currentTab] = dataWithStatus;

        if (gridApi) {
            setGridColumnDefsForTab(currentTab);
            gridApi.setGridOption('rowData', dataWithStatus);
            gridApi.setGridOption('loading', false);
            gridApi.redrawRows();
            if (currentTab === 'students') setTimeout(() => gridApi.resetRowHeights(), 100);
        }
    } catch (event) {
        console.error(`Error refreshing:`, event);
        alert('Refresh failed.');
        if (gridApi) gridApi.setGridOption('loading', false);
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

function switchTab(tabName) {
    // Security Check: Enforce tab interception guard clause
    const allowedTabs = ['assignments', 'discussions', 'announcements', 'pages', 'quizzes', 'new_quizzes', 'modules', 'files', 'standards_sync'];
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

        currentTab = tabName;

        const gridEl = document.getElementById('myGrid');
        const panelEl = document.getElementById('standardsSyncPanel');
        if (tabName === 'standards_sync') {
            if (gridEl) gridEl.style.display = 'none';
            if (panelEl) panelEl.style.display = 'block';
            loadStandardsSyncTab();
        } else {
            if (gridEl) gridEl.style.display = '';
            if (panelEl) panelEl.style.display = 'none';
        }

        const mergeMenuItem = document.getElementById('mergeMenuItem');
        if (mergeMenuItem) mergeMenuItem.style.display = (tabName === 'modules') ? 'block' : 'none';
        const timeLimitMenuItem = document.getElementById('timeLimitMenuItem');
        if (timeLimitMenuItem) timeLimitMenuItem.style.display = (tabName === 'quizzes') ? 'block' : 'none';
        const allowedAttemptsMenuItem = document.getElementById('allowedAttemptsMenuItem');
        if (allowedAttemptsMenuItem) allowedAttemptsMenuItem.style.display = (tabName === 'quizzes') ? 'block' : 'none';
        const allowRatingMenuItem = document.getElementById('allowRatingMenuItem');
        if (allowRatingMenuItem) allowRatingMenuItem.style.display = (tabName === 'discussions') ? 'block' : 'none';
        updatePointsUiLabels(tabName);

        if (tabName !== 'standards_sync' && typeof loadTabData === 'function') {
            loadTabData(tabName);
        }
    }
}

// Tab Interception System
let tabInterceptionEnabled = true;

function handleTabClick(event) {
    const tab = event.currentTarget;
    const tabName = tab.getAttribute('data-tab');
    
    const allowedTabs = ['assignments', 'discussions', 'announcements', 'pages', 'quizzes', 'new_quizzes', 'modules', 'files', 'standards_sync'];
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

// Initialize tab interception system
document.addEventListener('DOMContentLoaded', function() {
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
    const profileEl = document.getElementById('accProfileContent');
    const outcomesEl = document.getElementById('accOutcomesContent');
    if (!selectedCourseId) {
        if (profileEl) profileEl.innerHTML = '<p>Select a course to view the accreditation profile.</p>';
        if (outcomesEl) outcomesEl.innerHTML = '<p>Select a course to view outcomes.</p>';
        return;
    }
    if (profileEl) profileEl.innerHTML = '<div class="acc-card-loading" style="padding: 2rem;"><div class="acc-card-spinner" style="width: 32px; height: 32px;"></div><span style="margin-left: 0.5rem;">Loading profile...</span></div>';
    if (outcomesEl) outcomesEl.innerHTML = '<div class="acc-card-loading" style="padding: 2rem;"><div class="acc-card-spinner" style="width: 32px; height: 32px;"></div><span style="margin-left: 0.5rem;">Loading outcomes...</span></div>';
    const getEffectiveCip = () => {
        const progEl = document.getElementById('accProgram');
        const focusEl = document.getElementById('accProgramFocus');
        const programCip4 = progEl?.value?.trim() || '';
        const focusChecked = focusEl ? Array.from(focusEl.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).filter(Boolean) : [];
        return (focusChecked[0] || programCip4) || '';
    };
    const refreshAccreditorsStandards = async (keepSelections) => {
        if (!selectedCourseId || !outcomesEl) return;
        const cip = getEffectiveCip();
        if (!cip) return;
        const block = outcomesEl.querySelector('.acc-standards-block');
        if (!block) return;
        const listEl = document.getElementById('accStandardsList');
        const prevChecked = keepSelections && listEl ? new Set(Array.from(listEl.querySelectorAll('input[name="accStd"]:checked')).map(cb => cb.value)) : new Set();
        try {
            const url = `/canvas/courses/${selectedCourseId}/accreditation/accreditors?cip=${encodeURIComponent(cip)}`;
            const res = await fetch(url);
            const data = res.ok ? await res.json() : {};
            const list = Array.isArray(data?.accreditors) ? data.accreditors : (Array.isArray(data) ? data : []);
            const source = data?.source || 'stub';
            const sourceBanner = source === 'lookup_service' ? '<div class="acc-source-notice">Accreditation standards loaded from database</div>' : '';
            const hint = '<p class="acc-standards-hint">Select standards to apply to this course.</p>';
            const checkboxesHtml = list.length ? list.map(a => {
                const id = (a.id || a.name || '').toString();
                const label = escapeHtml((a.abbreviation ? a.abbreviation + ' — ' : '') + (a.name || id));
                const checked = prevChecked.has(id) ? ' checked' : '';
                return '<label class="acc-focus-check"><input type="checkbox" name="accStd" value="' + escapeHtml(id) + '"' + checked + '> ' + label + '</label>';
            }).join('') : '';
            const inner = list.length
                ? '<h4 class="acc-standards-heading">Accreditation standards for this course</h4>' + sourceBanner + hint + '<div id="accStandardsList" class="acc-program-focus">' + checkboxesHtml + '</div>' + '<button type="button" class="primary-btn" onclick="applyAccreditationStandards()" style="margin-top: 0.75rem;">Apply to course</button>'
                : '<h4 class="acc-standards-heading">Accreditation standards for this course</h4>' + sourceBanner + '<p class="acc-no-focus">No accreditation standards found for this program focus. Select a different program or focus above.</p>';
            block.innerHTML = inner;
        } catch (_) {}
    };
    const loadProfile = async () => {
        if (!profileEl) return null;
        try {
            const res = await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`);
            if (!res.ok) throw new Error(res.statusText);
            const profile = await res.json();
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
                    focusEl.innerHTML = accSpinnerHtml();
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
    const loadOutcomes = async (profile) => {
        if (!outcomesEl) return;
        const cip = (Array.isArray(profile?.programFocusCip6) && profile.programFocusCip6[0]) || profile?.programCip4 || profile?.program || '';
        try {
            const accreditorsUrl = `/canvas/courses/${selectedCourseId}/accreditation/accreditors${cip ? '?cip=' + encodeURIComponent(cip) : ''}`;
            const [accreditorsRes, outcomesRes] = await Promise.all([
                fetch(accreditorsUrl),
                fetch(`/canvas/courses/${selectedCourseId}/accreditation/outcomes`)
            ]);
            const accreditorsPayload = accreditorsRes.ok ? await accreditorsRes.json() : {};
            const accreditorsList = Array.isArray(accreditorsPayload?.accreditors) ? accreditorsPayload.accreditors : (Array.isArray(accreditorsPayload) ? accreditorsPayload : []);
            const accreditorsSource = accreditorsPayload?.source || 'stub';
            const outcomes = outcomesRes.ok ? await outcomesRes.json() : [];
            const selectedIds = Array.isArray(profile?.selectedStandards) ? profile.selectedStandards : [];
            const sourceBanner = accreditorsSource === 'lookup_service' ? '<div class="acc-source-notice">Accreditation standards loaded from database</div>' : '';
            const standardsHtml = '<div class="acc-standards-block">' +
                '<h4 class="acc-standards-heading">Accreditation standards for this course</h4>' +
                sourceBanner +
                (accreditorsList.length ? (
                    '<p class="acc-standards-hint">Select standards to apply to this course.</p>' +
                    '<div id="accStandardsList" class="acc-program-focus">' +
                    accreditorsList.map(a => {
                        const id = (a.id || a.name || '').toString();
                        const label = escapeHtml((a.abbreviation ? a.abbreviation + ' — ' : '') + (a.name || id));
                        const checked = selectedIds.includes(id) ? ' checked' : '';
                        return '<label class="acc-focus-check"><input type="checkbox" name="accStd" value="' + escapeHtml(id) + '"' + checked + '> ' + label + '</label>';
                    }).join('') +
                    '</div>' +
                    '<button type="button" class="primary-btn" onclick="applyAccreditationStandards()" style="margin-top: 0.75rem;">Apply to course</button>'
                ) : (
                    '<p class="acc-no-focus">Set Program in the Accreditation Profile above, then save. If the accreditation lookup service is running, standards for your program will appear here.</p>'
                )) +
                '</div>';
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
            outcomesEl.innerHTML = standardsHtml + '<div class="acc-outcomes-block" style="margin-top: 1.5rem;">' + outcomesHtml + '</div>';
        } catch (e) {
            outcomesEl.innerHTML = '<p style="color:#c62828;">Failed to load: ' + escapeHtml(e.message) + '</p>';
        }
    };
    const profile = await loadProfile();
    await loadOutcomes(profile);
}

async function onAccStateChange() {
    const stateEl = document.getElementById('accState');
    const cityWrap = document.getElementById('accCityWrap');
    const instWrap = document.getElementById('accInstWrap');
    const progWrap = document.getElementById('accProgWrap');
    const focusEl = document.getElementById('accProgramFocus');
    if (!stateEl || !cityWrap) return;
    cityWrap.innerHTML = accSpinnerHtml();
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
    instWrap.innerHTML = accSpinnerHtml();
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
    progWrap.innerHTML = accSpinnerHtml();
    if (focusEl) focusEl.innerHTML = 'Select program first';
    const schoolId = instEl.value;
    if (!schoolId) {
        progWrap.innerHTML = '<select id="accProgram" disabled><option value="">Select institution first</option></select>';
        document.getElementById('accProgram').onchange = onAccProgramChange;
        return;
    }
    try {
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
    focusEl.innerHTML = accSpinnerHtml();
    if (!cip4) {
        focusEl.innerHTML = 'Select program first';
        return;
    }
    try {
        const res = await fetch('/college-scorecard/cip6-options?cip4=' + encodeURIComponent(cip4));
        const data = await res.json();
        const opts = data && data.options ? data.options : [];
        if (!opts.length) {
            focusEl.innerHTML = '<span class="acc-no-focus">No specializations for this program</span>';
        } else {
            focusEl.innerHTML = opts.map(o => '<label class="acc-focus-check"><input type="checkbox" value="' + escapeHtml(o.code) + '"> ' + escapeHtml(o.code + ' - ' + (o.title || '')) + '</label>').join('');
        }
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
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="acc-card-loading" style="display: inline-flex; align-items: center; gap: 0.35rem;"><span class="acc-card-spinner" style="width: 16px; height: 16px;"></span>Saving...</span>';
    }
    try {
        const res = await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile })
        });
        if (!res.ok) throw new Error(res.statusText);
        loadStandardsSyncTab();
        if (typeof openModal === 'function') openModal('profileSavedModal');
    } catch (e) {
        alert('Save failed: ' + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml || 'Save Profile';
        }
    }
}

async function applyAccreditationStandards() {
    if (!selectedCourseId) return;
    const checkboxes = document.querySelectorAll('#accStandardsList input[name="accStd"]:checked');
    const selectedStandards = Array.from(checkboxes).map(cb => cb.value);
    try {
        const getRes = await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`);
        if (!getRes.ok) throw new Error(getRes.statusText);
        const profile = await getRes.json();
        profile.selectedStandards = selectedStandards;
        const putRes = await fetch(`/canvas/courses/${selectedCourseId}/accreditation/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile })
        });
        if (!putRes.ok) throw new Error(putRes.statusText);
        loadStandardsSyncTab();
        if (typeof openModal === 'function') openModal('profileSavedModal');
    } catch (e) {
        alert('Apply failed: ' + e.message);
    }
}

function accSpinnerHtml() {
    return '<div class="acc-card-loading"><div class="acc-card-spinner"></div><span>Loading...</span></div>';
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
        
        // Show the native spinner immediately
        if (gridApi) {
            gridApi.showLoadingOverlay();
            var initialText = document.getElementById('custom-loading-text');
            if (initialText) initialText.innerHTML = "Fetching " + displayTab + " 1 to 100...";
        }

        var progressInterval = setInterval(function() {
            var textElement = document.getElementById('custom-loading-text');
            if (textElement) {
                var start = (currentBatch * batchSize) + 1;
                var end = (currentBatch + 1) * batchSize;
                textElement.innerHTML = "Fetching " + displayTab + " " + start + " to " + end + "...";
            }
            currentBatch++;
        }, 2000);

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

        clearInterval(progressInterval);

        if (!response.ok) {
            if (gridApi) gridApi.hideOverlay();
            var errText = '';
            try { errText = await response.text(); } catch (_) {}
            var errMsg = errText ? (errText.slice(0, 300) + (errText.length > 300 ? '...' : '')) : response.statusText;
            alert('Failed to load ' + displayTab + ': ' + response.status + ' ' + errMsg);
            return;
        }

        var data = await response.json();
        if (!Array.isArray(data)) {
            if (gridApi) gridApi.hideOverlay();
            alert('Failed to load ' + displayTab + ': unexpected response format');
            return;
        }
        var dataWithStatus = data.map(function(item) { 
            return Object.assign({}, item, { _edit_status: 'synced' }); 
        });
        
        originalData[tabName] = dataWithStatus;

        if (currentTab === tabName && gridApi) {
            setGridColumnDefsForTab(tabName);
            gridApi.setGridOption('rowData', dataWithStatus);
            gridApi.hideOverlay();
        }
    } catch (error) {
        if (typeof progressInterval !== 'undefined') clearInterval(progressInterval);
        if (gridApi) gridApi.hideOverlay();
    }
}

function trackChange(tabName, itemId, fieldName, value) {
    CanvasHelpers.trackChange(changes, tabName, itemId, fieldName, value);
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
    if (!gridApi) return;
    gridApi.forEachNode(gridNode => {
        if (gridNode.data === rowData) {
            gridNode.setDataValue(field, value);
            gridNode.setDataValue('_edit_status', 'modified');
            trackChange(currentTab, rowData.id || rowData.url, field, value);
        }
    });
}

function applyGridCellChangeToNode(gridNode, field, value) {
    gridNode.setDataValue(field, value);
    gridNode.setDataValue('_edit_status', 'modified');
    trackChange(currentTab, gridNode.data.id || gridNode.data.url, field, value);
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

async function syncChanges() {
    if (!selectedCourseId) return alert('Select course first.');
    const tabChanges = changes[currentTab] || {};
    const itemIds = Object.keys(tabChanges);
    const newItemIds = itemIds.filter(id => String(id).startsWith('TEMP_'));
    const updateItemIds = itemIds.filter(id => !String(id).startsWith('TEMP_'));
    if (!itemIds.length) return alert('No changes.');

    const configKey = getConfigKey(currentTab);
    const config = FIELD_DEFINITIONS[configKey];
    if (!config) return alert('Invalid tab.');
    const endpoint = config.endpoint;

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
                if (created) {
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
                } else {
                    throw new Error('Create returned no data');
                }
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

    const updatePromises = updateItemIds.map(async (itemId) => {
        const updates = { ...tabChanges[itemId] };
        delete updates._isNew;
        if (currentTab === 'files') {
            gridApi.forEachNode(node => {
                if (String(node.data?.id) === String(itemId) && node.data?.is_folder)
                    updates.isFolder = true;
            });
        }
        const pathSegment = config.usesSlugIdentifier ? encodeURIComponent(itemId) : itemId;
        const url = `/canvas/courses/${selectedCourseId}/${endpoint}/${pathSegment}`;
        debugLog('[Sync] Request: ' + currentTab + ' ' + itemId + ' PUT ' + url + ' payload=' + JSON.stringify(updates), 'info');
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const rawText = await response.text();
            let errMsg = response.statusText;
            try {
                const errBody = rawText ? JSON.parse(rawText) : {};
                const msg = errBody.message ?? errBody.error;
                if (typeof msg === 'string') errMsg = msg;
                else if (msg != null) errMsg = JSON.stringify(msg);
                else errMsg = rawText || errMsg;
            } catch (_) {
                if (rawText) errMsg = rawText.slice(0, 1000);
            }
            debugLog(
                '[Sync] HTTP FAILED: item=' + itemId +
                ' tab=' + currentTab +
                ' status=' + response.status +
                ' endpoint=' + url +
                ' payload=' + JSON.stringify(updates) +
                ' response=' + (rawText ? rawText.slice(0, 1000) : ''),
                'error'
            );
            throw new Error(errMsg);
        }
        return { itemId, updates };
    });
    const updateResults = await Promise.allSettled(updatePromises);
    const redrawNodes = [];
    updateResults.forEach((result, i) => {
        const itemId = updateItemIds[i];
        if (result.status === 'fulfilled') {
            const { updates } = result.value;
            gridApi.forEachNode(node => {
                const nodeId = node.data.id || node.data.url;
                if (String(nodeId) === String(itemId)) {
                    node.setDataValue('_edit_status', 'synced');
                    redrawNodes.push(node);
                    if (originalData[currentTab]) {
                        const originalRow = originalData[currentTab].find(item => String(item.id || item.url) === String(itemId));
                        if (originalRow) Object.keys(updates).forEach(fieldKey => originalRow[fieldKey] = updates[fieldKey]);
                    }
                }
            });
            delete changes[currentTab][itemId];
        } else {
            debugLog('[Sync] Return: ' + itemId + ' FAILED - ' + (result.reason?.message || result.reason), 'error');
            let label = itemId;
            gridApi.forEachNode(nd => {
                if (String(nd.data?.id || nd.data?.url) === String(itemId)) label = nd.data?.name ?? nd.data?.title ?? itemId;
            });
            errors.push({ itemId, label, message: result.reason?.message || String(result.reason) });
        }
    });
    if (redrawNodes.length) gridApi.redrawRows({ rowNodes: redrawNodes });

    if (errors.length) {
        debugLog('[Sync] Summary FAILED count=' + errors.length + ' details=' + JSON.stringify(errors).slice(0, 3000), 'error');
        alert(`Sync failed for ${errors.length} item(s):\n\n${errors.map(e => `• ${e.label}: ${e.message}`).join('\n')}`);
        return;
    }
    alert('Sync completed.');
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
    selectEl.innerHTML = '<option value="">Loading...</option>';
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
            const res = await fetch('/canvas/courses/' + selectedCourseId + '/assignment_groups');
            if (res.ok) {
                const agData = await res.json();
                groups = {};
                agData.forEach(g => { groups[g.id] = g.name; });
                assignmentGroupsCache[selectedCourseId] = groups;
            }
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
    getBulkTargetRowData(true).forEach(rowData => applyGridCellChange(rowData, fieldKey, targetGroupId));
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
    getBulkTargetRowData(true).forEach(rowData => applyGridCellChange(rowData, targetColumn, newValue));
    gridApi.redrawRows();
    closeActiveModal();
}

function executeSearchReplace() {
    const targetColumn = document.getElementById('srColumnTarget').value;
    const searchText = document.getElementById('srSearchInput').value;
    const replaceText = document.getElementById('srReplaceInput').value;
    const useRegex = document.getElementById('srUseRegex').checked;
    if (!searchText || !gridApi) return;
    getBulkTargetRowData(true).forEach(rowData => {
        const currentValue = rowData[targetColumn];
        if (currentValue && typeof currentValue === 'string') {
            let updatedValue;
            if (useRegex) {
                try { updatedValue = currentValue.replace(new RegExp(searchText, 'g'), replaceText); }
                catch { return; }
            } else updatedValue = currentValue.split(searchText).join(replaceText);
            if (updatedValue !== currentValue) applyGridCellChange(rowData, targetColumn, updatedValue);
        }
    });
    gridApi.redrawRows();
    closeActiveModal();
}

function executeInsertPaste() {
    const targetColumn = document.getElementById('ipColumnTarget').value;
    const textToInsert = document.getElementById('ipTextInput').value;
    const position = document.querySelector('input[name="ipPosition"]:checked')?.value;
    const marker = document.getElementById('ipMarkerInput').value;
    if (!gridApi) return;
    getBulkTargetRowData(true).forEach(rowData => {
        const currentValue = rowData[targetColumn] || "";
        let updatedValue = currentValue;
        if (position === 'start') updatedValue = textToInsert + currentValue;
        else if (position === 'end') updatedValue = currentValue + textToInsert;
        else if (marker && currentValue.includes(marker)) {
            const parts = currentValue.split(marker);
            updatedValue = position === 'beforeMarker' ? (parts[0] + textToInsert + marker + parts.slice(1).join(marker)) : (parts[0] + marker + textToInsert + parts.slice(1).join(marker));
        }
        if (updatedValue !== currentValue) applyGridCellChange(rowData, targetColumn, updatedValue);
    });
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
    nodesToUpdate.forEach(rowData => applyGridCellChange(rowData, 'published', publishValue));
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
    rowNodes.forEach(gridNode => {
        const rowData = gridNode.data;
        if (!rowData) return;
        const rowId = rowData.id || rowData.url;
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
                newDateValue = DateUtils.formatForCanvas(dateObj);
            } else if (currentValue) {
                const currentDate = new Date(currentValue);
                if (!isNaN(currentDate.getTime())) {
                    const shiftedDate = new Date(currentDate);
                    shiftedDate.setDate(shiftedDate.getDate() + offsetDaysNum);
                    if (timeOverride) { const [hours, mins] = timeOverride.split(':'); shiftedDate.setHours(parseInt(hours, 10) || 0, parseInt(mins, 10) || 0, 0, 0); }
                    newDateValue = DateUtils.formatForCanvas(shiftedDate);
                }
            } else if (offsetDaysNum !== 0) {
                const baseDate = new Date();
                baseDate.setDate(baseDate.getDate() + offsetDaysNum);
                if (timeOverride) { const [hours, mins] = timeOverride.split(':'); baseDate.setHours(parseInt(hours, 10) || 0, parseInt(mins, 10) || 0, 0, 0); }
                else baseDate.setHours(23, 59, 0, 0);
                if (field === 'unlock_at') baseDate.setHours(baseDate.getHours() - 1, baseDate.getMinutes(), 0, 0);
                else if (field === 'lock_at') baseDate.setHours(baseDate.getHours() + 1, baseDate.getMinutes(), 0, 0);
                newDateValue = DateUtils.formatForCanvas(baseDate);
            }
            if (isClearMode || newDateValue !== null) {
                applyGridCellChangeToNode(gridNode, field, newDateValue);
                const readBack = gridNode.data[field];
                refreshedNodes.push({ node: gridNode, field });
            }
        });
    });
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
    if (op === 'remove') {
        nodesToUpdate.forEach(rowData => applyGridCellChange(rowData, 'time_limit', null));
    } else {
        if (op === 'set' && (isNaN(val) || val < 0)) { alert('Enter valid duration (hours and minutes).'); return; }
        if (op === 'add' && (isNaN(val) || val < 0)) { alert('Enter valid duration to add.'); return; }
        nodesToUpdate.forEach(rowData => {
            const current = rowData.time_limit;
            const curNum = (current != null && current !== '') ? Math.max(0, parseInt(Number(current), 10) || 0) : 0;
            let newVal = op === 'set' ? val : curNum + val;
            if (newVal < 0) newVal = 0;
            if (op === 'set' && newVal === 0) newVal = null;
            applyGridCellChange(rowData, 'time_limit', newVal);
        });
    }
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
    selectedRows.forEach(rowData => {
        const currentValue = parseFloat(rowData[targetField]) || 0;
        let finalValue = operation === 'set' ? pointsValue : operation === 'scale' ? currentValue * pointsValue : currentValue + pointsValue;
        const pointsResult = Number(finalValue.toFixed(2));
        applyGridCellChange(rowData, targetField, pointsResult);
    });
    gridApi.redrawRows();
    closeActiveModal();
}

function executeAllowedAttemptsUpdate() {
    const op = document.getElementById('allowedAttemptsOp')?.value;
    const valueInput = document.getElementById('allowedAttemptsValue');
    if (!gridApi) return;
    const nodesToUpdate = getBulkTargetRowData(true);
    if (!nodesToUpdate.length) { alert('Select rows or filter to target.'); return; }
    if (op === 'unlimited') {
        nodesToUpdate.forEach(rowData => applyGridCellChange(rowData, 'allowed_attempts', -1));
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
            applyGridCellChange(rowData, 'allowed_attempts', newVal);
        });
    }
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
    nodesToUpdate.forEach(rowData => applyGridCellChange(rowData, 'allow_rating', allowRating));
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
        try {
            if (gridApi) {
                gridApi.showLoadingOverlay();
                var ltf = document.getElementById('custom-loading-text');
                if (ltf) ltf.textContent = (method === 'deep') ? 'Deep cloning folders...' : 'Cloning folder shells...';
            }
            await executeFilesFolderClone(method, selectedRows, prefix, suffix, numCopies, serialize);
            await refreshCurrentTab();
        } finally {
            if (gridApi) gridApi.hideOverlay();
        }
    } else if (currentTab === 'modules' && method === 'deep') {
        try {
            if (gridApi) {
                gridApi.showLoadingOverlay();
                var lt = document.getElementById('custom-loading-text');
                if (lt) lt.textContent = 'Cloning modules...';
            }
            for (const rowData of selectedRows) await performDeepClone(rowData, prefix, rowData.name || rowData.title, suffix);
        } finally {
            if (gridApi) gridApi.hideOverlay();
        }
    } else if (method === 'deep') {
        try {
            if (gridApi) {
                gridApi.showLoadingOverlay();
                var lt2 = document.getElementById('custom-loading-text');
                if (lt2) lt2.textContent = 'Cloning...';
            }
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
        } finally {
            if (gridApi) gridApi.hideOverlay();
        }
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
    const courseId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!courseId) { alert('No course.'); return; }
    try {
        const deleteBtn = document.querySelector('.modal-footer .btn-danger');
        if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.textContent = 'Deleting...'; }
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
    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    } finally {
        const deleteBtn = document.querySelector('.modal-footer .btn-danger');
        if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.textContent = 'Delete'; }
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
        if (mergeBtn) {
            mergeBtn.disabled = true;
            mergeBtn.textContent = 'Merging...';
        }

        // Get current target items count for position numbering
        const targetItemsResponse = await fetch(`/canvas/courses/${courseId}/modules/${targetModuleId}/items`);
        if (!targetItemsResponse.ok) throw new Error('Failed to fetch target module items');
        const targetItems = await targetItemsResponse.json();
        let nextPosition = targetItems.length + 1;

        // Copy items from each source module to target
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

        // Update target module name
        const updateResponse = await fetch(`/canvas/courses/${courseId}/modules/${targetModuleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: { name: combinedName } })
        });
        if (!updateResponse.ok) console.warn('Failed to update module name');

        // Delete source modules
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

    } catch (error) {
        console.error('Merge error:', error);
        alert(`Merge failed: ${error.message}\n\nSome changes may have been applied. Please refresh to see current state.`);
    } finally {
        const mergeBtn = document.querySelector('#mergeModal .primary-btn');
        if (mergeBtn) {
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Confirm Merge';
        }
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
    const response = await fetch(`/canvas/courses/${courseId}/${endpoint}/${pathSegment}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: extraBody ? JSON.stringify(extraBody) : undefined
    });
    if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        try { errorDetail = JSON.parse(errorText); } catch { errorDetail = { message: errorText }; }
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

// Application Mode Management
let currentAppMode = localStorage.getItem('appMode') || 'demo';

function initializeAppMode() {
    applyAppMode(currentAppMode);
}

function applyAppMode(mode) {
    currentAppMode = mode;
    localStorage.setItem('appMode', mode);

    const debugPanel = document.getElementById('debugPanel');

    switch(mode) {
        case 'developer':
            // All tabs active, debug panel visible
            tabInterceptionEnabled = false;
            if (debugPanel) debugPanel.style.display = 'block';
            break;

        case 'production':
            // All tabs active, debug panel hidden
            tabInterceptionEnabled = false;
            if (debugPanel) debugPanel.style.display = 'none';
            break;

        case 'demo':
        default:
            // Only assignments tab active, debug panel hidden
            tabInterceptionEnabled = true;
            if (debugPanel) debugPanel.style.display = 'none';
            break;
    }

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
    location.reload(); // Reload to apply changes
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
