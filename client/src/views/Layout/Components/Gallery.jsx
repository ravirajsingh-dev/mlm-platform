import React, { useEffect, useState } from "react";
import { getGalleryImages } from "@src/actions/mediaActions";
import BouncingLoader from "@src/views/Common/Loaders/BouncingLoader";

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const images = await getGalleryImages();
        const formattedPhotos = (Array.isArray(images) ? images : []).map(
          (img, index) => ({
            src: img.imageUrl,
            alt: img.title || `Gallery Image ${index + 1}`,
            title: img.title,
            key: img._id || index,
          })
        );
        setPhotos(formattedPhotos);
      } catch (error) {
        console.error("Error fetching gallery:", error);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const handleImageClick = (image, index) => {
    // Optional: Add lightbox or modal functionality here
    console.log("Image clicked:", image, index);
  };

  if (loading) {
    return (
      <section className="gallery-section">
        <div className="container">
          <div className="gallery-loading">
            <BouncingLoader />
          </div>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="gallery-section">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div
              className="section-title wow fadeInUp animated"
              data-wow-delay=".3s"
              style={{
                visibility: "visible",
                animationDelay: "0.3s",
                animationName: "fadeInUp",
              }}
            >
              <span className="left-line">Our Gallery</span>
              <h2>Moments That Matter</h2>
              <p>
                Explore our journey in fighting hunger and spreading compassion
                through these captured moments of impact and community.
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="gallery-wrapper">
              <div className="gallery-grid">
                {photos.map((photo, index) => (
                  <div
                    key={photo.key || index}
                    className="gallery-item"
                    onClick={() => handleImageClick(photo, index)}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      title={photo.title}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
