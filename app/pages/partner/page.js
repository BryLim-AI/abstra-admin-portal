import { Building, BarChart, Globe } from "lucide-react";
import Footer from "../../../components/navigation/footer";

export default function Partner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
            Partnership Program
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Grow Your Business</span>
            <span className="block text-blue-600">With Hestia</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Join our network of property management professionals and expand
            your reach while providing clients with innovative rental solutions.
          </p>
          <div className="mt-10">
            <button className="bg-blue-600 text-white py-3 px-8 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md">
              Apply To Partner
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Partner Benefits
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Increased Revenue
            </h3>
            <p className="text-gray-600">
              Earn competitive commissions on referred clients and access new
              revenue streams through our platform.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Expanded Portfolio
            </h3>
            <p className="text-gray-600">
              Offer advanced property management tools to your clients without
              developing them yourself.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Market Expansion
            </h3>
            <p className="text-gray-600">
              Reach new geographic markets and customer segments through our
              growing platform.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            How Our Partnership Works
          </h2>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Apply
                </h3>
                <p className="text-gray-600">
                  Complete our simple application process. We'll review your
                  business and get back to you within 48 hours.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Onboard
                </h3>
                <p className="text-gray-600">
                  Get trained on our platform and receive exclusive partner
                  resources, marketing materials, and support.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Grow Together
                </h3>
                <p className="text-gray-600">
                  Start referring clients, earning commissions, and growing your
                  business with Hestia's powerful tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our growing network of partners who are revolutionizing
              property management and creating better rental experiences.
            </p>
            <div className="space-y-4">
              <button className="bg-blue-600 text-white py-3 px-8 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md w-full sm:w-auto">
                Apply Now
              </button>
              <p className="text-sm text-gray-500">
                Or contact our partnership team at{" "}
                <span className="text-blue-600 font-medium">
                  partners@hestia.com
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
