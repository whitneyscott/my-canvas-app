const FIELD_DEFINITIONS = {
    announcements: [
        { key: 'title', label: 'title', editable: true, type: 'text' },
        { key: 'message', label: 'message', editable: false, type: 'html' },
        { key: 'delayed_post_at', label: 'delayed_post_at', editable: true, type: 'date' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
    ],
    assignments: [
        { key: 'name', label: 'name', editable: true, type: 'text' },
        { key: 'description', label: 'description', editable: false, type: 'html' },
        { key: 'assignment_group_id', label: 'assignment_group_id', editable: true, type: 'number' },
        { key: 'points_possible', label: 'points_possible', editable: true, type: 'number' },
        { key: 'due_at', label: 'due_at', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
    ],
    discussions: [
        { key: 'title', label: 'title', editable: true, type: 'text' },
        { key: 'message', label: 'message', editable: false, type: 'html' },
        { key: 'allow_rating', label: 'allow_rating', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
        { key: 'delayed_post_at', label: 'delayed_post_at', editable: true, type: 'date' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'due_at', label: 'due_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
    ],
    files: [
        { key: 'display_name', label: 'display_name', editable: true, type: 'text' },
        { key: 'locked', label: 'locked', editable: false, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'Visible' }
    ],
    modules: [
        { key: 'name', label: 'name', editable: true, type: 'text' },
        { key: 'position', label: 'position', editable: true, type: 'number' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
    ],
    pages: [
        { key: 'title', label: 'title', editable: true, type: 'text' },
        { key: 'body', label: 'body', editable: false, type: 'html' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
    ],
    quizzes: [
        { key: 'title', label: 'title', editable: true, type: 'text' },
        { key: 'description', label: 'description', editable: false, type: 'html' },
        { key: 'assignment_group_id', label: 'assignment_group_id', editable: true, type: 'number' },
        { key: 'time_limit', label: 'time_limit', editable: true, type: 'number' },
        { key: 'allowed_attempts', label: 'allowed_attempts', editable: true, type: 'number' },
        { key: 'due_at', label: 'due_at', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'show_correct_answers_at', label: 'show_correct_answers_at', editable: true, type: 'date' },
        { key: 'hide_correct_answers_at', label: 'hide_correct_answers_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
    ],
    students: [
        { key: 'sis_user_id', label: 'sis_user_id', editable: false, type: 'text' },
        { key: 'accommodations', label: 'Accommodations', editable: false, type: 'accommodations' }
    ]
};

let gridApi;
let currentTab = 'assignments';
let originalData = {};
let changes = {};
let selectedCourseId = null;

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
        unSortIcon: true
    },
    getRowStyle: params => {
        if (params.data && params.data._edit_status === 'modified') {
            return { 
                backgroundColor: '#fff9c4', 
                fontWeight: 'bold',
                color: '#d35400'
            };
        }
        return null;
    },
    onCellValueChanged: (params) => {
        if (params.colDef.field !== '_edit_status') {
            params.node.setDataValue('_edit_status', 'modified');
            const id = params.data.id || params.data.url;
            trackChange(currentTab, id, params.colDef.field, params.newValue);
            params.api.redrawRows({ rowNodes: [params.node] });
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const gridDiv = document.querySelector('#myGrid');
    gridApi = agGrid.createGrid(gridDiv, gridOptions);
    
    await loadCourses();
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course_id');
    if (courseId) {
        const select = document.getElementById('courseSelect');
        if (select) {
            select.value = courseId;
            selectedCourseId = courseId;
            switchTab('assignments');
        }
    }
});

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(tabName));
    });

    if (gridApi) {
        gridApi.setFilterModel(null);
        gridApi.setGridOption('columnDefs', generateColumnDefs(tabName));
        gridApi.setGridOption('rowData', originalData[tabName] || []);
        setTimeout(() => {
            gridApi.sizeColumnsToFit();
            if (tabName === 'students') {
                gridApi.resetRowHeights();
            }
        }, 100);
    }

    if (!originalData[tabName]) {
        loadTabData(tabName);
    }
}

function generateColumnDefs(tabName) {
    const defs = FIELD_DEFINITIONS[tabName];
    if (!defs) return [];

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
        if (field.type === 'date') {
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
                const btn = document.createElement('button');
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

    return [statusCol, ...mapping];
}

async function loadCourses() {
    try {
        const response = await fetch('/canvas/courses');
        const courseGroups = await response.json();
        const select = document.getElementById('courseSelect');
        if (!select) return;
        select.innerHTML = '<option value="">Select a course...</option>';
        
        courseGroups.forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group.term;
            group.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.name} (${course.course_code})`;
                optgroup.appendChild(option);
            });
            select.appendChild(optgroup);
        });
    } catch (err) {
        console.error('Error loading courses:', err);
    }
}

function onCourseSelected() {
    const select = document.getElementById('courseSelect');
    const courseId = select.value;
    if (!courseId) {
        selectedCourseId = null;
        if (gridApi) gridApi.setGridOption('rowData', []);
        return;
    }
    selectedCourseId = courseId;
    const url = new URL(window.location);
    url.searchParams.set('course_id', courseId);
    window.history.pushState({}, '', url);
    originalData = {};
    switchTab(currentTab);
}

async function loadTabData(tabName) {
    try {
        const courseId = selectedCourseId;
        if (!courseId) return;

        if (currentTab === tabName && gridApi) {
            gridApi.setGridOption('loading', true);
        }

        const response = await fetch(`/canvas/courses/${courseId}/${tabName}`);
        const data = await response.json();
        
        const dataWithStatus = data.map(row => ({
            ...row,
            _edit_status: 'synced'
        }));
        
        originalData[tabName] = dataWithStatus;
        if (currentTab === tabName && gridApi) {
            gridApi.setGridOption('rowData', dataWithStatus);
            gridApi.setGridOption('loading', false);
            if (tabName === 'students') {
                setTimeout(() => {
                    gridApi.resetRowHeights();
                }, 100);
            }
        }
    } catch (err) {
        console.error(`Error loading ${tabName}:`, err);
        if (currentTab === tabName && gridApi) {
            gridApi.setGridOption('loading', false);
        }
    }
}

async function refreshCurrentTab() {
    if (!selectedCourseId) {
        alert('Please select a course first.');
        return;
    }
    
    delete originalData[currentTab];
    if (changes[currentTab]) {
        changes[currentTab] = {};
    }
    
    try {
        if (gridApi) {
            gridApi.setGridOption('loading', true);
        }
        
        const response = await fetch(`/canvas/courses/${selectedCourseId}/${currentTab}`);
        const data = await response.json();
        
        const dataWithStatus = data.map(row => ({
            ...row,
            _edit_status: 'synced'
        }));
        
        originalData[currentTab] = dataWithStatus;
        
        if (gridApi) {
            gridApi.setGridOption('rowData', dataWithStatus);
            gridApi.setGridOption('loading', false);
            gridApi.redrawRows();
            if (currentTab === 'students') {
                setTimeout(() => {
                    gridApi.resetRowHeights();
                }, 100);
            }
        }
    } catch (err) {
        console.error(`Error refreshing ${currentTab}:`, err);
        alert('Failed to refresh data. Please try again.');
        if (gridApi) {
            gridApi.setGridOption('loading', false);
        }
    }
}

function trackChange(tab, id, field, value) {
    if (!changes[tab]) changes[tab] = {};
    if (!changes[tab][id]) changes[tab][id] = {};
    changes[tab][id][field] = value;
}

async function syncChanges() {
    if (!selectedCourseId) return alert('Please select a course first.');
    const tabChanges = changes[currentTab];
    if (!tabChanges || Object.keys(tabChanges).length === 0) return alert('No pending changes.');

    for (const itemId in tabChanges) {
        const updates = tabChanges[itemId];
        const url = `/canvas/courses/${selectedCourseId}/${currentTab}/${itemId}`;
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const rowNodesToUpdate = [];
                gridApi.forEachNode(node => {
                    const nodeId = node.data.id || node.data.url;
                    if (String(nodeId) === String(itemId)) {
                        node.setDataValue('_edit_status', 'synced');
                        rowNodesToUpdate.push(node);
                        
                        if (originalData[currentTab]) {
                            const originalRow = originalData[currentTab].find(r => {
                                const rowId = r.id || r.url;
                                return String(rowId) === String(itemId);
                            });
                            if (originalRow) {
                                Object.keys(updates).forEach(field => {
                                    originalRow[field] = updates[field];
                                });
                            }
                        }
                    }
                });
                
                if (rowNodesToUpdate.length > 0) {
                    gridApi.redrawRows({ rowNodes: rowNodesToUpdate });
                }
                delete changes[currentTab][itemId];
            }
        } catch (err) {
            console.error(err);
        }
    }
    alert('Sync completed.');
}

function openModal(modalId) {
    const overlay = document.getElementById('modalOverlay');
    const targetModal = document.getElementById(modalId);
    
    if (!targetModal || !overlay) return;

    document.querySelectorAll('.modal-content-wrapper').forEach(m => {
        m.classList.remove('active');
    });

    if (modalId === 'searchReplaceModal') {
        populateColumnDropdown('srColumnTarget');
    } else if (modalId === 'insertPasteModal') {
        populateColumnDropdown('ipColumnTarget');
    } else if (modalId === 'bulkEditModal') {
        populateColumnDropdown('beColumnTarget');
    } else if (modalId === 'mergeModal') {
        populateMergeSelect();
    } else if (modalId === 'columnVisibilityModal') {
        renderColumnPicker();
    } else if (modalId === 'dateShiftModal') {
        populateDateColumnSelector();
    } else if (modalId === 'pointsModal') {
        populateNumericColumnDropdown('pointsColumnTarget');
    } else if (modalId === 'cloneModal') {
        // Log the global variable to verify it matches
        console.log('--- Clone Modal Debug ---');
        console.log('Global currentTab value:', currentTab);

        const methodSelect = document.getElementById('cloneMethod');
        const isModuleTab = (currentTab === 'modules');
        
        console.log('Is Module Tab?', isModuleTab);

        if (methodSelect) {
            Array.from(methodSelect.options).forEach(opt => {
                const isItemOption = (opt.value === 'item');
                if (isModuleTab) {
                    opt.hidden = isItemOption;
                    opt.disabled = isItemOption;
                } else {
                    opt.hidden = !isItemOption;
                    opt.disabled = !isItemOption;
                }
            });

            methodSelect.value = isModuleTab ? 'structural' : 'item';
            console.log('Select Value Set To:', methodSelect.value);
        }
    }

    overlay.classList.add('active');
    targetModal.classList.add('active');
}

function closeActiveModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    document.querySelectorAll('.modal-content-wrapper').forEach(m => {
        m.classList.remove('active');
    });
}

function handleOverlayClick(event) {
    if (event.target.id === 'modalOverlay') {
        closeActiveModal();
    }
}

function populateColumnDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select || !gridApi) return;
    
    select.innerHTML = '';
    const colDefs = gridApi.getColumnDefs();
    
    colDefs.forEach(col => {
        if (col.headerName && col.field && col.field !== '_edit_status' && col.field !== 'id') {
            const opt = document.createElement('option');
            opt.value = col.field;
            opt.innerText = col.headerName;
            select.appendChild(opt);
        }
    });
}

function populateMergeSelect() {
    const select = document.getElementById('mergeTargetSelect');
    if (!select || !gridApi) return;

    select.innerHTML = '';
    const selectedRows = gridApi.getSelectedRows();
    
    if (selectedRows.length < 2) {
        const opt = document.createElement('option');
        opt.innerText = "Select at least 2 rows...";
        select.appendChild(opt);
        return;
    }

    selectedRows.forEach(row => {
        const opt = document.createElement('option');
        opt.value = row.id || row.url;
        opt.innerText = row.name || row.title || row.display_name || opt.value;
        select.appendChild(opt);
    });
}

function closeActiveModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    document.querySelectorAll('.modal-content-wrapper').forEach(m => m.classList.remove('active'));
}

function handleOverlayClick(event) {
    if (event.target.id === 'modalOverlay') {
        closeActiveModal();
    }
}

function populateColumnDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select || !gridApi) return;
    select.innerHTML = '';
    const colDefs = gridApi.getColumnDefs();
    if (!colDefs) return;
    colDefs.forEach(col => {
        if (col.headerName && col.field && col.field !== '_edit_status') {
            const opt = document.createElement('option');
            opt.value = col.field;
            opt.innerText = col.headerName;
            select.appendChild(opt);
        }
    });
}

function executeBulkEdit() {
    const targetCol = document.getElementById('beColumnTarget').value;
    const newValue = document.getElementById('beValueInput').value;
    if (!gridApi) return;
    const selectedNodes = gridApi.getSelectedNodes();
    let nodesToUpdate = selectedNodes;
    if (nodesToUpdate.length === 0) {
        nodesToUpdate = [];
        gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node));
    }
    nodesToUpdate.forEach(node => {
        node.setDataValue(targetCol, newValue);
    });
    closeActiveModal();
}

function executeSearchReplace() {
    const targetCol = document.getElementById('srColumnTarget').value;
    const searchText = document.getElementById('srSearchInput').value;
    const replaceText = document.getElementById('srReplaceInput').value;
    const useRegex = document.getElementById('srUseRegex').checked;

    if (!searchText || !gridApi) return;
    const selectedNodes = gridApi.getSelectedNodes();
    
    let nodesToUpdate = selectedNodes;
    if (nodesToUpdate.length === 0) {
        nodesToUpdate = [];
        gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node));
    }

    nodesToUpdate.forEach(node => {
        const currentValue = node.data[targetCol];
        if (currentValue && typeof currentValue === 'string') {
            let newValue;
            if (useRegex) {
                try {
                    newValue = currentValue.replace(new RegExp(searchText, 'g'), replaceText);
                } catch (e) { return; }
            } else {
                newValue = currentValue.split(searchText).join(replaceText);
            }
            if (newValue !== currentValue) node.setDataValue(targetCol, newValue);
        }
    });
    closeActiveModal();
}

function executeInsertPaste() {
    const targetCol = document.getElementById('ipColumnTarget').value;
    const textToInsert = document.getElementById('ipTextInput').value;
    const position = document.querySelector('input[name="ipPosition"]:checked')?.value;
    const marker = document.getElementById('ipMarkerInput').value;

    if (!gridApi) return;
    const selectedNodes = gridApi.getSelectedNodes();
    
    let nodesToUpdate = selectedNodes;
    if (nodesToUpdate.length === 0) {
        nodesToUpdate = [];
        gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node));
    }

    nodesToUpdate.forEach(node => {
        const currentValue = node.data[targetCol] || "";
        let newValue = currentValue;
        if (position === 'start') newValue = textToInsert + currentValue;
        else if (position === 'end') newValue = currentValue + textToInsert;
        else if (marker && currentValue.includes(marker)) {
            const parts = currentValue.split(marker);
            newValue = position === 'beforeMarker' ? 
                (parts[0] + textToInsert + marker + parts.slice(1).join(marker)) : 
                (parts[0] + marker + textToInsert + parts.slice(1).join(marker));
        }
        if (newValue !== currentValue) node.setDataValue(targetCol, newValue);
    });
    closeActiveModal();
}

function executePublishStatus() {
    if (!gridApi) return;
    
    const selectedStatus = document.querySelector('input[name="pubStatus"]:checked')?.value;
    if (!selectedStatus) return;
    
    const publishValue = selectedStatus === 'true';
    
    const selectedNodes = gridApi.getSelectedNodes();
    let nodesToUpdate = selectedNodes;
    if (nodesToUpdate.length === 0) {
        nodesToUpdate = [];
        gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node));
    }
    
    if (nodesToUpdate.length === 0) {
        alert('No rows selected or visible. Please select rows or adjust filters.');
        return;
    }
    
    nodesToUpdate.forEach(node => {
        node.setDataValue('published', publishValue);
    });
    
    closeActiveModal();
}

function exportData() {
    if (!gridApi) return;
    gridApi.exportDataAsCsv({
        fileName: `canvas_${currentTab}_export.csv`
    });
}

document.addEventListener('change', function(e) {
    if (e.target.name === 'ipPosition') {
        const markerContainer = document.getElementById('markerInputContainer');
        if (markerContainer) {
            const isMarkerMode = e.target.value === 'beforeMarker' || e.target.value === 'afterMarker';
            markerContainer.style.display = isMarkerMode ? 'block' : 'none';
        }
    }
});

function renderColumnPicker() {
    const container = document.getElementById('columnListContainer');
    if (!container || !gridApi) return;

    container.innerHTML = ''; 
    
    const columns = gridApi.getColumns();
    if (!columns || columns.length === 0) return;

    const selectAllRow = document.createElement('div');
    selectAllRow.className = 'checkbox-group';
    selectAllRow.style.flexDirection = 'row';
    selectAllRow.style.justifyContent = 'space-between';
    selectAllRow.style.padding = '8px 12px';
    selectAllRow.style.marginBottom = '10px';
    selectAllRow.style.borderBottom = '2px solid #eee';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.textContent = 'Select All / None';
    selectAllLabel.style.fontWeight = 'bold';

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.checked = columns.every(col => col.isVisible());

    selectAllCheckbox.onchange = (e) => {
        const isChecked = e.target.checked;
        columns.forEach(col => {
            col.setVisible(isChecked);
        });
        
        container.querySelectorAll('.col-toggle-input').forEach(cb => {
            cb.checked = isChecked;
        });
    };

    selectAllRow.appendChild(selectAllLabel);
    selectAllRow.appendChild(selectAllCheckbox);
    container.appendChild(selectAllRow);

    columns.forEach(col => {
        const colDef = col.getColDef();
        const colId = col.getColId();
        
        if (!colDef.headerName) return; 

        const row = document.createElement('div');
        row.className = 'checkbox-group';
        row.style.flexDirection = 'row';
        row.style.justifyContent = 'space-between';
        row.style.padding = '8px 12px';
        row.style.marginBottom = '5px';

        const label = document.createElement('label');
        label.textContent = colDef.headerName;
        label.style.fontWeight = '500';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'col-toggle-input';
        checkbox.checked = col.isVisible();
        
        checkbox.onclick = (e) => {
            const isVisible = e.target.checked;
            col.setVisible(isVisible);
            
            const allChecked = Array.from(container.querySelectorAll('.col-toggle-input'))
                                    .every(input => input.checked);
            selectAllCheckbox.checked = allChecked;
        };

        row.appendChild(label);
        row.appendChild(checkbox);
        container.appendChild(row);
    });
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

    const diff = Math.round((new Date(newVal) - new Date(oldVal)) / (1000 * 60 * 60 * 24));
    document.getElementById('dateOffsetDays').value = diff;
}

function populateDateColumnSelector() {
    const container = document.getElementById('dateColumnSelector');
    if (!container) {
        console.error("Date Shift Error: 'dateColumnSelector' element not found in DOM.");
        return;
    }
    if (!FIELD_DEFINITIONS) {
        console.error("Date Shift Error: FIELD_DEFINITIONS is undefined.");
        return;
    }

    container.innerHTML = '';

    if (!currentTab || !FIELD_DEFINITIONS[currentTab]) {
        console.warn(`Date Shift Warning: No definitions found for tab '${currentTab}'`);
        container.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">Select a valid tab to see date options</div>';
        return;
    }

    const currentDefs = FIELD_DEFINITIONS[currentTab];
    console.log(`Processing ${currentDefs.length} fields for ${currentTab}...`);

    let matchCount = 0;
    currentDefs.forEach(def => {
        const isDateCol = def.type === 'date' && def.editable === true;

        console.log(`Checking field: '${def.key}' | type: ${def.type} | editable: ${def.editable} | isDate: ${isDateCol}`);

        if (isDateCol) {
            matchCount++;
            const row = document.createElement('div');
            row.className = 'checkbox-group';
            row.style.flexDirection = 'row';
            row.style.justifyContent = 'space-between';
            row.style.padding = '8px 12px';
            row.style.marginBottom = '5px';

            const label = document.createElement('label');
            label.textContent = def.label || def.key;
            label.style.fontWeight = '500';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'date-col-checkbox';
            checkbox.value = def.key;
            checkbox.checked = true;

            row.appendChild(label);
            row.appendChild(checkbox);
            container.appendChild(row);
        }
    });

    console.log(`Total date-related fields found: ${matchCount}`);

    if (matchCount === 0) {
        container.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">No date fields in this category</div>';
    }
}

function executeDateShift() {
    if (!gridApi) return;

    const offsetDays = parseInt(document.getElementById('dateOffsetDays').value) || 0;
    const timeOverride = document.getElementById('timeOverride').value;
    const manualFixedDate = document.getElementById('manualFixedDate').value;
    
    const selectedDateColumns = Array.from(document.querySelectorAll('.date-col-checkbox:checked'))
        .map(cb => cb.value);
    
    if (selectedDateColumns.length === 0) {
        alert('Please select at least one date column to update.');
        return;
    }

    const selectedNodes = gridApi.getSelectedNodes();
    let nodesToUpdate = selectedNodes;
    if (nodesToUpdate.length === 0) {
        nodesToUpdate = [];
        gridApi.forEachNodeAfterFilter(node => nodesToUpdate.push(node));
    }

    if (nodesToUpdate.length === 0) {
        alert('No rows selected or visible. Please select rows or adjust filters.');
        return;
    }

    nodesToUpdate.forEach(node => {
        selectedDateColumns.forEach(dateField => {
            const currentValue = node.data[dateField];
            
            let newDateValue = null;
            
            if (manualFixedDate) {
                const fixedDate = new Date(manualFixedDate);
                if (timeOverride) {
                    const [hours, minutes] = timeOverride.split(':');
                    fixedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                }
                newDateValue = fixedDate.toISOString();
            } else if (currentValue) {
                const currentDate = new Date(currentValue);
                if (!isNaN(currentDate.getTime())) {
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() + offsetDays);
                    
                    if (timeOverride) {
                        const [hours, minutes] = timeOverride.split(':');
                        newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    }
                    
                    newDateValue = newDate.toISOString();
                }
            } else if (offsetDays !== 0) {
                const baseDate = new Date();
                baseDate.setDate(baseDate.getDate() + offsetDays);
                
                if (timeOverride) {
                    const [hours, minutes] = timeOverride.split(':');
                    baseDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                }
                
                newDateValue = baseDate.toISOString();
            }
            
            if (newDateValue !== null) {
                node.setDataValue(dateField, newDateValue);
            }
        });
    });

    closeActiveModal();
}
function populateNumericColumnDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';

    const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    const defs = FIELD_DEFINITIONS[currentTab];
    if (!defs) return;

    defs.forEach(def => {
        if (def.type === 'number' || (def.key && def.key.toLowerCase().includes('points'))) {
            const opt = document.createElement('option');
            opt.value = def.key;
            opt.textContent = def.label || def.key;
            select.appendChild(opt);
        }
    });
}

function executePointsUpdate() {
    const field = document.getElementById('pointsColumnTarget').value;
    const op = document.getElementById('pointsOp').value;
    const val = parseFloat(document.getElementById('pointsValue').value);
    
    const selectedRows = gridApi.getSelectedRows();

    if (selectedRows.length === 0) {
        alert("Please select rows to update.");
        return;
    }
    
    if (isNaN(val)) {
        alert("Please enter a valid numeric value.");
        return;
    }

    selectedRows.forEach(row => {
        const currentVal = parseFloat(row[field]) || 0;
        let finalVal;

        if (op === 'set') {
            finalVal = val;
        } else if (op === 'scale') {
            finalVal = currentVal * val;
        } else if (op === 'add') {
            finalVal = currentVal + val;
        }

        row[field] = Number(finalVal.toFixed(2));
        row.isUpdated = true;
    });

    gridApi.applyTransaction({ update: selectedRows });
    closeActiveModal();
}

function getUniqueName(originalName, existingNames, prefix = '', suffix = '') {
    let baseName = originalName || "Untitled";
    let targetName = baseName;
    let numberMatch = targetName.match(/(.*)\s(\d+)$/);
    
    let currentNumber = 0;
    if (numberMatch) {
        targetName = numberMatch[1];
        currentNumber = parseInt(numberMatch[2], 10);
    }

    const getFinalString = (base, num) => {
        let core = num > 0 ? `${base} ${num}` : base;
        return `${prefix}${core}${suffix}`.trim();
    };

    let nextNumber = currentNumber + 1;
    let finalName = getFinalString(targetName, nextNumber);

    while (existingNames.has(finalName)) {
        nextNumber++;
        finalName = getFinalString(targetName, nextNumber);
    }

    existingNames.add(finalName); 
    return finalName;
}

function sanitizeRowData(data, tab, mode = 'sync') {
    if (mode === 'sync') {
        const definitions = FIELD_DEFINITIONS[tab];
        if (!definitions) return {};
        const cleanData = {};
        const pristine = data._pristine || {};
        definitions.forEach(def => {
            const key = def.key;
            const val = data[key];
            if (val === undefined || val === null || val === '') return;
            if (JSON.stringify(val) !== JSON.stringify(pristine[key])) {
                cleanData[key] = val;
            }
        });
        return cleanData;
    }

    const systemReadOnlyFields = [
        'id', 'uuid', 'created_at', 'updated_at', 'items_count', 'items',
        'html_url', 'url', 'workflow_state', 'publish_at', 'course_id', 
        'context_type', 'context_id', 'lti_context_id', 'global_id', 
        'secure_params', 'original_lti_resource_link_id', 'items_url',
        'locked_for_user', 'lock_info', 'lock_explanation', 'permissions', 
        'submission', 'overrides', 'all_dates', 'can_duplicate'
    ];

    const safeIdFields = new Set(['assignment_group_id', 'grading_standard_id', 'prerequisite_module_ids']);
    const forbiddenKeys = new Set(systemReadOnlyFields);
    
    const fieldDefs = FIELD_DEFINITIONS[tab];
    if (fieldDefs) {
        fieldDefs.forEach(field => {
            if (field.editable === false) {
                forbiddenKeys.add(field.key || field.name);
            }
        });
    }

    const sanitized = {};
    Object.keys(data).forEach(key => {
        if (key.startsWith('_')) return; 
        if (forbiddenKeys.has(key)) return;
        if (key.endsWith('_id') && !safeIdFields.has(key)) return;
        if (key === 'position') return;

        sanitized[key] = data[key];
    });

    return sanitized;
}

async function performDeepClone(moduleRow, prefix, suffix) {
    if (!selectedCourseId) {
        alert('No course selected.');
        return;
    }

    try {
        const modRes = await fetch(`/canvas/courses/${selectedCourseId}/modules?per_page=100`);
        const allModules = modRes.ok ? await modRes.json() : [];
        const existingModuleNames = new Set(allModules.map(m => m.name));

        const newModuleName = getUniqueName(moduleRow.name, existingModuleNames, prefix, suffix);
        const sanitizedModule = sanitizeRowData(moduleRow, 'modules', 'clone');
        sanitizedModule.name = newModuleName;

        const createModuleResponse = await fetch(`/canvas/courses/${selectedCourseId}/modules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: sanitizedModule })
        });

        if (!createModuleResponse.ok) throw new Error(`Failed to create module.`);
        const newModule = await createModuleResponse.json();

        const items = moduleRow.items || [];
        for (const item of items) {
            const type = item.type;
            const contentType = type.toLowerCase();
            let newContent;
            let itemPayload = { title: item.title, type: type, position: item.position, indent: item.indent };

            if (contentType === 'subheader' || contentType === 'externalurl') {
                if (contentType === 'externalurl') itemPayload.external_url = item.external_url;
                newContent = { id: 'no-content-needed' }; 
            } else {
                let endpoint = '';
                if (type === 'Assignment') endpoint = 'assignments';
                else if (type === 'Quiz') endpoint = 'quizzes';
                else if (type === 'Page') endpoint = 'pages';
                else if (type === 'Discussion') endpoint = 'discussions';

                if (endpoint) {
                    const idToFetch = (type === 'Page') ? (item.page_url || item.content_id) : item.content_id;
                    const res = await fetch(`/canvas/courses/${selectedCourseId}/${endpoint}/${idToFetch}`);
                    
                    if (res.ok) {
                        const originalFullObject = await res.json();
                        const sanitizedContent = sanitizeRowData(originalFullObject, endpoint, 'clone');
                        
                        const nameField = (type === 'Assignment' || type === 'Quiz' || type === 'Discussion') ? 'name' : 'title';
                        const currentName = originalFullObject[nameField] || originalFullObject.title || originalFullObject.name;
                        const newName = getUniqueName(currentName, new Set(), prefix, suffix);
                        
                        if (sanitizedContent.name !== undefined) sanitizedContent.name = newName;
                        if (sanitizedContent.title !== undefined) sanitizedContent.title = newName;

                        if (type === 'Assignment') {
                            newContent = await createAssignment(selectedCourseId, sanitizedContent);
                        } else if (type === 'Quiz') {
                            newContent = await createQuiz(selectedCourseId, sanitizedContent);
                        } else if (type === 'Page') {
                            newContent = await createPage(selectedCourseId, sanitizedContent);
                        } else if (type === 'Discussion') {
                            newContent = await createDiscussion(selectedCourseId, sanitizedContent);
                        }
                    }
                }
            }

            if (newContent) {
                if (type === 'Page') {
                    itemPayload.page_url = newContent.url || newContent.page_url;
                } else if (newContent.id !== 'no-content-needed') {
                    itemPayload.content_id = newContent.id;
                }
                await addModuleItem(selectedCourseId, newModule.id, itemPayload);
            }
        }
        await refreshCurrentTab();
    } catch (error) {
        alert(`Cloning failed: ${error.message}`);
    }
}

async function executeClone() {
    const selectedRows = gridApi.getSelectedRows();
    const method = document.getElementById('cloneMethod').value;
    const prefix = document.getElementById('clonePrefix').value || '';
    const suffix = document.getElementById('cloneSuffix').value || '';

    if (currentTab === 'modules' && method === 'deep') {
        for (const row of selectedRows) {
            await performDeepClone(row, prefix, suffix);
        }
    } else if (method === 'deep') {
        for (const row of selectedRows) {
            const originalName = row.display_name || row.name || row.title || "Untitled";
            const newName = getUniqueName(originalName, new Set(), prefix, suffix);
            let newContent;

            if (currentTab === 'assignments') {
                const isLtiNewQuiz = row.is_quiz_lti || (row.submission_types && row.submission_types.includes('external_tool'));
                if (isLtiNewQuiz) {
                    const quizPayload = { title: newName, quiz_type: 'assignment' };
                    const assignPayload = sanitizeRowData(row, 'assignments', 'clone');
                    assignPayload.name = newName;
                    newContent = await createQuiz(selectedCourseId, quizPayload, assignPayload);
                } else {
                    const assignPayload = sanitizeRowData(row, 'assignments', 'clone');
                    assignPayload.name = newName;
                    newContent = await createAssignment(selectedCourseId, assignPayload);
                }
            } else if (currentTab === 'quizzes') {
                const quizPayload = sanitizeRowData(row, 'quizzes', 'clone');
                quizPayload.title = newName;
                newContent = await createQuiz(selectedCourseId, quizPayload);
            } else if (currentTab === 'pages') {
                const pagePayload = sanitizeRowData(row, 'pages', 'clone');
                pagePayload.title = newName;
                newContent = await createPage(selectedCourseId, pagePayload);
            } else if (currentTab === 'discussions') {
                const discPayload = sanitizeRowData(row, 'discussions', 'clone');
                discPayload.title = newName;
                newContent = await createDiscussion(selectedCourseId, discPayload);
            }

            if (newContent) {
                console.log(`Successfully deep cloned individual ${currentTab} item:`, newContent);
            }
        }
        await refreshCurrentTab();
    } else {
        const newItems = [];
        selectedRows.forEach(row => {
            let rawClone = JSON.parse(JSON.stringify(row));
            const originalName = rawClone.display_name || rawClone.name || rawClone.title || "Untitled";
            const newName = getUniqueName(originalName, new Set(), prefix, suffix);

            if (rawClone.display_name !== undefined) rawClone.display_name = newName;
            if (rawClone.name !== undefined) rawClone.name = newName;
            if (rawClone.title !== undefined) rawClone.title = newName;

            let cleanClone = sanitizeRowData(rawClone, currentTab, 'clone');
            cleanClone.id = `TEMP_${Math.random().toString(36).substr(2, 9)}`;
            cleanClone.isNew = true;
            cleanClone.syncStatus = 'New';

            if (currentTab === 'modules') {
                if (method === 'structural') {
                    cleanClone.items = [];
                } else if (method === 'reuse') {
                    cleanClone.items = (row.items || []).map(item => ({ ...item }));
                }
            }
            newItems.push(cleanClone);
        });
        gridApi.applyTransaction({ add: newItems });
    }
    closeActiveModal();
}

async function createAssignment(courseId, payload) {
    const res = await fetch(`/canvas/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: payload })
    });
    return res.ok ? await res.json() : null;
}

async function createQuiz(courseId, quizPayload, assignmentPayload = null) {
    console.log('[createQuiz] -> Initiating POST to /quizzes');
    console.log('[createQuiz] -> Quiz Payload:', JSON.stringify(quizPayload, null, 2));

    const res = await fetch(`/canvas/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: quizPayload })
    });

    const newQuiz = res.ok ? await res.json() : null;

    if (newQuiz && assignmentPayload && newQuiz.assignment_id) {
        console.log(`[createQuiz] -> LTI Sync detected. Target Assignment ID: ${newQuiz.assignment_id}`);
        console.log('[createQuiz] -> Assignment Payload (Metadata):', JSON.stringify(assignmentPayload, null, 2));

        const assignRes = await fetch(`/canvas/courses/${courseId}/assignments/${newQuiz.assignment_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignment: assignmentPayload })
        });

        if (!assignRes.ok) {
            console.error('[createQuiz] -> Assignment Metadata Sync FAILED:', await assignRes.text());
        } else {
            console.log('[createQuiz] -> Assignment Metadata Sync SUCCESS');
        }
    }

    return newQuiz;
}

async function createPage(courseId, payload) {
    const res = await fetch(`/canvas/courses/${courseId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wiki_page: payload })
    });
    const result = res.ok ? await res.json() : null;
    if (result && result.url && !result.id) result.id = result.url;
    return result;
}

async function createDiscussion(courseId, payload) {
    const res = await fetch(`/canvas/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return res.ok ? await res.json() : null;
}

async function addModuleItem(courseId, moduleId, itemPayload) {
    const res = await fetch(`/canvas/courses/${courseId}/modules/${moduleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_item: itemPayload })
    });
    return res.ok ? await res.json() : null;
}