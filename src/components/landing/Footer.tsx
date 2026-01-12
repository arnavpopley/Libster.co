import libsterFullLogo from '@/assets/libster_full_logo.png';

export function Footer() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <img src={libsterFullLogo} alt="Libster" className="h-10 w-auto" />
          </div>

          <p className="text-muted-foreground text-sm flex items-center gap-2">Built at Imperial College London</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-foreground transition-colors">
              How it Works
            </button>
            <button onClick={() => scrollToSection("privacy")} className="hover:text-foreground transition-colors">
              Privacy
            </button>
            <button onClick={() => scrollToSection("contact")} className="hover:text-foreground transition-colors">
              Contact
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
          <p>
            Not affiliated with Imperial College London. This is a student project demonstrating library usage
            visualization.
          </p>
        </div>
      </div>
    </footer>
  );
}
