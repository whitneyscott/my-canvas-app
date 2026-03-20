async function init() {
    debugLog("Initializing Application...");
    const tokenOverlay = document.getElementById('token-overlay');
    const oauthOverlay = document.getElementById('oauth-overlay');
    const wrapper = document.getElementById('main-app-wrapper');

    try {
        const response = await fetch('/auth/status');
        const status = await response.json();

        if (status && status.needsToken === true) {
            debugLog(status.needsOAuth ? "Status: Canvas OAuth required" : "Status: Manual token required");
            if (wrapper) wrapper.style.display = 'none';
            if (status.needsOAuth) {
                if (oauthOverlay) oauthOverlay.style.display = 'flex';
                if (tokenOverlay) tokenOverlay.style.display = 'none';
            } else {
                if (oauthOverlay) oauthOverlay.style.display = 'none';
                if (tokenOverlay) tokenOverlay.style.display = 'flex';
            }
        } else {
            debugLog("Status: Access Granted");
            if (oauthOverlay) oauthOverlay.style.display = 'none';
            if (tokenOverlay) tokenOverlay.style.display = 'none';
            if (wrapper) wrapper.style.display = 'block';
            await loadCourses();
        }
    } catch (err) {
        debugLog("Init Error: " + err.message);
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
            debugLog("Credentials saved. Reloading app...");
            location.reload();
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        debugLog("Login error: " + err.message);
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
let assignmentGroupsCache = {};

const FIELD_DEFINITIONS = window.FIELD_DEFINITIONS || window.CANVAS_CONFIG?.FIELD_DEFINITIONS || {};

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
    
    console.log(`%c[${type.toUpperCase()}] ${message}`, `color: ${typeColors[type]}`);
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
    const btn = document.querySelector('.debug-copy-btn');
    if (btn) {
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = prev; }, 1500);
    }
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

const gridOptions = {
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
            params.node.setDataValue('_edit_status', 'modified');
            trackChange(currentTab, params.data.id || params.data.url, params.colDef.field, params.newValue);
            params.api.redrawRows({ rowNodes: [params.node] });
        }
    },
    // Additional event handler to catch programmatic changes
    onRowDataUpdated: params => {
        if (!gridApi || currentTab === 'files') return;
        let configKey = currentTab;
        if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';
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
        const internalColumns = ['_edit_status', 'id', 'uuid', 'created_at', 'updated_at', 'items_count', 'html_url', 'url', 'workflow_state', 'publish_at', 'course_id', 'context_type', 'context_id', 'lti_context_id', 'global_id', 'secure_params', 'original_lti_resource_link_id', 'items_url', 'locked_for_user', 'lock_info', 'lock_explanation', 'permissions', 'submission', 'overrides', 'all_dates', 'can_duplicate'];
        
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
const LTI_COURSE_ID = '<%= courseId %>';

document.addEventListener('DOMContentLoaded', async () => {
    debugLog('=== Canvas Manager Initializing ===');

    if (NEEDS_TOKEN) {
        debugLog('Authentication required. Showing overlay.', 'warn');
        return;
    }
    
    const gridDiv = document.querySelector('#myGrid');
    if (gridDiv) {
        gridApi = agGrid.createGrid(gridDiv, gridOptions);
    }

    await loadCourses();
    if (!selectedCourseId && gridApi) gridApi.showNoRowsOverlay();
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
    debugLog(`Generating column definitions for: ${tabName}`);
    let configKey = tabName;
    if (!FIELD_DEFINITIONS[configKey] && tabName === 'discussions') configKey = 'discussion_topics';
    const tabConfig = FIELD_DEFINITIONS[configKey];
    if (!tabConfig) {
        debugLog(`ERROR: No config found for tab: ${tabName}`);
        return [];
    }

    const defs = tabConfig.fields;
    debugLog(`Found ${defs.length} field definitions: ${defs.map(f => f.key).join(', ')}`);

    const statusCol = {
        headerName: 'edit_status',
        field: '_edit_status',
        width: 120,
        minWidth: 90,
        sortable: true,
        editable: false,
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

        if (field.type === 'assignment_group_dropdown') {
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
        else if (field.type === 'date') {
            colDef.comparator = (a, b) => {
                const dA = a ? new Date(a).getTime() : 0;
                const dB = b ? new Date(b).getTime() : 0;
                return isNaN(dA) && isNaN(dB) ? 0 : (isNaN(dA) ? 1 : isNaN(dB) ? -1 : dA - dB);
            };
            colDef.cellEditor = 'agDateCellEditor';
            colDef.cellEditorParams = {
                format: 'yyyy-MM-ddTHH:mm:ss',
                min: new Date(1900, 0, 1),
            };
            colDef.valueFormatter = params => {
                if (!params.value) return '';
                const date = new Date(params.value);
                if (isNaN(date.getTime())) return params.value;
                return date.toISOString().slice(0, 19);
            };
            colDef.valueParser = params => {
                if (!params.newValue) return null;
                const date = new Date(params.newValue);
                if (isNaN(date.getTime())) return params.newValue;
                return date.toISOString();
            };
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
        return colDef;
    });

    if (tabName === 'files') {
        mapping.unshift({
            headerName: 'Type',
            field: 'is_folder',
            sortable: true,
            editable: false,
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
        width: 100,
        minWidth: 70,
        sortable: true,
        editable: false,
        hide: false,
        pinned: 'left'
    };

    const allColumns = [statusCol, idCol, ...mapping];
    debugLog(`Returning ${allColumns.length} total columns (status + id + ${mapping.length} data columns)`);

    return allColumns;
}

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

        let configKey = currentTab;
        if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';

        const tabConfig = FIELD_DEFINITIONS[configKey];
        if (!tabConfig) { throw new Error(`No config for: ${currentTab}`); }

        const response = await fetch(`/canvas/courses/${selectedCourseId}/${tabConfig.endpoint}`);
        const data = await response.json();
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
    debugLog('loadCourses() called');
    try {
        const courseSelect = document.getElementById('courseSelect');
        if (!courseSelect) {
            debugLog('ERROR: courseSelect element not found', 'error');
            return;
        }

        courseSelect.innerHTML = '<option value="">Select a Course</option>';
        debugLog('Fetching courses from /canvas/courses');

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
        debugLog(`Received ${Array.isArray(courseGroups) ? courseGroups.length : 0} course groups`);
        
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

        debugLog(`SUCCESS: Loaded ${totalCourses} courses successfully`, 'success');

        const urlParams = new URLSearchParams(window.location.search);
        const autoCourseId = (typeof LTI_COURSE_ID !== 'undefined' ? LTI_COURSE_ID : null) || urlParams.get('courseId') || urlParams.get('course_id') || (window.SERVER_DATA && window.SERVER_DATA.courseId);
        const validId = autoCourseId && autoCourseId !== 'null' && autoCourseId !== '' && autoCourseId !== 'undefined' && autoCourseId !== '<%= courseId %>';
        const hasOption = validId && Array.from(courseSelect.options).some(opt => opt.value === String(autoCourseId));

        if (validId && hasOption) {
            debugLog(`Auto-selecting course context: ${autoCourseId}`);
            courseSelect.value = autoCourseId;
            if (typeof onCourseSelected === 'function') onCourseSelected();
        } else {
            const firstOpt = Array.from(courseSelect.options).find(opt => opt.value && opt.value !== '');
            if (firstOpt) {
                courseSelect.value = firstOpt.value;
                debugLog(`Defaulting to first course: ${firstOpt.value}`);
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
    debugLog('onCourseSelected() called');
    const courseSelect = document.getElementById('courseSelect');
    const courseId = courseSelect.value;
    debugLog(`Course selected: ${courseId}`);
    
    if (!courseId) {
        debugLog('No course ID, clearing data', 'warn');
        selectedCourseId = null;
        if (gridApi) {
            gridApi.setGridOption('rowData', []);
            gridApi.showNoRowsOverlay();
        }
        return;
    }
    
    selectedCourseId = courseId;
    debugLog(`selectedCourseId set to: ${selectedCourseId}`, 'success');
    
    // Update URL to match current selection without refreshing
    const url = new URL(window.location);
    url.searchParams.set('courseId', courseId);
    window.history.pushState({}, '', url);
    
    // Reset state and reload
    originalData = {};
    if (gridApi) gridApi.setGridOption('rowData', []);
    
    debugLog('Cleared originalData and Grid, calling switchTab');
    switchTab(currentTab);
}

function switchTab(tabName) {
    // Security Check: Enforce tab interception guard clause
    const allowedTabs = ['assignments', 'discussions', 'announcements', 'pages', 'quizzes', 'new_quizzes', 'modules', 'files', 'standards_sync'];
    if (tabInterceptionEnabled && !allowedTabs.includes(tabName)) {
        const message = 'Module Integration Pending: This feature is planned for a future development phase.';
        alert(message);
        debugLog(`Tab interception blocked: ${tabName}`, 'warn');
        
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
            const isTarget = tab.getAttribute('onclick').includes(previousTab);
            tab.classList.toggle('active', isTarget);
            tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        
        return false; // Stop execution immediately
    } else {
        // Normal tab switching logic for allowed tabs
        const allTabs = document.querySelectorAll('.tab-btn');
        
        allTabs.forEach(tab => {
            const isTarget = tab.getAttribute('onclick').includes(tabName);
            tab.classList.toggle('active', isTarget);
            tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });

        currentTab = tabName;
        debugLog(`Switched to ${tabName} view`, 'info');

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
        if (mergeMenuItem) {
            mergeMenuItem.style.display = (tabName === 'modules') ? 'block' : 'none';
        }

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
        
        // Log the interception
        debugLog(`Tab interception blocked: ${tabName}`, 'warn');
        
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
            const isTarget = tab.getAttribute('onclick').includes(previousTab);
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
    const status = tabInterceptionEnabled ? 'ENABLED' : 'DISABLED';
    debugLog(`Tab Interception: ${status}`, tabInterceptionEnabled ? 'warn' : 'info');
    
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
    
    debugLog('Tab Interception System Initialized', 'info');
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
            console.log('[Accreditation] refreshAccreditorsStandards fetching:', { cip, url });
            const res = await fetch(url);
            const data = res.ok ? await res.json() : {};
            const list = Array.isArray(data?.accreditors) ? data.accreditors : (Array.isArray(data) ? data : []);
            console.log('[Accreditation] refreshAccreditorsStandards response:', { cip, source: data?.source, count: list.length, accreditors: list });
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
            console.log('[Accreditation] loadOutcomes accreditors:', { cip, url: accreditorsUrl, source: accreditorsSource, count: accreditorsList.length, data: accreditorsList });
            if (typeof debugLog === 'function') debugLog('[Accreditation] Retrieved accreditors: ' + accreditorsSource + ', count=' + accreditorsList.length, 'info');
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
        if (typeof debugLog === 'function') debugLog('[AccProfile] Fetching cities: ' + url);
        const res = await fetch(url);
        const data = await res.json();
        if (typeof debugLog === 'function') debugLog('[AccProfile] Cities response: status=' + res.status);
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
    debugLog("loadTabData() called for: " + tabName);
    
    try {
        if (!selectedCourseId) return;

        var configKey = tabName;
        if (!FIELD_DEFINITIONS[configKey] && tabName === 'discussions') configKey = 'discussion_topics';

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

        if (tabName === 'assignments' || tabName === 'quizzes') {
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

        var dataUrl = "/canvas/courses/" + selectedCourseId + "/" + tabConfig.endpoint;
        var response = await fetch(dataUrl);

        clearInterval(progressInterval);

        if (!response.ok) {
            if (gridApi) gridApi.hideOverlay();
            return;
        }

        var data = await response.json();
        if (!Array.isArray(data)) {
            if (gridApi) gridApi.hideOverlay();
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
    if (!changes[tabName]) changes[tabName] = {};
    if (!changes[tabName][itemId]) changes[tabName][itemId] = {};
    changes[tabName][itemId][fieldName] = value;
}

async function syncChanges() {
    if (!selectedCourseId) return alert('Select course first.');
    const tabChanges = changes[currentTab];
    if (!tabChanges || !Object.keys(tabChanges).length) return alert('No changes.');

    let configKey = currentTab;
    if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';

    const config = FIELD_DEFINITIONS[configKey];
    if (!config) return alert('Invalid tab.');
    const endpoint = config.endpoint;

    const itemIds = Object.keys(tabChanges);
    debugLog('[Sync] Request: ' + itemIds.length + ' item(s) - ' + itemIds.join(', '), 'info');

    const errors = [];
    for (const itemId of itemIds) {
        const updates = { ...tabChanges[itemId] };
        if (currentTab === 'files') {
            gridApi.forEachNode(node => {
                if (String(node.data?.id) === String(itemId) && node.data?.is_folder)
                    updates.isFolder = true;
            });
        }
        const url = `/canvas/courses/${selectedCourseId}/${endpoint}/${itemId}`;
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                let errMsg = response.statusText;
                try {
                    const errBody = await response.json();
                    errMsg = errBody.message || errBody.error || errMsg;
                } catch (_) {
                    const text = await response.text();
                    if (text) errMsg = text.slice(0, 300);
                }
                throw new Error(errMsg);
            }

            const rowNodes = [];
            gridApi.forEachNode(node => {
                const nodeId = node.data.id || node.data.url;
                if (String(nodeId) === String(itemId)) {
                    node.setDataValue('_edit_status', 'synced');
                    rowNodes.push(node);
                    if (originalData[currentTab]) {
                        const originalRow = originalData[currentTab].find(item => String(item.id || item.url) === String(itemId));
                        if (originalRow) {
                            Object.keys(updates).forEach(fieldKey => originalRow[fieldKey] = updates[fieldKey]);
                        }
                    }
                }
            });
            if (rowNodes.length) gridApi.redrawRows({ rowNodes });
            delete changes[currentTab][itemId];
            debugLog('[Sync] Return: ' + itemId + ' OK', 'success');
        } catch (error) {
            console.error(error);
            debugLog('[Sync] Return: ' + itemId + ' FAILED - ' + (error.message || error), 'error');
            const label = (gridApi.getRowNode(String(itemId))?.data?.name ?? gridApi.getRowNode(String(itemId))?.data?.title ?? itemId) || itemId;
            errors.push({ itemId, label, message: error.message || String(error) });
        }
    }

    if (errors.length) {
        alert(`Sync failed for ${errors.length} item(s):\n\n${errors.map(e => `• ${e.label}: ${e.message}`).join('\n')}`);
        return;
    }
    debugLog('[Sync] Completed: all ' + itemIds.length + ' item(s) synced', 'success');
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
    let configKey = currentTab;
    if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';
    const tabConfig = FIELD_DEFINITIONS[configKey];
    if (!tabConfig?.fields) return;
    tabConfig.fields.forEach((field) => {
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
    let configKey = currentTab;
    if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';
    const tabConfig = FIELD_DEFINITIONS[configKey];
    if (!tabConfig) {
        container.innerHTML = '<div style="text-align:center;padding:10px;color:#666">Select valid tab</div>';
        return;
    }
    let matchCount = 0;
    tabConfig.fields.forEach(field => {
        if (field.type === 'date' && field.editable === true) {
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
        }
    });
    if (!matchCount) container.innerHTML = '<div style="text-align:center;padding:10px;color:#666">No date fields</div>';
}

function populateNumericColumnSelector(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
    selectElement.innerHTML = '';
    let configKey = currentTab;
    if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';
    const tabConfig = FIELD_DEFINITIONS[configKey];
    if (!tabConfig) return;
    tabConfig.fields.forEach(field => {
        if (field.type === 'number' || (field.key && field.key.toLowerCase().includes('points'))) {
            const option = document.createElement('option');
            option.value = field.key;
            option.textContent = field.label || field.key;
            selectElement.appendChild(option);
        }
    });
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
    else if (modalId === 'deleteModal') {
        const input = document.getElementById('deleteConfirmInput');
        if (input) {
            input.value = '';
            input.dataset.mode = (currentTab === 'modules') ? 'deep' : 'individual';
        }
    } else if (modalId === 'cloneModal') {
        const methodSelect = document.getElementById('cloneMethod');
        const isModuleTab = (currentTab === 'modules');
        if (methodSelect) {
            Array.from(methodSelect.options).forEach(option => {
                const isItemMode = (option.value === 'item');
                option.hidden = isModuleTab ? isItemMode : !isItemMode;
                option.disabled = isModuleTab ? isItemMode : !isItemMode;
            });
            methodSelect.value = isModuleTab ? 'structural' : 'item';
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
    let nodesToUpdate = gridApi.getSelectedRows();
    if (!nodesToUpdate.length) { nodesToUpdate = []; gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node.data)); }
    nodesToUpdate.forEach(rowData => {
        gridApi.forEachNode(gridNode => {
            if (gridNode.data === rowData) {
                gridNode.setDataValue(targetColumn, newValue);
                gridNode.setDataValue('_edit_status', 'modified');
                trackChange(currentTab, rowData.id || rowData.url, targetColumn, newValue);
            }
        });
    });
    gridApi.redrawRows();
    closeActiveModal();
}

function executeSearchReplace() {
    const targetColumn = document.getElementById('srColumnTarget').value;
    const searchText = document.getElementById('srSearchInput').value;
    const replaceText = document.getElementById('srReplaceInput').value;
    const useRegex = document.getElementById('srUseRegex').checked;
    if (!searchText || !gridApi) return;
    let nodesToUpdate = gridApi.getSelectedRows();
    if (!nodesToUpdate.length) { nodesToUpdate = []; gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node.data)); }
    nodesToUpdate.forEach(rowData => {
        const currentValue = rowData[targetColumn];
        if (currentValue && typeof currentValue === 'string') {
            let updatedValue;
            if (useRegex) {
                try { updatedValue = currentValue.replace(new RegExp(searchText, 'g'), replaceText); }
                catch { return; }
            } else updatedValue = currentValue.split(searchText).join(replaceText);
            if (updatedValue !== currentValue) {
                gridApi.forEachNode(gridNode => {
                    if (gridNode.data === rowData) {
                        // Use startEditing to trigger onCellValueChanged event
                        gridNode.setDataValue(targetColumn, updatedValue);
                        // Manually trigger edit status update since setDataValue might not trigger onCellValueChanged
                        gridNode.setDataValue('_edit_status', 'modified');
                        // Track the change
                        trackChange(currentTab, rowData.id || rowData.url, targetColumn, updatedValue);
                    }
                });
            }
        }
    });
    // Force redraw to show updated edit status
    gridApi.redrawRows();
    closeActiveModal();
}

function executeInsertPaste() {
    const targetColumn = document.getElementById('ipColumnTarget').value;
    const textToInsert = document.getElementById('ipTextInput').value;
    const position = document.querySelector('input[name="ipPosition"]:checked')?.value;
    const marker = document.getElementById('ipMarkerInput').value;
    if (!gridApi) return;
    let nodesToUpdate = gridApi.getSelectedRows();
    if (!nodesToUpdate.length) { nodesToUpdate = []; gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node.data)); }
    nodesToUpdate.forEach(rowData => {
        const currentValue = rowData[targetColumn] || "";
        let updatedValue = currentValue;
        if (position === 'start') updatedValue = textToInsert + currentValue;
        else if (position === 'end') updatedValue = currentValue + textToInsert;
        else if (marker && currentValue.includes(marker)) {
            const parts = currentValue.split(marker);
            updatedValue = position === 'beforeMarker' ? (parts[0] + textToInsert + marker + parts.slice(1).join(marker)) : (parts[0] + marker + textToInsert + parts.slice(1).join(marker));
        }
        if (updatedValue !== currentValue) {
            gridApi.forEachNode(gridNode => {
                if (gridNode.data === rowData) {
                    gridNode.setDataValue(targetColumn, updatedValue);
                    gridNode.setDataValue('_edit_status', 'modified');
                    trackChange(currentTab, rowData.id || rowData.url, targetColumn, updatedValue);
                }
            });
        }
    });
    gridApi.redrawRows();
    closeActiveModal();
}

function executePublishStatus() {
    if (!gridApi) return;
    const selectedStatus = document.querySelector('input[name="pubStatus"]:checked')?.value;
    if (!selectedStatus) return;
    const publishValue = selectedStatus === 'true';
    let nodesToUpdate = gridApi.getSelectedRows();
    if (!nodesToUpdate.length) { nodesToUpdate = []; gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node.data)); }
    if (!nodesToUpdate.length) { alert('No rows.'); return; }
    nodesToUpdate.forEach(rowData => {
        gridApi.forEachNode(gridNode => {
            if (gridNode.data === rowData) {
                gridNode.setDataValue('published', publishValue);
                gridNode.setDataValue('_edit_status', 'modified');
                trackChange(currentTab, rowData.id || rowData.url, 'published', publishValue);
            }
        });
    });
    gridApi.redrawRows();
    closeActiveModal();
}

function executeDateShift() {
    if (!gridApi) return;
    const offsetDays = parseInt(document.getElementById('dateOffsetDays').value) || 0;
    const timeOverride = document.getElementById('timeOverride').value;
    const manualDate = document.getElementById('manualFixedDate').value;
    const selectedDateColumns = Array.from(document.querySelectorAll('.date-col-checkbox:checked')).map(checkbox => checkbox.value);
    if (!selectedDateColumns.length) { alert('Select date columns.'); return; }
    let nodesToUpdate = gridApi.getSelectedRows();
    if (!nodesToUpdate.length) { nodesToUpdate = []; gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node.data)); }
    nodesToUpdate.forEach(rowData => {
        selectedDateColumns.forEach(field => {
            const currentValue = rowData[field];
            let newDateValue = null;
            if (manualDate) {
                const dateObj = new Date(manualDate);
                if (timeOverride) { const [hours, mins] = timeOverride.split(':'); dateObj.setHours(parseInt(hours), parseInt(mins), 0, 0); }
                newDateValue = dateObj.toISOString();
            } else if (currentValue) {
                const currentDate = new Date(currentValue);
                if (!isNaN(currentDate.getTime())) {
                    const shiftedDate = new Date(currentDate);
                    shiftedDate.setDate(shiftedDate.getDate() + offsetDays);
                    if (timeOverride) { const [hours, mins] = timeOverride.split(':'); shiftedDate.setHours(parseInt(hours), parseInt(mins), 0, 0); }
                    newDateValue = shiftedDate.toISOString();
                }
            } else if (offsetDays !== 0) {
                const baseDate = new Date();
                baseDate.setDate(baseDate.getDate() + offsetDays);
                if (timeOverride) { const [hours, mins] = timeOverride.split(':'); baseDate.setHours(parseInt(hours), parseInt(mins), 0, 0); }
                newDateValue = baseDate.toISOString();
            }
            if (newDateValue !== null) {
                gridApi.forEachNode(gridNode => {
                    if (gridNode.data === rowData) {
                        gridNode.setDataValue(field, newDateValue);
                        gridNode.setDataValue('_edit_status', 'modified');
                        trackChange(currentTab, rowData.id || rowData.url, field, newDateValue);
                    }
                });
            }
        });
    });
    gridApi.redrawRows();
    closeActiveModal();
}

function executePointsUpdate() {
    const targetField = document.getElementById('pointsColumnTarget').value;
    const operation = document.getElementById('pointsOp').value;
    const pointsValue = parseFloat(document.getElementById('pointsValue').value);
    const selectedRows = gridApi.getSelectedRows();
    if (!selectedRows.length) { alert("Select rows."); return; }
    if (isNaN(pointsValue)) { alert("Enter valid number."); return; }
    selectedRows.forEach(rowData => {
        const currentValue = parseFloat(rowData[targetField]) || 0;
        let finalValue = operation === 'set' ? pointsValue : operation === 'scale' ? currentValue * pointsValue : currentValue + pointsValue;
        const pointsResult = Number(finalValue.toFixed(2));
        gridApi.forEachNode(gridNode => {
            if (gridNode.data === rowData) {
                gridNode.setDataValue(targetField, pointsResult);
                gridNode.setDataValue('_edit_status', 'modified');
                trackChange(currentTab, rowData.id || rowData.url, targetField, pointsResult);
            }
        });
    });
    gridApi.redrawRows();
    closeActiveModal();
}

async function executeClone() {
    const selectedRows = gridApi.getSelectedRows();
    const method = document.getElementById('cloneMethod').value;
    const prefix = document.getElementById('clonePrefix').value || '';
    const suffix = document.getElementById('cloneSuffix').value || '';
    if (currentTab === 'modules' && method === 'deep') {
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
            let configKey = currentTab;
            if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';
            const tabConfig = FIELD_DEFINITIONS[configKey];
            for (const rowData of selectedRows) {
                const endpoint = tabConfig.endpoint;
                const itemIdentifier = (currentTab === 'pages') ? (rowData.url || rowData.page_url) : rowData.id;
                const response = await fetch(`/canvas/courses/${selectedCourseId}/${endpoint}/${itemIdentifier}`);
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
        const newItems = selectedRows.map(rowData => {
            let clonedCopy = prepareUIClone(rowData, currentTab, prefix, suffix);
            if (currentTab === 'modules') clonedCopy.items = method === 'structural' ? [] : (rowData.items || []).map(item => ({ ...item }));
            return clonedCopy;
        });
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
                const identifier = (type === 'pages') ? (item.url || item.page_url) : item.id;
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
    let configKey = tabType;
    if (!FIELD_DEFINITIONS[configKey] && tabType === 'discussions') configKey = 'discussion_topics';
    const tabConfig = FIELD_DEFINITIONS[configKey];
    if (!tabConfig) return {};

    if (method === 'sync') {
        const dataFields = tabConfig.fields;
        const changedData = {};
        const pristineData = rowData._pristine || {};
        dataFields.forEach(field => {
            const key = field.key;
            const value = rowData[key];
            if (value !== undefined && value !== null && value !== '' && JSON.stringify(value) !== JSON.stringify(pristineData[key])) {
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
            let itemParams = { title: item.title, type: itemType, position: item.position, indent: item.indent };
            if (contentType === 'subheader' || contentType === 'externalurl') {
                if (contentType === 'externalurl') itemParams.external_url = item.external_url;
                newContent = { id: 'no-content-needed' };
            } else {
                let apiEndpoint = '';
                if (itemType === 'Assignment') apiEndpoint = 'assignments';
                else if (itemType === 'Quiz') apiEndpoint = 'quizzes';
                else if (itemType === 'Page') apiEndpoint = 'pages';
                else if (itemType === 'Discussion') apiEndpoint = 'discussions';
                if (apiEndpoint) {
                    const contentIdentifier = (itemType === 'Page') ? (item.page_url || item.content_id) : item.content_id;
                    const contentResponse = await fetch(`/canvas/courses/${selectedCourseId}/${apiEndpoint}/${contentIdentifier}`);
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

async function createDeepContent(itemType, sanitizedParams) {
    if (itemType === 'Assignment') return await createAssignments(selectedCourseId, sanitizedParams);
    if (itemType === 'Quiz') return await createQuizzes(selectedCourseId, sanitizedParams);
    if (itemType === 'Page') return await createPages(selectedCourseId, sanitizedParams);
    if (itemType === 'Discussion') return await createDiscussions(selectedCourseId, sanitizedParams);
    if (itemType === 'Announcement') return await createAnnouncements(selectedCourseId, sanitizedParams);
    if (itemType === 'Folder') return await createFolders(selectedCourseId, sanitizedParams);
    return null;
}

function prepareUIClone(row, type, prefix, suffix) {
    let rowCopy = JSON.parse(JSON.stringify(row));
    let uniqueName = getNewName(rowCopy, prefix, suffix);
    if (rowCopy.display_name !== undefined) rowCopy.display_name = uniqueName;
    if (rowCopy.name !== undefined) rowCopy.name = uniqueName;
    if (rowCopy.title !== undefined) rowCopy.title = uniqueName;
    let clonedContent = sanitizeRowData(rowCopy, type, 'clone');
    clonedContent.id = `TEMP_${Math.random().toString(36).substr(2, 9)}`;
    clonedContent.isNew = true;
    clonedContent.syncStatus = 'New';
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

async function createFolders(courseId, params) {
    const response = await fetch(`/canvas/courses/${courseId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return response.ok ? await response.json() : null;
}

const createModules = async (courseId, moduleName, position) => {
    const body = { module: { name: moduleName } };
    if (position != null) body.module.position = position;
    const response = await fetch(`/canvas/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
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
    let configKey = type;
    if (!FIELD_DEFINITIONS[configKey] && type === 'discussions') configKey = 'discussion_topics';
    const config = FIELD_DEFINITIONS[configKey];
    const endpoint = config ? config.endpoint : type;
    const response = await fetch(`/canvas/courses/${courseId}/${endpoint}/${identifier}`, {
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
        delete originalData['assignments'];
        if (changes['assignments']) changes['assignments'] = {};
        await refreshCurrentTab();
        if (currentTab !== 'assignments') {
            const response = await fetch(`/canvas/courses/${selectedCourseId}/${FIELD_DEFINITIONS['assignments'].endpoint}`);
            const data = await response.json();
            originalData['assignments'] = data.map(record => ({ ...record, _edit_status: 'synced' }));
        }
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
    debugLog(`Application mode initialized: ${currentAppMode}`, 'info');
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
            debugLog('Developer Mode: All tabs active, debug panel visible', 'success');
            break;

        case 'production':
            // All tabs active, debug panel hidden
            tabInterceptionEnabled = false;
            if (debugPanel) debugPanel.style.display = 'none';
            debugLog('Production Mode: All tabs active, debug panel hidden', 'info');
            break;

        case 'demo':
        default:
            // Only assignments tab active, debug panel hidden
            tabInterceptionEnabled = true;
            if (debugPanel) debugPanel.style.display = 'none';
            debugLog('Demo Mode: Only Assignments tab active', 'warn');
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
