// In-app dialog system: replaces browser alert/confirm/prompt with styled in-app UI.
// Must be loaded before all other scripts so the overrides are in place early.
(function () {

    // ── Toast ───────────────────────────────────────────────────────────────
    function appToast(message, type) {
        type = type || 'info';
        var container = document.getElementById('app-toast-container');
        if (!container) { return; }
        var toast = document.createElement('div');
        toast.className = 'app-toast app-toast-' + type;
        toast.textContent = String(message || '');
        container.appendChild(toast);
        requestAnimationFrame(function () {
            toast.classList.add('app-toast-visible');
        });
        setTimeout(function () {
            toast.classList.remove('app-toast-visible');
            setTimeout(function () {
                if (toast.parentNode) { toast.parentNode.removeChild(toast); }
            }, 350);
        }, 3800);
    }

    // ── Alert (replaces window.alert) ───────────────────────────────────────
    function appAlert(message, type) {
        var msg = String(message || '');
        var t = type;
        if (!t) {
            var lo = msg.toLowerCase();
            if (lo.indexOf('success') !== -1 || lo.indexOf('saved') !== -1 || lo.indexOf('done') !== -1 || lo.indexOf('deleted') !== -1) {
                t = 'success';
            } else if (lo.indexOf('fail') !== -1 || lo.indexOf('error') !== -1 || lo.indexOf('invalid') !== -1) {
                t = 'error';
            } else if (lo.indexOf('warn') !== -1) {
                t = 'warning';
            } else {
                t = 'info';
            }
        }
        appToast(msg, t);
    }

    // ── Shared: ensure overlay is body-level (avoids stacking context issues) ──
    function ensureBodyChild(el) {
        if (el && el.parentNode !== document.body) {
            document.body.appendChild(el);
        }
    }

    // ── Confirm (in-app modal, callback-based) ──────────────────────────────
    var confirmKeyHandler = null; // track active keydown handler

    function appConfirm(message, onConfirm, onCancel) {
        var overlay   = document.getElementById('app-confirm-overlay');
        var msgEl     = document.getElementById('app-confirm-message');
        var btnOk     = document.getElementById('app-confirm-ok');
        var btnCancel = document.getElementById('app-confirm-cancel');

        // Fallback to native if DOM not ready
        if (!overlay || !msgEl || !btnOk || !btnCancel) {
            if (window._nativeConfirm(String(message || ''))) {
                if (typeof onConfirm === 'function') { onConfirm(); }
            } else {
                if (typeof onCancel === 'function') { onCancel(); }
            }
            return;
        }

        // Ensure overlay is a direct body child (avoids parent transform/overflow issues)
        ensureBodyChild(overlay);

        // Remove any stale keydown handler
        if (confirmKeyHandler) {
            document.removeEventListener('keydown', confirmKeyHandler);
            confirmKeyHandler = null;
        }

        msgEl.textContent = String(message || '');
        overlay.style.display = 'flex';

        function cleanup() {
            overlay.style.display = 'none';
            btnOk.onclick     = null;
            btnCancel.onclick = null;
            overlay.onclick   = null;
            if (confirmKeyHandler) {
                document.removeEventListener('keydown', confirmKeyHandler);
                confirmKeyHandler = null;
            }
        }

        btnOk.onclick = function (e) {
            e.stopPropagation();
            cleanup();
            if (typeof onConfirm === 'function') { onConfirm(); }
        };
        btnCancel.onclick = function (e) {
            e.stopPropagation();
            cleanup();
            if (typeof onCancel === 'function') { onCancel(); }
        };
        overlay.onclick = function (e) {
            if (e.target === overlay) {
                cleanup();
                if (typeof onCancel === 'function') { onCancel(); }
            }
        };

        confirmKeyHandler = function (e) {
            if (e.key === 'Escape') {
                cleanup();
                if (typeof onCancel === 'function') { onCancel(); }
            } else if (e.key === 'Enter') {
                cleanup();
                if (typeof onConfirm === 'function') { onConfirm(); }
            }
        };
        document.addEventListener('keydown', confirmKeyHandler);
    }

    // ── Prompt (in-app modal with text input, callback-based) ───────────────
    var promptKeyHandler = null;

    function appPrompt(message, defaultValue, onOk, onCancel) {
        var overlay   = document.getElementById('app-prompt-overlay');
        var msgEl     = document.getElementById('app-prompt-message');
        var inputEl   = document.getElementById('app-prompt-input');
        var btnOk     = document.getElementById('app-prompt-ok');
        var btnCancel = document.getElementById('app-prompt-cancel');

        // Fallback to native prompt
        if (!overlay || !msgEl || !inputEl || !btnOk || !btnCancel) {
            var result = window._nativePrompt(String(message || ''), String(defaultValue || ''));
            if (result !== null) {
                if (typeof onOk === 'function') { onOk(result); }
            } else {
                if (typeof onCancel === 'function') { onCancel(); }
            }
            return;
        }

        ensureBodyChild(overlay);

        if (promptKeyHandler) {
            document.removeEventListener('keydown', promptKeyHandler);
            promptKeyHandler = null;
        }

        msgEl.textContent = String(message || '');
        inputEl.value = String(defaultValue || '');
        overlay.style.display = 'flex';

        // Focus input after display
        setTimeout(function () { inputEl.focus(); inputEl.select(); }, 30);

        function cleanup() {
            overlay.style.display = 'none';
            btnOk.onclick     = null;
            btnCancel.onclick = null;
            overlay.onclick   = null;
            if (promptKeyHandler) {
                document.removeEventListener('keydown', promptKeyHandler);
                promptKeyHandler = null;
            }
        }

        function doOk() {
            var val = inputEl.value;
            cleanup();
            if (typeof onOk === 'function') { onOk(val); }
        }
        function doCancel() {
            cleanup();
            if (typeof onCancel === 'function') { onCancel(); }
        }

        btnOk.onclick = function (e) { e.stopPropagation(); doOk(); };
        btnCancel.onclick = function (e) { e.stopPropagation(); doCancel(); };
        overlay.onclick = function (e) { if (e.target === overlay) { doCancel(); } };

        promptKeyHandler = function (e) {
            if (e.key === 'Escape') { doCancel(); }
            else if (e.key === 'Enter') { doOk(); }
        };
        document.addEventListener('keydown', promptKeyHandler);
    }

    // ── Override native browser dialogs ────────────────────────────────────
    window._nativeAlert   = window.alert;
    window._nativeConfirm = window.confirm;
    window._nativePrompt  = window.prompt;
    window.alert = function (message) { appAlert(String(message || '')); };
    // window.confirm and window.prompt are NOT globally overridden;
    // call sites use appConfirm() / appPrompt() directly for async callbacks.

    // ── Expose globally ─────────────────────────────────────────────────────
    window.appToast   = appToast;
    window.appAlert   = appAlert;
    window.appConfirm = appConfirm;
    window.appPrompt  = appPrompt;

}());
