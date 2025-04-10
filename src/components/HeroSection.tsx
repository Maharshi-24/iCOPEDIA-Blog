
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
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
    <section className="pt-32 pb-16 bg-wellness-cream">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 text-center md:text-left">
            <div className="space-y-6 max-w-2xl mx-auto md:mx-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight text-wellness-navy animate-fade-in-up">
                The Wellness Resource <span className="text-wellness-navy">Portal</span>
              </h1>
              
              <p className="text-lg text-gray-700 md:text-xl animate-fade-in-up animate-delay-200">
                Learn how to improve your wellbeing and productivity with our guides and resources
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start animate-fade-in-up animate-delay-300">
                <Button 
                  className="btn-download bg-wellness-yellow"
                  onClick={handleIOSClick}
                >
                  <Download size={18} />
                  Download for iOS
                </Button>
                <Button className="btn-download bg-wellness-mint">
                  <Download size={18} />
                  Download for Android
                </Button>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-5 animate-fade-in-up animate-delay-400">
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-100">
              <h3 className="font-serif text-xl font-bold mb-4 text-wellness-navy">Featured Article</h3>
              <div className="mb-4 rounded-md overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Wellness at work"
                  className="w-full h-48 object-cover"
                />
              </div>
              <span className="wellness-tag mb-2">Workplace Wellness</span>
              <h4 className="font-serif text-lg font-bold mt-2">Wellness Programs: How To Create An Impactful Employee Rewards Program</h4>
              <p className="text-gray-600 text-sm mt-2">Learn how effective wellness incentives can improve employee engagement and productivity</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-gray-500">By Dr. Maria A.</span>
                <a href="#" className="text-sm font-medium text-wellness-navy hover:underline">Read more</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* iOS Coming Soon Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-serif">Coming Soon</DialogTitle>
            <DialogDescription className="py-4">
              <div className="flex flex-col items-center gap-4">
                <Smartphone size={64} className="text-wellness-navy" />
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
