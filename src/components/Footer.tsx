import { ArrowUp, Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <h3 className="text-2xl font-bold mb-4">i-Copedia</h3>
            <p className="text-gray-400 mb-6">
              Digitizing industrial coating workflows with advanced tools for job tracking, 
              material calculations, and comprehensive reporting solutions.
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                <p className="text-gray-400">123 Industrial Avenue, Tech Park, Mumbai, India</p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-blue-400 flex-shrink-0" />
                <p className="text-gray-400">+91 (022) 1234-5678</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-blue-400 flex-shrink-0" />
                <p className="text-gray-400">contact@icopedia.com</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-lg mb-4 text-blue-400">App</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-lg mb-4 text-blue-400">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Support Center
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-bold text-lg mb-4 text-blue-400">Newsletter</h4>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter to receive the latest updates and industry information.
            </p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-grow px-4 py-2 rounded-l-md focus:outline-none text-gray-900"
              />
              <button className="bg-blue-600 px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} i-Copedia. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-4 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
          </div>
          <button
            onClick={scrollToTop}
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
