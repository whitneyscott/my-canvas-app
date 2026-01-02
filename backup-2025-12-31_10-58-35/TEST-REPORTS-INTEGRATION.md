# Test Reports Tab Integration Guide

## Overview
The Test Reports tab stores and displays all test results from the automated editing feature tests. Reports are persisted in localStorage and displayed in a table format.

## Adding the Tab

Add the following to your `tabs` array in `views/index.ejs`:

```javascript
const tabs = [
    // ... existing tabs ...
    { 
        name: 'test-reports', 
        displayName: 'Test Reports', 
        isActive: false
    }
];
```

## Tab Content Structure

The test reports tab expects a container with id `test-reports-content`. Add this to your tab partial or directly in the tab content area:

```html
<div id="test-reports-content" class="tab-content">
    <!-- Content will be populated by displayTestReports() -->
</div>
```

## Tab Display Function

When the test reports tab is clicked, call `displayTestReports()`:

```javascript
// In your tab switching logic
function switchTab(tabName) {
    // ... existing tab switching code ...
    
    if (tabName === 'test-reports') {
        displayTestReports();
    }
}
```

## Report Structure

Each test report contains:
- **tab**: The tab name (e.g., 'quizzes', 'assignments')
- **parameter**: The field name that was tested (e.g., 'title', 'points_possible')
- **result**: 'PASS' or 'FAIL'
- **timestamp**: ISO timestamp of when the test ran
- **expectedValue**: The value that was expected
- **actualValue**: The value that was actually retrieved from Canvas
- **errorMessage**: Error message if the test failed (null if passed)

## Functions Available

- `displayTestReports()`: Displays all test reports in a table
- `clearTestReports()`: Clears all stored test reports (with confirmation)
- `EditingFeatureTester.getTestReports()`: Returns array of all reports
- `EditingFeatureTester.clearTestReports()`: Clears reports programmatically

## Automatic Updates

The test reports tab will automatically update when:
1. A test completes (success or failure)
2. Reports are cleared
3. `displayTestReports()` is called manually

## Styling

The test reports table uses inline styles for portability. You can customize the appearance by modifying the styles in `public/test-reports.js` or adding CSS classes.

## Example Integration

```javascript
// In your tab click handler
document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        // Switch to tab
        switchToTab(tabName);
        
        // If test reports tab, display reports
        if (tabName === 'test-reports') {
            displayTestReports();
        }
    });
});
```

