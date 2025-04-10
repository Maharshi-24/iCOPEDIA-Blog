import { 
  Briefcase, 
  FileText, 
  Calculator,
  FileBarChart,
  Box,
  VideoIcon
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
      icon: <Briefcase className="h-6 w-6 text-blue-600" />,
      title: "Job & Process Management",
      description: "Add, edit, and track coating jobs. View job statuses and assign jobs to workers with live updates.",
    },
    {
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      title: "BOQ Creation",
      description: "Input material details, surface area, and layers to automatically generate structured BOQs for each job.",
    },
    {
      icon: <FileBarChart className="h-6 w-6 text-blue-600" />,
      title: "Report Generation",
      description: "Generate professional reports containing job data, materials used, DFT/WFT records, and QC feedback.",
    },
    {
      icon: <Calculator className="h-6 w-6 text-blue-600" />,
      title: "Advanced Calculators",
      description: "Built-in calculators for DFT to WFT, coverage estimation, quantity estimation, unit conversion and more.",
    },
    {
      icon: <Box className="h-6 w-6 text-blue-600" />,
      title: "Product & Equipment",
      description: "Access coating product information and manage equipment calibration data with detailed records.",
    },
    {
      icon: <VideoIcon className="h-6 w-6 text-blue-600" />,
      title: "Video Tutorials",
      description: "In-app tutorials showing how to navigate the app, use calculators, track jobs, and utilize BOQ tools.",
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
