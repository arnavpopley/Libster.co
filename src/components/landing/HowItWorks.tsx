import { LogIn, Download, BarChart3, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: LogIn,
    title: 'Log in with Imperial',
    description: 'Sign in securely with your Imperial College credentials. One click, no extra accounts.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Download,
    title: 'We fetch your data',
    description: "We pull your library entry/exit history directly from Imperial's systems. Nothing stored.",
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'See your stats',
    description: 'Get beautiful visualizations of your study habits.',
    color: 'from-primary to-emerald-400',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to unlock your library recap experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Connector arrow (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 -right-4 z-10">
                  <ArrowRight className="w-8 h-8 text-muted-foreground/30" />
                </div>
              )}

              <div className="gradient-card rounded-2xl p-8 border border-border/50 h-full hover:border-primary/30 transition-colors group">
                {/* Step number */}
                <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${step.color} mb-6 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8 text-foreground" />
                </div>

                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
