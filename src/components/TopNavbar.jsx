import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import DarkModeToggle from './DarkModeToggle';

function TopNavbar() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-md z-50">
      <div className="flex items-center justify-between px-4 h-16">
        <Link to="/home" className="flex items-center gap-2">
          <img 
            src="/micon.png"
            alt="Lol"
            className="w-8 h-8"
          />
          <span className="text-xl font-bold">
            <span className="text-red-600">My</span>
            <span className="text-black dark:text-white">Kolkata</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}

export default TopNavbar;
