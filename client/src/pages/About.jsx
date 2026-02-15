import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">About Us</h1>
            <p className="text-lg text-gray-600">
              Leading HR Management Solutions Provider
            </p>
          </div>

          <div className="prose max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                We are dedicated to providing comprehensive HR management solutions that streamline 
                organizational processes, enhance employee engagement, and drive business success. 
                Our platform integrates cutting-edge technology with intuitive user experience 
                to deliver exceptional value to our clients.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">What We Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">🏢 Company Management</h3>
                  <p className="text-blue-700">Comprehensive company and organizational structure management</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">👥 Employee Management</h3>
                  <p className="text-green-700">Complete employee lifecycle management and tracking</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">📊 Analytics & Reports</h3>
                  <p className="text-purple-700">Advanced analytics and customizable reporting solutions</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">⚙️ Settings & Configuration</h3>
                  <p className="text-orange-700">Flexible system configuration and customization options</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Values</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Excellence:</strong> We strive for excellence in everything we do</li>
                <li><strong>Innovation:</strong> We continuously innovate to meet evolving needs</li>
                <li><strong>Integrity:</strong> We maintain the highest standards of integrity</li>
                <li><strong>Customer Focus:</strong> We put our customers at the center of our decisions</li>
                <li><strong>Teamwork:</strong> We believe in the power of collaboration</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-2">
                  <strong>Email:</strong> info@hrmsolutions.com
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
                <p className="text-gray-600">
                  <strong>Address:</strong> 123 Business Avenue, Suite 100, Corporate City, CC 12345
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors mr-4">
              Contact Us
            </Link>
            <Link to="/" className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;