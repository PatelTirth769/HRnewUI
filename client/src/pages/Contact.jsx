import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Contact form submitted:', formData);
      setIsSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setIsSubmitted(false);
      }, 3000);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 text-center">Contact Us</h1>
            <p className="text-gray-600 text-center mt-2">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>

          <div className="p-8">
            {isSubmitted && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                ✅ Thank you for your message! We'll get back to you soon.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Your Name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.subject ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Message Subject"
                    />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.message ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Your message here..."
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Get in touch</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 text-xl">📧</div>
                    <div>
                      <h3 className="font-medium text-gray-800">Email</h3>
                      <p className="text-gray-600">info@hrmsolutions.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 text-xl">📞</div>
                    <div>
                      <h3 className="font-medium text-gray-800">Phone</h3>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 text-xl">📍</div>
                    <div>
                      <h3 className="font-medium text-gray-800">Address</h3>
                      <p className="text-gray-600">
                        123 Business Avenue<br />
                        Suite 100<br />
                        Corporate City, CC 12345
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 text-xl">🕒</div>
                    <div>
                      <h3 className="font-medium text-gray-800">Business Hours</h3>
                      <p className="text-gray-600">
                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                        Saturday: 10:00 AM - 4:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-medium text-gray-800 mb-3">Follow Us</h3>
                  <div className="flex space-x-4">
                    <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                      Facebook
                    </a>
                    <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                      Twitter
                    </a>
                    <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;