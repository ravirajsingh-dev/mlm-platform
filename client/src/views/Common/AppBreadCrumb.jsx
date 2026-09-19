import React from "react";
import { Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { TiArrowBackOutline } from "react-icons/ti";

const AppBreadCrumb = ({ title, breadcrumbs }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <section className="page-title-area pos-rel">
      <div className="container">
        <div className="row">
          <div className="col-xl-8 offset-xl-2">
            <div className="page-title text-center">
              <h2>{title}</h2>
              <div className="breadcrumb-list">
                <div>
                  <Button className="back-btn" onClick={handleBack}>
                    <TiArrowBackOutline size={25} />
                  </Button>
                </div>
                <div>
                  <ul>
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index}>
                        {crumb.link ? (
                          <Link to={crumb.link}>{crumb.label}</Link>
                        ) : (
                          crumb.label
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

AppBreadCrumb.propTypes = {
  title: PropTypes.string.isRequired,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      link: PropTypes.string,
    })
  ).isRequired,
  backgroundImage: PropTypes.string,
};

export default AppBreadCrumb;
