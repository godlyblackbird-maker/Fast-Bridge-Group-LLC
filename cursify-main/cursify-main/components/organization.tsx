"use client";
import { ProgressiveBlur } from "@/components/progressive-blur";
import { TimelineAnimation } from "@/components/timeline-animation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sparkles } from "lucide-react";
import { AlignJustify, X } from "lucide-react";
import { useRef, useState } from "react";
import { Drawer } from "vaul";

function OrganizationHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 992px)");
  const [isOpen, setIsOpen] = useState(false);
  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };
  const scaleVariants = {
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      scale: 0.8,
      opacity: 0,
    },
  };
  return (
    <section ref={heroRef} className="min-h-screen relative pb-10 bg-white">
      <TimelineAnimation
        animationNum={11}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className=" absolute inset-0 bg-[url('https://pro-section.ui-layouts.com/shadow13.png')] bg-cover bg-center bg-no-repeat"
      />

      <TimelineAnimation
        as="header"
        animationNum={0}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className="flex gap-2 z-50 text-neutral-900 sm:backdrop-blur-lg sm:first:border border-gray-200/80 sm:bg-white top-2 rounded-lg max-w-4xl items-center justify-between mx-auto px-3 p-2 sticky"
      >
        {!isMobile ? (
          <>
            <h1 className="text-xl uppercase">Logo</h1>
            <nav className="flex gap-4 font-medium">
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Solutions</a>
              <a href="#">Resources</a>
              <a href="#">Blog</a>
            </nav>
            <button className="text-lg h-10 px-4 rounded-lg text-white flex items-center gap-2 bg-neutral-800 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-2 before:bg-linear-to-t before:from-neutral-800 before:to-neutral-300 before:rounded-t-lg  transition-all group">
              Log In
            </button>
          </>
        ) : (
          <Drawer.Root direction="left" open={isOpen} onOpenChange={setIsOpen}>
            <Drawer.Trigger className="px-2 text-white h-9 grid place-content-center bg-neutral-800 w-fit rounded-lg">
              <AlignJustify />
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Drawer.Content
                className="left-2 top-2 bottom-2 fixed z-50 outline-hidden w-72 flex"
                style={
                  {
                    "--initial-transform": "calc(100% + 8px)",
                  } as React.CSSProperties
                }
              >
                <div className="bg-linear-to-t from-black via-neutral-800 to-neutral-950 border border-neutral-400 text-white p-2 h-full w-full grow flex flex-col rounded-[16px]">
                  <div className="w-full flex justify-between">
                    <div className="flex gap-2 px-4 shrink-0 items-center text-2xl font-semibold  ">
                      <span>LOGO</span>
                    </div>
                    <button
                      className="rounded-md w-fit bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                      onClick={() => setIsOpen(false)}
                    >
                      <X />
                    </button>
                  </div>
                  <div className="rounded-b-md py-2 px-3">
                    <ul className="space-y-2">
                      <li className="hover:bg-neutral-800 cursor-pointer p-1.5 px-2 rounded-md">
                        Features
                      </li>
                      <li className="hover:bg-neutral-800 cursor-pointer p-1.5 px-2 rounded-md">
                        Pricing
                      </li>
                      <li className="hover:bg-neutral-800 cursor-pointer p-1.5 px-2 rounded-md">
                        Solutions
                      </li>
                      <li className="hover:bg-neutral-800 cursor-pointer p-1.5 px-2 rounded-md">
                        Resources
                      </li>
                      <li className="hover:bg-neutral-800 cursor-pointer p-1.5 px-2 rounded-md">
                        Blog
                      </li>
                    </ul>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        )}
      </TimelineAnimation>
      <TimelineAnimation
        as="article"
        animationNum={1}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className="text-neutral-800 py-32 w-fit max-w-5xl mx-auto text-center space-y-4 relative z-10 lg:px-0 px-4"
      >
        <TimelineAnimation
          animationNum={2}
          timelineRef={heroRef}
          customVariants={revealVariants}
          className="flex gap-2 items-center mb-4 bg-black text-white w-fit mx-auto py-1 px-1.5 sm:text-sm text-xs rounded-md cursor-pointer"
        >
          <span className="bg-blue-500 px-1 rounded-xs">NEW </span> Make your
          event hand-picked with Guest Genius
        </TimelineAnimation>
        <TimelineAnimation
          as="h1"
          animationNum={3}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="2xl:text-6xl sm:text-5xl text-4xl font-semibold text-gray-900 mb-6 capitalize "
        >
          Designed for organisers
          {!isMobile && <br />}
          <span className="pt-3 inline-block 2xl:text-8xl sm:text-7xl text-5xl">
            <span className="bg-linear-to-b from-black to-black/40 bg-clip-text text-transparent">
              built to sell{" "}
            </span>
            <TimelineAnimation
              as="span"
              animationNum={4}
              timelineRef={heroRef}
              customVariants={scaleVariants}
              className="text-blue-500 text-shadow capitalize bg-blue-500/20 backdrop-blur-md rounded-xl border-2 border-blue-300 px-2  inline-block"
            >
              tickets
            </TimelineAnimation>
          </span>
        </TimelineAnimation>
        <TimelineAnimation
          as="p"
          animationNum={5}
          timelineRef={heroRef}
          customVariants={revealVariants}
          className="2xl:max-w-3xl max-w-2xl mx-auto 2xl:text-lg sm:text-base text-sm"
        >
          From intimate gatherings to large-scale events, our platform provides
          everything you need to create, promote, and manage successful events
          with ease.
        </TimelineAnimation>
        <TimelineAnimation
          as="div"
          animationNum={6}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="flex gap-2 mt-5 mx-auto w-fit"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="text-white bg-linear-to-t from-blue-500 to-blue-400 shadow-md shadow-blue-500 border border-blue-500 px-4 py-2 rounded-lg flex items-center gap-2">
              <Sparkles size={20} />
              Get started
            </button>
            <button className="bg-neutral-100 border border-neutral-200 text-black p-2 rounded-lg flex items-center gap-2 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_10px_10px_-5px_rgba(0,0,0,0.04)]">
              <img
                src={`https://pro-section.ui-layouts.com/naymur.png`}
                className="w-8 h-8 rounded-full mr-2"
                alt=""
              />
              Book a call
            </button>
          </div>
        </TimelineAnimation>
      </TimelineAnimation>
      <TimelineAnimation
        as="div"
        animationNum={7}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className="gap-2 max-w-6xl mx-auto grid lg:grid-cols-3 sm:grid-cols-2 xl:px-0 px-6"
      >
        <TimelineAnimation
          as="figure"
          animationNum={8}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="group p-2 bg-white rounded-lg w-full overflow-hidden"
        >
          <div className="bg-linear-to-t to-neutral-100 from-neutral-50 rounded-lg p-4 h-80 flex flex-col overflow-hidden relative">
            {/* Top Left Rotated Card */}
            <div className="flex gap-2 shrink-0 items-center bg-white justify-between w-100 p-2 group-hover:top-16 group-hover:-left-20  top-6 rounded-xl relative -left-36 rotate-6 group-hover:-rotate-12 transition-all">
              <p>Host your dream event today</p>
              <button className="bg-blue-500 p-2 px-4 shadow-blue-600 shadow-lg rounded-lg text-white">
                Get Started
              </button>
            </div>

            {/* Top Right Rotated Card */}
            <div className="flex gap-4 shrink-0 items-center bg-white w-100 p-2 top-6 rounded-xl relative -right-20 group-hover:-right-16 group-hover:rotate-12 -rotate-6 transition-all">
              <button className="bg-blue-500 p-2 px-4 shadow-blue-600 shadow-lg rounded-lg text-white">
                Plan Now
              </button>
              <p>Tools that make planning easy</p>
            </div>
            <ProgressiveBlur
              className="pointer-events-none absolute bottom-0 left-0 h-[75%] w-full"
              blurIntensity={0.5}
            />
            {/* Bottom Sticky Article */}
            <article className="text-gray-600 mt-auto relative text-sm">
              <span className="text-gray-500 font-semibold">STEP 1</span>
              <p className="pt-2">
                Start by creating your{" "}
                <span className="text-black font-semibold">
                  personalized event
                </span>
                . Choose a name, set the details, and you’re{" "}
                <span className="text-black font-semibold">ready to go!</span>
              </p>
            </article>
          </div>
        </TimelineAnimation>

        <TimelineAnimation
          as="figure"
          animationNum={9}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="p-2 bg-white rounded-lg w-full overflow-hidden"
        >
          <div className="bg-linear-to-t to-neutral-100 from-neutral-50 rounded-lg p-2 h-80 flex flex-col relative">
            <div className="flex gap-4 items-center bg-white py-1 px-2 rounded-lg w-[80%] mx-auto relative translate-y-5 -rotate-6">
              {/* Image Section */}
              <div className="shrink-0">
                <div className="w-14 h-14 bg-orange-500 rounded-xl overflow-hidden"></div>
              </div>
              <div className="flex-1 space-y-1 text-xs text-gray-500">
                <p>
                  Lorem, ipsum dolor sit amet consectetur adipisx elit. Odit,
                  dolo?
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center bg-white py-1 px-2 rounded-lg w-[80%] mx-auto relative z-10 shadow-md  -translate-x-5 rotate-6">
              {/* Image Section */}
              <div className="shrink-0">
                <div className="w-14 h-14 bg-blue-500 rounded-xl overflow-hidden"></div>
              </div>
              <div className="flex-1 space-y-1 text-xs text-gray-500">
                <span>SASS</span>
                <p>
                  Lorem, ipsum dolor sit amet consectetur adipisx elit. Odit,
                  dolo?
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center bg-white py-1 px-2 rounded-lg w-[80%] mx-auto  -translate-y-5 -rotate-6">
              {/* Image Section */}
              <div className="shrink-0">
                <div className="w-14 h-14 bg-green-500 rounded-xl overflow-hidden"></div>
              </div>
              <div className="flex-1 space-y-1 text-xs text-gray-500">
                <p>
                  Lorem, ipsum dolor sit amet consectetur adipisx elit. Odit,
                  dolo?
                </p>
              </div>
            </div>
            <ProgressiveBlur
              className="pointer-events-none absolute bottom-0 left-0 h-[75%] w-full"
              blurIntensity={0.5}
            />
            <article className="text-gray-600 mt-auto text-sm relative">
              <span>STEP 2</span>
              <p>
                Set up your{" "}
                <span className="text-black font-bold">event in minutes</span>,
                name it, drive it,
                <span className="text-black font-bold">done</span>
              </p>
            </article>
          </div>
        </TimelineAnimation>
        <TimelineAnimation
          as="figure"
          animationNum={10}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="group p-2 bg-white rounded-lg w-full overflow-hidden"
        >
          <div className="bg-linear-to-t to-neutral-100 from-neutral-50 rounded-lg p-2 h-80 flex flex-col relative">
            <div className="flex justify-between absolute top-0 left-0 w-full items-end px-4 h-[75%]">
              <div className="h-[50%] w-12 bg-linear-to-b from-gray-300 to-gray-100 rounded-lg transition-all"></div>
              <div className="h-[60%] w-12 bg-linear-to-b from-gray-300 to-gray-100 rounded-lg transition-all"></div>
              <div className="group-hover:h-[55%] h-[90%] w-12 bg-linear-to-b from-blue-500 to-gray-100 rounded-lg group-hover:from-gray-300 transition-all"></div>
              <div className="group-hover:h-[50%] h-[80%] w-12 bg-linear-to-b from-gray-300 to-gray-100 rounded-lg transition-all"></div>
              <div className="group-hover:h-[90%] h-[65%] w-12 bg-linear-to-b from-gray-300 to-gray-100 rounded-lg group-hover:from-blue-500 transition-all"></div>
            </div>
            <ProgressiveBlur
              className="pointer-events-none absolute bottom-0 left-0 h-[50%] w-full"
              blurIntensity={3}
            />
            <article className="text-gray-600 mt-auto relative text-sm">
              <span>STEP 3</span>
              <p>
                Set up your{" "}
                <span className="text-black font-bold">event in minutes</span>,
                name it, drive it,
                <span className="text-black font-bold">done</span>
              </p>
            </article>
          </div>
        </TimelineAnimation>
      </TimelineAnimation>
    </section>
  );
}

export default OrganizationHero;
