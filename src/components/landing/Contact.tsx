import { Mail } from 'lucide-react';

export function Contact() {
  return (
    <section id="contact" className="py-16 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Contact</h2>
          </div>
          <p className="text-muted-foreground">
            For suggestions, improvements, or feedback, please email{' '}
            <a 
              href="mailto:ap2424@ic.ac.uk" 
              className="text-primary hover:underline"
            >
              ap2424@ic.ac.uk
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}