import React, { useEffect, useState, useCallback, useRef } from "react";
import { getSliderBanners } from "@src/actions/mediaActions";
import BouncingLoader from "@src/views/Common/Loaders/BouncingLoader";

/**
 * Custom Slider Component
 * A fully responsive, reusable slider without any 3rd party dependencies
 *
 * @param {Array} banners - Array of banner objects with {imageUrl, title?, link?}
 * @param {Number} autoplaySpeed - Auto-play interval in milliseconds (default: 5000)
 * @param {Boolean} autoplay - Enable/disable auto-play (default: true)
 * @param {Boolean} pauseOnHover - Pause auto-play on hover (default: true)
 * @param {Boolean} showArrows - Show navigation arrows (default: true)
 * @param {Boolean} showDots - Show pagination dots (default: true)
 * @param {String} transition - Transition type: 'fade' or 'slide' (default: 'fade')
 */
const SliderComponent = ({
  banners: propBanners = null,
  autoplaySpeed = 5000,
  autoplay = true,
  pauseOnHover = true,
  showArrows = true,
  showDots = true,
  transition = "fade",
}) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const sliderRef = useRef(null);

  // Fetch banners if not provided as props
  useEffect(() => {
    if (propBanners === null) {
      const fetchBanners = async () => {
        try {
          const data = await getSliderBanners();
          setBanners(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching banners:", error);
          setBanners([]);
        } finally {
          setLoading(false);
        }
      };
      fetchBanners();
    } else {
      setBanners(Array.isArray(propBanners) ? propBanners : []);
      setLoading(false);
    }
  }, [propBanners]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoplay || banners.length <= 1 || isPaused || loading) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, autoplaySpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoplay, autoplaySpeed, banners.length, isPaused, loading]);

  // Handle mouse enter/leave for pause on hover
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  }, [pauseOnHover]);

  // Navigation functions
  const goToSlide = useCallback(
    (index) => {
      if (index >= 0 && index < banners.length) {
        setCurrentSlide(index);
      }
    },
    [banners.length]
  );

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToPrev, goToNext]);

  if (loading) {
    return (
      <div className="container">
        <div className="slider-area">
          <div className="slider-loading-container">
            <BouncingLoader />
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="container">
        <div className="slider-area">
          <div className="slider-empty-container">
            <div className="text-center">
              <h3>Welcome to EKPAHAL</h3>
              <p>Fighting Hunger, One Meal at a Time</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div
        className="slider-area"
        ref={sliderRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="slider-container">
          {banners.map((banner, index) => (
            <div
              key={banner._id || index}
              className={`slider-slide ${
                index === currentSlide ? "active" : ""
              }`}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title || `Slide ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
              {/* {(banner.title || banner.link) && (
                <div className="slider-overlay">
                  {banner.title && (
                    <h2 className="slider-title">{banner.title}</h2>
                  )}
                  {banner.link && (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="slider-link-btn"
                    >
                      Learn More
                    </a>
                  )}
                </div>
              )} */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SliderComponent;
