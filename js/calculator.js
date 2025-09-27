// Negative Split Calculator JavaScript

class NegativeSplitCalculator {
    constructor() {
        this.form = document.getElementById('calculator-form');
        this.resultsSection = document.getElementById('results-section');
        this.resultsTable = document.getElementById('results-table');
        this.summaryStats = document.getElementById('summary-stats');
        this.copyButton = document.getElementById('copy-button');
        this.shareButton = document.getElementById('share-button');
        this.paceUnit = document.getElementById('pace-unit');
        this.unitSelect = document.getElementById('unit');
        
        this.initializeEventListeners();
        this.updatePaceUnit();
        this.loadFromURL();
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateSplits();
        });

        // Unit change
        this.unitSelect.addEventListener('change', () => {
            this.updatePaceUnit();
        });

        // Copy and share buttons
        this.copyButton.addEventListener('click', () => this.copyResults());
        this.shareButton.addEventListener('click', () => this.shareResults());

        // Theme toggle
        this.initializeThemeToggle();
    }

    initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }

        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    updatePaceUnit() {
        const unit = this.unitSelect.value;
        const displayUnit = unit === 'meters' ? 'meter' : unit.slice(0, -1); // Remove 's' from miles/kilometers
        this.paceUnit.textContent = displayUnit;
    }

    parseTime(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            if (isNaN(minutes) || isNaN(seconds) || seconds >= 60) {
                throw new Error('Invalid time format');
            }
            return minutes * 60 + seconds;
        }
        throw new Error('Invalid time format');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    validateInputs(distance, segments, targetPace) {
        const errors = [];

        if (!distance || distance <= 0) {
            errors.push('Distance must be greater than 0');
        }

        if (!segments || segments < 2 || segments > 20) {
            errors.push('Number of segments must be between 2 and 20');
        }

        try {
            this.parseTime(targetPace);
        } catch (e) {
            errors.push('Target pace must be in MM:SS format (e.g., 5:30)');
        }

        return errors;
    }

    calculateSplits() {
        const distance = parseFloat(document.getElementById('distance').value);
        const segments = parseInt(document.getElementById('segments').value, 10);
        const targetPace = document.getElementById('target-pace').value.trim();
        const unit = document.getElementById('unit').value;

        // Clear previous error states
        document.querySelectorAll('.error-border').forEach(el => {
            el.classList.remove('error-border');
        });

        // Validate inputs
        const errors = this.validateInputs(distance, segments, targetPace);
        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return;
        }

        try {
            const targetSeconds = this.parseTime(targetPace);
            const segmentDistance = distance / segments;
            
            // Calculate negative splits using progressive improvement
            const improvementFactor = 0.92; // Each split ~8% faster
            const results = [];
            
            // Generate raw improvement factors
            const rawFactors = [];
            let sumFactors = 0;
            
            for (let i = 0; i < segments; i++) {
                // Start slower, get faster (reverse the exponent)
                const factor = Math.pow(improvementFactor, -i);
                rawFactors.push(factor);
                sumFactors += factor;
            }
            
            // Normalize factors to maintain target average pace
            const normalizer = (targetSeconds * segments) / sumFactors;
            
            let cumulativeTime = 0;
            
            for (let i = 0; i < segments; i++) {
                const segmentPace = rawFactors[i] * normalizer;
                const segmentTime = segmentPace * segmentDistance;
                cumulativeTime += segmentTime;
                
                // Calculate improvement from previous segment
                let improvement = null;
                if (i > 0) {
                    const previousPace = rawFactors[i - 1] * normalizer;
                    improvement = previousPace - segmentPace;
                }
                
                results.push({
                    segment: i + 1,
                    pace: this.formatTime(segmentPace),
                    paceSeconds: segmentPace,
                    time: this.formatTime(segmentTime),
                    timeSeconds: segmentTime,
                    cumulative: this.formatTime(cumulativeTime),
                    cumulativeSeconds: cumulativeTime,
                    improvement: improvement,
                    distance: segmentDistance
                });
            }

            this.displayResults(results, unit, distance, targetSeconds);
            this.updateURL(distance, segments, targetPace, unit);

        } catch (error) {
            console.error('Calculation error:', error);
            alert('An error occurred during calculation. Please check your inputs.');
        }
    }

    displayResults(results, unit, totalDistance, targetPaceSeconds) {
        // Show results section
        this.resultsSection.classList.remove('hidden');
        this.resultsSection.classList.add('fade-in');

        // Clear previous results
        this.resultsTable.innerHTML = '';
        this.summaryStats.innerHTML = '';

        // Display each segment
        results.forEach((result, index) => {
            const row = document.createElement('div');
            row.className = 'result-row border-b border-gray-200 dark:border-gray-700 last:border-b-0';
            
            // Determine if this segment is faster/slower
            let improvementClass = '';
            let improvementText = '';
            if (result.improvement !== null) {
                if (result.improvement > 0) {
                    improvementClass = 'segment-faster';
                    improvementText = `(${this.formatTime(result.improvement)} faster)`;
                } else if (result.improvement < 0) {
                    improvementClass = 'segment-slower';
                    improvementText = `(${this.formatTime(Math.abs(result.improvement))} slower)`;
                }
            }

            row.innerHTML = `
                <div class="segment-info">
                    <div class="font-semibold text-gray-900 dark:text-white">
                        Segment ${result.segment}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        ${result.distance.toFixed(2)} ${unit}
                    </div>
                </div>
                <div class="text-center">
                    <div class="pace-display text-gray-900 dark:text-white">
                        ${result.pace}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        per ${unit === 'meters' ? 'meter' : unit.slice(0, -1)}
                    </div>
                    <div class="text-xs ${improvementClass} mt-1">
                        ${improvementText}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm text-gray-900 dark:text-white">
                        Split: ${result.time}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        Total: ${result.cumulative}
                    </div>
                </div>
            `;
            
            this.resultsTable.appendChild(row);
        });

        // Display summary statistics
        this.displaySummaryStats(results, unit, totalDistance, targetPaceSeconds);

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    displaySummaryStats(results, unit, totalDistance, targetPaceSeconds) {
        const firstPace = results[0].paceSeconds;
        const lastPace = results[results.length - 1].paceSeconds;
        const totalImprovement = firstPace - lastPace;
        const averageImprovement = totalImprovement / (results.length - 1);

        const stats = [
            {
                label: 'Total Time Savings',
                value: this.formatTime(totalImprovement),
                description: 'First vs last segment'
            },
            {
                label: 'Average Drop Per Segment',
                value: this.formatTime(averageImprovement),
                description: 'Pace improvement'
            },
            {
                label: 'Fastest Segment',
                value: results[results.length - 1].pace,
                description: `Segment ${results.length}`
            }
        ];

        stats.forEach(stat => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = `
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">${stat.description}</div>
            `;
            this.summaryStats.appendChild(statCard);
        });
    }

    copyResults() {
        const distance = document.getElementById('distance').value;
        const unit = document.getElementById('unit').value;
        const targetPace = document.getElementById('target-pace').value;
        
        // Get current results
        const rows = this.resultsTable.querySelectorAll('.result-row');
        if (rows.length === 0) return;

        let copyText = `Negative Split Plan\n`;
        copyText += `Distance: ${distance} ${unit}\n`;
        copyText += `Target Pace: ${targetPace} per ${unit === 'meters' ? 'meter' : unit.slice(0, -1)}\n\n`;

        rows.forEach((row, index) => {
            const segmentNum = index + 1;
            const pace = row.querySelector('.pace-display').textContent;
            const splitTime = row.querySelector('.text-right .text-sm').textContent.replace('Split: ', '');
            copyText += `Segment ${segmentNum}: ${pace} (${splitTime})\n`;
        });

        copyText += `\nGenerated by Negative Split Calculator`;

        navigator.clipboard.writeText(copyText).then(() => {
            // Show success feedback
            const originalText = this.copyButton.innerHTML;
            this.copyButton.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Copied!</span>
            `;
            this.copyButton.classList.add('copy-success');

            setTimeout(() => {
                this.copyButton.innerHTML = originalText;
                this.copyButton.classList.remove('copy-success');
            }, 2000);
        }).catch(() => {
            alert('Could not copy to clipboard. Please manually select and copy the results.');
        });
    }

    shareResults() {
        const distance = document.getElementById('distance').value;
        const segments = document.getElementById('segments').value;
        const targetPace = document.getElementById('target-pace').value;
        const unit = document.getElementById('unit').value;

        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('d', distance);
        shareUrl.searchParams.set('s', segments);
        shareUrl.searchParams.set('p', targetPace);
        shareUrl.searchParams.set('u', unit);

        if (navigator.share) {
            navigator.share({
                title: 'Negative Split Calculator',
                text: `Check out my negative split plan: ${distance} ${unit} with ${targetPace} target pace`,
                url: shareUrl.toString()
            });
        } else {
            // Fallback: copy URL to clipboard
            navigator.clipboard.writeText(shareUrl.toString()).then(() => {
                alert('Share URL copied to clipboard!');
            }).catch(() => {
                prompt('Copy this URL to share:', shareUrl.toString());
            });
        }
    }

    updateURL(distance, segments, targetPace, unit) {
        const url = new URL(window.location.href);
        url.searchParams.set('d', distance);
        url.searchParams.set('s', segments);
        url.searchParams.set('p', targetPace);
        url.searchParams.set('u', unit);
        
        window.history.replaceState({}, '', url.toString());
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('d')) {
            document.getElementById('distance').value = urlParams.get('d');
        }
        if (urlParams.has('s')) {
            document.getElementById('segments').value = urlParams.get('s');
        }
        if (urlParams.has('p')) {
            document.getElementById('target-pace').value = urlParams.get('p');
        }
        if (urlParams.has('u')) {
            document.getElementById('unit').value = urlParams.get('u');
            this.updatePaceUnit();
        }

        // Auto-calculate if all parameters are present
        if (urlParams.has('d') && urlParams.has('s') && urlParams.has('p') && urlParams.has('u')) {
            // Small delay to ensure form is properly loaded
            setTimeout(() => {
                this.calculateSplits();
            }, 100);
        }
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NegativeSplitCalculator();
});

// Performance tracking
if (window.performance && window.performance.mark) {
    window.performance.mark('calculator-loaded');
    console.log('🏃‍♂️ Negative Split Calculator loaded and ready');
}