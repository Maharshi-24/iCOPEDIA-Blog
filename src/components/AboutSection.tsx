
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";

const AboutSection = () => {
  const benefits = [
    "Evidence-based wellness resources",
    "Tools for creating effective wellness programs",
    "Expert-written articles and guides",
    "Resources for all aspects of wellness"
  ];
  
  return (
    <section id="about" className="section-padding relative overflow-hidden bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="relative">
              <div className="rounded-md shadow-md overflow-hidden animate-fade-in-up">
                <img
                  src="https://images.unsplash.com/photo-1507208773393-40d9fc670c2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80"
                  alt="About our wellness portal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden md:block absolute -z-10 -bottom-10 -right-10 w-72 h-72 bg-wellness-mint/30 rounded-full blur-3xl"></div>
              
              <div className="absolute -bottom-6 right-6 md:bottom-12 md:right-0 w-36 h-36 bg-white shadow-md rounded-md p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold text-3xl text-wellness-navy">100+</div>
                  <div className="text-gray-600 text-sm">Wellness Resources</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <div className="animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-wellness-navy">About iCOPEDIA</h2>
              <p className="text-gray-700 mb-6">
                iCOPEDIA is a comprehensive wellness resource portal designed to help individuals and organizations 
                enhance their well-being through evidence-based articles, tools, and programs.
              </p>
              <p className="text-gray-700 mb-8">
                Our mission is to make wellness accessible to everyone. We provide resources that cover all dimensions 
                of wellness - physical, mental, financial, social, and environmental - to support a holistic approach 
                to health and well-being.
              </p>
              
              <div className="mb-8">
                <h3 className="text-xl font-serif font-semibold mb-4 text-wellness-navy">Why choose iCOPEDIA?</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-3 animate-fade-slide-in" style={{ animationDelay: `${0.15 * index}s` }}>
                      <div className="bg-wellness-yellow p-1 rounded-full">
                        <Check size={16} className="text-wellness-navy" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="btn-download bg-wellness-yellow">
                  <Download size={18} />
                  Download App
                </Button>
                <Button variant="outline" className="border-wellness-navy text-wellness-navy hover:bg-wellness-navy/5 transition-colors">
                  Learn More
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
