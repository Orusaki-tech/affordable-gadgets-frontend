import Link from 'next/link';
import Image from 'next/image';
import { brandConfig } from '@/lib/config/brand';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div className="lg:col-span-1">
            <Link href="/" className="block mb-4">
              <Image 
                src="/affordablelogo.png" 
                alt={`${brandConfig.name} logo`}
                width={120}
                height={120}
                className="object-contain h-16 w-auto"
                priority
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Quality electronics at great prices. Shop phones, laptops, tablets, and accessories with confidence.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="https://www.facebook.com/share/183qZXAKhB/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://x.com/afford_gadgets?s=11" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@affordablegadgetske?_r=1&_t=ZS-935Z189T4J2" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/affordablegadgetske?igsh=MTlsbjRsZnprNWN3NQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/budget-search" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Budget Search
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Compare Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Customer Service</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Get in Touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-gray-400">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:affordablegadgetske@gmail.com" className="hover:text-blue-400 transition-colors">affordablegadgetske@gmail.com</a>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="https://wa.me/254717881573" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">+254 717 881 573</a>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Kimathi House Room 409, Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {currentYear} {brandConfig.name}. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

