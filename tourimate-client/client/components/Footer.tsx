import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, Globe } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-800 to-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="font-itim text-2xl md:text-3xl text-white font-bold">
              TouriMate
            </h3>
            <p className="font-nunito text-sm text-gray-300 leading-relaxed">
              Nền tảng kết nối du khách với hướng dẫn viên du lịch chuyên nghiệp và sản phẩm địa phương chất lượng tại Việt Nam.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-tour-blue rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-tour-blue rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-tour-blue rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-nunito text-lg font-semibold text-white">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  to="/tours"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Tour du lịch
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  to="/guides"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Hướng dẫn viên
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-nunito text-lg font-semibold text-white">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/profile"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Tài khoản
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Giỏ hàng
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  Câu hỏi thường gặp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-nunito text-lg font-semibold text-white">Liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-tour-blue mt-0.5 flex-shrink-0" />
                <span className="font-nunito text-sm text-gray-300">
                  Việt Nam
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-tour-blue flex-shrink-0" />
                <a
                  href="tel:+84123456789"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  +84 123 456 789
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-tour-blue flex-shrink-0" />
                <a
                  href="mailto:support@tourimate.com"
                  className="font-nunito text-sm text-gray-300 hover:text-tour-blue transition-colors duration-200"
                >
                  support@tourimate.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="font-nunito text-sm text-gray-400 text-center md:text-left">
              © {currentYear} <span className="font-semibold text-white">TouriMate</span>. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-gray-400">
              <Globe className="w-4 h-4" />
              <span className="font-nunito text-sm">Made with ❤️ in Vietnam</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

