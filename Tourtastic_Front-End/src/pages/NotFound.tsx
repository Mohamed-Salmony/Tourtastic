
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const NotFound: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20">
        <h1 className="text-9xl font-bold text-tourtastic-blue">404</h1>
        <h2 className="text-3xl font-bold mt-6 mb-4">Page Not Found</h2>
        <p className="text-gray-600 max-w-md text-center mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link 
          to="/" 
          className="btn-primary"
        >
          Back to Home
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
