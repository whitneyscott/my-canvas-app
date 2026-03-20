// Authentication handling for the Canvas Manager
async function checkAuthentication() {
    try {
        const response = await fetch('/auth/status');
        const status = await response.json();

        if (status && status.needsToken === true) {
            if (status.needsOAuth) {
                showOAuthOverlay();
            } else {
                showLoginModal(status);
            }
        } else {
            showApp();
        }
    } catch (err) {
        console.error('Auth check error:', err);
        showFlashError('Authentication system error. Please refresh the page.');
    }
}

function showOAuthOverlay() {
    const overlay = document.getElementById('oauth-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function showLoginModal(status) {
    const oauthOverlay = document.getElementById('oauth-overlay');
    if (oauthOverlay) oauthOverlay.style.display = 'none';
    const overlay = document.getElementById('token-overlay');
    const loginForm = document.getElementById('loginForm');
    const canvasUrlInput = document.getElementById('canvasUrl');
    const loginError = document.getElementById('loginError');
    
    if (overlay && loginForm && canvasUrlInput) {
        canvasUrlInput.value = status.defaultUrl || 'https://canvas.instructure.com/api/v1';
        
        overlay.style.display = 'flex';
        loginError.style.display = 'none';
    }
}

function closeLoginModal() {
    const overlay = document.getElementById('token-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

async function submitLogin() {
    const canvasUrlInput = document.getElementById('canvasUrl');
    const canvasTokenInput = document.getElementById('canvasToken');
    const loginError = document.getElementById('loginError');
    const loginForm = document.getElementById('loginForm');
    
    const canvasUrl = canvasUrlInput.value.trim();
    const token = canvasTokenInput.value.trim();
    
    if (!canvasUrl || !token) {
        showError('Please enter both Canvas URL and API token.');
        return;
    }
    
    // Disable form during submission
    loginForm.style.opacity = '0.5';
    loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    
    try {
        const response = await fetch('/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: token,
                canvasUrl: canvasUrl
            })
        });
        
        if (response.ok) {
            // Success - the server will redirect us back to the app
            window.location.reload();
        } else {
            const result = await response.json();
            showError(result.message || 'Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        // Re-enable form
        loginForm.style.opacity = '1';
        loginForm.querySelectorAll('input, button').forEach(el => el.disabled = false);
    }
}

function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    }
}

function showApp() {
    const oauthOverlay = document.getElementById('oauth-overlay');
    if (oauthOverlay) oauthOverlay.style.display = 'none';
    const overlay = document.getElementById('token-overlay');
    const wrapper = document.getElementById('main-app-wrapper');
    
    if (overlay) overlay.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';
    
    if (typeof initializeGrid === 'function') initializeGrid();
    if (typeof loadCourses === 'function') {
        loadCourses().then(() => {
            if (typeof gridApi !== 'undefined' && gridApi && !selectedCourseId) gridApi.showNoRowsOverlay();
        });
    }
}

function showFlashError(message) {
    const overlay = document.getElementById('token-overlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    overlay.style.background = 'rgba(139, 0, 0, 0.95)';
    overlay.innerHTML = `
        <div style="background: white; padding: 3rem; border-radius: 8px; border: 5px solid red;">
            <h1 style="color: red; margin: 0;">ACCESS BLOCKED</h1>
            <p style="font-size: 1.2rem; font-weight: bold;">${message}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">Retry Connection</button>
        </div>
    `;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitLogin();
        });
    }
    
    // Initialize authentication check
    checkAuthentication();
});