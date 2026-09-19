import React from "react";

const DefaultFooter = () => {
  return (
    <footer className="footer-area">
      <div className="footer-bottom-area">
        <div className="border-line"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="copywrite-text text-center">
                <p>
                  © {new Date().getFullYear()}{" "}
                  <span className="link-web">Ek Pahal</span> — an initiative of{" "}
                  <span className="link-web">Godjee Foundation</span>. All
                  Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DefaultFooter;
