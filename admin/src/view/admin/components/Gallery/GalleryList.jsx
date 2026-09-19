import React from "react";
import { Button, Row, Col, Container, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// icons
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";

// custom imports
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import VerificationConfirmModal from "../../modals/VerificationConfirmModal";

import {
  getGalleryImages,
  resetComponentStore,
  deleteGalleryImage,
} from "@src/actions/adminGalleryActions";
import GalleryModal from "./GalleryModal";

const GalleryList = ({
  loggedInUser,
  galleryList: { data, count },
  categories,
  getGalleryImages,
  loadingGalleryList,
  resetComponentStore,
  sortingParams,
  deleteGalleryImage,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState("");

  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    category: "",
  };

  const [galleryParams, setGalleryParams] = React.useState(initialSortingParams);

  const navigate = useNavigate();
  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    getGalleryImages(galleryParams);
  }, [getGalleryImages, galleryParams, resetComponentStore, loggedInUser]);

  const handleConfirmDeletion = () => {
    deleteGalleryImage(selectedImage._id);
    setShowModal(false);
    setSelectedImage(null);
  };

  const handleCreateImageClick = (e) => {
    e.preventDefault();
    setSelectedImage(null);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedImage(null);
    // Refresh list
    getGalleryImages(galleryParams);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setGalleryParams({
      ...galleryParams,
      category: category || "",
      page: 1,
    });
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Image Gallery"
        crumbs={[{ name: "Image Gallery" }]}
      />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between align-items-center">
            <Col md="4">
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateImageClick}
              >
                Add Image
              </Button>
            </Col>
            <Col md="4">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Col>
          </Row>
        </div>

        <div className="gallery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
          {data.map((image) => (
            <div
              key={image._id}
              className="gallery-item"
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", paddingTop: "75%" }}>
                <img
                  src={image.imageUrl}
                  alt={image.title || "Gallery"}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div style={{ padding: "10px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {image.title || "Untitled"}
                </div>
                {image.category && (
                  <Badge bg="info" style={{ marginBottom: "5px" }}>
                    {image.category}
                  </Badge>
                )}
                <div style={{ marginBottom: "5px" }}>
                  <Badge bg={image.isActive ? "success" : "secondary"}>
                    {image.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="d-flex gap-2 mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(image);
                      setShowEditModal(true);
                    }}
                  >
                    <RiEditLine />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(image);
                      setShowModal(true);
                    }}
                  >
                    <RiDeleteBin5Line />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {count > galleryParams.limit && (
          <div className="mt-3 d-flex justify-content-between align-items-center">
            <div>
              Showing {((galleryParams.page - 1) * galleryParams.limit) + 1} to{" "}
              {Math.min(galleryParams.page * galleryParams.limit, count)} of {count} images
            </div>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                disabled={galleryParams.page === 1}
                onClick={() =>
                  setGalleryParams({ ...galleryParams, page: galleryParams.page - 1 })
                }
              >
                Previous
              </Button>
              <span className="mx-2">Page {galleryParams.page}</span>
              <Button
                variant="outline-primary"
                size="sm"
                disabled={galleryParams.page * galleryParams.limit >= count}
                onClick={() =>
                  setGalleryParams({ ...galleryParams, page: galleryParams.page + 1 })
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {loadingGalleryList && (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </MainCard>

      <VerificationConfirmModal
        show={showModal}
        handleClose={() => {
          setShowModal(false);
          setSelectedImage(null);
        }}
        handleConfirm={handleConfirmDeletion}
        title="Confirm Deletion"
        body={`Are you sure you want to delete this image?`}
        submitBtnText="Delete"
      />

      <GalleryModal
        show={showEditModal}
        handleClose={handleModalClose}
        image={selectedImage}
        categories={categories}
      />
    </Container>
  );
};

GalleryList.propTypes = {
  getGalleryImages: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  galleryList: state.gallery.galleryList,
  categories: state.gallery.categories || [],
  loadingGalleryList: state.gallery.loadingGalleryList,
  sortingParams: state.gallery.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getGalleryImages,
  resetComponentStore,
  deleteGalleryImage,
})(GalleryList);

