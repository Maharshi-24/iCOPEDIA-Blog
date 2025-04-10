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
          : "bg-gray-100 py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <span className="text-blue-600">i</span>COPEDIA
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</a>
            <a href="#articles" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Articles</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</a>
          </nav>
          
          {/* Download button */}
          <Button className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 text-white font-medium shadow-sm">
            <Download size={18} className="mr-1" />
            Download App
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} className="text-gray-800" /> : <Menu size={24} className="text-gray-800" />}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white p-4 shadow-md md:hidden">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium p-2 transition-colors">Features</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium p-2 transition-colors">About</a>
              <a href="#articles" className="text-gray-700 hover:text-blue-600 font-medium p-2 transition-colors">Articles</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium p-2 transition-colors">Contact</a>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full transition-colors">
                <Download size={18} className="mr-1" />
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
