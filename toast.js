// toast.js - 修复版（支持 i18n 翻译）
(function() {
    'use strict';

    // ========== Toast Notification ==========
    function showToast(message, type = 'success') {
        // 🔥 确保 i18n 已加载，否则等待
        let translatedMessage = message;
        
        if (window.i18n && typeof window.i18n.t === 'function') {
            translatedMessage = window.i18n.t(message);
        } else {
            // 如果 i18n 还未加载，尝试从 TRANSLATIONS 直接获取
            try {
                const lang = localStorage.getItem('app_lang') || 'en';
                // 尝试从 i18n 的 TRANSLATIONS 中获取
                if (window.i18n && window.i18n.TRANSLATIONS) {
                    const translations = window.i18n.TRANSLATIONS;
                    translatedMessage = translations[lang]?.[message] || 
                                       translations['en']?.[message] || 
                                       message;
                }
            } catch (e) {
                // 静默失败，使用原始消息
            }
        }
        
        const existingToast = document.querySelector('.custom-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `custom-toast custom-toast-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icon}"></i></div>
            <div class="toast-message">${translatedMessage}</div>
            <div class="toast-progress"></div>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========== Confirm Dialog ==========
    function showConfirm(title, message, onConfirm, onCancel) {
        const t = window.i18n?.t || function(key) { return key; };
        const translatedTitle = t(title);
        const translatedMessage = t(message);
        
        const existingModal = document.querySelector('.custom-confirm');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'custom-confirm';
        modal.innerHTML = `
            <div class="confirm-overlay"></div>
            <div class="confirm-content">
                <div class="confirm-title">${translatedTitle}</div>
                <div class="confirm-message">${translatedMessage}</div>
                <div class="confirm-buttons">
                    <button class="confirm-btn confirm-cancel">${t('cancel')}</button>
                    <button class="confirm-btn confirm-ok">${t('confirm')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        modal.querySelector('.confirm-cancel').onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            if (onCancel) onCancel();
        };
        
        modal.querySelector('.confirm-ok').onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            if (onConfirm) onConfirm();
        };
        
        modal.querySelector('.confirm-overlay').onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            if (onCancel) onCancel();
        };
    }

    // ========== Prompt Dialog ==========
    function showPrompt(title, placeholder, callback) {
        const t = window.i18n?.t || function(key) { return key; };
        const translatedTitle = t(title);
        const translatedPlaceholder = t(placeholder);
        
        const existingModal = document.querySelector('.custom-prompt');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'custom-prompt';
        modal.innerHTML = `
            <div class="prompt-overlay"></div>
            <div class="prompt-content">
                <div class="prompt-title">${translatedTitle}</div>
                <input type="text" class="prompt-input" placeholder="${translatedPlaceholder}">
                <div class="prompt-buttons">
                    <button class="prompt-btn prompt-cancel">${t('cancel')}</button>
                    <button class="prompt-btn prompt-ok">${t('confirm')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        const input = modal.querySelector('.prompt-input');
        input.focus();
        
        modal.querySelector('.prompt-cancel').onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            if (callback) callback(null);
        };
        
        modal.querySelector('.prompt-ok').onclick = () => {
            const value = input.value.trim();
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            if (callback) callback(value);
        };
        
        modal.querySelector('.prompt-overlay').onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            if (callback) callback(null);
        };
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                modal.querySelector('.prompt-ok').click();
            }
        });
    }

    // ========== Global alert interceptor ==========
    window.originalAlert = window.alert;
    window.alert = function(message) {
        const t = window.i18n?.t || function(key) { return key; };
        showToast(t(message) || message, 'info');
    };

    // 暴露到全局
    window.showToast = showToast;
    window.showConfirm = showConfirm;
    window.showPrompt = showPrompt;

    console.log('✅ toast.js loaded with i18n support');
})();