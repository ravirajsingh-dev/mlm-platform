import React from "react";
import { Row, Col } from "react-bootstrap";
import CopyToClipboard from "react-copy-to-clipboard";
import { MdOutlineCopyAll } from "react-icons/md";

const Tile = ({ label, value, copyable, copyableValue = null }) => {
  return (
    <Row className="tile">
      <Col md="12" className="tile-label">
        {label}
      </Col>

      <Col md="12" className="tile-value">
        {value}
        {copyable ? (
          <CopyToClipboard
            options={{ debug: true, message: "Copied" }}
            text={copyableValue}
          >
            <MdOutlineCopyAll className="tile-copy-icon" size={20} />
          </CopyToClipboard>
        ) : null}
      </Col>
    </Row>
  );
};

export default Tile;
