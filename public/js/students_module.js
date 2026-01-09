(function() {
    'use strict';

    if (typeof window.StudentsModule !== 'undefined') {
        console.warn('StudentsModule already loaded');
        return;
    }

    let accommodationColumns = null;
    let accommodationOptions = ['Time 1.25x', 'Time 1.5x', 'Time 2.0x', 'Extra Attempt', 'Quiet Room'];
    let studentAccommodations = {};
    let originalAccommodations = {};

    async function loadAccommodations(courseId) {
        if (!courseId) return;
        try {
            const ensureResponse = await fetch(`/canvas/courses/${courseId}/accommodations/ensure-columns`);
            if (!ensureResponse.ok) return;
            accommodationColumns = await ensureResponse.json();
            
            const dataResponse = await fetch(`/canvas/courses/${courseId}/accommodations/data`);
            if (!dataResponse.ok) return;
            
            const accommodationsData = await dataResponse.json();
            studentAccommodations = {};
            Object.entries(accommodationsData).forEach(([userId, type]) => {
                if (type?.trim()) studentAccommodations[String(userId)] = type.trim();
            });
            
            originalAccommodations = JSON.parse(JSON.stringify(studentAccommodations));
            
            if (typeof window.masterGridApi !== 'undefined' && window.masterGridApi && typeof window.getCurrentTabName === 'function' && window.getCurrentTabName() === 'students') {
                window.masterGridApi.refreshCells({ force: true });
            }
        } catch (error) {
            console.error(error);
        }
    }

    class AccommodationRenderer {
        init(params) {
            this.eGui = document.createElement('div');
            this.eGui.className = 'accommodation-checkboxes';
            const studentId = params.data.id || params.data.__itemId;
            const currentVal = studentAccommodations[studentId] || null;

            accommodationOptions.forEach(option => {
                const label = document.createElement('label');
                label.className = 'accommodation-checkbox-label';
                const isChecked = currentVal === option;
                const escapeHtml = typeof window.escapeHtml === 'function' ? window.escapeHtml : function(str) {
                    const div = document.createElement('div');
                    div.textContent = str;
                    return div.innerHTML;
                };
                label.innerHTML = `<input type="checkbox" ${isChecked ? 'checked' : ''} value="${escapeHtml(option)}"> <span>${escapeHtml(option)}</span>`;
                
                const input = label.querySelector('input');
                input.addEventListener('change', () => {
                    onAccommodationChange(studentId, option, input);
                    if (params.api) {
                        params.api.refreshCells({ rowNodes: [params.node], force: true });
                    }
                });
                this.eGui.appendChild(label);
            });
        }
        getGui() { return this.eGui; }
        refresh() { return false; }
    }

    function onAccommodationChange(studentId, optionName, checkbox) {
        if (checkbox.checked) {
            studentAccommodations[studentId] = optionName;
            const otherCheckboxes = document.querySelectorAll(`.accommodation-checkbox-label input[value]:not([value="${optionName}"])`);
        } else {
            delete studentAccommodations[studentId];
        }
        
        if (typeof changes !== 'undefined') {
            if (!changes['students']) changes['students'] = {};
            if (!changes['students'][studentId]) changes['students'][studentId] = {};
            changes['students'][studentId]['__accommodations'] = true;
        }
        
        if (typeof updateSyncButton === 'function') {
            updateSyncButton('students');
        }
    }

    async function syncAccommodations() {
        const getCurrentCourseId = typeof window.getCurrentCourseId === 'function' ? window.getCurrentCourseId : function() {
            return typeof currentCourseId !== 'undefined' ? currentCourseId : null;
        };
        const courseId = getCurrentCourseId();
        if (!courseId || !accommodationColumns) throw new Error('Initialization error');
        const allIds = new Set([...Object.keys(studentAccommodations), ...Object.keys(originalAccommodations)]);
        const studentsToSync = [];
        
        allIds.forEach(id => {
            if (studentAccommodations[id] !== originalAccommodations[id]) {
                studentsToSync.push({ id, val: studentAccommodations[id] || '' });
            }
        });
        
        if (studentsToSync.length === 0) return 0;
        
        let successCount = 0;
        for (const { id, val } of studentsToSync) {
            try {
                const res = await fetch(`/canvas/courses/${courseId}/accommodations/columns/${accommodationColumns.column.id}/users/${id}`, {
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: val })
                });
                if (res.ok) { 
                    originalAccommodations[id] = val; 
                    successCount++; 
                }
            } catch (e) {
                console.error(e);
            }
        }
        return successCount;
    }

    const STUDENTS_FIELD_DEFINITIONS = [
        { field: 'last_name', headerName: 'Last Name', editable: false },
        { field: 'first_name', headerName: 'First Name', editable: false },
        { 
            field: 'accommodations', 
            headerName: 'Accommodations', 
            editable: false,
            customRenderer: 'accommodations'
        },
        { field: 'email', headerName: 'Student ID', editable: false },
        { field: 'enrollment_state', headerName: 'Status', editable: false }
    ];

    function displayStudents(students) {
        const countEl = document.getElementById('studentsCount');
        if (countEl) {
            countEl.textContent = `${students.length} student${students.length !== 1 ? 's' : ''}`;
        }

        if (typeof originalData !== 'undefined') {
            if (!originalData['students']) {
                originalData['students'] = {};
            }

            const processedStudents = students.map(student => {
                const itemId = String(student.id);
                originalData['students'][itemId] = student;

                let lastName = '-';
                let firstName = '-';
                if (student.name) {
                    const nameParts = student.name.trim().split(/\s+/);
                    if (nameParts.length === 1) {
                        lastName = nameParts[0];
                    } else if (nameParts.length >= 2) {
                        lastName = nameParts[nameParts.length - 1];
                        firstName = nameParts.slice(0, -1).join(' ');
                    }
                }

                return {
                    ...student,
                    id: itemId,
                    last_name: lastName,
                    first_name: firstName,
                    enrollment_state: (student.enrollment_state || 'unknown').charAt(0).toUpperCase() + (student.enrollment_state || 'unknown').slice(1)
                };
            });

            if (typeof initializeAGGrid === 'function') {
                initializeAGGrid('students', processedStudents, STUDENTS_FIELD_DEFINITIONS);
            }
        }
    }

    function scrapeUniqueAccommodations() {
        const uniqueAccommodations = new Set();

        Object.values(studentAccommodations).forEach(accType => {
            if (accType && accType.trim()) {
                uniqueAccommodations.add(accType.trim());
            }
        });

        if (typeof window.getGridApiForTab === 'function') {
            const studentsGridApi = window.getGridApiForTab('students');
            if (studentsGridApi) {
                const rowNodes = [];
                studentsGridApi.forEachNode(node => {
                    if (node.data) {
                        const studentId = node.data.id || node.data.__itemId;
                        const accType = studentAccommodations[studentId];
                        if (accType && accType.trim()) {
                            uniqueAccommodations.add(accType.trim());
                        }
                    }
                });
            }
        }

        return Array.from(uniqueAccommodations).sort();
    }

    function populateAccommodationTypes(accommodationTypes) {
        const container = document.getElementById('accommodationTypesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (accommodationTypes.length === 0) {
            const message = document.createElement('div');
            message.textContent = 'No accommodation types found in the Students tab.';
            message.style.cssText = 'padding: 10px; color: #999; font-style: italic; text-align: center;';
            container.appendChild(message);
            return;
        }

        accommodationTypes.forEach(accType => {
            const label = document.createElement('label');
            label.style.cssText = 'display: flex; align-items: center; cursor: pointer; padding: 8px; border-radius: 4px; transition: background 0.2s;';
            
            label.onmouseover = function() { this.style.background = '#f0f0f0'; };
            label.onmouseout = function() { this.style.background = 'transparent'; };

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = accType;
            checkbox.style.marginRight = '8px';
            checkbox.addEventListener('change', function() {
                if (typeof window.updateAccommodationPlanPreview === 'function' && typeof window.getCurrentTabName === 'function' && typeof window.getSelectedItems === 'function') {
                    window.updateAccommodationPlanPreview(window.getCurrentTabName(), window.getSelectedItems(), accommodationTypes);
                }
            });

            const text = document.createTextNode(accType);
            label.appendChild(checkbox);
            label.appendChild(text);
            container.appendChild(label);
        });
    }

    function getStudentsByAccommodationType(accType) {
        const studentIds = [];
        Object.keys(studentAccommodations).forEach(studentId => {
            if (studentAccommodations[studentId] === accType) {
                studentIds.push(parseInt(studentId));
            }
        });
        return studentIds;
    }

    function getStudentCountForAccommodationType(accType) {
        let count = 0;
        Object.keys(studentAccommodations).forEach(studentId => {
            if (studentAccommodations[studentId] === accType) {
                count++;
            }
        });
        return count;
    }

    function extractTimeMultiplier(accType) {
        const match = accType.match(/(\d+\.?\d*)x/i);
        if (match) {
            return parseFloat(match[1]);
        }
        return null;
    }

    async function getAllCourseStudentIds(courseId) {
        try {
            const response = await fetch(`/canvas/courses/${courseId}/students`);
            if (!response.ok) {
                throw new Error(`Failed to fetch students: ${response.status}`);
            }
            const students = await response.json();
            return students.map(s => s.id || s.user_id).filter(id => id);
        } catch (error) {
            console.error('Error fetching course students:', error);
            return [];
        }
    }

    function getStudentAccommodations() {
        return studentAccommodations;
    }

    function getAccommodationOptions() {
        return accommodationOptions;
    }

    if (typeof FIELD_DEFINITIONS !== 'undefined' && FIELD_DEFINITIONS) {
        FIELD_DEFINITIONS['students'] = STUDENTS_FIELD_DEFINITIONS;
    }

    window.StudentsModule = {
        loadAccommodations,
        syncAccommodations,
        displayStudents,
        scrapeUniqueAccommodations,
        populateAccommodationTypes,
        getStudentsByAccommodationType,
        getStudentCountForAccommodationType,
        extractTimeMultiplier,
        getAllCourseStudentIds,
        AccommodationRenderer,
        onAccommodationChange,
        getStudentAccommodations,
        getAccommodationOptions,
        FIELD_DEFINITIONS: STUDENTS_FIELD_DEFINITIONS
    };

})();
