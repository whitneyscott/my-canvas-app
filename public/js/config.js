const CONFIG = {
    TABS: [
      'announcements',
      'assignments', 
      'discussions',
      'files',
      'modules',
      'pages',
      'quizzes',
      'students'
    ],
  
    API: {
      getCourses: '/canvas/courses',
      getTabData: (courseId, tab) => `/canvas/courses/${courseId}/${tab}`,
      updateItem: (courseId, tab, itemId) => `/canvas/courses/${courseId}/${tab}/${itemId}`
    },
  
    FIELD_DEFINITIONS: {
      announcements: [
        { key: 'title', label: 'Title', editable: true, type: 'text' },
        { key: 'delayed_post_at', label: 'Delayed Post At', editable: true, type: 'text' },
        { key: 'published', label: 'Published', editable: true, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ],
      assignments: [
        { key: 'name', label: 'Name', editable: true, type: 'text' },
        { key: 'assignment_group_id', label: 'Assignment Group ID', editable: true, type: 'number' },
        { key: 'points_possible', label: 'Points Possible', editable: true, type: 'number' },
        { key: 'published', label: 'Published', editable: true, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ],
      discussions: [
        { key: 'title', label: 'Title', editable: true, type: 'text' },
        { key: 'allow_rating', label: 'Allow Rating', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
        { key: 'published', label: 'Published', editable: true, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ],
      files: [
        { key: 'display_name', label: 'Display Name', editable: true, type: 'text' },
        { key: 'locked', label: 'Locked', editable: true, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'Visible' }
      ],
      modules: [
        { key: 'name', label: 'Name', editable: true, type: 'text' },
        { key: 'position', label: 'Position', editable: true, type: 'number' },
        { key: 'published', label: 'Published', editable: true, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ],
      pages: [
        { key: 'title', label: 'Title', editable: true, type: 'text' },
        { key: 'published', label: 'Published', editable: true, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ],
      quizzes: [
        { key: 'title', label: 'Title', editable: true, type: 'text' },
        { key: 'allowed_attempts', label: 'Allowed Attempts', editable: true, type: 'number' },
        { key: 'published', label: 'Published', editable: true, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ],
      students: [
        { key: 'sortable_name', label: 'Name', editable: false, type: 'text' },
        { key: 'login_id', label: 'Login ID', editable: false, type: 'text' },
        { key: 'sis_user_id', label: 'SIS User ID', editable: false, type: 'text' }
      ]
    },
  
    GRID_DEFAULTS: {
      flex: 1,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      editable: true,
      unSortIcon: true,
      minWidth: 100
    },
  
    STATUS_COLUMN: {
      headerName: 'Edit Status',
      field: '_edit_status',
      width: 130,
      editable: false,
      pinned: 'left',
      filter: false,
      sortable: true
    },
  
    ROW_STYLES: {
      modified: {
        backgroundColor: '#fff9c4',
        fontWeight: 'bold',
        color: '#d35400'
      }
    }
  };
  
  if (typeof window !== 'undefined') {
    window.CANVAS_CONFIG = CONFIG;
  }