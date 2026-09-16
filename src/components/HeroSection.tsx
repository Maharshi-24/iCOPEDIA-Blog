import { Calculator, Clock, LineChart } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="pt-32 pb-16 bg-gray-100">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 text-center md:text-left">
            <div className="space-y-6 max-w-2xl mx-auto md:mx-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-800 animate-fade-in-up">
                Digitizing Industrial/Protective <span className="text-blue-600">Coatings Ecosystem</span>
              </h1>

              <p className="text-lg text-gray-700 md:text-xl animate-fade-in-up animate-delay-200">
                iCOPEDIA replaces manual logs, estimation sheets, and basic tools with a unified app for tracking jobs, calculating materials, and generating professional reports.
              </p>
            </div>
          </div>

          <div className="md:col-span-5 animate-fade-in-up animate-delay-400">
            <div className="bg-white p-6 rounded-md shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">App Capabilities</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Advanced Calculators</h4>
                    <p className="text-gray-600 text-sm">Advanced calculators and tools for industrial coating professionals</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Real-time Data</h4>
                    <p className="text-gray-600 text-sm">On hand data for ease of working, better control, lower people dependency, faster decision making & optimize daily operations</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <LineChart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Data-driven Operation</h4>
                    <p className="text-gray-600 text-sm">Pre feed technical data which enables smooth and independent working</p>
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
    </section>
  );
};

export default HeroSection;
