import { ArrowRight } from "lucide-react";

const ArticlesSection = () => {
  const articles = [
    {
      title: "New Developments in Anti-Corrosion Coatings for Industrial Applications",
      date: "May 15, 2023",
      author: "Paint & Coatings Industry",
      excerpt: "Researchers have developed novel anti-corrosion coatings that extend protection for steel structures in marine environments by up to 10 years longer than conventional systems.",
      imageUrl: "https://images.unsplash.com/photo-1570199474015-e217b8b07795?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      category: "Research",
      url: "#"
    },
    {
      title: "Industry 4.0 and its Impact on Industrial Coating Processes",
      date: "June 2, 2023",
      author: "Industrial Coating Magazine",
      excerpt: "How IoT, AI, and automation are transforming traditional coating operations and creating new opportunities for efficiency and quality control.",
      imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      category: "Technology",
      url: "#"
    },
    {
      title: "Sustainability Initiatives in the Coatings Industry: 2023 Report",
      date: "April 27, 2023",
      author: "Coating World",
      excerpt: "Leading coating manufacturers are adopting eco-friendly practices and developing water-based alternatives to traditional solvent-based products.",
      imageUrl: "https://images.unsplash.com/photo-1623511092499-cc155fcb9209?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      category: "Sustainability",
      url: "#"
    },
    {
      title: "Advanced Application Techniques for Industrial Protective Coatings",
      date: "May 30, 2023",
      author: "JPCL",
      excerpt: "New application methods are significantly improving coating performance and reducing waste in large-scale industrial projects.",
      imageUrl: "https://images.unsplash.com/photo-1619120361956-e85fb5c855fe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      category: "Technical",
      url: "#"
    }
  ];

  return (
    <section id="articles" className="section-padding bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Latest Industry Articles</h2>
          <p className="text-gray-600">
            Stay informed with the latest news, research, and developments in the industrial coating industry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video overflow-hidden">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium py-1 px-2 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500">{article.date}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2">{article.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{article.author}</span>
                  <a href={article.url} className="text-blue-600 font-medium text-sm flex items-center hover:text-blue-800 transition-colors">
                    Read more 
                    <ArrowRight size={14} className="ml-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <a 
            href="#" 
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            View All Articles
          </a>
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection; 