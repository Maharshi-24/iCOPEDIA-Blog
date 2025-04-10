import { Button } from "@/components/ui/button";
import { Download, Check, ArrowRight } from "lucide-react";

const AboutSection = () => {
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
                <Button className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 text-white">
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
    </section>
  );
};

export default AboutSection;
