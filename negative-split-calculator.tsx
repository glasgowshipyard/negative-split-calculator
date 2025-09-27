import { useState } from 'react';
import { Activity, Clock, TrendingDown } from 'lucide-react';

export default function NegativeSplitCalculator() {
  const [distance, setDistance] = useState('1');
  const [segments, setSegments] = useState('4');
  const [targetPace, setTargetPace] = useState('5:30');
  const [unit, setUnit] = useState('mile');
  const [splits, setSplits] = useState([]);

  const parseTime = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSplits = () => {
    const dist = parseFloat(distance);
    const numSegments = parseInt(segments);
    const targetSeconds = parseTime(targetPace);

    if (!dist || !numSegments || !targetSeconds) {
      alert('Please enter valid values');
      return;
    }

    const segmentDistance = dist / numSegments;
    const totalTime = targetSeconds * dist;
    
    // Calculate negative splits using a progressive formula
    // Each segment gets faster, with the total averaging to target pace
    const results = [];
    let runningTotal = 0;
    
    // Use a factor to create progressive improvement
    const improvementFactor = 0.92; // Each split is ~8% faster than previous
    
    // Calculate raw times
    let rawTimes = [];
    let sumRaw = 0;
    
    for (let i = 0; i < numSegments; i++) {
      const factor = Math.pow(improvementFactor, -i); // Start slower, get faster
      rawTimes.push(factor);
      sumRaw += factor;
    }
    
    // Normalize so they average to target pace
    const normalizer = (targetSeconds * numSegments) / sumRaw;
    
    for (let i = 0; i < numSegments; i++) {
      const segmentPace = rawTimes[i] * normalizer;
      const segmentTime = segmentPace * segmentDistance;
      runningTotal += segmentTime;
      
      results.push({
        segment: i + 1,
        pace: formatTime(segmentPace),
        time: formatTime(segmentTime),
        cumulative: formatTime(runningTotal)
      });
    }
    
    setSplits(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <TrendingDown className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Negative Split Calculator</h1>
          </div>
          <p className="text-blue-200">Automatically calculate progressive pacing for your runs</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Activity className="w-4 h-4 inline mr-2" />
                Total Distance
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="1.0"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="px-4 py-3 bg-slate-800/50 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="mile">miles</option>
                  <option value="km">km</option>
                  <option value="meters">meters</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Number of Segments
              </label>
              <input
                type="number"
                value={segments}
                onChange={(e) => setSegments(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="4"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-blue-200 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Target Average Pace (min/{unit === 'meters' ? 'meter' : unit})
            </label>
            <input
              type="text"
              value={targetPace}
              onChange={(e) => setTargetPace(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="5:30"
            />
            <p className="text-sm text-blue-300 mt-1">Format: MM:SS (e.g., 5:30)</p>
          </div>

          <button
            onClick={calculateSplits}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            Calculate Negative Splits
          </button>
        </div>

        {splits.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Your Pacing Plan</h2>
            <div className="space-y-3">
              {splits.map((split) => (
                <div
                  key={split.segment}
                  className="bg-slate-800/50 rounded-lg p-4 border border-blue-400/20 hover:border-blue-400/40 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="text-blue-300 font-semibold">
                        Segment {split.segment}
                      </span>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-white text-lg font-mono">
                        {split.pace}
                      </span>
                      <span className="text-blue-300 text-sm ml-2">
                        min/{unit === 'meters' ? 'meter' : unit}
                      </span>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-blue-200 text-sm">
                        Total: {split.cumulative}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}