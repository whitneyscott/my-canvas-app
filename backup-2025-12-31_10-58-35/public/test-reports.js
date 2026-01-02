/**
 * Test Reports Display Module
 * Handles displaying test reports in a dedicated tab
 */

function displayTestReports() {
    const reports = EditingFeatureTester.getTestReports();
    const tabContent = document.getElementById('test-reports-content');
    
    if (!tabContent) {
        console.warn('Test reports tab content not found');
        return;
    }

    if (reports.length === 0) {
        tabContent.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #666;">
                <p style="font-size: 18px; margin-bottom: 10px;">No test reports yet</p>
                <p style="font-size: 14px;">Run tests to generate reports</p>
            </div>
        `;
        return;
    }

    // Sort by timestamp (newest first)
    const sortedReports = [...reports].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Build table HTML
    let tableHTML = `
        <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>Total Reports:</strong> ${reports.length}
                <span style="margin-left: 20px; color: #155724;">
                    <strong>Passed:</strong> ${reports.filter(r => r.result === 'PASS').length}
                </span>
                <span style="margin-left: 20px; color: #721c24;">
                    <strong>Failed:</strong> ${reports.filter(r => r.result === 'FAIL').length}
                </span>
            </div>
            <button onclick="clearTestReports()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Clear All Reports
            </button>
        </div>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #dee2e6;">Tab</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #dee2e6;">Parameter</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #dee2e6;">Result</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #dee2e6;">Timestamp</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #dee2e6;">Expected Value</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #dee2e6;">Actual Value</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600;">Error Message</th>
                    </tr>
                </thead>
                <tbody>
    `;

    sortedReports.forEach((report, index) => {
        const resultClass = report.result === 'PASS' ? 'passed' : 'failed';
        const resultColor = report.result === 'PASS' ? '#155724' : '#721c24';
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        
        const timestamp = new Date(report.timestamp).toLocaleString();
        const expectedValue = formatValue(report.expectedValue);
        const actualValue = formatValue(report.actualValue);
        const errorMessage = report.errorMessage || '-';

        tableHTML += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; border-right: 1px solid #dee2e6; text-transform: capitalize;">${report.tab}</td>
                <td style="padding: 10px; border-right: 1px solid #dee2e6; font-family: monospace; font-size: 12px;">${report.parameter}</td>
                <td style="padding: 10px; border-right: 1px solid #dee2e6;">
                    <span style="color: ${resultColor}; font-weight: 600;">${report.result}</span>
                </td>
                <td style="padding: 10px; border-right: 1px solid #dee2e6; font-size: 12px; color: #666;">${timestamp}</td>
                <td style="padding: 10px; border-right: 1px solid #dee2e6; font-family: monospace; font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(String(expectedValue))}">${escapeHtml(String(expectedValue))}</td>
                <td style="padding: 10px; border-right: 1px solid #dee2e6; font-family: monospace; font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(String(actualValue))}">${escapeHtml(String(actualValue))}</td>
                <td style="padding: 10px; font-size: 12px; color: ${report.errorMessage ? '#721c24' : '#666'}; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(errorMessage)}">${escapeHtml(errorMessage)}</td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    tabContent.innerHTML = tableHTML;
}

function formatValue(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function clearTestReports() {
    if (confirm('Are you sure you want to clear all test reports? This cannot be undone.')) {
        EditingFeatureTester.clearTestReports();
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.displayTestReports = displayTestReports;
    window.clearTestReports = clearTestReports;
}

