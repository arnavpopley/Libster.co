import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PrivacyBlurb } from '@/components/landing/PrivacyBlurb';
import { Contact } from '@/components/landing/Contact';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <PrivacyBlurb />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
