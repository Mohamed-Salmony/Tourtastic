import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDestinationById } from '../../services/destinations';
import type { Destination } from '../../services/destinations';

const DestinationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        setLoading(true);
        const data = await getDestinationById(id);
        setDestination(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load destination');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDestination();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading destination details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600">Destination not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Rest of the component content */}
    </div>
  );
};

export default DestinationDetails; 