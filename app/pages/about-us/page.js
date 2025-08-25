import { BuildingIcon, UsersIcon, LightbulbIcon, ArrowRightIcon } from "lucide-react";
import Footer from "../../../components/navigation/footer";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">About Hestia</span>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Simplifying Property</span>
            <span className="block text-blue-600">Management For Everyone</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Hestia makes property management effortless for landlords and creates 
            a seamless experience for tenants.
          </p>
        </div>
      </div>
      
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="p-8 sm:p-10 lg:p-12 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="text-center">
              <BuildingIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                At Hestia, we're dedicated to providing top-tier property management solutions that
                simplify billing and lease management. We believe that managing rental properties shouldn't be complicated,
                and we're here to make it easier for everyone involved.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What Makes Hestia Different</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Value 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Built for Both Sides</h3>
            <p className="text-gray-600">
              Unlike other platforms, Hestia is designed with both landlords and tenants in mind,
              creating a balanced system that benefits the entire rental relationship.
            </p>
          </div>
          
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <LightbulbIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart Solutions</h3>
            <p className="text-gray-600">
              Hestia uses innovative technology to automate tedious tasks, generate insights,
              and help property owners make better decisions with less effort.
            </p>
          </div>
          
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <ArrowRightIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Simplified Workflow</h3>
            <p className="text-gray-600">
              We've streamlined every process - from tenant applications to lease signing, 
              payment collection, and maintenance requests - all in one intuitive platform.
            </p>
          </div>
        </div>
      </div>
      
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">The Hestia Story</h2>
          <p className="text-gray-600 mb-4">
              Hestia was founded by a group of Benildean Information Systems (IS) students as part of their thesis project. 
              During their research, they identified the growing challenges faced by tenants and landlords in the Philippines—
              from communication gaps to inefficient rental management.
          </p>
          <p className="text-gray-600">
              What started as an academic project quickly evolved into a full-fledged business idea. 
              Hestia is designed to bridge the gap between landlords and tenants by providing a streamlined, user-friendly platform 
              that simplifies property management, billing, and communication—making renting easier and more efficient for everyone.
          </p>
        </div>
      </div>
      
      
      <div className="bg-blue-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to transform your rental experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the Hestia community and discover a better way to manage properties.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg shadow-md transition-colors duration-200">
              Get Started with Hestia
            </button>
            <button className="bg-transparent text-white border border-white hover:bg-blue-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200">
              See Features
            </button>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}