import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Menu, X, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const { toast } = useToast();

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
  
  const handleDownloadClick = () => {
    setIsDownloadDialogOpen(true);
  };
  
  const downloadAndroidApp = () => {
    // Open the Google Drive link in a new tab
    window.open('https://drive.google.com/file/d/1QOcUa0vioVwcyug7Ufo6iiwHyLzYZNCr/view?usp=drive_link', '_blank');
    
    setIsDownloadDialogOpen(false);
    toast({
      title: "Download Started",
      description: "You'll be redirected to download the app from Google Drive.",
      duration: 5000,
    });
  };

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
            <a href="#screenshots" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Screenshots</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</a>
          </nav>
          
          {/* Download button */}
          <Button 
            className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 text-white font-medium shadow-sm"
            onClick={handleDownloadClick}
          >
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
              <a href="#screenshots" className="text-gray-700 hover:text-blue-600 font-medium p-2 transition-colors">Screenshots</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium p-2 transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium p-2 transition-colors">Contact</a>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full transition-colors"
                onClick={handleDownloadClick}
              >
                <Download size={18} className="mr-1" />
                Download App
              </Button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Download Confirmation Dialog */}
      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Download Android App</h3>
              <div className="bg-white/20 p-3 rounded-full">
                <div className="flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-full flex-shrink-0 mt-1">
                <Download size={24} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Ready to Install</h4>
                <p className="text-gray-600">
                  You are about to download the i-Copedia Android application. This app provides comprehensive tools for industrial coating management.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Application Size</span>
                <span className="font-medium">24.5 MB</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Required Android Version</span>
                <span className="font-medium">8.0 or higher</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button 
                variant="outline" 
                className="border-gray-300 sm:flex-1" 
                onClick={() => setIsDownloadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 gap-2 sm:flex-1" 
                onClick={downloadAndroidApp}
              >
                <CheckCircle2 size={18} />
                Download Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navigation;
