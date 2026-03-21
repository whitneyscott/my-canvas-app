const CanvasHelpers = {
  
    async fetchJSON(url, options = {}) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        throw error;
      }
    },
  
    async loadData(endpoint) {
      return this.fetchJSON(endpoint);
    },
  
    async updateItem(endpoint, updates) {
      return this.fetchJSON(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    },
  
    generateColumnDefs(tabName) {
      if (typeof window.generateColumnDefs === 'function') return window.generateColumnDefs(tabName);
      const config = window.CANVAS_CONFIG;
      const fields = config?.FIELD_DEFINITIONS?.[tabName];
      if (!fields) return [];
      const statusCol = { ...(config?.STATUS_COLUMN || {}), cellRenderer: this.statusCellRenderer };
      const dataColumns = fields.map(field => {
        const colDef = { headerName: field.label, field: field.key, editable: field.editable !== false };
        if (field.type === 'boolean') { colDef.editable = false; colDef.cellRenderer = (params) => this.booleanCellRenderer(params, field); }
        return colDef;
      });
      return [statusCol, ...dataColumns];
    },
  
    statusCellRenderer(params) {
      if (params.value === 'modified') {
        return '<span class="status-pending">Modified</span>';
      }
      return '<span class="status-synced">Synced</span>';
    },
  
    booleanCellRenderer(params, field) {
      const isTrue = params.value === true;
      const btn = document.createElement('button');
      btn.className = `btn-toggle ${isTrue ? 'active' : 'inactive'}`;
      btn.textContent = isTrue ? (field.activeLabel || 'Active') : (field.inactiveLabel || 'Inactive');
      
      btn.onclick = () => {
        const newValue = !isTrue;
        params.node.setDataValue(field.key, newValue);
      };
      
      return btn;
    },
  
    getRowId(data) {
      return data.id || data.url || null;
    },
  
    trackChange(changes, tab, id, field, value) {
      if (!changes[tab]) changes[tab] = {};
      if (!changes[tab][id]) changes[tab][id] = {};
      changes[tab][id][field] = value;
    },
  
    markRowAsModified(params) {
      params.node.setDataValue('_edit_status', 'modified');
      params.api.redrawRows({ rowNodes: [params.node] });
    },
  
    markRowAsSynced(gridApi, rowId) {
      const rowNode = gridApi.getRowNode(rowId);
      if (rowNode) {
        rowNode.setDataValue('_edit_status', 'synced');
        gridApi.redrawRows({ rowNodes: [rowNode] });
      }
    },
  
    async populateCourseSelect(selectElement) {
      try {
        const courseGroups = await this.loadData(window.CANVAS_CONFIG.API.getCourses);
        
        selectElement.innerHTML = '<option value="">Select a course...</option>';
        
        courseGroups.forEach(group => {
          const optgroup = document.createElement('optgroup');
          optgroup.label = group.term;
          group.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} (${course.course_code})`;
            optgroup.appendChild(option);
          });
          selectElement.appendChild(optgroup);
        });
      } catch (err) {
        console.error('Error loading courses:', err);
        selectElement.innerHTML = '<option value="">Error loading courses</option>';
      }
    },
  
    updateURL(courseId) {
      const url = new URL(window.location);
      if (courseId) {
        url.searchParams.set('course_id', courseId);
      } else {
        url.searchParams.delete('course_id');
      }
      window.history.pushState({}, '', url);
    },
  
    getCourseIdFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('course_id');
    }
  };
  
  if (typeof window !== 'undefined') {
    window.CanvasHelpers = CanvasHelpers;
  }