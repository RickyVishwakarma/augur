// Monitoring and Error Tracking System
class AugurMonitoring {
    constructor() {
        this.metrics = {
            errors: [],
            performance: [],
            interactions: [],
            apiCalls: []
        };
        
        this.init();
    }

    init() {
        // Track unhandled errors
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'unhandled',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                timestamp: new Date().toISOString()
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'promise',
                message: event.reason,
                timestamp: new Date().toISOString()
            });
        });

        // Track performance metrics
        if ('performance' in window) {
            this.trackPageLoadMetrics();
            this.observeResourceTiming();
        }
    }

    trackError(error) {
        this.metrics.errors.push(error);
        this.sendToServer('error', error);
        
        console.error('[Monitoring]', error);
    }

    trackPerformance(metric) {
        this.metrics.performance.push({
            ...metric,
            timestamp: new Date().toISOString()
        });
        this.sendToServer('performance', metric);
    }

    trackInteraction(action) {
        this.metrics.interactions.push({
            action,
            timestamp: new Date().toISOString()
        });
    }

    trackApiCall(details) {
        this.metrics.apiCalls.push({
            ...details,
            timestamp: new Date().toISOString()
        });
    }

    trackPageLoadMetrics() {
        window.addEventListener('load', () => {
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            const metrics = {
                pageLoadTime: navigationEntry.loadEventEnd - navigationEntry.startTime,
                domLoadTime: navigationEntry.domComplete - navigationEntry.domLoading,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
                firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
            };
            
            this.trackPerformance({
                type: 'page_load',
                metrics
            });
        });
    }

    observeResourceTiming() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
                    this.trackPerformance({
                        type: 'api_timing',
                        url: entry.name,
                        duration: entry.duration,
                        startTime: entry.startTime
                    });
                }
            });
        });

        observer.observe({ entryTypes: ['resource'] });
    }

    async sendToServer(type, data) {
        try {
            await fetch('/api/monitoring', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    data,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to send monitoring data:', error);
        }
    }

    getMetricsSummary() {
        return {
            totalErrors: this.metrics.errors.length,
            totalApiCalls: this.metrics.apiCalls.length,
            averageApiTime: this.calculateAverageApiTime(),
            recentErrors: this.metrics.errors.slice(-5)
        };
    }

    calculateAverageApiTime() {
        const apiTimings = this.metrics.performance
            .filter(m => m.type === 'api_timing')
            .map(m => m.duration);
            
        if (apiTimings.length === 0) return 0;
        return apiTimings.reduce((a, b) => a + b, 0) / apiTimings.length;
    }
}

// Initialize monitoring
const monitoring = new AugurMonitoring();
window.augurMonitoring = monitoring;
