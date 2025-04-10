import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Wrench, Clock, LineChart } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const HeroSection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleIOSClick = () => {
    setIsDialogOpen(true);
    toast({
      title: "Coming Soon",
      description: "iOS version will be available soon!",
      duration: 3000,
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
                <Button className="bg-blue-700 hover:bg-blue-800 transition-colors duration-300 text-white">
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Coming Soon</DialogTitle>
            <DialogDescription className="py-4">
              <div className="flex flex-col items-center gap-4">
                <Smartphone size={64} className="text-gray-700" />
                <p className="text-center">
                  Our iOS version is currently in development and will be available soon. 
                  Please check back later or sign up for our newsletter to be notified when it launches.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
