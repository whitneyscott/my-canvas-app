(function() {
    'use strict';

    const filterState = {
        filters: {},
        sortState: {},
        filterMenus: {}
    };

    function getFilterState(tabName) {
        if (!filterState.filters[tabName]) filterState.filters[tabName] = {};
        return filterState.filters[tabName];
    }

    function getSortState(tabName) {
        if (!filterState.sortState[tabName]) filterState.sortState[tabName] = { field: null, direction: null };
        return filterState.sortState[tabName];
    }

    function setFilterState(tabName, fieldKey, filterConfig) {
        const state = getFilterState(tabName);
        if (filterConfig) {
            state[fieldKey] = filterConfig;
        } else {
            delete state[fieldKey];
        }
    }

    function clearFilterState(tabName, fieldKey) {
        const state = getFilterState(tabName);
        delete state[fieldKey];
    }

    function setSortState(tabName, fieldKey, direction) {
        const state = getSortState(tabName);
        if (direction === null) {
            state.field = null;
            state.direction = null;
        } else {
            state.field = fieldKey;
            state.direction = direction;
        }
    }

    function toggleSortState(tabName, fieldKey) {
        const currentSort = getSortState(tabName);
        if (currentSort.field !== fieldKey) {
            currentSort.field = fieldKey;
            currentSort.direction = 'asc';
        } else if (currentSort.direction === 'asc') {
            currentSort.direction = 'desc';
        } else {
            currentSort.field = null;
            currentSort.direction = null;
        }
    }

    function getSortValue(item, fieldKey) {
        let value = item[fieldKey];
        if (value === null || value === undefined) value = '';
        if ((fieldKey.endsWith('_at') && !fieldKey.includes('attempts')) || fieldKey.includes('date')) {
            value = value ? new Date(value).getTime() : 0;
        } else if (Array.isArray(value)) {
            value = value.join(', ');
        }
        return String(value).toLowerCase();
    }

    function compareValues(valueA, valueB) {
        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
        return 0;
    }

    function matchesDateFilter(value, filterConfig) {
        if (!value) return !(filterConfig.from || filterConfig.to);
        const cellDate = new Date(value).getTime();
        if (filterConfig.from) {
            const fromDate = new Date(filterConfig.from).getTime();
            if (cellDate < fromDate) return false;
        }
        if (filterConfig.to) {
            const toDate = new Date(filterConfig.to + 'T23:59:59').getTime();
            if (cellDate > toDate) return false;
        }
        return true;
    }

    function matchesTextFilter(value, filterConfig) {
        const searchText = String(value || '').toLowerCase();
        const filterText = (filterConfig.value || '').toLowerCase();
        return searchText.includes(filterText);
    }

    function matchesSelectFilter(value, filterConfig, fieldKey) {
        if (fieldKey === 'submission_types') {
            return Array.isArray(value) && value.includes(filterConfig.value);
        }
        return String(value) === filterConfig.value;
    }

    function matchesFilter(item, fieldKey, filterConfig) {
        const cellValue = item[fieldKey];
        if (filterConfig.type === 'text') return matchesTextFilter(cellValue, filterConfig);
        if (filterConfig.type === 'select') return matchesSelectFilter(cellValue, filterConfig, fieldKey);
        if (filterConfig.type === 'date') return matchesDateFilter(cellValue, filterConfig);
        return true;
    }

    function applyAllFilters(tabName) {
        const activeFilters = getFilterState(tabName);
        const tbody = document.querySelector(`#${tabName}Table tbody`);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            let shouldShow = true;
            const itemId = row.querySelector('[data-item-id]')?.getAttribute('data-item-id');
            const item = window.originalData?.[tabName]?.[itemId];

            if (!item) {
                // If we can't find the item data, we don't hide the row (failsafe)
                return;
            }

            Object.keys(activeFilters).forEach(fieldKey => {
                const filter = activeFilters[fieldKey];
                if (filter && !matchesFilter(item, fieldKey, filter)) {
                    shouldShow = false;
                }
            });

            row.style.display = shouldShow ? '' : 'none';
        });

        updateFilterIndicators(tabName);
    }

    function applySort(tabName) {
        const sortState = getSortState(tabName);
        const tbody = document.querySelector(`#${tabName}Table tbody`);
        if (!tbody || !sortState.field || !sortState.direction) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a, b) => {
            const idA = a.querySelector('[data-item-id]')?.getAttribute('data-item-id');
            const idB = b.querySelector('[data-item-id]')?.getAttribute('data-item-id');
            const itemA = window.originalData?.[tabName]?.[idA];
            const itemB = window.originalData?.[tabName]?.[idB];

            if (!itemA || !itemB) return 0;

            const valA = getSortValue(itemA, sortState.field);
            const valB = getSortValue(itemB, sortState.field);
            const comparison = compareValues(valA, valB);
            return sortState.direction === 'asc' ? comparison : -comparison;
        });

        rows.forEach(row => tbody.appendChild(row));
        updateSortIndicators(tabName);
    }

    function updateSortIndicators(tabName) {
        const sortState = getSortState(tabName);
        document.querySelectorAll(`#${tabName}Table .sort-indicator`).forEach(indicator => {
            const fieldKey = indicator.getAttribute('data-field');
            indicator.classList.remove('active', 'asc', 'desc');
            if (sortState.field === fieldKey) {
                indicator.classList.add('active', sortState.direction);
            }
        });
    }

    function updateFilterIndicators(tabName) {
        const table = document.getElementById(`${tabName}Table`);
        if (!table) return;

        const activeFilters = getFilterState(tabName);
        const fieldDefs = window.FIELD_DEFINITIONS?.[tabName];
        if (!fieldDefs) return;

        const headers = table.querySelectorAll('th');
        headers.forEach((th, index) => {
            if (index === 0) return; // Skip checkbox column
            
            const field = fieldDefs[index - 1];
            if (!field) return;

            const filterValue = activeFilters[field.key];
            let hasActive = false;

            if (filterValue) {
                if (filterValue.type === 'text') hasActive = !!filterValue.value;
                else if (filterValue.type === 'date') hasActive = !!(filterValue.from || filterValue.to);
                else if (filterValue.type === 'select') hasActive = !!filterValue.value;
            }

            th.classList.toggle('filter-active', hasActive);
        });
    }

    function refreshTable(tabName) {
        applySort(tabName);
        applyAllFilters(tabName);
    }

    // Menu logic
    function toggleFilterMenu(tabName, fieldKey, iconElement) {
        const menuId = `filter-menu-${tabName}-${fieldKey}`;
        const menu = document.getElementById(menuId);
        if (!menu) return;

        document.querySelectorAll('.filter-menu').forEach(m => {
            if (m.id !== menuId) m.classList.remove('active');
        });

        menu.classList.toggle('active');
        if (iconElement) iconElement.classList.toggle('active', menu.classList.contains('active'));
    }

    // Export to global scope
    window.FilterEngine = {
        state: filterState,
        applyTextFilter: function(tabName, fieldKey) {
            const input = document.getElementById(`text-filter-${tabName}-${fieldKey}`);
            const val = input?.value?.trim();
            val ? setFilterState(tabName, fieldKey, { type: 'text', value: val }) : clearFilterState(tabName, fieldKey);
            refreshTable(tabName);
        },
        clearTextFilter: function(tabName, fieldKey) {
            const input = document.getElementById(`text-filter-${tabName}-${fieldKey}`);
            if (input) input.value = '';
            clearFilterState(tabName, fieldKey);
            refreshTable(tabName);
        },
        applyDateFilter: function(tabName, fieldKey) {
            const from = document.getElementById(`date-filter-from-${tabName}-${fieldKey}`)?.value;
            const to = document.getElementById(`date-filter-to-${tabName}-${fieldKey}`)?.value;
            (from || to) ? setFilterState(tabName, fieldKey, { type: 'date', from, to }) : clearFilterState(tabName, fieldKey);
            refreshTable(tabName);
        },
        clearDateFilter: function(tabName, fieldKey) {
            const f = document.getElementById(`date-filter-from-${tabName}-${fieldKey}`);
            const t = document.getElementById(`date-filter-to-${tabName}-${fieldKey}`);
            if (f) f.value = ''; if (t) t.value = '';
            clearFilterState(tabName, fieldKey);
            refreshTable(tabName);
        },
        applySelectFilter: function(tabName, fieldKey) {
            const val = document.getElementById(`select-filter-${tabName}-${fieldKey}`)?.value;
            val ? setFilterState(tabName, fieldKey, { type: 'select', value: val }) : clearFilterState(tabName, fieldKey);
            refreshTable(tabName);
        },
        clearSelectFilter: function(tabName, fieldKey) {
            const s = document.getElementById(`select-filter-${tabName}-${fieldKey}`);
            if (s) s.value = '';
            clearFilterState(tabName, fieldKey);
            refreshTable(tabName);
        },
        toggleSort: function(tabName, fieldKey) {
            toggleSortState(tabName, fieldKey);
            refreshTable(tabName);
        },
        toggleFilterMenu,
        refreshTable
    };
})();