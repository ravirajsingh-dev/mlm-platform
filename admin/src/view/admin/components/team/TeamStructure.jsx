import React, { useEffect } from "react";
import { connect } from "react-redux";
import user from "@assets/images/icons/user.png";
import { Row, Col } from "react-bootstrap";
import { fetchTreeDownline } from "@actions/downlineActions";
import Spinner from "@src/view/spinners/Spinner";

const TreeNode = ({ node }) => {
  if (!node) {
    return null;
  }

  return (
    <li>
      <a href="#">
        <img
          src={node.image || user}
          alt={node.name}
          style={{ width: "50px", height: "50px" }}
        />
        <span>
          <div className="tree-data-sec">
            <div>{node.name} </div>
            <div> {node.level} </div>
            <div>{node.EP_ID}</div>
          </div>
        </span>
        <Row className="tree-data-card">
          <Col xs={6} className="text-start">
            <Col>Name: {node.name}</Col>
            <Col>This Month Left: {node.level}</Col>
            <Col>Today Left: {node.EP_ID}</Col>
            <Col>Total Left: {node.EP_ID}</Col>
          </Col>
          <Col xs={6} className="text-start">
            <Col>Sponsor ID: {node.name}</Col>
            <Col>This Month Right: {node.level}</Col>
            <Col>Today Right: {node.EP_ID}</Col>
            <Col>Total Right: {node.EP_ID}</Col>
          </Col>
        </Row>
      </a>
      {(node.left || node.right) && (
        <ul>
          {node.left && <TreeNode node={node.left} />}
          {node.right && <TreeNode node={node.right} />}
        </ul>
      )}
    </li>
  );
};

const Structure = ({
  treeDownline,
  loadingDownline,
  fetchTreeDownline,
  loggedInUser,
}) => {
  useEffect(() => {
    if (!loggedInUser) return;
    console.log("its calling fetchTreeDownline ");
    fetchTreeDownline(loggedInUser._id);
  }, [fetchTreeDownline, loggedInUser._id]);

  useEffect(() => {
    console.log("treeDownline", treeDownline);
  }, [treeDownline]);

  if (loadingDownline) {
    return <Spinner />;
  }

  return (
    <div className="tree">
      <ul>{treeDownline && <TreeNode node={treeDownline} />}</ul>
    </div>
  );
};

const mapStateToProps = (state) => ({
  treeDownline: state.downline.treeDownline,
  loadingDownline: state.downline.loadingDownline,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  fetchTreeDownline,
})(Structure);
