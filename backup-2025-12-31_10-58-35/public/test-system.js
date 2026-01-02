/**
 * Automated Testing System for Canvas Bulk Editor
 * Tests all editable fields across all tabs with Canvas sync verification
 */

class EditingFeatureTester {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            details: {}
        };
        this.currentTestIndex = 0;
        this.allTests = [];
        this.consecutiveFailures = 0;
        this.testItems = {};
        this.isRunning = false;
    }

    async initialize(courseId) {
        this.courseId = courseId;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            details: {}
        };
        this.consecutiveFailures = 0;
        
        // Find or create test items
        await this.setupTestItems();
        
        // Build test list
        this.buildTestList();
    }

    async setupTestItems() {
        try {
            // Check for existing test items
            const response = await fetch(`/canvas/courses/${this.courseId}/test-items`);
            const existing = await response.json();
            
            this.testItems = {};
            const tabs = ['quiz', 'assignment', 'discussion', 'page', 'module', 'announcement'];
            const tabNames = ['quizzes', 'assignments', 'discussions', 'pages', 'modules', 'announcements'];
            
            for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                const tabName = tabNames[i];
                let testItem = existing[tab];
                
                if (!testItem) {
                    // Create test item
                    this.updateStatus(`Creating test ${tabName.slice(0, -1)}...`);
                    const createResponse = await fetch(`/canvas/courses/${this.courseId}/test-items/${tab}/${i + 1}`, {
                        method: 'POST'
                    });
                    if (createResponse.ok) {
                        testItem = await createResponse.json();
                    } else {
                        throw new Error(`Failed to create test ${tab}: ${await createResponse.text()}`);
                    }
                }
                
                this.testItems[tabName] = testItem;
            }
        } catch (error) {
            throw new Error(`Failed to setup test items: ${error.message}`);
        }
    }

    buildTestList() {
        this.allTests = [];
        
        const fieldDefinitions = {
            quizzes: [
                { key: 'title', type: 'text', testValue: '[TEST] Quiz Updated' },
                { key: 'points_possible', type: 'number', testValue: 25 },
                { key: 'time_limit', type: 'number', testValue: 30 },
                { key: 'shuffle_answers', type: 'boolean', testValue: true },
                { key: 'published', type: 'boolean', testValue: true },
                { key: 'due_at', type: 'datetime', testValue: this.getFutureDate() }
            ],
            assignments: [
                { key: 'name', type: 'text', testValue: '[TEST] Assignment Updated' },
                { key: 'points_possible', type: 'number', testValue: 50 },
                { key: 'allowed_attempts', type: 'number', testValue: 3 },
                { key: 'published', type: 'boolean', testValue: true },
                { key: 'due_at', type: 'datetime', testValue: this.getFutureDate() }
            ],
            discussions: [
                { key: 'title', type: 'text', testValue: '[TEST] Discussion Updated' },
                { key: 'published', type: 'boolean', testValue: true },
                { key: 'pinned', type: 'boolean', testValue: true }
            ],
            pages: [
                { key: 'title', type: 'text', testValue: '[TEST] Page Updated' },
                { key: 'published', type: 'boolean', testValue: true }
            ],
            modules: [
                { key: 'name', type: 'text', testValue: '[TEST] Module Updated' },
                { key: 'published', type: 'boolean', testValue: true },
                { key: 'position', type: 'number', testValue: 1 }
            ],
            announcements: [
                { key: 'title', type: 'text', testValue: '[TEST] Announcement Updated' },
                { key: 'published', type: 'boolean', testValue: true }
            ]
        };

        Object.keys(fieldDefinitions).forEach(tabName => {
            if (!this.testItems[tabName]) return;
            
            fieldDefinitions[tabName].forEach(field => {
                this.allTests.push({
                    tabName,
                    fieldKey: field.key,
                    fieldType: field.type,
                    testValue: field.testValue,
                    itemId: this.getItemId(tabName)
                });
            });
        });
    }

    getItemId(tabName) {
        const item = this.testItems[tabName];
        if (!item) return null;
        
        if (tabName === 'pages') {
            return item.url || item.page_id;
        }
        return item.id;
    }

    getFutureDate() {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        date.setHours(23, 59, 0, 0);
        return date.toISOString().slice(0, 16);
    }

    async runAllTests() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.currentTestIndex = 0;
        this.consecutiveFailures = 0;

        this.updateStatus('Starting tests...');
        this.showTestPanel();

        for (let i = 0; i < this.allTests.length; i++) {
            this.currentTestIndex = i;
            const test = this.allTests[i];
            
            try {
                await this.runSingleTest(test);
                
                // Check for consecutive failures
                if (this.consecutiveFailures >= 3) {
                    const shouldContinue = confirm(
                        `Encountered ${this.consecutiveFailures} consecutive failures.\n\n` +
                        `Continue testing?`
                    );
                    if (!shouldContinue) {
                        this.updateStatus('Testing stopped by user');
                        break;
                    }
                    this.consecutiveFailures = 0;
                }
                
                // Small delay to avoid rate limiting
                await this.sleep(500);
            } catch (error) {
                this.recordFailure(test, error.message);
                this.consecutiveFailures++;
            }
        }

        this.isRunning = false;
        this.showSummary();
    }

    async runSingleTest(test) {
        const { tabName, fieldKey, fieldType, testValue, itemId } = test;
        
        this.updateStatus(`Testing ${tabName} → ${fieldKey}...`);
        this.updateTestProgress(test, 'testing');

        try {
            // Step 1: Switch to the tab
            await this.switchToTab(tabName);
            await this.sleep(500);

            // Step 2: Find the test item row
            const row = await this.findTestItemRow(tabName, itemId);
            if (!row) {
                throw new Error(`Test item row not found for ${tabName} ${itemId}`);
            }

            // Step 3: Find the cell and get original value
            const cell = row.querySelector(`[data-field="${fieldKey}"]`);
            if (!cell) {
                throw new Error(`Cell not found for field ${fieldKey}`);
            }

            // Skip published fields that use toggle buttons
            if (fieldKey === 'published' && fieldType === 'boolean') {
                const toggle = row.querySelector('.published-toggle');
                if (toggle) {
                    // Use toggle instead
                    const originalValue = this.getPublishedValue(row);
                    const newValue = !originalValue;
                    toggle.click();
                    await this.sleep(300);
                    
                    // Sync
                    await this.syncTab(tabName);
                    
                    // Verify
                    await this.verifyField(tabName, fieldKey, itemId, newValue, test);
                    return;
                }
            }

            // Step 4: Make the edit
            await this.editCell(cell, tabName, itemId, fieldKey, testValue, fieldType);
            await this.sleep(300);

            // Step 5: Sync to Canvas (mandatory)
            await this.syncTab(tabName);

            // Step 6: Verify by fetching from Canvas
            const verificationResult = await this.verifyField(tabName, fieldKey, itemId, testValue, test);
            if (!verificationResult.success) {
                this.recordFailure(test, verificationResult.error || 'Verification failed', verificationResult.actualValue);
                throw new Error(verificationResult.error || 'Verification failed');
            }

        } catch (error) {
            // If we don't have actual value yet, try to get it
            let actualValue = null;
            try {
                const fetched = await this.fetchItemForVerification(tabName, itemId);
                actualValue = this.extractFieldValue(fetched, fieldKey, test.fieldType);
            } catch (e) {
                // Ignore if we can't fetch
            }
            this.recordFailure(test, error.message, actualValue);
            throw error;
        }
    }

    async switchToTab(tabName) {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (!tabButton) {
            throw new Error(`Tab button not found for ${tabName}`);
        }
        tabButton.click();
        await this.sleep(500);
    }

    async findTestItemRow(tabName, itemId) {
        const tabContent = document.getElementById(`${tabName}-content`);
        if (!tabContent) {
            // Try alternative selector
            const tab = document.querySelector(`#tab-${tabName}`);
            if (tab) {
                const table = tab.querySelector('table');
                if (table) {
                    // Search in table
                    let row = Array.from(table.querySelectorAll('tr')).find(r => {
                        const cell = r.querySelector(`[data-item-id="${itemId}"]`);
                        const checkbox = r.querySelector(`input[data-id="${itemId}"], input[data-tab="${tabName}"][data-id="${itemId}"]`);
                        return cell || checkbox;
                    });
                    return row;
                }
            }
            return null;
        }

        // Try different selectors
        let row = tabContent.querySelector(`tr[data-item-id="${itemId}"]`);
        if (!row) {
            row = tabContent.querySelector(`[data-item-id="${itemId}"]`)?.closest('tr');
        }
        if (!row) {
            row = Array.from(tabContent.querySelectorAll('tr')).find(r => {
                const checkbox = r.querySelector(`input[data-id="${itemId}"], input[data-tab="${tabName}"][data-id="${itemId}"]`);
                return checkbox !== null;
            });
        }
        if (!row) {
            // Last resort: search by text content for [TEST] items
            row = Array.from(tabContent.querySelectorAll('tr')).find(r => {
                const text = r.textContent || '';
                return text.includes('[TEST]') && text.includes(String(itemId));
            });
        }
        return row;
    }

    async editCell(cell, tabName, itemId, fieldKey, testValue, fieldType) {
        // Click to start editing
        cell.click();
        await this.sleep(200);

        // Find the input element
        let input = cell.querySelector('.cell-input, .cell-select, input[type="checkbox"], input[type="datetime-local"], input[type="number"], input[type="text"], select');
        if (!input) {
            throw new Error('Input element not found after clicking cell');
        }

        // Set the value based on type
        if (input.type === 'checkbox') {
            input.checked = testValue;
            input.dispatchEvent(new Event('change'));
        } else if (input.tagName === 'SELECT') {
            input.value = testValue;
            input.dispatchEvent(new Event('change'));
        } else {
            input.value = testValue;
            input.dispatchEvent(new Event('input'));
        }

        // Finish editing (blur or Enter)
        if (input.type !== 'checkbox' && input.tagName !== 'SELECT') {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
        input.blur();
        await this.sleep(300);
    }

    async syncTab(tabName) {
        // Check if there are changes to sync
        const changes = (window.changes && window.changes[tabName]) || {};
        if (Object.keys(changes).length === 0) {
            return; // No changes to sync
        }

        const syncBtn = document.getElementById(`sync-${tabName}`);
        if (!syncBtn) {
            // Try calling syncChanges function directly if it exists
            if (typeof window.syncChanges === 'function') {
                await window.syncChanges(tabName);
                await this.sleep(2000); // Wait for sync to complete
                return;
            }
            throw new Error(`Sync button not found for ${tabName}`);
        }

        if (syncBtn.disabled) {
            throw new Error(`Sync button is disabled for ${tabName} - no changes to sync`);
        }

        syncBtn.click();
        
        // Wait for sync to complete
        let attempts = 0;
        const originalText = syncBtn.textContent;
        while ((syncBtn.textContent.includes('Syncing') || syncBtn.disabled) && attempts < 60) {
            await this.sleep(500);
            attempts++;
        }
        
        if (attempts >= 60) {
            throw new Error('Sync timed out after 30 seconds');
        }
        
        // Wait a bit more for API to process
        await this.sleep(1500);
    }

    async fetchItemForVerification(tabName, itemId) {
        if (tabName === 'pages') {
            const response = await fetch(`/canvas/courses/${this.courseId}/pages/${encodeURIComponent(itemId)}`);
            if (!response.ok) throw new Error(`Failed to fetch page: ${response.status}`);
            return await response.json();
        } else if (tabName === 'quizzes') {
            const response = await fetch(`/canvas/courses/${this.courseId}/quizzes/${itemId}`);
            if (!response.ok) throw new Error(`Failed to fetch quiz: ${response.status}`);
            return await response.json();
        } else if (tabName === 'assignments') {
            const response = await fetch(`/canvas/courses/${this.courseId}/assignments/${itemId}`);
            if (!response.ok) throw new Error(`Failed to fetch assignment: ${response.status}`);
            return await response.json();
        } else if (tabName === 'discussions' || tabName === 'announcements') {
            const response = await fetch(`/canvas/courses/${this.courseId}/discussions/${itemId}`);
            if (!response.ok) throw new Error(`Failed to fetch discussion: ${response.status}`);
            return await response.json();
        } else if (tabName === 'modules') {
            const response = await fetch(`/canvas/courses/${this.courseId}/modules/${itemId}`);
            if (!response.ok) throw new Error(`Failed to fetch module: ${response.status}`);
            return await response.json();
        }
        throw new Error(`Unknown tab name: ${tabName}`);
    }

    async verifyField(tabName, fieldKey, itemId, expectedValue, test) {
        // Fetch the item from Canvas
        let fetchedItem;
        try {
            fetchedItem = await this.fetchItemForVerification(tabName, itemId);
        } catch (error) {
            return {
                success: false,
                error: `Failed to fetch item for verification: ${error.message}`,
                actualValue: null
            };
        }

        // Compare values
        const actualValue = this.extractFieldValue(fetchedItem, fieldKey, test.fieldType);
        const matches = this.compareValues(actualValue, expectedValue, test.fieldType);

        if (matches) {
            this.recordSuccess(test, actualValue);
            return { success: true, actualValue };
        } else {
            return {
                success: false,
                error: `Value mismatch. Expected: ${expectedValue}, Got: ${actualValue}`,
                actualValue
            };
        }
    }

    extractFieldValue(item, fieldKey, fieldType) {
        let value = item[fieldKey];
        
        // Handle nested fields
        if (fieldKey === 'due_at' && item.assignment) {
            value = item.assignment.due_at || value;
        }
        
        // Convert to appropriate type
        if (fieldType === 'boolean') {
            return value === true || value === 'true' || value === 1;
        } else if (fieldType === 'number') {
            return value != null ? Number(value) : null;
        } else if (fieldType === 'datetime') {
            return value ? new Date(value).toISOString().slice(0, 16) : null;
        }
        
        return value;
    }

    compareValues(actual, expected, fieldType) {
        if (fieldType === 'boolean') {
            return actual === expected;
        } else if (fieldType === 'number') {
            return Number(actual) === Number(expected);
        } else if (fieldType === 'datetime') {
            // Compare dates (allow small differences due to timezone)
            const actualDate = actual ? new Date(actual).getTime() : null;
            const expectedDate = expected ? new Date(expected).getTime() : null;
            if (!actualDate || !expectedDate) return actualDate === expectedDate;
            // Allow 1 hour difference for timezone issues
            return Math.abs(actualDate - expectedDate) < 3600000;
        }
        return String(actual) === String(expected);
    }

    getPublishedValue(row) {
        const toggle = row.querySelector('.published-toggle');
        if (toggle) {
            return toggle.textContent.includes('✓');
        }
        return false;
    }

    recordSuccess(test, actualValue = null) {
        this.results.total++;
        this.results.passed++;
        
        if (!this.results.details[test.tabName]) {
            this.results.details[test.tabName] = { total: 0, passed: 0, failed: 0, issues: [] };
        }
        this.results.details[test.tabName].total++;
        this.results.details[test.tabName].passed++;
        
        this.consecutiveFailures = 0;
        this.updateTestProgress(test, 'passed');
        
        // Save to test reports
        this.saveTestReport({
            tab: test.tabName,
            parameter: test.fieldKey,
            result: 'PASS',
            timestamp: new Date().toISOString(),
            expectedValue: test.testValue,
            actualValue: actualValue || test.testValue,
            errorMessage: null
        });
    }

    recordFailure(test, errorMessage, actualValue = null) {
        this.results.total++;
        this.results.failed++;
        
        if (!this.results.details[test.tabName]) {
            this.results.details[test.tabName] = { total: 0, passed: 0, failed: 0, issues: [] };
        }
        this.results.details[test.tabName].total++;
        this.results.details[test.tabName].failed++;
        this.results.details[test.tabName].issues.push(`${test.fieldKey}: ${errorMessage}`);
        
        this.results.errors.push(`${test.tabName}.${test.fieldKey}: ${errorMessage}`);
        this.consecutiveFailures++;
        this.updateTestProgress(test, 'failed', errorMessage);
        
        // Save to test reports
        this.saveTestReport({
            tab: test.tabName,
            parameter: test.fieldKey,
            result: 'FAIL',
            timestamp: new Date().toISOString(),
            expectedValue: test.testValue,
            actualValue: actualValue,
            errorMessage: errorMessage
        });
    }

    updateStatus(message) {
        const statusEl = document.getElementById('testStatus');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.log(`[TEST] ${message}`);
    }

    updateTestProgress(test, status, errorMessage = '') {
        const progressEl = document.getElementById('testProgress');
        if (!progressEl) return;

        const testEl = document.getElementById(`test-${test.tabName}-${test.fieldKey}`);
        if (!testEl) {
            // Create test result element
            const div = document.createElement('div');
            div.id = `test-${test.tabName}-${test.fieldKey}`;
            div.className = `test-result test-${status}`;
            div.innerHTML = `
                <span class="test-icon">${status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏳'}</span>
                <span class="test-label">${test.tabName} → ${test.fieldKey}</span>
                ${errorMessage ? `<span class="test-error">${errorMessage}</span>` : ''}
            `;
            progressEl.appendChild(div);
        } else {
            testEl.className = `test-result test-${status}`;
            const icon = testEl.querySelector('.test-icon');
            if (icon) {
                icon.textContent = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏳';
            }
            if (errorMessage) {
                let errorSpan = testEl.querySelector('.test-error');
                if (!errorSpan) {
                    errorSpan = document.createElement('span');
                    errorSpan.className = 'test-error';
                    testEl.appendChild(errorSpan);
                }
                errorSpan.textContent = errorMessage;
            }
        }

        // Update progress bar
        const progressBar = document.getElementById('testProgressBar');
        if (progressBar) {
            const percent = ((this.results.total) / this.allTests.length) * 100;
            progressBar.style.width = `${percent}%`;
        }

        const progressText = document.getElementById('testProgressText');
        if (progressText) {
            progressText.textContent = `${this.results.total}/${this.allTests.length} tests completed`;
        }
    }

    showTestPanel() {
        let panel = document.getElementById('testPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'testPanel';
            panel.className = 'test-panel';
            panel.innerHTML = `
                <div class="test-panel-header">
                    <h2>🧪 Editing Features Test</h2>
                    <button class="test-close-btn" onclick="tester.closePanel()">×</button>
                </div>
                <div class="test-panel-content">
                    <div id="testStatus" class="test-status">Initializing...</div>
                    <div class="test-progress-container">
                        <div class="test-progress-bar">
                            <div id="testProgressBar" class="test-progress-fill"></div>
                        </div>
                        <div id="testProgressText" class="test-progress-text">0/0 tests</div>
                    </div>
                    <div id="testProgress" class="test-results-list"></div>
                </div>
            `;
            document.body.appendChild(panel);
        }
        panel.classList.add('active');
    }

    closePanel() {
        const panel = document.getElementById('testPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    showSummary() {
        const panel = document.getElementById('testPanel');
        if (!panel) return;

        const summary = document.createElement('div');
        summary.className = 'test-summary';
        summary.innerHTML = `
            <h3>Test Summary</h3>
            <div class="test-summary-stats">
                <div>Total: ${this.results.total}</div>
                <div class="test-passed">Passed: ${this.results.passed}</div>
                <div class="test-failed">Failed: ${this.results.failed}</div>
                <div>Success Rate: ${this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(1) : 0}%</div>
            </div>
            <h4>Results by Tab:</h4>
            <div class="test-tab-results">
                ${Object.keys(this.results.details).map(tabName => {
                    const tab = this.results.details[tabName];
                    const rate = tab.total > 0 ? ((tab.passed / tab.total) * 100).toFixed(1) : 0;
                    return `
                        <div class="test-tab-result">
                            <strong>${tabName}:</strong> ${tab.passed}/${tab.total} passed (${rate}%)
                            ${tab.issues.length > 0 ? `
                                <ul class="test-issues">
                                    ${tab.issues.map(issue => `<li>${issue}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="test-actions">
                <button class="test-btn" onclick="tester.closePanel()">Close</button>
                <button class="test-btn test-btn-primary" onclick="tester.exportResults()">Export Results</button>
            </div>
        `;

        const content = panel.querySelector('.test-panel-content');
        if (content) {
            content.appendChild(summary);
        }
    }

    exportResults() {
        const dataStr = JSON.stringify(this.results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `test-results-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveTestReport(report) {
        try {
            let reports = JSON.parse(localStorage.getItem('testReports') || '[]');
            reports.push(report);
            // Keep only last 1000 reports to avoid localStorage size limits
            if (reports.length > 1000) {
                reports = reports.slice(-1000);
            }
            localStorage.setItem('testReports', JSON.stringify(reports));
            
            // Update the test reports tab if it exists
            if (typeof window.displayTestReports === 'function') {
                window.displayTestReports();
            }
        } catch (error) {
            console.error('Failed to save test report:', error);
        }
    }

    static getTestReports() {
        try {
            return JSON.parse(localStorage.getItem('testReports') || '[]');
        } catch (error) {
            console.error('Failed to load test reports:', error);
            return [];
        }
    }

    static clearTestReports() {
        localStorage.removeItem('testReports');
        if (typeof window.displayTestReports === 'function') {
            window.displayTestReports();
        }
    }
}

// Global tester instance
let tester = new EditingFeatureTester();

// Initialize tester when DOM is ready
if (typeof window !== 'undefined') {
    window.tester = tester;
}

