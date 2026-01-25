let assignmentGroupsCache = {};

const FIELD_DEFINITIONS = window.FIELD_DEFINITIONS || window.CANVAS_CONFIG?.FIELD_DEFINITIONS || {};

function debugLog(message, type = 'info') {
    const content = document.getElementById('debugContent');
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `debug-log ${type}`;
    logEntry.textContent = `[${time}]${type !== 'info' ? ' ' + type.toUpperCase() + ':' : ''} ${message}`;
    content.appendChild(logEntry);
    content.scrollTop = content.scrollHeight;
    console.log(`[${type.toUpperCase()}]`, message);
}

function toggleDebugPanel() {
    const panel = document.getElementById('debugPanel');
    const toggle = document.getElementById('debugToggle');
    panel.classList.toggle('collapsed');
    toggle.textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
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
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    debugLog('=== Canvas Manager Initializing ===');
    debugLog(`FIELD_DEFINITIONS available: ${Object.keys(FIELD_DEFINITIONS).length > 0}`);
    debugLog(`FIELD_DEFINITIONS tabs: ${Object.keys(FIELD_DEFINITIONS).join(', ')}`);

    const tabContainer = document.querySelector('.tab-container');
    if (tabContainer) {
        tabContainer.innerHTML = '';
        Object.keys(FIELD_DEFINITIONS).forEach(tabKey => {
            const config = FIELD_DEFINITIONS[tabKey];
            const button = document.createElement('button');
            button.className = 'tab-btn';
            button.textContent = config.displayName;
            button.dataset.tab = tabKey;
            button.onclick = () => switchTab(tabKey);
            tabContainer.appendChild(button);
        });
        debugLog(`Tabs created: ${Object.keys(FIELD_DEFINITIONS).length}`);
    }

    const gridDiv = document.querySelector('#myGrid');
    gridApi = agGrid.createGrid(gridDiv, gridOptions);

    await loadCourses();

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course_id');
    if (courseId) {
        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect) {
            courseSelect.value = courseId;
            selectedCourseId = courseId;
            switchTab('assignments');
        }
    }
});

function switchTab(tabName) {
    debugLog(`Switching to tab: ${tabName}`);
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    if (gridApi) {
        gridApi.setFilterModel(null);
        const columnDefs = generateColumnDefs(tabName);
        debugLog(`Generated ${columnDefs.length} column definitions for ${tabName}`);
        debugLog(`Column definitions: ${columnDefs.map(col => col.headerName || col.field).join(', ')}`);

        gridApi.setGridOption('columnDefs', columnDefs);
        gridApi.setGridOption('rowData', originalData[tabName] || []);

        setTimeout(() => {
            gridApi.sizeColumnsToFit();
            if (tabName === 'students') gridApi.resetRowHeights();

            const visibleColumns = gridApi.getColumns();
            debugLog(`Visible columns after render: ${visibleColumns ? visibleColumns.length : 0}`);
            if (visibleColumns) {
                debugLog(`Column visibility: ${visibleColumns.map(col => col.getColId() + ':' + col.isVisible()).join(', ')}`);
            }
        }, 100);
    }
    if (!originalData[tabName]) loadTabData(tabName);
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
                btn.className = `btn-toggle ${isTrue ? 'active' : 'inactive'}`;
                btn.textContent = isTrue ? (field.activeLabel || 'Active') : (field.inactiveLabel || 'Inactive');
                btn.onclick = () => {
                    const newValue = !isTrue;
                    params.node.setDataValue(field.key, newValue);
                };
                return btn;
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

        const tabContainer = FIELD_DEFINITIONS[configKey];
        if (!tc) { throw new Error(`No config for: ${currentTab}`); }

        const response = await fetch(`/canvas/courses/${selectedCourseId}/${tc.endpoint}`);
        const data = await r.json();
        const ds = d.map(x => ({ ...x, _edit_status: 'synced' }));
        originalData[currentTab] = ds;

        if (gridApi) {
            gridApi.setGridOption('rowData', ds);
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
        const mc = document.getElementById('markerInputContainer');
        if (mc) mc.style.display = (event.target.value === 'beforeMarker' || event.target.value === 'afterMarker') ? 'block' : 'none';
    }
});

async function loadCourses() {
    try {
        const courseSelect = document.getElementById('courseSelect');
        if (!s) return;

        s.innerHTML = '<option value="">Loading courses...</option>';

        const response = await fetch('/canvas/courses');
        if (!r.ok) {
            console.error('Failed to load courses:', r.status, r.statusText);
            s.innerHTML = '<option value="">Error loading courses</option>';
            return;
        }

        const g = await r.json();
        if (!Array.isArray(g)) {
            console.error('Expected array of course groups, got:', g);
            s.innerHTML = '<option value="">Error loading courses</option>';
            return;
        }

        s.innerHTML = '<option value="">Select a course...</option>';

        if (g.length === 0) {
            s.innerHTML = '<option value="">No courses available</option>';
            return;
        }

        g.forEach(x => {
            if (!x.term || !Array.isArray(x.courses)) return;
            const og = document.createElement('optgroup');
            og.label = x.term;
            x.courses.forEach(c => {
                if (!c.id) return;
                const o = document.createElement('option');
                o.value = c.id;
                o.textContent = `${c.name || c.course_code || 'Untitled'} (${c.course_code || 'No Code'})`;
                og.appendChild(o);
            });
            if (og.children.length > 0) {
                s.appendChild(og);
            }
        });
    } catch (event) {
        console.error('Error loading courses:', event);
        const courseSelect = document.getElementById('courseSelect');
        if (s) s.innerHTML = '<option value="">Error loading courses</option>';
    }
}

function onCourseSelected() {
    const select = document.getElementById('courseSelect'), cId = s.value;
    if (!cId) {
        selectedCourseId = null;
        if (gridApi) gridApi.setGridOption('rowData', []);
        return;
    }
    selectedCourseId = cId;
    const u = new URL(window.location);
    u.searchParams.set('course_id', cId);
    window.history.pushState({}, '', u);
    originalData = {};
    switchTab(currentTab);
}

async function loadTabData(tabName) {
    try {
        if (!selectedCourseId) return;

        let configKey = n;
        if (!FIELD_DEFINITIONS[configKey] && n === 'discussions') configKey = 'discussion_topics';

        const tabContainer = FIELD_DEFINITIONS[configKey];
        if (!tc) { console.error(`No config for: ${n}`); return; }

        if (currentTab === n && gridApi) gridApi.setGridOption('loading', true);

        if (n === 'assignments' || n === 'quizzes') {
            try {
                const agUrl = `/canvas/courses/${selectedCourseId}/assignment_groups`;
                const agResponse = await fetch(agUrl);

                if (!agResponse.ok) {
                    console.error('[Assignment Groups] Failed to fetch:', agResponse.status);
                    assignmentGroupsCache[selectedCourseId] = {};
                } else {
                    const agData = await agResponse.json();
                    assignmentGroupsCache[selectedCourseId] = {};
                    agData.forEach(group => {
                        assignmentGroupsCache[selectedCourseId][group.id] = group.name;
                    });
                }
            } catch (agError) {
                console.error('[Assignment Groups] Error:', agError);
                assignmentGroupsCache[selectedCourseId] = {};
            }
        }

        const response = await fetch(`/canvas/courses/${selectedCourseId}/${tc.endpoint}`);

        if (!r.ok) {
            console.error(`Failed to load ${n}: ${r.status} ${r.statusText}`);
            if (currentTab === n && gridApi) gridApi.setGridOption('loading', false);
            return;
        }

        const data = await r.json();

        if (!Array.isArray(d)) {
            console.error(`Expected array for ${n}, got:`, d);
            if (currentTab === n && gridApi) gridApi.setGridOption('loading', false);
            return;
        }

        const ds = d.map(x => ({ ...x, _edit_status: 'synced' }));
        originalData[tabName] = ds;

        if (currentTab === n && gridApi) {
            if (n === 'assignments' || n === 'quizzes') {
                gridApi.setGridOption('columnDefs', generateColumnDefs(tabName));
            }

            gridApi.setGridOption('rowData', ds);
            gridApi.setGridOption('loading', false);

            if (tabName === 'students') setTimeout(() => gridApi.resetRowHeights(), 100);

            if (n === 'assignments' || n === 'quizzes') {
                gridApi.refreshCells({ force: true });
            }
        }
    } catch (event) {
        console.error(`Error loading ${n}:`, event);
        if (currentTab === n && gridApi) gridApi.setGridOption('loading', false);
    }
}

function trackChange(tabName, itemId, fieldName, value) {
    if (!changes[tabName]) changes[tabName] = {};
    if (!changes[tabName][itemId]) changes[tabName][itemId] = {};
    changes[tabName][itemId][fieldName] = value;
}

async function syncChanges() {
    if (!selectedCourseId) return alert('Select course first.');
    const tabContainer = changes[currentTab];
    if (!tc || !Object.keys(tc).length) return alert('No changes.');

    let configKey = currentTab;
    if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';

    const cfg = FIELD_DEFINITIONS[configKey];
    if (!cfg) return alert('Invalid tab.');
    const ep = cfg.endpoint;

    for (const iId in tc) {
        const u = tc[iId], url = `/canvas/courses/${selectedCourseId}/${ep}/${iId}`;
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(u)
            });

            if (r.ok) {
                const rn = [];
                gridApi.forEachNode(n => {
                    const nId = n.data.id || n.data.url;
                    if (String(nId) === String(iId)) {
                        n.setDataValue('_edit_status', 'synced');
                        rn.push(n);
                        if (originalData[currentTab]) {
                            const or = originalData[currentTab].find(x => String(x.id || x.url) === String(iId));
                            if (or) Object.keys(u).forEach(f => or[f] = u[f]);
                        }
                    }
                });
                if (rn.length) gridApi.redrawRows({ rowNodes: rn });
                delete changes[currentTab][iId];
            }
        } catch (event) { console.error(event); }
    }
    alert('Sync completed.');
}

async function handleDeleteClick() {
    const sel = getSelectedItems();
    if (!sel.length) { alert("Select at least one item."); return; }

    if (currentTab === 'modules') {
        for (const m of sel) {
            try {
                const response = await fetch(`/canvas/modules/${selectedCourseId}/${m.id}/items`);

                if (!r.ok) {
                    const errorText = await r.text();
                    console.error(`[Frontend] Failed to fetch items: ${r.status} ${r.statusText}`, errorText);
                    m.items = [];
                    continue;
                }

                const its = await r.json();

                if (!Array.isArray(its)) {
                    console.error(`[Frontend] Expected array, got:`, typeof its, its);
                    m.items = [];
                    continue;
                }
                m.items = its;
            } catch (event) {
                console.error(`Error fetching items for module ${m.id}:`, event);
                m.items = [];
            }
        }

        const infoDiv = document.getElementById('moduleItemsList');
        if (infoDiv) {
            infoDiv.innerHTML = '';
            sel.forEach(m => {
                const itemCount = Array.isArray(m.items) ? m.items.length : 0;
                const div = document.createElement('div');
                div.style.marginBottom = '8px';
                div.style.padding = '6px';
                div.style.background = itemCount > 0 ? '#e8f5e9' : '#fff3cd';
                div.style.borderLeft = '3px solid ' + (itemCount > 0 ? '#4caf50' : '#ffc107');
                div.innerHTML = `<strong>${m.name || 'Unnamed Module'}</strong>: <span style="font-weight: bold; color: ${itemCount > 0 ? '#2e7d32' : '#856404'}">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>`;
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
    const colDefs = gridApi.getColumnDefs();

    const selectAllRow = document.createElement('div');
    selectAllRow.className = 'checkbox-group';
    selectAllRow.style.cssText = 'flex-direction:row;justify-content:space-between;padding:8px 12px;margin-bottom:10px;border-bottom:2px solid #eee';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.textContent = 'Select All / None';
    selectAllLabel.style.fontWeight = 'bold';

    const selectAllCb = document.createElement('input');
    selectAllCb.type = 'checkbox';
    selectAllCb.checked = colDefs.every(cd => {
        const col = gridApi.getColumn(cd.colId || cd.field);
        return col ? col.isVisible() : true;
    });

    selectAllCb.onchange = (event) => {
        container.querySelectorAll('.col-toggle-input').forEach(cb => cb.checked = event.target.checked);
    };

    selectAllRow.append(selectAllLabel, selectAllCb);
    container.appendChild(selectAllRow);

    colDefs.forEach((cd) => {
        const id = cd.colId || cd.field;

        if (id === '_edit_status' || id === 'id') return;

        const row = document.createElement('div');
        row.className = 'checkbox-group';
        row.style.cssText = 'flex-direction:row;justify-content:space-between;padding:8px 12px;margin-bottom:5px';

        const label = document.createElement('label');
        label.textContent = cd.headerName || id;
        label.style.fontWeight = '500';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'col-toggle-input';
        cb.value = id;

        const liveCol = gridApi.getColumn(id);
        cb.checked = liveCol ? liveCol.isVisible() : true;

        row.append(label, cb);
        container.appendChild(row);
    });
}

function populateColumnDropdown(sId) {
    const select = document.getElementById(sId);
    if (!s || !gridApi) {
        console.error('Dropdown population failed: Element or GridApi missing');
        return;
    }

    s.innerHTML = '';

    gridApi.getColumnDefs().forEach(c => {
        const id = c.colId || c.field;
        if (c.headerName && id && id !== '_edit_status' && id !== 'id') {
            const o = document.createElement('option');
            o.value = id;
            o.innerText = c.headerName;
            s.appendChild(o);
        }
    });
}

function populateMergeSelector() {
    const select = document.getElementById('mergeTargetSelect');
    if (!s || !gridApi) return;
    s.innerHTML = '';
    const sr = gridApi.getSelectedRows();
    if (sr.length < 2) {
        s.innerHTML = '<option>Select 2+ rows...</option>';
        return;
    }
    sr.forEach(r => {
        const o = document.createElement('option');
        o.value = r.id || r.url;
        o.innerText = r.name || r.title || r.display_name || o.value;
        s.appendChild(o);
    });
}

function populateDateColumnSelector() {
    const c = document.getElementById('dateColumnSelector');
    if (!c) { console.error('dateColumnSelector not found'); return; }
    c.innerHTML = '';

    let configKey = currentTab;
    if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';

    const tabContainer = FIELD_DEFINITIONS[configKey];
    if (!tc) {
        c.innerHTML = '<div style="text-align:center;padding:10px;color:#666">Select valid tab</div>';
        return;
    }

    let mc = 0;
    tc.fields.forEach(d => {
        if (d.type === 'date' && d.editable === true) {
            mc++;
            const response = document.createElement('div'), l = document.createElement('label'), cb = document.createElement('input');
            r.className = 'checkbox-group';
            r.style.cssText = 'flex-direction:row;justify-content:space-between;padding:8px 12px;margin-bottom:5px';
            l.textContent = d.label || d.key;
            l.style.fontWeight = '500';
            cb.type = 'checkbox';
            cb.className = 'date-col-checkbox';
            cb.value = d.key;
            cb.checked = true;
            r.append(l, cb);
            c.appendChild(r);
        }
    });
    if (!mc) c.innerHTML = '<div style="text-align:center;padding:10px;color:#666">No date fields</div>';
}

function populateNumericColumnSelector(sId) {
    const select = document.getElementById(sId);
    if (!s) return;
    s.innerHTML = '';

    let configKey = currentTab;
    if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';

    const tabContainer = FIELD_DEFINITIONS[configKey];
    if (!tc) return;

    tc.fields.forEach(d => {
        if (d.type === 'number' || (d.key && d.key.toLowerCase().includes('points'))) {
            const o = document.createElement('option');
            o.value = d.key;
            o.textContent = d.label || d.key;
            s.appendChild(o);
        }
    });
}

function openModal(mId) {
    const ov = document.getElementById('modalOverlay'), tm = document.getElementById(mId);
    if (!tm || !ov) return;
    document.querySelectorAll('.modal-content-wrapper').forEach(m => m.classList.remove('active'));

    if (mId === 'searchReplaceModal') populateColumnDropdown('srColumnTarget');
    else if (mId === 'insertPasteModal') populateColumnDropdown('ipColumnTarget');
    else if (mId === 'bulkEditModal') populateColumnDropdown('beColumnTarget');
    else if (mId === 'mergeModal') populateMergeSelector();
    else if (mId === 'columnVisibilityModal') populateColumnSelector();
    else if (mId === 'dateShiftModal') populateDateColumnSelector();
    else if (mId === 'pointsModal') populateNumericColumnSelector('pointsColumnTarget');
    else if (mId === 'deleteModal') {
        const inp = document.getElementById('deleteConfirmInput');
        if (inp) {
            inp.value = '';
            inp.dataset.mode = (currentTab === 'modules') ? 'deep' : 'individual';
        }
    } else if (mId === 'cloneModal') {
        const ms = document.getElementById('cloneMethod'), isMod = (currentTab === 'modules');
        if (ms) {
            Array.from(ms.options).forEach(o => {
                const isIt = (o.value === 'item');
                o.hidden = isMod ? isIt : !isIt;
                o.disabled = isMod ? isIt : !isIt;
            });
            ms.value = isMod ? 'structural' : 'item';
        }
    }
    ov.classList.add('active');
    tm.classList.add('active');
}

function closeActiveModal() {
    const ov = document.getElementById('modalOverlay');
    if (ov) ov.classList.remove('active');
    document.querySelectorAll('.modal-content-wrapper').forEach(m => m.classList.remove('active'));
}

function executeBulkEdit() {
    const tabContainer = document.getElementById('beColumnTarget').value, nv = document.getElementById('beValueInput').value;
    if (!gridApi) return;
    let n = gridApi.getSelectedRows();
    if (!n.length) { n = []; gridApi.forEachNodeAfterFilter(x => n.push(x.data)); }
    n.forEach(x => {
        gridApi.forEachNode(gn => {
            if (gn.data === x) gn.setDataValue(tc, nv);
        });
    });
    closeActiveModal();
}

function executeSearchReplace() {
    const tabContainer = document.getElementById('srColumnTarget').value, st = document.getElementById('srSearchInput').value;
    const rt = document.getElementById('srReplaceInput').value, ur = document.getElementById('srUseRegex').checked;
    if (!st || !gridApi) return;
    let n = gridApi.getSelectedRows();
    if (!n.length) { n = []; gridApi.forEachNodeAfterFilter(x => n.push(x.data)); }
    n.forEach(x => {
        const cv = x[tc];
        if (cv && typeof cv === 'string') {
            let nv;
            if (ur) {
                try { nv = cv.replace(new RegExp(st, 'g'), rt); }
                catch { return; }
            } else nv = cv.split(st).join(rt);
            if (nv !== cv) {
                gridApi.forEachNode(gn => {
                    if (gn.data === x) gn.setDataValue(tc, nv);
                });
            }
        }
    });
    closeActiveModal();
}

function executeInsertPaste() {
    const tabContainer = document.getElementById('ipColumnTarget').value, ti = document.getElementById('ipTextInput').value;
    const pos = document.querySelector('input[name="ipPosition"]:checked')?.value, mk = document.getElementById('ipMarkerInput').value;
    if (!gridApi) return;
    let n = gridApi.getSelectedRows();
    if (!n.length) { n = []; gridApi.forEachNodeAfterFilter(x => n.push(x.data)); }
    n.forEach(x => {
        const cv = x[tc] || "";
        let nv = cv;
        if (pos === 'start') nv = ti + cv;
        else if (pos === 'end') nv = cv + ti;
        else if (mk && cv.includes(mk)) {
            const p = cv.split(mk);
            nv = pos === 'beforeMarker' ? (p[0] + ti + mk + params.slice(1).join(mk)) : (p[0] + mk + ti + params.slice(1).join(mk));
        }
        if (nv !== cv) {
            gridApi.forEachNode(gn => {
                if (gn.data === x) gn.setDataValue(tc, nv);
            });
        }
    });
    closeActiveModal();
}

function executePublishStatus() {
    if (!gridApi) return;
    const ss = document.querySelector('input[name="pubStatus"]:checked')?.value;
    if (!ss) return;
    const pv = ss === 'true';
    let n = gridApi.getSelectedRows();
    if (!n.length) { n = []; gridApi.forEachNodeAfterFilter(x => n.push(x.data)); }
    if (!n.length) { alert('No rows.'); return; }
    n.forEach(x => {
        gridApi.forEachNode(gn => {
            if (gn.data === x) gn.setDataValue('published', pv);
        });
    });
    closeActiveModal();
}

function executeDateShift() {
    if (!gridApi) return;
    const od = parseInt(document.getElementById('dateOffsetDays').value) || 0;
    const to = document.getElementById('timeOverride').value, mfd = document.getElementById('manualFixedDate').value;
    const sdc = Array.from(document.querySelectorAll('.date-col-checkbox:checked')).map(x => x.value);
    if (!sdc.length) { alert('Select date columns.'); return; }
    let n = gridApi.getSelectedRows();
    if (!n.length) { n = []; gridApi.forEachNodeAfterFilter(x => n.push(x.data)); }
    if (!n.length) { alert('No rows.'); return; }
    n.forEach(x => {
        sdc.forEach(df => {
            const cv = x[df];
            let ndv = null;
            if (mfd) {
                const fd = new Date(mfd);
                if (to) { const [h, m] = to.split(':'); fd.setHours(parseInt(h), parseInt(m), 0, 0); }
                ndv = fd.toISOString();
            } else if (cv) {
                const cd = new Date(cv);
                if (!isNaN(cd.getTime())) {
                    const nd = new Date(cd);
                    nd.setDate(nd.getDate() + od);
                    if (to) { const [h, m] = to.split(':'); nd.setHours(parseInt(h), parseInt(m), 0, 0); }
                    ndv = nd.toISOString();
                }
            } else if (od !== 0) {
                const bd = new Date();
                bd.setDate(bd.getDate() + od);
                if (to) { const [h, m] = to.split(':'); bd.setHours(parseInt(h), parseInt(m), 0, 0); }
                ndv = bd.toISOString();
            }
            if (ndv !== null) {
                gridApi.forEachNode(gn => {
                    if (gn.data === x) gn.setDataValue(df, ndv);
                });
            }
        });
    });
    closeActiveModal();
}

function executePointsUpdate() {
    const f = document.getElementById('pointsColumnTarget').value, op = document.getElementById('pointsOp').value;
    const v = parseFloat(document.getElementById('pointsValue').value), sr = gridApi.getSelectedRows();
    if (!sr.length) { alert("Select rows."); return; }
    if (isNaN(v)) { alert("Enter valid number."); return; }
    sr.forEach(r => {
        const cv = parseFloat(r[f]) || 0;
        let fv = op === 'set' ? v : op === 'scale' ? cv * v : cv + v;
        gridApi.forEachNode(gn => {
            if (gn.data === r) gn.setDataValue(f, Number(fv.toFixed(2)));
        });
    });
    closeActiveModal();
}

async function executeClone() {
    const sr = gridApi.getSelectedRows(), m = document.getElementById('cloneMethod').value;
    const pf = document.getElementById('clonePrefix').value || '', sf = document.getElementById('cloneSuffix').value || '';

    if (currentTab === 'modules' && m === 'deep') {
        for (const r of sr) await performDeepClone(r, pf, sf);
    } else if (m === 'deep') {
        let configKey = currentTab;
        if (!FIELD_DEFINITIONS[configKey] && currentTab === 'discussions') configKey = 'discussion_topics';

        const tabContainer = FIELD_DEFINITIONS[configKey];
        for (const r of sr) {
            const ep = tc.endpoint, itf = (currentTab === 'pages') ? (r.url || r.page_url) : r.id;
            const res = await fetch(`/canvas/courses/${selectedCourseId}/${ep}/${itf}`);
            if (res.ok) {
                const ofo = await res.json(), sc = sanitizeRowData(ofo, ep, 'clone'), nn = getUniqueName(ofo.name || ofo.title || ofo.display_name || "Item", new Set(), pf, sf);
                if (sc.name !== undefined) sc.name = nn;
                if (sc.title !== undefined) sc.title = nn;
                if (sc.display_name !== undefined) sc.display_name = nn;
                await createDeepContent(currentTab.charAt(0).toUpperCase() + currentTab.slice(1, -1), sc);
            }
        }
        await refreshCurrentTab();
    } else {
        const ni = sr.map(r => {
            let cc = prepareUIClone(r, currentTab, pf, sf);
            if (currentTab === 'modules') cc.items = m === 'structural' ? [] : (r.items || []).map(x => ({ ...x }));
            return cc;
        });
        gridApi.applyTransaction({ add: ni });
    }
    closeActiveModal();
}

async function executeDelete() {
    const ci = document.getElementById('deleteConfirmInput'), m = ci.dataset.mode;
    if (ci.value !== 'DELETE') { alert('Type DELETE.'); return; }

    const si = getSelectedItems();
    if (!si || !si.length) { alert('No items.'); return; }

    const cId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!cId) { alert('No course.'); return; }

    try {
        const deleteBtn = document.querySelector('.modal-footer .btn-danger');
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.textContent = 'Deleting...';
        }

        for (const it of si) {
            const ty = it._originTab || currentTab;
            if (m === 'deep' && ty === 'modules') {
                await deepPurgeModule(cId, it);
            } else {
                const itd = (ty === 'pages') ? (it.url || it.page_url) : it.id;
                await deleteCanvasItem(ty, cId, itd);
            }
        }

        closeActiveModal();
        delete originalData['assignments'];
        if (changes['assignments']) changes['assignments'] = {};
        await refreshCurrentTab();

        if (currentTab !== 'assignments') {
            let configKey = 'assignments';
            const tabContainer = FIELD_DEFINITIONS[configKey];
            const response = await fetch(`/canvas/courses/${selectedCourseId}/${tc.endpoint}`);
            const data = await r.json();
            originalData['assignments'] = d.map(x => ({ ...x, _edit_status: 'synced' }));
        }
    } catch (event) {
        console.error(event);
        alert(`Error: ${event.message}`);
    } finally {
        const deleteBtn = document.querySelector('.modal-footer .btn-danger');
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete';
        }
    }
}

function exportData() {
    if (gridApi) gridApi.exportDataAsCsv({ fileName: `canvas_${currentTab}_export.csv` });
}

function toggleAllDateCheckboxes() {
    const cbs = document.querySelectorAll('.date-col-checkbox'), ac = Array.from(cbs).every(x => x.checked);
    cbs.forEach(x => x.checked = !ac);
}

function calculateDateOffset() {
    const ov = document.getElementById('calcOldDate').value, nv = document.getElementById('calcNewDate').value;
    if (!ov || !nv) return;
    document.getElementById('dateOffsetDays').value = Math.round((new Date(nv) - new Date(ov)) / 86400000);
}

function getUniqueName(on, en, pf = '', sf = '') {
    let bn = on || "Untitled", tn = bn, nm = tn.match(/(.*)\s(\d+)$/), cn = 0;
    if (nm) { tn = nm[1]; cn = parseInt(nm[2], 10); }
    const gfs = (b, n) => `${pf}${n > 0 ? `${b} ${n}` : b}${sf}`.trim();
    let nn = cn + 1, fn = gfs(tn, nn);
    while (en.has(fn)) { nn++; fn = gfs(tn, nn); }
    en.add(fn);
    return fn;
}

function sanitizeRowData(d, t, m = 'sync') {
    if (m === 'sync') {
        let configKey = t;
        if (!FIELD_DEFINITIONS[configKey] && t === 'discussions') configKey = 'discussion_topics';

        const tabContainer = FIELD_DEFINITIONS[configKey];
        if (!tc) return {};

        const df = tc.fields, cd = {}, pr = d._pristine || {};
        df.forEach(f => {
            const k = f.key, v = d[k];
            if (v !== undefined && v !== null && v !== '' && JSON.stringify(v) !== JSON.stringify(pr[k])) cd[k] = v;
        });
        return cd;
    }

    const srf = ['id', 'uuid', 'created_at', 'updated_at', 'items_count', 'items', 'html_url', 'url', 'workflow_state', 'publish_at', 'course_id', 'context_type', 'context_id', 'lti_context_id', 'global_id', 'secure_params', 'original_lti_resource_link_id', 'items_url', 'locked_for_user', 'lock_info', 'lock_explanation', 'permissions', 'submission', 'overrides', 'all_dates', 'can_duplicate'];
    const sif = new Set(['assignment_group_id', 'grading_standard_id', 'prerequisite_module_ids']), fk = new Set(srf);

    let configKey = t;
    if (!FIELD_DEFINITIONS[configKey] && t === 'discussions') configKey = 'discussion_topics';

    const tabContainer = FIELD_DEFINITIONS[configKey];
    if (tc?.fields) tc.fields.forEach(f => { if (f.editable === false) fk.add(f.key || f.name); });

    const san = {};
    Object.keys(d).forEach(k => {
        if (!k.startsWith('_') && !fk.has(k) && !(k.endsWith('_id') && !sif.has(k)) && k !== 'position') san[k] = d[k];
    });
    return san;
}

async function performDeepClone(mr, pf, sf) {
    if (!selectedCourseId) { alert('No course.'); return; }
    try {
        const mr2 = await fetch(`/canvas/courses/${selectedCourseId}/modules?per_page=100`), am = mr2.ok ? await mr2.json() : [];
        const emn = new Set(am.map(m => m.name)), nmn = getUniqueName(mr.name || mr.title || "Module", emn, pf, sf);
        const nm = await createModules(selectedCourseId, nmn), its = mr.items || [];
        for (const it of its) {
            const ty = it.type, ct = ty.toLowerCase();
            let nc, ip = { title: it.title, type: ty, position: it.position, indent: it.indent };
            if (ct === 'subheader' || ct === 'externalurl') {
                if (ct === 'externalurl') ip.external_url = it.external_url;
                nc = { id: 'no-content-needed' };
            } else {
                let ep = '';
                if (ty === 'Assignment') ep = 'assignments';
                else if (ty === 'Quiz') ep = 'quizzes';
                else if (ty === 'Page') ep = 'pages';
                else if (ty === 'Discussion') ep = 'discussions';
                if (ep) {
                    const itf = (ty === 'Page') ? (it.page_url || it.content_id) : it.content_id;
                    const response = await fetch(`/canvas/courses/${selectedCourseId}/${ep}/${itf}`);
                    if (r.ok) {
                        const ofo = await r.json(), sc = sanitizeRowData(ofo, ep, 'clone'), nn = getUniqueName(ofo.name || ofo.title || "Item", new Set(), pf, sf);
                        if (sc.name !== undefined) sc.name = nn;
                        if (sc.title !== undefined) sc.title = nn;
                        nc = await createDeepContent(ty, sc);
                    }
                }
            }
            if (nc) {
                if (ty === 'Page') ip.page_url = nc.url || nc.page_url;
                else if (nc.id !== 'no-content-needed') ip.content_id = nc.id;
                await addModuleItem(selectedCourseId, nm.id, ip);
            }
        }
        await refreshCurrentTab();
    } catch (event) { alert(`Cloning failed: ${event.message}`); }
}

const getNewName = (r, pf, sf, en = new Set()) => getUniqueName(r.display_name || r.name || r.title || "Untitled", en, pf, sf);

async function createDeepContent(ty, sp) {
    if (ty === 'Assignment') return await createAssignments(selectedCourseId, sp);
    if (ty === 'Quiz') return await createQuizzes(selectedCourseId, sp);
    if (ty === 'Page') return await createPages(selectedCourseId, sp);
    if (ty === 'Discussion') return await createDiscussions(selectedCourseId, sp);
    if (ty === 'Folder') return await createFolders(selectedCourseId, sp);
    return null;
}

function prepareUIClone(r, ty, pf, sf) {
    let rc = JSON.parse(JSON.stringify(r)), nn = getNewName(rc, pf, sf);
    if (rc.display_name !== undefined) rc.display_name = nn;
    if (rc.name !== undefined) rc.name = nn;
    if (rc.title !== undefined) rc.title = nn;
    let cc = sanitizeRowData(rc, ty, 'clone');
    cc.id = `TEMP_${Math.random().toString(36).substr(2, 9)}`;
    cc.isNew = true;
    cc.syncStatus = 'New';
    return cc;
}

async function createAssignments(cId, params) {
    const response = await fetch(`/canvas/courses/${cId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: p })
    });
    return r.ok ? await r.json() : null;
}

async function createQuizzes(cId, qp, ap = null) {
    const response = await fetch(`/canvas/courses/${cId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: qp })
    });
    const nq = r.ok ? await r.json() : null;
    if (nq && ap && nq.assignment_id) {
        await fetch(`/canvas/courses/${cId}/assignments/${nq.assignment_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignment: ap })
        });
    }
    return nq;
}

async function createPages(cId, params) {
    const response = await fetch(`/canvas/courses/${cId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wiki_page: p })
    });
    const res = r.ok ? await r.json() : null;
    if (res && res.url && !res.id) res.id = res.url;
    return res;
}

async function createDiscussions(cId, params) {
    const response = await fetch(`/canvas/courses/${cId}/discussion_topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return r.ok ? await r.json() : null;
}

async function createFolders(cId, params) {
    const response = await fetch(`/canvas/courses/${cId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return r.ok ? await r.json() : null;
}

const createModules = async (cId, mn) => {
    const response = await fetch(`/canvas/courses/${cId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: { name: mn } })
    });
    if (!r.ok) throw new Error(`Failed: ${r.statusText}`);
    return await r.json();
};

async function addModuleItem(cId, mId, ip) {
    const response = await fetch(`/canvas/courses/${cId}/modules/${mId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_item: ip })
    });
    return r.ok ? await r.json() : null;
}

function getSelectedItems() {
    if (!gridApi) { console.error("No API."); return []; }
    const response = gridApi.getSelectedRows();
    return r;
}

async function deleteCanvasItem(ty, cId, id) {
    let configKey = ty;
    if (!FIELD_DEFINITIONS[configKey] && ty === 'discussions') configKey = 'discussion_topics';

    const config = FIELD_DEFINITIONS[configKey];
    const endpoint = config ? config.endpoint : ty;

    const response = await fetch(`/canvas/${endpoint}/${cId}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!r.ok) {
        const et = await r.text();
        let ed;
        try { ed = JSON.parse(et); } catch { ed = { message: et }; }
        throw new Error(ed.message || `Failed: ${ty} ${id}`);
    }

    if (gridApi) {
        const rowNode = gridApi.getRowNode(id.toString());
        if (rowNode) {
            gridApi.applyTransaction({ remove: [rowNode.data] });
        }
    }

    return await r.json().catch(() => ({ status: 'success' }));
}

async function deepPurgeModule(cId, moduleItem) {
    const response = await fetch(`/canvas/courses/${cId}/modules/${moduleItem.id}/full-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!r.ok) {
        const et = await r.text();
        let ed;
        try { ed = JSON.parse(et); } catch { ed = { message: et }; }
        throw new Error(ed.message || `Failed to deep delete module ${moduleItem.id}`);
    }

    if (gridApi) {
        const rowNode = gridApi.getRowNode(moduleItem.id.toString());
        if (rowNode) {
            gridApi.applyTransaction({ remove: [rowNode.data] });
        }
    }

    return await r.json().catch(() => ({ status: 'success' }));
}

async function handleDeepPurge() {
    const si = getSelectedItems();
    if (!si || !si.length) { alert('No items selected.'); return; }

    const cId = document.getElementById('courseSelect')?.value || selectedCourseId;
    if (!cId) { alert('No course ID found.'); return; }

    if (!confirm(`This will delete ${si.length} module(s) AND all contents inside them. Continue?`)) return;

    try {
        for (const it of si) {
            await deepPurgeModule(cId, it);
        }

        closeActiveModal();
        delete originalData['assignments'];
        if (changes['assignments']) changes['assignments'] = {};
        await refreshCurrentTab();

        if (currentTab !== 'assignments') {
            const tabContainer = FIELD_DEFINITIONS['assignments'];
            const response = await fetch(`/canvas/courses/${selectedCourseId}/${tc.endpoint}`);
            const data = await r.json();
            originalData['assignments'] = d.map(x => ({ ...x, _edit_status: 'synced' }));
        }

        alert('Deep purge complete.');
    } catch (event) {
        console.error('Purge error:', event);
        alert(`Purge failed: ${event.message}`);
    }
}

function updateColumnVisibility(colIds, isVisible) {
    if (!gridApi) {
        console.error('gridApi is not defined or not initialized');
        return;
    }

    if (!colIds || colIds.length === 0) {
        console.warn('No column IDs provided to updateColumnVisibility');
        return;
    }

    const stateUpdates = colIds.map(id => ({
        colId: id,
        hide: !isVisible
    }));

    gridApi.applyColumnState({
        state: stateUpdates,
        applyOrder: false
    });
}