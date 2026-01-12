import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import libsterFullLogo from '@/assets/libster_full_logo.png';

export function Hero() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    await login();
    navigate('/dashboard');
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img src={libsterFullLogo} alt="Libster" className="h-16 md:h-20 w-auto" />
          </div>

          {/* Main title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6">
            <span className="gradient-text">Library Recap 2025</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
            See how many minutes you <em>really</em> spent in the library this year. 
            <span className="text-foreground"> Your study stats, recapped.</span>
          </p>

          {/* CTA Button */}
          <Button 
            variant="hero" 
            size="xl"
            onClick={handleLogin}
            disabled={isLoading}
            className="group"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Log in with Imperial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Demo mode — no real login required
          </p>
        </div>
      </div>
    </section>
  );
}
