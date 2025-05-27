import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, Globe, ShoppingBasket, User, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import Logo from '@/assets/logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { currentLocale, toggleLocale } = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    toast({
      title: "Success",
      description: "Successfully signed out",
    });
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="container-custom mx-auto py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-gray-800 hover:text-tourtastic-blue focus:outline-none"
          >
            {isMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`} end>
            {t('home')}
          </NavLink>
          <NavLink to="/flights" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            {t('flights')}
          </NavLink>
          <NavLink to="/destinations" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            {t('destinations')}
          </NavLink>
          <NavLink to="/about" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            {t('about')}
          </NavLink>
          <NavLink to="/contact" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            {t('contact')}
          </NavLink>
        </nav>

        {/* Auth Buttons & Utilities Desktop */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-tourtastic-blue relative"
                asChild
              >
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-tourtastic-blue ring-2 ring-white" />
                  )}
                  <span className="sr-only">{t('notifications')}</span>
                </Link>
              </Button>

              {/* Shopping Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-tourtastic-blue relative"
                asChild
              >
                <Link to="/cart">
                  <ShoppingBasket className="h-5 w-5" />
                  <span className="sr-only">{t('cart')}</span>
                </Link>
              </Button>

              {/* User Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-tourtastic-blue">
                    <User className="h-5 w-5" />
                    <span className="sr-only">{t('profile')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t('myAccount')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={toggleLocale} className="cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    {currentLocale === 'en' ? 'EN' : 'AR'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Language Toggle */}
              <Button 
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-tourtastic-blue"
                onClick={toggleLocale}
              >
                <Globe className="h-5 w-5" />
                <span className="ml-2">{currentLocale === 'en' ? 'EN' : 'AR'}</span>
              </Button>

              {/* Sign In Button */}
              <Button
                variant="ghost"
                className="text-tourtastic-blue hover:text-tourtastic-dark-blue transition-colors"
                asChild
              >
                <Link to="/login">
                  {t('signIn')}
                </Link>
              </Button>

              {/* Register Button */}
              <Button
                className="bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white"
                asChild
              >
                <Link to="/register">
                  {t('register')}
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md animate-fade-in">
            <div className="container mx-auto py-3 flex flex-col">
              <NavLink 
                to="/" 
                className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'}`}
                onClick={toggleMenu}
                end
              >
                {t('home')}
              </NavLink>
              <NavLink 
                to="/flights" 
                className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'}`}
                onClick={toggleMenu}
              >
                {t('flights')}
              </NavLink>
              <NavLink 
                to="/destinations" 
                className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'}`}
                onClick={toggleMenu}
              >
                {t('destinations')}
              </NavLink>
              <NavLink 
                to="/about" 
                className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'}`}
                onClick={toggleMenu}
              >
                {t('about')}
              </NavLink>
              <NavLink 
                to="/contact" 
                className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'}`}
                onClick={toggleMenu}
              >
                {t('contact')}
              </NavLink>
              
              <div className="border-t border-gray-200 my-2" />

              {isAuthenticated ? (
                <>
                  <NavLink 
                    to="/notifications" 
                    className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'} flex items-center`}
                    onClick={toggleMenu}
                  >
                    <Bell className="h-5 w-5 mr-2" />
                    {t('notifications')}
                    {hasUnreadNotifications && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </NavLink>

                  <NavLink 
                    to="/cart" 
                    className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'} flex items-center`}
                    onClick={toggleMenu}
                  >
                    <ShoppingBasket className="h-5 w-5 mr-2" />
                    {t('cart')}
                  </NavLink>

                  <NavLink 
                    to="/profile" 
                    className={({isActive}) => `py-2 px-4 ${isActive ? 'text-tourtastic-blue font-semibold' : 'text-gray-800'} flex items-center`}
                    onClick={toggleMenu}
                  >
                    <User className="h-5 w-5 mr-2" />
                    {t('myAccount')}
                  </NavLink>
                  
                  <button
                    className="py-2 px-4 text-gray-800 w-full text-left flex items-center"
                    onClick={() => {
                      toggleMenu();
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <>
                  <NavLink 
                    to="/login" 
                    className="py-2 px-4 text-tourtastic-blue hover:text-tourtastic-dark-blue w-full text-left flex items-center"
                    onClick={toggleMenu}
                  >
                    {t('signIn')}
                  </NavLink>
                  
                  <NavLink 
                    to="/register" 
                    className="py-2 px-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white w-full text-center"
                    onClick={toggleMenu}
                  >
                    {t('register')}
                  </NavLink>
                </>
              )}
              
              <div className="border-t border-gray-200 my-2" />
              
              <div className="flex items-center justify-between py-2 px-4">
                <span className="text-gray-800">{currentLocale === 'en' ? 'Language' : 'اللغة'}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    toggleLocale();
                    toggleMenu();
                  }}
                >
                  {currentLocale === 'en' ? 'العربية' : 'English'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
