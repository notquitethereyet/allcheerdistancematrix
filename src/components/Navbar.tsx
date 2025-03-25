import React, { useState } from 'react';
import ConnectionStatus from './ConnectionStatus';

interface NavLinkProps {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, isActive = false, onClick }) => {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick && onClick();
      }}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive
          ? 'bg-blue-700 text-white'
          : 'text-gray-800 hover:bg-blue-500 hover:text-white'
      }`}
    >
      {label}
    </a>
  );
};

interface NavbarProps {
  appName?: string;
  onNavigate: (page: string) => void;
  currentPage: string;
  isBackendConnected: boolean | null;
  onRetryConnection?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  appName = 'Distance Matrix Tool',
  onNavigate,
  currentPage,
  isBackendConnected,
  onRetryConnection,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'distance-calculator', label: 'Distance Calculator' },
    { id: 'distance-matrix', label: 'Distance Matrix' },
    { id: 'time-converter', label: 'Time Converter' },
    { id: 'about', label: 'About' },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">{appName}</span>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2 sm:items-center">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  href={`#${item.id}`}
                  label={item.label}
                  isActive={currentPage === item.id}
                  onClick={() => handleNavigation(item.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Connection status (desktop) */}
          <div className="hidden sm:flex sm:items-center">
            <ConnectionStatus 
              isConnected={isBackendConnected} 
              onRetry={onRetryConnection}
              compact={true}
            />
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            {/* Connection status (mobile) */}
            <div className="mr-2">
              <ConnectionStatus 
                isConnected={isBackendConnected} 
                onRetry={onRetryConnection}
                compact={true}
              />
            </div>
            
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                currentPage === item.id
                  ? 'bg-blue-700 text-white'
                  : 'text-gray-800 hover:bg-blue-500 hover:text-white'
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;