
import { 
  Book, 
  Shield, 
  BarChart,
  Heart,
  Users,
  Calendar
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
  <div className={cn("wellness-card p-6", className)} style={style}>
    <div className="mb-4 p-3 rounded-full bg-wellness-yellow/10 w-fit">
      {icon}
    </div>
    <h3 className="text-xl font-serif font-semibold mb-3 text-wellness-navy">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const FeaturesSection = () => {
  const features = [
    {
      icon: <Book className="h-6 w-6 text-wellness-navy" />,
      title: "Expert Articles",
      description: "Access professionally written articles on various aspects of workplace wellness.",
    },
    {
      icon: <Shield className="h-6 w-6 text-wellness-navy" />,
      title: "Secure Resources",
      description: "All our resources are vetted by wellness professionals to ensure quality information.",
    },
    {
      icon: <BarChart className="h-6 w-6 text-wellness-navy" />,
      title: "Progress Tracking",
      description: "Track your wellness journey with intuitive tools and personalized insights.",
    },
    {
      icon: <Heart className="h-6 w-6 text-wellness-navy" />,
      title: "Health Programs",
      description: "Discover comprehensive health programs designed by wellness experts.",
    },
    {
      icon: <Users className="h-6 w-6 text-wellness-navy" />,
      title: "Community Support",
      description: "Connect with like-minded individuals on their wellness journey.",
    },
    {
      icon: <Calendar className="h-6 w-6 text-wellness-navy" />,
      title: "Event Planning",
      description: "Tools to organize and manage wellness events for your organization.",
    },
  ];

  return (
    <section id="features" className="section-padding bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-wellness-navy">Features</h2>
          <p className="text-gray-600">
            Explore the tools and resources designed to enhance wellness in your organization
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
