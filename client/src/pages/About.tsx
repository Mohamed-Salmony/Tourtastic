import React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">{t('aboutUs', 'About Us')}</h1>
          <p className="text-gray-600 max-w-2xl">
            {t('aboutIntro', "Learn more about Tourtastic and our mission to create unforgettable travel experiences.")}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Company Story */}
          <div className="animate-fade-in space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 section-title">{t('ourStory', 'Our Story')}</h2>
              <p className="text-gray-600 mb-4">
                {t('aboutStory1', 'Founded in 2018, Tourtastic was born from a simple idea: travel should be fantastic for everyone. Our founders, avid travelers themselves, had experienced the frustrations of planning trips, navigating foreign cities, and dealing with the unexpected challenges that come with exploration.')}
              </p>
              <p className="text-gray-600">
                {t('aboutStory2', "What started as a small team of passionate travelers has grown into a global company serving thousands of customers across 60+ countries. We've built our reputation on personalized service, authentic experiences, and a commitment to responsible tourism.")}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 section-title">{t('ourMission', 'Our Mission')}</h2>
              <p className="text-gray-600">
                {t('aboutMission', "At Tourtastic, we believe that travel has the power to transform lives, broaden perspectives, and create meaningful connections across cultures. Our mission is to make exceptional travel experiences accessible to everyone through innovative technology, outstanding customer service, and deep local partnerships.")}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 section-title">{t('ourValues', 'Our Values')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="card-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{t('authenticity', 'Authenticity')}</h3>
                    <p className="text-gray-600">
                      {t('aboutAuthenticity', 'We create genuine experiences that respect local cultures and traditions.')}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{t('sustainability', 'Sustainability')}</h3>
                    <p className="text-gray-600">
                      {t('aboutSustainability', "We're committed to environmentally responsible travel practices.")}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{t('innovation', 'Innovation')}</h3>
                    <p className="text-gray-600">
                      {t('aboutInnovation', 'We continuously improve our technology to enhance the travel experience.')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column - Team & Image */}
          <div className="space-y-8 animate-fade-in animation-delay-200">
            <div className="rounded-lg overflow-hidden mb-8">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80" 
                alt="Tourtastic Team" 
                className="w-full h-auto object-cover"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 section-title">Our Team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="card-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=761&q=80" 
                        alt="Sarah Johnson" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-lg">Sarah Johnson</h3>
                    <p className="text-tourtastic-blue">CEO & Founder</p>
                  </CardContent>
                </Card>

                <Card className="card-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" 
                        alt="Michael Chen" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-lg">Michael Chen</h3>
                    <p className="text-tourtastic-blue">CTO</p>
                  </CardContent>
                </Card>

                <Card className="card-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80" 
                        alt="Elena Rodriguez" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-lg">Elena Rodriguez</h3>
                    <p className="text-tourtastic-blue">Head of Operations</p>
                  </CardContent>
                </Card>

                <Card className="card-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" 
                        alt="James Wilson" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-lg">James Wilson</h3>
                    <p className="text-tourtastic-blue">Marketing Director</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
