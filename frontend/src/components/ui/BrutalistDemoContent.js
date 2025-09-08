import React, { useState } from 'react';
import BrutalistCheckbox from './BrutalistCheckbox';

const BrutalistDemoContent = () => {
  const [checkboxStates, setCheckboxStates] = useState({
    option1: false,
    option2: true,
    option3: false,
    option4: true
  });

  const handleCheckboxChange = (key) => {
    setCheckboxStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="font-['Space_Grotesk'] font-black text-6xl uppercase tracking-[4px] mb-8 text-white">
            HORIZONTAL RESIZABLE NAVBAR
          </h1>
          <p className="font-['Inter'] text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Scroll down to see the navbar shrink horizontally from the sides with smooth animations while maintaining brutalist design principles. The navbar will get narrower and move inward from both sides.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-[2px] border-4 border-white shadow-[6px_6px_0_#e1e1e1] transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#e1e1e1] transition-all duration-300">
              START SCROLLING
            </button>
            <button className="px-8 py-4 bg-transparent text-white font-black uppercase tracking-[2px] border-4 border-white shadow-[6px_6px_0_#ffffff] hover:bg-white hover:text-black hover:shadow-[8px_8px_0_#e1e1e1] transition-all duration-300">
              LEARN MORE
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections for Scrolling */}
      {[1, 2, 3, 4, 5].map((section) => (
        <div key={section} className="border-t-4 border-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-['Space_Grotesk'] font-black text-4xl uppercase tracking-[3px] mb-6 text-white">
                  SECTION {section}
                </h2>
                <p className="font-['Inter'] text-lg text-gray-300 mb-8 leading-relaxed">
                  This is demonstration content to showcase the horizontal resizable navbar functionality. 
                  As you scroll down, notice how the navbar smoothly shrinks from both left and right sides, 
                  creating a narrower navigation bar while maintaining all the brutalist design elements 
                  including the logo, navigation items, and buttons. The entire navbar gets more compact horizontally.
                </p>
                <div className="flex flex-wrap gap-4">
                  <span className="px-4 py-2 bg-white text-black font-black text-sm uppercase tracking-[1px] border-2 border-white">
                    BRUTALIST
                  </span>
                  <span className="px-4 py-2 bg-transparent text-white font-black text-sm uppercase tracking-[1px] border-2 border-white">
                    RESPONSIVE
                  </span>
                  <span className="px-4 py-2 bg-transparent text-white font-black text-sm uppercase tracking-[1px] border-2 border-white">
                    ANIMATED
                  </span>
                </div>
              </div>
              
              <div className="bg-white border-4 border-white shadow-[8px_8px_0_#e1e1e1] p-8">
                <h3 className="font-['Space_Grotesk'] font-black text-xl uppercase tracking-[2px] mb-6 text-black">
                  BRUTALIST CHECKBOXES
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(checkboxStates).map(([key, checked], index) => (
                    <div key={key} className="flex items-center space-x-4">
                      <BrutalistCheckbox
                        checked={checked}
                        onChange={() => handleCheckboxChange(key)}
                      />
                      <span className="font-['Space_Grotesk'] font-bold text-black uppercase tracking-[1px]">
                        OPTION {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-black text-white border-2 border-black">
                  <div className="font-['JetBrains_Mono'] text-sm">
                    <div>Selected Options:</div>
                    {Object.entries(checkboxStates)
                      .filter(([_, checked]) => checked)
                      .map(([key, _]) => (
                        <div key={key}>• {key.toUpperCase()}</div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Final Section */}
      <div className="border-t-4 border-white bg-white text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="font-['Space_Grotesk'] font-black text-5xl uppercase tracking-[4px] mb-8">
              HORIZONTAL SCROLL COMPLETE
            </h2>
            <p className="font-['Inter'] text-xl text-gray-800 mb-12 max-w-3xl mx-auto">
              You've experienced the full horizontal resizable navbar functionality. The navbar shrunk from both sides and became more compact. Scroll back up to see it expand horizontally to full width again.
            </p>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-black text-white font-black uppercase tracking-[2px] border-4 border-black shadow-[6px_6px_0_#2e2e2e] transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#2e2e2e] transition-all duration-300"
            >
              SCROLL TO TOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrutalistDemoContent;
