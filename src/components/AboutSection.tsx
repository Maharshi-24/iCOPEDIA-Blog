import { Button } from "@/components/ui/button";
import { Download, Check, ArrowRight, CheckCircle2, Smartphone } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const AboutSection = () => {
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const { toast } = useToast();
  
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

  const benefits = [
    "Replaces manual logs and estimation sheets",
    "Tracks job progress and statuses in real-time",
    "Generates detailed BOQs and professional reports",
    "Includes advanced engineering calculators and tools"
  ];
  
  return (
    <section id="about" className="section-padding relative overflow-hidden bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="relative">
              <div className="rounded-md shadow-md overflow-hidden animate-fade-in-up">
                <img
                  src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  alt="Industrial coating environment"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden md:block absolute -z-10 -bottom-10 -right-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
              
              <div className="absolute -bottom-6 right-6 md:bottom-12 md:right-0 w-36 h-36 bg-white shadow-md rounded-md p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold text-3xl text-gray-800">6+</div>
                  <div className="text-gray-600 text-sm">Built-in Calculators</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <div className="animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">About iCOPEDIA</h2>
              <p className="text-gray-700 mb-6">
                I-Copedia digitizes the coating workflow in industrial environments. It replaces manual logs, 
                estimation sheets, and basic tools with a unified app that streamlines the entire coating process.
              </p>
              <p className="text-gray-700 mb-8">
                Our mission is to improve efficiency and accuracy in industrial coating operations. The app tracks 
                job progress, offers advanced calculators, stores product and equipment data, generates reports and BOQs, 
                and educates users through tutorials.
              </p>
              
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Why choose iCOPEDIA?</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-3 animate-fade-slide-in" style={{ animationDelay: `${0.15 * index}s` }}>
                      <div className="bg-blue-100 p-1 rounded-full">
                        <Check size={16} className="text-blue-600" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 text-white"
                  onClick={handleDownloadClick}
                >
                  <Download size={18} />
                  Download App
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors group"
                >
                  Learn More
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
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
    </section>
  );
};

export default AboutSection;
