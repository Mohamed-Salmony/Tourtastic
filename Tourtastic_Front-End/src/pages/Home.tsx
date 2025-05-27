
import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import SearchForm from '@/components/home/SearchForm';
import Features from '@/components/home/Features';
import Destinations from '@/components/home/Destinations';
import Newsletter from '@/components/home/Newsletter';

const Home: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <div className="container-custom">
        <SearchForm />
      </div>
      <Features />
      <Destinations />
      <Newsletter />
    </Layout>
  );
};

export default Home;
