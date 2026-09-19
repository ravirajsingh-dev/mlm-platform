import React from "react";
import SliderComponent from "../Components/Slider";
import Donation from "../Components/Donation";
import About from "../Components/About";
import Gallery from "../Components/Gallery";
import Process from "../Components/Process";

const Home = () => {
  return (
    <>
      <SliderComponent />
      <Donation />
      <About />
      <Gallery />
      <Process />
    </>
  );
};

export default Home;
