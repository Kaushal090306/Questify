import React from 'react';

const BrutalistDemoContent = () => {
  return (
    <div className="container mx-auto p-8 pt-24">
      <h1 className="mb-6 text-center text-4xl font-black text-black" style={{
        fontFamily: 'Space Grotesk, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '3px'
      }}>
        Brutalist Navbar Demo
      </h1>
      <p className="mb-10 text-center text-lg text-black font-bold" style={{
        fontFamily: 'Inter, sans-serif'
      }}>
        This is your new{" "}
        <span className="font-black bg-black text-white px-2 py-1">BRUTALIST</span>{" "}
        animated navbar. It features bold typography, thick borders, and dramatic hover effects.
      </p>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {[
          {
            id: 1,
            title: "BOLD",
            width: "md:col-span-1",
            height: "h-60",
            bg: "bg-white",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#000000]",
          },
          {
            id: 2,
            title: "BRUTALIST",
            width: "md:col-span-2",
            height: "h-60",
            bg: "bg-black",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#e1e1e1]",
            textColor: "text-white",
          },
          {
            id: 3,
            title: "DESIGN",
            width: "md:col-span-1",
            height: "h-60",
            bg: "bg-white",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#000000]",
          },
          {
            id: 4,
            title: "STRONG",
            width: "md:col-span-3",
            height: "h-60",
            bg: "bg-white",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#000000]",
          },
          {
            id: 5,
            title: "ANGULAR",
            width: "md:col-span-1",
            height: "h-60",
            bg: "bg-black",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#e1e1e1]",
            textColor: "text-white",
          },
          {
            id: 6,
            title: "TYPOGRAPHY",
            width: "md:col-span-2",
            height: "h-60",
            bg: "bg-white",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#000000]",
          },
          {
            id: 7,
            title: "THICK BORDERS",
            width: "md:col-span-2",
            height: "h-60",
            bg: "bg-black",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#e1e1e1]",
            textColor: "text-white",
          },
          {
            id: 8,
            title: "IMPACT",
            width: "md:col-span-1",
            height: "h-60",
            bg: "bg-white",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#000000]",
          },
          {
            id: 9,
            title: "NO COMPROMISE",
            width: "md:col-span-2",
            height: "h-60",
            bg: "bg-white",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#000000]",
          },
          {
            id: 10,
            title: "RAW POWER",
            width: "md:col-span-1",
            height: "h-60",
            bg: "bg-black",
            border: "border-4 border-black",
            shadow: "shadow-[8px_8px_0_#e1e1e1]",
            textColor: "text-white",
          },
        ].map((box) => (
          <div
            key={box.id}
            className={`
              ${box.width} 
              ${box.height} 
              ${box.bg} 
              ${box.border}
              ${box.shadow}
              flex 
              items-center 
              justify-center 
              p-6
              transform
              hover:-translate-x-2
              hover:-translate-y-2
              transition-all
              duration-300
              hover:shadow-[12px_12px_0_${box.bg === 'bg-black' ? '#e1e1e1' : '#000000'}]
            `}
          >
            <h2 className={`
              text-xl 
              font-black 
              text-center 
              uppercase 
              tracking-[2px]
              ${box.textColor || 'text-black'}
            `} style={{
              fontFamily: 'Space Grotesk, sans-serif'
            }}>
              {box.title}
            </h2>
          </div>
        ))}
      </div>
      
      {/* Feature Description */}
      <div className="mt-16 bg-white border-4 border-black p-8" style={{
        boxShadow: '8px 8px 0 #000000'
      }}>
        <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-[2px]" style={{
          fontFamily: 'Space Grotesk, sans-serif'
        }}>
          Navbar Features
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-black mb-3" style={{
              fontFamily: 'Space Grotesk, sans-serif'
            }}>
              🎯 BRUTALIST ANIMATIONS
            </h3>
            <ul className="space-y-2 text-black font-medium" style={{
              fontFamily: 'Inter, sans-serif'
            }}>
              <li>→ Transform hover effects</li>
              <li>→ Letter spacing animations</li>
              <li>→ Corner border reveals</li>
              <li>→ Shine effects on buttons</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-black mb-3" style={{
              fontFamily: 'Space Grotesk, sans-serif'
            }}>
              📱 RESPONSIVE DESIGN
            </h3>
            <ul className="space-y-2 text-black font-medium" style={{
              fontFamily: 'Inter, sans-serif'
            }}>
              <li>→ Mobile-first approach</li>
              <li>→ Animated mobile menu</li>
              <li>→ Touch-friendly buttons</li>
              <li>→ Consistent styling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrutalistDemoContent;
