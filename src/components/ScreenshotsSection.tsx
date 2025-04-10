
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const blogPosts = [
  {
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    category: "Workplace Wellness",
    title: "The Importance Of Employee Well-Being In The Workplace",
    excerpt: "Discover how prioritizing employee wellness can lead to increased productivity and job satisfaction."
  },
  {
    image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    category: "Financial Wellness",
    title: "A Guide To Financial Wellness Programs For Employees",
    excerpt: "Learn how financial wellness programs help employees manage stress and improve financial literacy."
  },
  {
    image: "https://images.unsplash.com/photo-1542744173-8659b8e77b29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    category: "Team Building",
    title: "15 Company Retreat Ideas To Unite Your Team",
    excerpt: "Explore team-building activities to strengthen employee relationships and boost morale."
  },
  {
    image: "https://images.unsplash.com/photo-1565945887714-d5139f4eb0ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    category: "Wellness Month",
    title: "Celebrating National Wellness Month in August",
    excerpt: "Ideas and activities to celebrate National Wellness Month in your organization."
  },
  {
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    category: "Workplace Challenges",
    title: "Summer Wellness Challenges For The Workplace",
    excerpt: "Fun and engaging wellness challenges to keep employees motivated during summer months."
  },
];

const ScreenshotsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((current) => (current === blogPosts.length - 1 ? 0 : current + 1));
  };

  const prevSlide = () => {
    setActiveIndex((current) => (current === 0 ? blogPosts.length - 1 : current - 1));
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <section id="blog" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-wellness-yellow/30"></div>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-wellness-navy">Latest Articles</h2>
          <p className="text-gray-700">
            Browse our collection of wellness articles to find inspiration and guidance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.slice(0, 3).map((post, index) => (
            <div key={index} className="wellness-card animate-fade-in-up" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
              <div className="h-48 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="wellness-tag mb-2">{post.category}</div>
                <h3 className="font-serif text-lg font-bold mb-2 text-wellness-navy">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">5 min read</span>
                  <a href="#" className="text-sm font-medium text-wellness-navy hover:underline">Read more</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="#" className="inline-block border-b-2 border-wellness-navy text-wellness-navy font-medium hover:border-wellness-yellow transition-colors">
            View All Articles
          </a>
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;
