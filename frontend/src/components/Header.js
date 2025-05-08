import React from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";

const Header = () => {
    const location = useLocation();
    const isFormPage = location.pathname === "/"; // WormCatForm lives here
  return (
    <header>
      <nav className="bg-white shadow-md fixed top-0 w-full z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              className="block md:hidden text-gray-700 focus:outline-none"
              onClick={() => {
                const menu = document.getElementById('navbar-collapse');
                menu.classList.toggle('hidden');
              }}
            >
              <span className="block w-6 h-0.5 bg-gray-800 mb-1"></span>
              <span className="block w-6 h-0.5 bg-gray-800 mb-1"></span>
              <span className="block w-6 h-0.5 bg-gray-800"></span>
            </button>
              <a href="/index" className="ml-4 md:ml-0">
                <div className="flex items-center">
                    <img src="/logo1.png" alt="WormCat logo" className="h-8 w-8 mr-2" />
                    <span className="text-xl font-bold text-gray-800">WormCat</span>
                </div>
            </a>
          </div>
          <div
            id="navbar-collapse"
            className="hidden md:flex md:items-center md:space-x-6"
          >
            <a href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </a>
            <a href="/batch" className="text-gray-700 hover:text-blue-600">
              Batch
            </a>
            <a href="/batch" className="text-gray-700 hover:text-blue-600">
              GSEA
            </a>
            {isFormPage && (
            <>
            <a href="#usage" className="text-gray-700 hover:text-blue-600">
                Usage
            </a><a href="#citation" className="text-gray-700 hover:text-blue-600">
                Citation
            </a><a href="#news" className="text-gray-700 hover:text-blue-600">
                News
            </a><a href="#contact" className="text-gray-700 hover:text-blue-600">
                Contact
            </a></>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;