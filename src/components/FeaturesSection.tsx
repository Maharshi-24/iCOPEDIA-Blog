import {
  Briefcase,
  FileText,
  Calculator,
  FileBarChart,
  Box,
  VideoIcon,
  Database,
  ClipboardList,
  BarChart3,
  Users,
  Bot,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  style?: CSSProperties;
}

const FeatureCard = ({ icon, title, description, className, style }: FeatureCardProps) => (
  <div className={cn("bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow", className)} style={style}>
    <div className="mb-4 p-3 rounded-full bg-blue-100 w-fit">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const FeaturesSection = () => {
  const features = [
    {
      icon: <Calculator className="h-6 w-6 text-blue-600" />,
      title: "Calculators",
      description: "Coverage Estimation, Quantity Estimation, Part Quantity Calculator, DFT to WFT to Corrected WFT Estimation, Unit Converter assisted with sharing feature.",
    },
    {
      icon: <Database className="h-6 w-6 text-blue-600" />,
      title: "Product Details",
      description: "Unified representation of product key technical details of renowned manufactures assisted with sharing feature.",
    },
    {
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      title: "BOQ (Bill of Quantity)",
      description: "Project coating/material required estimation with a pre feed data customizable with specific project parameters.",
    },
    {
      icon: <Box className="h-6 w-6 text-blue-600" />,
      title: "Instrument Calibration",
      description: "Data Base for key Instruments records at once place for calibration certificate and advance auto reminder prior to expiry.",
    },
    {
      icon: <ClipboardList className="h-6 w-6 text-blue-600" />,
      title: "Daily Reports",
      description: "Daily activity records to keep a track on progress.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      title: "Inventory Tracker",
      description: "Digital tracker to keep stock in check.",
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Inspector Directory",
      description: "Find a third party inspector make a direct contact and hire as required.",
    },
    {
      icon: <Bot className="h-6 w-6 text-blue-600" />,
      title: "AI Bot",
      description: "AI enabled Bot to provide you with your general queries on Industrial coating as your first level of understanding on the subject matter.",
    },
    {
      icon: <Target className="h-6 w-6 text-blue-600" />,
      title: "Targeted Reach",
      description: "Reach to right audience with your product innovation, new product launch, awards etc.",
    },
  ];

  return (
    <section id="features" className="section-padding bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Key Features</h2>
          <p className="text-gray-600">
            Explore the powerful tools and features designed to digitize and streamline your coating workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              className="animate-fade-in-up"
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
