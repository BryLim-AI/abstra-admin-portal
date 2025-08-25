import { Facebook, Twitter, Linkedin, Mail, Phone } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center py-16 px-6">
      <div className="text-center mb-12">
        <span className="inline-block bg-blue-100 text-blue-600 px-5 py-2 rounded-full text-sm font-medium mb-4">
          Get in Touch
        </span>
        <h1 className="text-5xl font-bold text-gray-900">Contact Us</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
          Have questions or need assistance? Reach out to us, and we’ll be happy
          to help!
        </p>
      </div>

      {/* Contact Card */}
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Contact Information
        </h2>

        {/* Email */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Mail className="text-blue-600" size={22} />
          <a
            href="mailto:bryan@gmail.com"
            className="text-lg text-gray-700 hover:text-blue-600 transition"
          >
            bryan@gmail.com
          </a>
        </div>

        {/* Phone Number */}
        <div className="flex items-center justify-center gap-3">
          <Phone className="text-blue-600" size={22} />
          <a
            href="tel:+639123456789"
            className="text-lg text-gray-700 hover:text-blue-600 transition"
          >
            +63 912 345 6789
          </a>
        </div>

        {/* Social Media Links */}
        <div className="mt-8 flex justify-center space-x-6">
          <a
            href="https://facebook.com/example"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-blue-600 transition"
          >
            <Facebook size={28} />
          </a>
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-blue-400 transition"
          >
            <Twitter size={28} />
          </a>
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-blue-700 transition"
          >
            <Linkedin size={28} />
          </a>
        </div>
      </div>
    </div>
  );
}
