"use client";
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  UserMenu,
} from "../ui/resizable-navbar";

export function BrutalistNavbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      link: "/dashboard",
    },
    {
      name: "Generate",
      link: "/generate",
    },
    {
      name: "Create Room",
      link: "/create-room",
    },
    {
      name: "Join Room",
      link: "/join-room",
    },
    {
      name: "Analytics",
      link: "/analytics",
    },
  ];

  const publicNavItems = [
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "About",
      link: "#about",
    },
    {
      name: "Contact",
      link: "#contact",
    },
  ];

  const currentNavItems = isAuthenticated ? navItems : publicNavItems;

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={currentNavItems} />
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <>
                <NavbarButton variant="secondary">
                  <a href="/login">Login</a>
                </NavbarButton>
                <NavbarButton variant="primary">
                  <a href="/signup">Sign Up</a>
                </NavbarButton>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {/* Mobile Navigation Items */}
            {currentNavItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  block
                  px-4
                  py-4
                  text-white
                  font-black
                  uppercase
                  tracking-[2px]
                  border-4
                  border-white
                  bg-transparent
                  hover:bg-white
                  hover:text-black
                  transition-all
                  duration-300
                  transform
                  hover:-translate-x-1
                  shadow-[3px_3px_0_#ffffff]
                  hover:shadow-[4px_4px_0_#e1e1e1]
                  font-['Space_Grotesk']
                  mb-2
                "
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            
            {/* Mobile Action Buttons */}
            <div className="flex w-full flex-col gap-4 mt-6 pt-6 border-t-4 border-white">
              {isAuthenticated ? (
                <>
                  <NavbarButton
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="secondary"
                    className="w-full justify-center"
                  >
                    Profile
                  </NavbarButton>
                  <NavbarButton
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="danger"
                    className="w-full justify-center"
                  >
                    Logout
                  </NavbarButton>
                </>
              ) : (
                <>
                  <NavbarButton
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="secondary"
                    className="w-full justify-center"
                  >
                    <a href="/login" className="block w-full">Login</a>
                  </NavbarButton>
                  <NavbarButton
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="primary"
                    className="w-full justify-center"
                  >
                    <a href="/signup" className="block w-full">Sign Up</a>
                  </NavbarButton>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
