import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Wrench, Clock, LineChart, CheckCircle2, AlertTriangle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const HeroSection = () => {
  const [isIOSDialogOpen, setIsIOSDialogOpen] = useState(false);
  const [isAndroidDialogOpen, setIsAndroidDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleIOSClick = () => {
    setIsIOSDialogOpen(true);
  };
  
  const handleAndroidClick = () => {
    setIsAndroidDialogOpen(true);
  };
  
  const downloadAndroidApp = () => {
    // Open the Google Drive link in a new tab
    window.open('https://drive.google.com/file/d/1QOcUa0vioVwcyug7Ufo6iiwHyLzYZNCr/view?usp=drive_link', '_blank');
    
    setIsAndroidDialogOpen(false);
    toast({
      title: "Download Started",
      description: "You'll be redirected to download the app from Google Drive.",
      duration: 5000,
    });
  };

  return (
    <section className="pt-32 pb-16 bg-gray-100">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 text-center md:text-left">
            <div className="space-y-6 max-w-2xl mx-auto md:mx-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-800 animate-fade-in-up">
                Digitizing Industrial <span className="text-blue-600">Coating Workflows</span>
              </h1>
              
              <p className="text-lg text-gray-700 md:text-xl animate-fade-in-up animate-delay-200">
                i-Copedia replaces manual logs, estimation sheets, and basic tools with a unified app for tracking jobs, calculating materials, and generating professional reports.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start animate-fade-in-up animate-delay-300">
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 transition-colors duration-300 text-white"
                  onClick={handleIOSClick}
                >
                  <Download size={18} />
                  Download for iOS
                </Button>
                <Button 
                  className="bg-blue-700 hover:bg-blue-800 transition-colors duration-300 text-white"
                  onClick={handleAndroidClick}
                >
                  <Download size={18} />
                  Download for Android
                </Button>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-5 animate-fade-in-up animate-delay-400">
            <div className="bg-white p-6 rounded-md shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">App Capabilities</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Wrench className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Precision Engineering</h4>
                    <p className="text-gray-600 text-sm">Advanced calculators and tools for industrial coating professionals</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Real-time Tracking</h4>
                    <p className="text-gray-600 text-sm">Monitor job progress and team assignments with live updates</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <LineChart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Data-driven Reporting</h4>
                    <p className="text-gray-600 text-sm">Generate comprehensive BOQs and detailed technical reports</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 text-center">
                <a href="#features" className="inline-block px-4 py-2 bg-gray-100 text-blue-600 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium">View All Features</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* iOS Coming Soon Dialog */}
      <Dialog open={isIOSDialogOpen} onOpenChange={setIsIOSDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Download iOS App</h3>
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
            <div className="flex items-center gap-4 mb-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <AlertTriangle className="text-amber-500 h-8 w-8 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-700">Coming Soon</h4>
                <p className="text-amber-600 text-sm">
                  Our iOS version is currently in development and will be available soon.
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              We're working hard to bring i-Copedia to iOS devices. Please check back soon or sign up for our newsletter to be notified when it launches.
            </p>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="border-gray-300 sm:flex-1" 
                onClick={() => setIsIOSDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Android Download Confirmation Dialog */}
      <Dialog open={isAndroidDialogOpen} onOpenChange={setIsAndroidDialogOpen}>
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
                  You are about to download the i-Copedia Android application. This app will help you manage coating workflows, calculate materials, and generate professional reports.
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
                onClick={() => setIsAndroidDialogOpen(false)}
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

export default HeroSection;
