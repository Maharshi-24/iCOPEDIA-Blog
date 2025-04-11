import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="iCOPEDIA Logo"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="text-xl font-bold text-gray-800">iCOPEDIA</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-gray-900"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('screenshots')}
              className="text-gray-600 hover:text-gray-900"
            >
              Screenshots
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-gray-600 hover:text-gray-900"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-gray-600 hover:text-gray-900"
            >
              Contact
            </button>
            <Button className="btn-primary">
              <a href="/iCopedia.apk" download>Download APK</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('screenshots')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Screenshots
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Contact
            </button>
            <Button className="btn-primary w-full">
              <a href="/iCopedia.apk" download>Download APK</a>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
