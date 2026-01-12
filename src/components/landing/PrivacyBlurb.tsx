import { Shield, Lock, Eye, Server } from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'No data storage',
    description: 'We never store your library access sessions. Period.',
  },
  {
    icon: Eye,
    title: 'Process only',
    description: 'Data is processed in memory to generate visualizations, then discarded.',
  },
  {
    icon: Server,
    title: 'Imperial owns your data',
    description: 'All raw session data lives securely in Imperial College systems.',
  },
];

export function PrivacyBlurb() {
  return (
    <section id="privacy" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-card rounded-3xl p-8 md:p-12 border border-border/50 relative overflow-hidden animate-fade-in">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Your privacy matters</h2>
              </div>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                We built Libster with privacy at its core. Here's our commitment to you:
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div 
                    key={feature.title}
                    className="p-5 rounded-xl bg-secondary/50 border border-border/30"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <feature.icon className="w-6 h-6 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Technical note:</span> Session data is fetched from Imperial's API, 
                  held in browser memory for your viewing session, and never persisted to any database or logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
