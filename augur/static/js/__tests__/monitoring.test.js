// monitoring.test.js
describe('AugurMonitoring', () => {
    let monitoring;
    let mockFetch;

    beforeEach(() => {
        // Mock fetch API
        mockFetch = jest.fn(() => Promise.resolve());
        global.fetch = mockFetch;
        
        // Mock performance API
        global.performance = {
            getEntriesByType: jest.fn((type) => {
                if (type === 'navigation') {
                    return [{
                        loadEventEnd: 1000,
                        startTime: 0,
                        domComplete: 800,
                        domLoading: 200
                    }];
                }
                if (type === 'paint') {
                    return [
                        { startTime: 300 }, // First Paint
                        { startTime: 500 }  // First Contentful Paint
                    ];
                }
                return [];
            })
        };

        // Mock PerformanceObserver
        global.PerformanceObserver = class {
            constructor(callback) {
                this.callback = callback;
            }
            observe() {}
        };

        // Create fresh instance
        monitoring = new AugurMonitoring();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Error Tracking', () => {
        test('tracks unhandled errors', () => {
            const errorEvent = new ErrorEvent('error', {
                message: 'Test error',
                filename: 'test.js',
                lineno: 42
            });
            window.dispatchEvent(errorEvent);

            expect(monitoring.metrics.errors).toHaveLength(1);
            expect(monitoring.metrics.errors[0]).toMatchObject({
                type: 'unhandled',
                message: 'Test error',
                source: 'test.js',
                line: 42
            });
        });

        test('tracks unhandled promise rejections', () => {
            const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
                reason: 'Promise rejected',
                promise: Promise.reject('Promise rejected')
            });
            window.dispatchEvent(rejectionEvent);

            expect(monitoring.metrics.errors).toHaveLength(1);
            expect(monitoring.metrics.errors[0]).toMatchObject({
                type: 'promise',
                message: 'Promise rejected'
            });
        });
    });

    describe('Performance Tracking', () => {
        test('tracks page load metrics', () => {
            const loadEvent = new Event('load');
            window.dispatchEvent(loadEvent);

            expect(monitoring.metrics.performance).toHaveLength(1);
            expect(monitoring.metrics.performance[0].type).toBe('page_load');
            expect(monitoring.metrics.performance[0].metrics).toMatchObject({
                pageLoadTime: 1000,
                domLoadTime: 600,
                firstPaint: 300,
                firstContentfulPaint: 500
            });
        });

        test('tracks API timing', () => {
            const observer = new PerformanceObserver(() => {});
            const entries = [{
                initiatorType: 'fetch',
                name: '/api/test',
                duration: 500,
                startTime: 100
            }];
            observer.callback({ getEntries: () => entries });

            expect(mockFetch).toHaveBeenCalledWith('/api/monitoring', expect.any(Object));
        });
    });

    describe('API Call Tracking', () => {
        test('tracks API calls', () => {
            const apiCall = {
                url: '/api/test',
                method: 'GET',
                status: 200,
                duration: 500
            };
            monitoring.trackApiCall(apiCall);

            expect(monitoring.metrics.apiCalls).toHaveLength(1);
            expect(monitoring.metrics.apiCalls[0]).toMatchObject(apiCall);
        });
    });

    describe('Metrics Summary', () => {
        test('calculates metrics summary correctly', () => {
            // Add some test data
            monitoring.trackError({ type: 'unhandled', message: 'Error 1' });
            monitoring.trackError({ type: 'promise', message: 'Error 2' });
            monitoring.trackApiCall({ duration: 100 });
            monitoring.trackPerformance({ type: 'api_timing', duration: 200 });

            const summary = monitoring.getMetricsSummary();
            expect(summary).toMatchObject({
                totalErrors: 2,
                totalApiCalls: 1,
                averageApiTime: 200
            });
            expect(summary.recentErrors).toHaveLength(2);
        });
    });
});
