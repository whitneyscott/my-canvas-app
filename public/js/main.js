async function init() {
    debugLog("Initializing Application...");

    try {
        // 1. Ask the server: "What is my current status?"
        const response = await fetch('/auth/status');
        const status = await response.json();

        debugLog(`Status received: NeedsToken=${status.needsToken}`);

        // 2. Decide: Show the login box OR load the data
        if (status.needsToken) {
            document.getElementById('token-overlay').style.display = 'flex';
            debugLog("Token required. Showing overlay.");
        } else {
            debugLog("Authentication valid. Loading courses...");
            await loadCourses(); // This calls your existing course loader
        }
    } catch (err) {
        debugLog("Error during initialization: " + err.message);
        console.error("Init failed:", err);
    }
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

let gridApi, currentTab = 'assignments', originalData = {}, changes = {}, selectedCourseId = null;

class CustomHeader {
    init(params) {
        this.params = params;
        this.eGui = document.createElement('div');
        this.eGui.style.cssText = 'display: flex; align-items: center; justify-content: space-between; width: 100%;';

        this.eGui.innerHTML = `
            <span class="header-label" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${params.displayName}</span>
            <span class="header-hide-btn" style="cursor: pointer; padding: 0 4px; font-size: 14px; font-weight: bold; color: #888; margin-left: 4px;">&times;</span>
        `;

        this.btnHide = this.eGui.querySelector('.header-hide-btn');
        this.btnHide.onclick = (event) => {
            event.stopPropagation();
            const colId = this.params.column.getColId();
            this.params.api.setColumnsVisible([colId], false);
        };
    }

    getGui() {
        return this.eGui;
    }
}

const gridOptions = {
    rowSelection: {
        mode: 'multiRow',
        selectAll: 'filtered',
        headerCheckbox: true,
        checkboxes: true,
        enableClickSelection: false
    },
    defaultColDef: {
        flex: 1,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        sortable: true,
        resizable: true,
        editable: true,
        unSortIcon: true,
        singleClickEdit: true,
        headerComponent: CustomHeader
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
    onGridReady: params => {
        window.gridApi = params.api;
        gridApi = params.api;
    },
    overlayLoadingTemplate: 
        '<div class="ag-overlay-loading-wrapper">' +
        '  <div class="ag-overlay-loading-center">' +
        '    <span class="ag-icon ag-icon-loading" style="font-size: 24px;"></span>' + 
        '    <span id="custom-loading-text" style="margin-left: 10px; font-weight: bold;">Loading...</span>' +
        '  </div>' +
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

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = LTI_COURSE_ID || urlParams.get('courseId') || urlParams.get('course_id');
    
    if (courseId && courseId !== '') {
        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect) {
            courseSelect.value = courseId;
            selectedCourseId = courseId;
            debugLog(`Course context detected: ${courseId}`, 'info');
            
            if (typeof onCourseSelected === 'function') {
                onCourseSelected();
            }
        }
    } else {
        switchTab(currentTab || 'assignments');
    }
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
    const tabConfig = FIELD_DEFINITIONS[tabName];
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

    const idCol = {
        headerName: 'ID',
        field: 'id',
        width: 100,
        editable: false,
        hide: false,
        pinned: 'left'
    };

    const allColumns = [statusCol, idCol, ...mapping];
    debugLog(`Returning ${allColumns.length} total columns (status + id + ${mapping.length} data columns)`);

    return allColumns;
}

async function refreshCurrentTab() {
    if (!selectedCourseId) { alert('Select course first.'); return; }
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

        courseSelect.innerHTML = '<option value="">Loading courses...</option>';
        debugLog('Fetching courses from /canvas/courses');

        const response = await fetch('/canvas/courses');
        
        if (response.status === 401) {
            debugLog('Session expired or token invalid. Redirecting to auth.', 'warn');
            const overlay = document.getElementById('token-overlay');
            if (overlay) overlay.style.display = 'flex';
            return;
        }

        if (!response.ok) {
            debugLog(`ERROR: Failed to load courses: ${response.status} ${response.statusText}`, 'error');
            console.error('Failed to load courses:', response.status, response.statusText);
            courseSelect.innerHTML = '<option value="">Error loading courses</option>';
            return;
        }

        const courseGroups = await response.json();
        debugLog(`Received ${Array.isArray(courseGroups) ? courseGroups.length : 0} course groups`);
        
        if (!Array.isArray(courseGroups)) {
            debugLog('ERROR: Expected array of course groups', 'error');
            console.error('Expected array of course groups, got:', courseGroups);
            courseSelect.innerHTML = '<option value="">Error loading courses</option>';
            return;
        }

        courseSelect.innerHTML = '<option value="">Select a course...</option>';

        if (courseGroups.length === 0) {
            debugLog('No courses available', 'warn');
            courseSelect.innerHTML = '<option value="">No courses available</option>';
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
        debugLog(`Loaded ${totalCourses} courses successfully`, 'success');
    } catch (error) {
        debugLog(`ERROR in loadCourses: ${error.message}`, 'error');
        console.error('Error loading courses:', error);
        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect) courseSelect.innerHTML = '<option value="">Error loading courses</option>';
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
        if (gridApi) gridApi.setGridOption('rowData', []);
        return;
    }
    
    selectedCourseId = courseId;
    debugLog(`selectedCourseId set to: ${selectedCourseId}`, 'success');
    
    const url = new URL(window.location);
    url.searchParams.set('course_id', courseId);
    window.history.pushState({}, '', url);
    
    originalData = {};
    debugLog('Cleared originalData, calling switchTab');
    switchTab(currentTab);
}

function switchTab(tabName) {
    const allTabs = document.querySelectorAll('.tab-btn');
    
    allTabs.forEach(tab => {
        const isTarget = tab.getAttribute('onclick').includes(tabName);
        tab.classList.toggle('active', isTarget);
        tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    currentTab = tabName;
    debugLog(`Switched to ${tabName} view`, 'info');
    
    if (typeof loadTabData === 'function') {
        loadTabData(tabName);
    }
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
        var dataWithStatus = data.map(function(item) { 
            return Object.assign({}, item, { _edit_status: 'synced' }); 
        });
        
        originalData[tabName] = dataWithStatus;

        if (currentTab === tabName && gridApi) {
            if (tabName === 'assignments' || tabName === 'quizzes') {
                gridApi.setGridOption('columnDefs', generateColumnDefs(tabName));
            }
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

    for (const itemId in tabChanges) {
        const updates = tabChanges[itemId];
        const url = `/canvas/courses/${selectedCourseId}/${endpoint}/${itemId}`;
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
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
                if (rowNodes.length) {
                    gridApi.redrawRows({ rowNodes: rowNodes });
                }
                delete changes[currentTab][itemId];
            }
        } catch (error) { 
            console.error(error); 
        }
    }
    alert('Sync completed.');
}
async function handleDeleteClick() {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) { alert("Select at least one item."); return; }

    if (currentTab === 'modules') {
        for (const module of selectedItems) {
            try {
                const response = await fetch(`/canvas/modules/${selectedCourseId}/${module.id}/items`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Frontend] Failed to fetch items: ${response.status}`, errorText);
                    module.items = [];
                    continue;
                }
                const itemsList = await response.json();
                module.items = Array.isArray(itemsList) ? itemsList : [];
            } catch (error) {
                console.error(`Error fetching items for module ${module.id}:`, error);
                module.items = [];
            }
        }

        const infoDiv = document.getElementById('moduleItemsList');
        if (infoDiv) {
            infoDiv.innerHTML = '';
            selectedItems.forEach(module => {
                const itemCount = Array.isArray(module.items) ? module.items.length : 0;
                const div = document.createElement('div');
                div.style.marginBottom = '8px';
                div.style.padding = '6px';
                div.style.background = itemCount > 0 ? '#e8f5e9' : '#fff3cd';
                div.style.borderLeft = '3px solid ' + (itemCount > 0 ? '#4caf50' : '#ffc107');
                div.innerHTML = `<strong>${module.name || 'Unnamed Module'}</strong>: <span style="font-weight: bold; color: ${itemCount > 0 ? '#2e7d32' : '#856404'}">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>`;
                infoDiv.appendChild(div);
            });
        }
        openModal('deepPurgeModal');
        document.getElementById('deepPurgeConfirmInput').value = '';
        document.getElementById('purgeMethod').value = 'standard';
    } else {
        openModal('deleteModal');
        document.getElementById('deleteConfirmInput').value = '';
    }
}

function handleOverlayClick(event) {
    if (event.target.id === 'modalOverlay') closeActiveModal();
}

function populateColumnSelector() {
    const container = document.getElementById('columnListContainer');
    if (!container || !gridApi) return;
    container.innerHTML = '';
    const columnDefinitions = gridApi.getColumnDefs();

    const selectAllRow = document.createElement('div');
    selectAllRow.className = 'checkbox-group';
    selectAllRow.style.cssText = 'flex-direction:row;justify-content:space-between;padding:8px 12px;margin-bottom:10px;border-bottom:2px solid #eee';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.textContent = 'Select All / None';
    selectAllLabel.style.fontWeight = 'bold';

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.checked = columnDefinitions.every(colDef => {
        const column = gridApi.getColumn(colDef.colId || colDef.field);
        return column ? column.isVisible() : true;
    });

    selectAllCheckbox.onchange = (event) => {
        container.querySelectorAll('.col-toggle-input').forEach(checkbox => checkbox.checked = event.target.checked);
    };

    selectAllRow.append(selectAllLabel, selectAllCheckbox);
    container.appendChild(selectAllRow);

    columnDefinitions.forEach((colDef) => {
        const id = colDef.colId || colDef.field;
        if (id === '_edit_status' || id === 'id') return;
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
    if (!selectElement || !gridApi) return;
    selectElement.innerHTML = '';
    gridApi.getColumnDefs().forEach(colDef => {
        const id = colDef.colId || colDef.field;
        if (colDef.headerName && id && id !== '_edit_status' && id !== 'id') {
            const option = document.createElement('option');
            option.value = id;
            option.innerText = colDef.headerName;
            selectElement.appendChild(option);
        }
    });
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
            if (gridNode.data === rowData) gridNode.setDataValue(targetColumn, newValue);
        });
    });
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
                    if (gridNode.data === rowData) gridNode.setDataValue(targetColumn, updatedValue);
                });
            }
        }
    });
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
                if (gridNode.data === rowData) gridNode.setDataValue(targetColumn, updatedValue);
            });
        }
    });
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
            if (gridNode.data === rowData) gridNode.setDataValue('published', publishValue);
        });
    });
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
                    if (gridNode.data === rowData) gridNode.setDataValue(field, newDateValue);
                });
            }
        });
    });
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
        gridApi.forEachNode(gridNode => {
            if (gridNode.data === rowData) gridNode.setDataValue(targetField, Number(finalValue.toFixed(2)));
        });
    });
    closeActiveModal();
}

async function executeClone() {
    const selectedRows = gridApi.getSelectedRows();
    const method = document.getElementById('cloneMethod').value;
    const prefix = document.getElementById('clonePrefix').value || '';
    const suffix = document.getElementById('cloneSuffix').value || '';
    if (currentTab === 'modules' && method === 'deep') {
        for (const rowData of selectedRows) await performDeepClone(rowData, prefix, suffix);
    } else if (method === 'deep') {
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
                await deleteCanvasItem(type, courseId, identifier);
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
    const exclusionSet = new Set(systemRestrictedFields);

    if (tabConfig.fields) {
        tabConfig.fields.forEach(field => { if (field.editable === false) exclusionSet.add(field.key || field.name); });
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

async function performDeepClone(moduleRecord, prefix, suffix) {
    if (!selectedCourseId) { alert('No course.'); return; }
    try {
        const response = await fetch(`/canvas/courses/${selectedCourseId}/modules?per_page=100`);
        const allModules = response.ok ? await response.json() : [];
        const existingNames = new Set(allModules.map(m => m.name));
        const newModuleName = getUniqueName(moduleRecord.name || moduleRecord.title || "Module", existingNames, prefix, suffix);
        const newModule = await createModules(selectedCourseId, newModuleName);
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
                        const uniqueItemName = getUniqueName(originalFullObject.name || originalFullObject.title || "Item", new Set(), prefix, suffix);
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
        await refreshCurrentTab();
    } catch (error) { alert(`Cloning failed: ${error.message}`); }
}

const getNewName = (record, prefix, suffix, existingSet = new Set()) => getUniqueName(record.display_name || record.name || record.title || "Untitled", existingSet, prefix, suffix);

async function createDeepContent(itemType, sanitizedParams) {
    if (itemType === 'Assignment') return await createAssignments(selectedCourseId, sanitizedParams);
    if (itemType === 'Quiz') return await createQuizzes(selectedCourseId, sanitizedParams);
    if (itemType === 'Page') return await createPages(selectedCourseId, sanitizedParams);
    if (itemType === 'Discussion') return await createDiscussions(selectedCourseId, sanitizedParams);
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
    const response = await fetch(`/canvas/courses/${courseId}/discussion_topics`, {
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

const createModules = async (courseId, moduleName) => {
    const response = await fetch(`/canvas/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: { name: moduleName } })
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

async function deleteCanvasItem(type, courseId, identifier) {
    let configKey = type;
    if (!FIELD_DEFINITIONS[configKey] && type === 'discussions') configKey = 'discussion_topics';
    const config = FIELD_DEFINITIONS[configKey];
    const endpoint = config ? config.endpoint : type;
    const response = await fetch(`/canvas/${endpoint}/${courseId}/${identifier}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
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
    const response = await fetch(`/canvas/courses/${courseId}/modules/${moduleItem.id}/full-delete`, {
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