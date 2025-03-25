import React, { useState } from 'react';
import DateTimePicker from './DateTimePicker';
import Button from './Button';
import { apiService, DistanceCalculationResponse } from '../services/api';

interface DistanceCalculatorProps {
  onCalculate?: (result: DistanceCalculationResponse) => void;
}

const DistanceCalculator: React.FC<DistanceCalculatorProps> = ({ onCalculate }) => {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
  const [transportMode, setTransportMode] = useState<string>('drive');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DistanceCalculationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!origin || !destination || !departureDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.calculateDistance({
        originAddress: origin,
        destinationAddress: destination,
        transportMode,
        departureTime: departureDate.toISOString(),
      });

      setResult(response);
      if (onCalculate) {
        onCalculate(response);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate distance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Distance Calculator</h2>
      
      <div className="space-y-4">
        {/* Origin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Origin Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter origin address"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>
        
        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter destination address"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        
        {/* Transport Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transport Mode
          </label>
          <select
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={transportMode}
            onChange={(e) => setTransportMode(e.target.value)}
          >
            <option value="drive">Drive</option>
            <option value="transit">Public Transit</option>
            <option value="tele">Telephonic (No Travel)</option>
          </select>
        </div>
        
        {/* Departure Date/Time */}
        <div>
          <DateTimePicker
            label="Departure Date & Time"
            value={departureDate}
            onChange={setDepartureDate}
            required
          />
        </div>
        
        {/* Calculate Button */}
        <div className="mt-6">
          <Button
            variant="primary"
            fullWidth
            isLoading={loading}
            disabled={loading || !origin || !destination || !departureDate}
            onClick={handleCalculate}
          >
            Calculate Distance
          </Button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}
        
        {/* Results */}
        {result && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Results</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{result.distanceInKm} km</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Travel Time:</span>
                <span className="font-medium">
                  {Math.floor(result.timeInMinutes / 60)} hr {Math.round(result.timeInMinutes % 60)} min
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium capitalize">{result.transportMode}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistanceCalculator;