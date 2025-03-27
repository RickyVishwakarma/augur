document.addEventListener('DOMContentLoaded', function() {
    // Initialize date presets
    const datePreset = document.getElementById('date-preset');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const customDateRange = document.getElementById('custom-date-range');
    
    function updateDateRange(preset) {
        const now = new Date();
        let start = new Date();
        
        switch(preset) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return;
        }
        
        startDate.value = start.toISOString().split('T')[0];
        endDate.value = now.toISOString().split('T')[0];
    }
    
    datePreset.addEventListener('change', function() {
        const preset = this.value;
        customDateRange.style.display = preset === 'custom' ? 'flex' : 'none';
        if (preset !== 'custom') {
            updateDateRange(preset);
        }
    });
    
    // Initialize with last quarter selected
    datePreset.value = 'quarter';
    updateDateRange('quarter');
    customDateRange.style.display = 'none';

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Handle refresh buttons with debouncing
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const handleRefresh = debounce(async function(cardBody) {
        const spinner = cardBody.querySelector('.loading-spinner');
        const content = cardBody.querySelector('.summary-content');
        
        spinner.classList.remove('d-none');
        content.style.opacity = '0.5';
        
        try {
            // Simulate API call (replace with actual implementation)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update data
            const chart = Chart.getChart(cardBody.querySelector('canvas'));
            if (chart) {
                chart.data.datasets[0].data = generateRandomData(30, 50);
                chart.update();
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            // Show error toast
            showToast('Error refreshing data. Please try again.');
        } finally {
            spinner.classList.add('d-none');
            content.style.opacity = '1';
        }
    }, 300);

    document.querySelectorAll('.refresh-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardBody = this.closest('.card-body');
            handleRefresh(cardBody);
        });
    });

    // Date filter handling
    document.getElementById('apply-filter').addEventListener('click', function() {
        const start = startDate.value;
        const end = endDate.value;
        
        if (!start || !end) {
            alert('Please select both start and end dates');
            return;
        }

        // Show loading state on all charts
        document.querySelectorAll('canvas').forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        });

        // Simulate data refresh (replace with actual API calls)
        setTimeout(() => {
            // Update charts with new data
            updateCharts(start, end);
        }, 1000);
    });

    // Initialize charts with default settings
    function initializeCharts() {
        // Common chart options
        Chart.defaults.color = '#bcd0f7';
        Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';
        
        // Health Score Chart
        const healthScoreCtx = document.getElementById('health-score-chart').getContext('2d');
        new Chart(healthScoreCtx, {
            type: 'doughnut',
            data: {
                labels: ['Code Quality', 'Community', 'Activity'],
                datasets: [{
                    data: [85, 70, 90],
                    backgroundColor: [
                        'rgba(111, 66, 193, 0.8)',
                        'rgba(0, 221, 255, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Commit Activity Chart
        const commitActivityCtx = document.getElementById('commit-activity-chart').getContext('2d');
        new Chart(commitActivityCtx, {
            type: 'line',
            data: {
                labels: generateDateLabels(30),
                datasets: [{
                    label: 'Commits',
                    data: generateRandomData(30, 50),
                    borderColor: 'rgba(111, 66, 193, 1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    }
                }
            }
        });
    }

    function generateDateLabels(days) {
        const dates = [];
        const now = new Date();
        for (let i = days; i > 0; i--) {
            dates.push(new Date(now - i * 24 * 60 * 60 * 1000));
        }
        return dates;
    }

    // Handle chart type changes
    document.querySelectorAll('[data-chart-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            const chartType = this.dataset.chartType;
            const chart = Chart.getChart(this.closest('.card-body').querySelector('canvas'));
            if (chart) {
                chart.config.type = chartType;
                chart.update();
            }
            
            // Update active state
            this.closest('.btn-group').querySelectorAll('.btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Handle chart exports
    document.getElementById('export-png').addEventListener('click', function() {
        const chart = Chart.getChart(this.closest('.card-body').querySelector('canvas'));
        if (chart) {
            const link = document.createElement('a');
            link.download = 'chart.png';
            link.href = chart.toBase64Image();
            link.click();
        }
    });

    document.getElementById('export-pdf').addEventListener('click', async function() {
        const chart = Chart.getChart(this.closest('.card-body').querySelector('canvas'));
        if (chart) {
            // Implementation would require a PDF generation library
            showToast('PDF export coming soon!');
        }
    });

    // Handle chart zoom controls
    let zoomLevel = 1;
    const ZOOM_FACTOR = 1.2;

    document.getElementById('zoom-in').addEventListener('click', function() {
        const chart = Chart.getChart(this.closest('.card-body').querySelector('canvas'));
        if (chart) {
            zoomLevel *= ZOOM_FACTOR;
            updateChartZoom(chart, zoomLevel);
        }
    });

    document.getElementById('zoom-out').addEventListener('click', function() {
        const chart = Chart.getChart(this.closest('.card-body').querySelector('canvas'));
        if (chart) {
            zoomLevel /= ZOOM_FACTOR;
            updateChartZoom(chart, zoomLevel);
        }
    });

    document.getElementById('reset-zoom').addEventListener('click', function() {
        const chart = Chart.getChart(this.closest('.card-body').querySelector('canvas'));
        if (chart) {
            zoomLevel = 1;
            updateChartZoom(chart, zoomLevel);
        }
    });

    // Function to update chart zoom
    function updateChartZoom(chart, level) {
        const options = chart.options;
        options.scales.y.min = options.scales.y.suggestedMin / level;
        options.scales.y.max = options.scales.y.suggestedMax * level;
        chart.update();
    }

    // Function to show toast messages
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.innerHTML = `
            <div class="toast-body">
                ${message}
                <button type="button" class="btn-close float-end" onclick="this.closest('.toast').remove()"></button>
            </div>
        `;
        document.querySelector('.toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Function to generate random data
    function generateRandomData(count, max) {
        return Array.from({length: count}, () => Math.floor(Math.random() * max));
    }

    // Function to update charts with new date range
    function updateCharts(startDate, endDate) {
        // Implementation for updating charts with new date range
        // This would typically involve API calls to fetch new data
        console.log(`Updating charts for date range: ${startDate} to ${endDate}`);
    }

    initializeCharts();
});
