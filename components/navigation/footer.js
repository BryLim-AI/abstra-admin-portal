import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Hestia</h2>
            <p className="text-gray-400 mb-4">
              Finding your perfect rental property has never been easier.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </Link>
              <Link
                href="https://twitter.com"
                className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter />
              </Link>
              <Link
                href="https://instagram.com"
                className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram />
              </Link>
              <Link
                href="https://linkedin.com"
                className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <address className="not-italic text-gray-400">
              <p className="mb-2">123 Property Street, Manila</p>
              <p className="mb-2">Philippines, 1000</p>
              <p className="mb-2">Email: info@hestia.com</p>
              <p>Phone: +63 123 456 7890</p>
            </address>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="text-gray-400 space-y-2">
              <li>
                <Link
                  href="/pages/public/support"
                  className="hover:text-white transition"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/about-us"
                  className="hover:text-white transition"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/find-rent"
                  className="hover:text-white transition"
                >
                  Find Rent
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/terms-services"
                  className="hover:text-white transition"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            Copyright © 2025 Hestia. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Designed by IS Students in De La Salle College of Saint Benilde
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
