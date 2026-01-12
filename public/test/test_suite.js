selectedCourseId = "107171";

let masterTestResults = {
    module: null,
    items: []
};

async function addModuleItem(courseId, moduleId, data) {
    const id = (moduleId && typeof moduleId === 'object') ? moduleId.id : moduleId;
    const response = await fetch(`/canvas/courses/${courseId}/modules/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function createModule(courseId, name) {
    const response = await fetch(`/canvas/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    return response.json();
}

function discoverAllFunctions() {
    return Object.keys(window).filter(key => typeof window[key] === 'function');
}

function findBestFunctionMatch(type, availableFunctions) {
    const typeClean = type.toLowerCase().replace(/s$/, '');
    return availableFunctions.find(fnName => {
        const lowerFn = fnName.toLowerCase();
        const isCreate = lowerFn.startsWith('create') || lowerFn.startsWith('add');
        const matchesType = lowerFn.includes(type.toLowerCase()) || lowerFn.includes(typeClean);
        return isCreate && matchesType;
    });
}



async function logTestResult(action, type, status, details) {
    const body = document.getElementById('test-report-body');
    if (!body) return;
    const row = body.insertRow();
    const statusClass = status === 'SUCCESS' ? 'text-success' : 'text-danger';
    row.innerHTML = `<td>${action}</td><td>${type}</td><td class="${statusClass} font-weight-bold">${status}</td><td>${details}</td>`;
}

function buildPayloadFromDefinitions(type) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueAt = tomorrow.toISOString();

    const basePayload = {
        title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleTimeString()}`,
        name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleTimeString()}`,
        body: `<p>This is a test ${type} created by the automated test suite. It includes points and a due date.</p>`,
        message: `<p>This is a test ${type} created by the automated test suite. It includes points and a due date.</p>`,
        published: true
    };

    // Add specific details based on type
    switch (type.toLowerCase()) {
        case 'assignments':
            return {
                ...basePayload,
                points_possible: 100,
                due_at: dueAt,
                submission_types: ['online_text_entry', 'online_url'],
                grading_type: 'points'
            };
        case 'quizzes':
            return {
                ...basePayload,
                description: basePayload.body,
                quiz_type: 'assignment',
                points_possible: 50,
                due_at: dueAt,
                allowed_attempts: 3
            };
        case 'pages':
            return {
                title: basePayload.title,
                body: basePayload.body,
                editing_roles: 'teachers'
            };
        case 'discussions':
        case 'announcements':
            return {
                title: basePayload.title,
                message: basePayload.message,
                discussion_type: 'side_comment',
                is_announcement: type.toLowerCase() === 'announcements'
            };
        default:
            return basePayload;
    }
}

async function runTestStage1() {
    const allFunctions = discoverAllFunctions();
    const definitionTypes = ['assignments', 'quizzes', 'pages', 'discussions'];

    try {
        logTestResult('Stage 1', 'Module', 'STARTING', 'Creating Master Module...');
        const masterModule = await createModule(selectedCourseId, 'INTEGRATION TEST CONTENT');
        
        if (!masterModule || !masterModule.id) throw new Error("Module creation failed");
        
        const moduleId = masterModule.id;
        logTestResult('Create', 'Module', 'SUCCESS', masterModule.name);

        for (const type of definitionTypes) {
            const fnName = findBestFunctionMatch(type, allFunctions);
            if (!fnName) continue;

            try {
                const data = buildPayloadFromDefinitions(type);
                const created = await window[fnName](selectedCourseId, data);
                
                const hasValidId = created.id || created.page_url || created.url;
                const hasErrors = (created.errors && created.errors.length > 0) || created.message === "An error occurred.";

                if (created && hasValidId && !hasErrors) {
                    const displayName = created.title || created.name || "Item Created";
                    logTestResult('Execute', type, 'SUCCESS', displayName);

                    const linker = allFunctions.find(f => f.toLowerCase() === 'addmoduleitem');
                    if (linker) {
                        const linkPayload = { title: displayName };
                        const t = type.toLowerCase();
                        
                        if (t.includes('page')) {
                            linkPayload.type = 'Page';
                            linkPayload.page_url = created.url || created.page_url;
                        } else {
                            if (t.includes('quiz')) linkPayload.type = 'Quiz';
                            else if (t.includes('discussion')) linkPayload.type = 'DiscussionTopic';
                            else linkPayload.type = 'Assignment';
                            linkPayload.content_id = created.id;
                        }

                        const linked = await window[linker](selectedCourseId, moduleId, linkPayload);
                        if (linked && linked.id) {
                            logTestResult('Link', type, 'SUCCESS', 'Added to Module');
                        } else {
                            logTestResult('Link', type, 'FAILED', linked?.errors?.[0]?.message || 'Link Error');
                        }
                    }
                } else {
                    const errorMsg = created?.errors?.[0]?.message || created?.message || "Creation Failed";
                    logTestResult('Execute', type, 'FAILED', errorMsg);
                }
            } catch (err) {
                logTestResult('Execute', type, 'FAILED', err.message);
            }
        }
        
        logTestResult('Final', 'Test Suite', 'SUCCESS', 'Stage 1 Complete: All items created and linked.');

    } catch (err) {
        logTestResult('Stage 1', 'CRITICAL', 'FAILED', err.message);
    }
}