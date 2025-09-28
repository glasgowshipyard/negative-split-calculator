// Negative Split Calculator JavaScript

class NegativeSplitCalculator {
    constructor() {
        this.form = document.getElementById('calculator-form');
        this.resultsSection = document.getElementById('results-section');
        this.resultsTable = document.getElementById('results-table');
        this.summaryStats = document.getElementById('summary-stats');
        this.copyButton = document.getElementById('copy-button');
        this.downloadButton = document.getElementById('download-button');
        this.shareButton = document.getElementById('share-button');
        this.paceUnit = document.getElementById('pace-unit');
        this.unitSelect = document.getElementById('unit');
        this.distanceInput = document.getElementById('distance');
        this.segmentsInput = document.getElementById('segments');
        
        // Track if segments were manually changed
        this.segmentsManuallyChanged = false;
        
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

        // Distance change - auto-sync segments if not manually changed
        this.distanceInput.addEventListener('input', () => {
            this.autoSyncSegments();
        });

        // Segments manual change tracking
        this.segmentsInput.addEventListener('input', () => {
            this.segmentsManuallyChanged = true;
        });

        // Unit change
        this.unitSelect.addEventListener('change', () => {
            this.updatePaceUnit();
        });

        // Export and share buttons
        this.copyButton.addEventListener('click', () => this.copyResults());
        this.downloadButton.addEventListener('click', () => this.downloadResults());
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

    autoSyncSegments() {
        // Only auto-sync if segments haven't been manually changed
        if (!this.segmentsManuallyChanged) {
            const distance = parseFloat(this.distanceInput.value);
            if (distance && distance > 0) {
                // Round to nearest whole number, but ensure minimum of 2 segments
                const suggestedSegments = Math.max(2, Math.round(distance));
                this.segmentsInput.value = suggestedSegments;
            }
        }
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
            
            // Calculate negative splits - each segment gets progressively FASTER
            const results = [];
            
            // For negative splits, we want each segment to be faster than the previous
            // Start with a slower first segment, end with a faster last segment
            // The middle segments create a smooth progression
            
            // Calculate the total time for the race
            const totalRaceTime = targetSeconds * distance;
            
            // Symmetric distribution approach for negative splits
            // Calculate spread as percentage of target pace for unit-appropriate scaling
            const spreadPercentage = 0.025; // 2.5% spread works well for all units
            const maxSpread = targetSeconds * spreadPercentage;
            
            // Generate symmetric pairs around the target average
            const segmentPaces = [];
            
            for (let i = 0; i < segments; i++) {
                // Create symmetric distribution: slower segments first, faster segments last
                // For segments 0,1,2,3: factors would be [0.75, 0.25, -0.25, -0.75]
                const normalizedPosition = (segments - 1 - 2 * i) / (segments - 1);
                const segmentPace = targetSeconds + (normalizedPosition * maxSpread);
                segmentPaces.push(segmentPace);
            }
            
            let cumulativeTime = 0;
            
            for (let i = 0; i < segments; i++) {
                const segmentPace = segmentPaces[i];
                const segmentTime = segmentPace * segmentDistance;
                cumulativeTime += segmentTime;
                
                // Calculate improvement from previous segment (negative means faster)
                let improvement = null;
                if (i > 0) {
                    const previousPace = segmentPaces[i - 1];
                    improvement = previousPace - segmentPace; // Positive = faster this segment
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

    generateResultsText() {
        const distance = document.getElementById('distance').value;
        const unit = document.getElementById('unit').value;
        const targetPace = document.getElementById('target-pace').value;
        
        // Get current results
        const rows = this.resultsTable.querySelectorAll('.result-row');
        if (rows.length === 0) return '';

        let text = `Negative Split Plan\n`;
        text += `Distance: ${distance} ${unit}\n`;
        text += `Target Pace: ${targetPace} per ${unit === 'meters' ? 'meter' : unit.slice(0, -1)}\n\n`;

        rows.forEach((row, index) => {
            const segmentNum = index + 1;
            const pace = row.querySelector('.pace-display').textContent;
            const splitTime = row.querySelector('.text-right .text-sm').textContent.replace('Split: ', '');
            text += `Segment ${segmentNum}: ${pace} (${splitTime})\n`;
        });

        text += `\nGenerated by Negative Split Calculator`;
        return text;
    }

    copyResults() {
        const copyText = this.generateResultsText();
        if (!copyText) return;

        navigator.clipboard.writeText(copyText).then(() => {
            // Show success feedback
            const originalIcon = this.copyButton.innerHTML;
            this.copyButton.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
            this.copyButton.classList.add('copy-success');

            setTimeout(() => {
                this.copyButton.innerHTML = originalIcon;
                this.copyButton.classList.remove('copy-success');
            }, 1500);
        }).catch(() => {
            alert('Could not copy to clipboard. Please manually select and copy the results.');
        });
    }

    downloadResults() {
        const downloadText = this.generateResultsText();
        if (!downloadText) return;

        // Create filename with current date and distance
        const distance = document.getElementById('distance').value;
        const unit = document.getElementById('unit').value;
        const date = new Date().toISOString().split('T')[0];
        const filename = `negative-split-${distance}${unit}-${date}.txt`;

        // Create and download file
        const blob = new Blob([downloadText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Show success feedback
        const originalText = this.downloadButton.innerHTML;
        this.downloadButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Downloaded!</span>
        `;

        setTimeout(() => {
            this.downloadButton.innerHTML = originalText;
        }, 2000);
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
            // If segments are loaded from URL, mark as manually changed
            this.segmentsManuallyChanged = true;
        }
        if (urlParams.has('p')) {
            document.getElementById('target-pace').value = urlParams.get('p');
        }
        if (urlParams.has('u')) {
            document.getElementById('unit').value = urlParams.get('u');
            this.updatePaceUnit();
        }

        // If no segments in URL but distance is present, auto-sync
        if (urlParams.has('d') && !urlParams.has('s')) {
            this.autoSyncSegments();
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