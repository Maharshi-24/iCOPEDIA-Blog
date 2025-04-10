
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Menu, X } from "lucide-react";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white py-3 shadow-sm"
          : "bg-wellness-cream py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-2xl font-serif font-bold text-wellness-navy">
          <span className="text-wellness-navy">iCOPEDIA</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-wellness-navy hover:text-wellness-navy/80 font-medium">Features</a>
            <a href="#about" className="text-wellness-navy hover:text-wellness-navy/80 font-medium">About</a>
            <a href="#blog" className="text-wellness-navy hover:text-wellness-navy/80 font-medium">Blog</a>
            <a href="#contact" className="text-wellness-navy hover:text-wellness-navy/80 font-medium">Contact</a>
          </nav>
          
          {/* Download button */}
          <Button className="btn-download bg-wellness-yellow shadow-sm transition-colors duration-300">
            <Download size={18} />
            Download App
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} className="text-wellness-navy" /> : <Menu size={24} className="text-wellness-navy" />}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white p-4 shadow-md md:hidden">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-wellness-navy hover:text-wellness-navy/80 font-medium p-2">Features</a>
              <a href="#about" className="text-wellness-navy hover:text-wellness-navy/80 font-medium p-2">About</a>
              <a href="#blog" className="text-wellness-navy hover:text-wellness-navy/80 font-medium p-2">Blog</a>
              <a href="#contact" className="text-wellness-navy hover:text-wellness-navy/80 font-medium p-2">Contact</a>
              <Button className="btn-download bg-wellness-yellow shadow-sm w-full">
                <Download size={18} />
                Download App
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;
