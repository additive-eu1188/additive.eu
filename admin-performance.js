// admin-performance.js - 后台全局性能优化
// 在所有 admin 页面中引入此文件

(function() {
    'use strict';

    console.log('🚀 Performance optimization started');

    // ============================================================
    // 1. Frame Rate Monitor (FPS)
    // ============================================================
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let currentFps = 60;

    function monitorFps() {
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate >= 1000) {
            currentFps = Math.round(frameCount * 1000 / (now - lastFpsUpdate));
            if (currentFps < 30) {
                console.warn('⚠️ Low FPS detected:', currentFps, 'FPS');
                applyLowFpsOptimizations();
            }
            frameCount = 0;
            lastFpsUpdate = now;
        }
        requestAnimationFrame(monitorFps);
    }

    let lowFpsOptimized = false;

    function applyLowFpsOptimizations() {
        if (lowFpsOptimized) return;
        lowFpsOptimized = true;

        console.log('🔧 Applying low FPS optimizations...');

        document.querySelectorAll('.card, .stat-card, .quick-card').forEach(function(el) {
            el.style.transition = 'none';
        });

        document.querySelectorAll('.card, .stat-card').forEach(function(el) {
            el.style.boxShadow = 'none';
        });

        document.querySelectorAll('.modal-overlay, .modal-card, #creditScoreFill').forEach(function(el) {
            el.style.willChange = 'auto';
        });
    }

    // ============================================================
    // 2. Scroll Optimization (passive events)
    // ============================================================
    document.addEventListener('scroll', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });

    // ============================================================
    // 3. Throttle & Debounce
    // ============================================================
    window.throttle = function(func, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() { inThrottle = false; }, limit);
            }
        };
    };

    window.debounce = function(func, delay) {
        var timeoutId;
        return function() {
            var args = arguments;
            var context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function() {
                func.apply(context, args);
            }, delay);
        };
    };

    // ============================================================
    // 4. Batch DOM Updates
    // ============================================================
    var domBatchQueue = [];
    var domBatchPending = false;

    window.batchDomUpdate = function(callback) {
        domBatchQueue.push(callback);
        if (!domBatchPending) {
            domBatchPending = true;
            requestAnimationFrame(function() {
                var batch = domBatchQueue.slice();
                domBatchQueue = [];
                domBatchPending = false;
                for (var i = 0; i < batch.length; i++) {
                    try { batch[i](); } catch (e) {}
                }
            });
        }
    };

    // ============================================================
    // 5. Virtual Scroll (table optimization)
    // ============================================================
    var virtualScrollEnabled = false;

    function enableVirtualScroll(container) {
        if (!container) return;
        if (virtualScrollEnabled) return;

        var rows = container.querySelectorAll('tr');
        if (rows.length <= 50) return;

        virtualScrollEnabled = true;
        console.log('📊 Virtual scroll enabled (rows:', rows.length, ')');

        var rowHeight = 38;
        var containerHeight = container.clientHeight || 400;
        var startIndex = 0;

        function updateVisibleRows() {
            var scrollTop = container.scrollTop;
            startIndex = Math.floor(scrollTop / rowHeight);
            var endIndex = Math.min(startIndex + Math.ceil(containerHeight / rowHeight) + 5, rows.length);

            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (i >= startIndex && i < endIndex) {
                    row.style.display = '';
                    row.style.position = 'absolute';
                    row.style.top = (i * rowHeight) + 'px';
                    row.style.width = '100%';
                } else {
                    row.style.display = 'none';
                }
            }
        }

        container.style.position = 'relative';
        container.style.height = containerHeight + 'px';
        container.style.overflow = 'auto';

        var spacer = document.createElement('div');
        spacer.style.height = (rows.length * rowHeight) + 'px';
        spacer.style.pointerEvents = 'none';
        container.insertBefore(spacer, container.firstChild);

        container.addEventListener('scroll', window.throttle(updateVisibleRows, 50));
        updateVisibleRows();
    }

    window.enableVirtualScroll = enableVirtualScroll;

    // ============================================================
    // 6. Lazy Loading Images
    // ============================================================
    function enableLazyLoading() {
        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function(entries) {
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                }
            }, {
                rootMargin: '50px'
            });

            var images = document.querySelectorAll('img[data-src]');
            for (var j = 0; j < images.length; j++) {
                observer.observe(images[j]);
            }
        }
    }

    // ============================================================
    // 7. AbortController for requests
    // ============================================================
    var pendingRequests = [];

    window.abortPendingRequests = function() {
        for (var i = 0; i < pendingRequests.length; i++) {
            try { pendingRequests[i].abort(); } catch (e) {}
        }
        pendingRequests = [];
    };

    window.fetchWithAbort = function(url, options) {
        options = options || {};
        var controller = new AbortController();
        pendingRequests.push(controller);

        return fetch(url, {
            ...options,
            signal: controller.signal
        }).finally(function() {
            var index = pendingRequests.indexOf(controller);
            if (index > -1) pendingRequests.splice(index, 1);
        });
    };

    // ============================================================
    // 8. Memory Management
    // ============================================================
    function cleanupMemory() {
        var modals = document.querySelectorAll('.modal-overlay');
        for (var i = 0; i < modals.length; i++) {
            var modal = modals[i];
            if (modal.style.display === 'none' || modal.style.visibility === 'hidden') {
                // Clean up heavy content if needed
            }
        }
    }

    setInterval(cleanupMemory, 30000);

    // ============================================================
    // 9. CSS Optimizations (reduce repaints)
    // ============================================================
    function injectOptimizedStyles() {
        var style = document.createElement('style');
        style.id = 'performance-optimized-styles';
        style.textContent = `
            /* Performance: Reduce repaints */
            * {
                -webkit-tap-highlight-color: transparent;
            }

            /* GPU acceleration */
            .card, .stat-card, .quick-card, .modal-card {
                transform: translateZ(0);
                backface-visibility: hidden;
            }

            /* Scroll optimization */
            .table-container {
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
            }

            /* Reduce animation jank */
            .modal-overlay {
                transition: opacity 0.15s ease, visibility 0.15s ease;
            }

            /* Table row hover optimization */
            .user-row {
                transition: background 0.1s ease;
            }

            /* Button feedback */
            .btn-sm, .btn-primary, .success, .danger {
                transition: opacity 0.1s ease;
                cursor: pointer;
            }
            .btn-sm:active, .btn-primary:active {
                transform: scale(0.96);
            }

            /* Font rendering */
            body {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeSpeed;
            }

            /* Reduce layout shift */
            .data-table {
                table-layout: fixed;
                width: 100%;
            }
            .data-table td, .data-table th {
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* Modal optimization */
            .modal-card {
                max-height: 85vh;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // 10. MutationObserver for DOM changes
    // ============================================================
    var domObserver = new MutationObserver(function(mutations) {
        window.throttle(function() {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.type === 'childList') {
                    for (var j = 0; j < mutation.addedNodes.length; j++) {
                        var node = mutation.addedNodes[j];
                        if (node.nodeType === 1) {
                            if (node.tagName === 'TABLE' || (node.querySelector && node.querySelector('table'))) {
                                var table = node.tagName === 'TABLE' ? node : node.querySelector('table');
                                if (table) {
                                    table.style.tableLayout = 'fixed';
                                    table.style.width = '100%';
                                }
                            }
                        }
                    }
                }
            }
        }, 500)();
    });

    // ============================================================
    // 11. Start Performance Monitoring
    // ============================================================
    function startPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            try {
                var observer = new PerformanceObserver(function(list) {
                    var entries = list.getEntries();
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];
                        if (entry.duration > 50) {
                            console.debug('⏱️ Long task:', entry.duration.toFixed(0), 'ms', entry.name);
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Browser doesn't support longtask
            }
        }

        monitorFps();
    }

    // ============================================================
    // 12. Initialize
    // ============================================================
    function init() {
        injectOptimizedStyles();
        startPerformanceMonitoring();
        enableLazyLoading();

        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ Performance optimization initialized');
        console.log('   - FPS monitor started');
        console.log('   - Lazy loading enabled');
        console.log('   - DOM change listener started');
        console.log('   - Virtual scroll ready');
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    // ============================================================
    // 13. Expose API
    // ============================================================
    window.PerformanceOptimizer = {
        enableVirtualScroll: enableVirtualScroll,
        batchDomUpdate: window.batchDomUpdate,
        throttle: window.throttle,
        debounce: window.debounce,
        abortPendingRequests: window.abortPendingRequests,
        getFps: function() { return currentFps; }
    };

    console.log('📊 Current FPS:', currentFps);

})();