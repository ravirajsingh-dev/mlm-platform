import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Button, Image } from "react-bootstrap";
import { getStructureList } from "@actions/teamActions";
import PreLoader from "@src/views/Common/Loaders/PreLoader";

import No_User from "@assets/img/icon/no_user.png";

import { FaRegArrowAltCircleDown } from "react-icons/fa";
import { getLevelTitle } from "@src/utils/levelHelper";
import { toRoman } from "@src/utils/helper";
import CopyIcon from "@src/views/Common/CopyIcon";

const TreeNode = ({ node, downline, getStructureList }) => {
  if (!node) {
    return (
      <li>
        <div className="tf-nc">
          <Image
            src={No_User}
            alt="No User"
            style={{ width: "60px", height: "60px" }}
          />
          <h5>No User</h5>
        </div>
      </li>
    );
  }

  const onClickViewDownline = (userId) => {
    getStructureList(downline, userId);
  };

  return (
    <li>
      <div className="tf-nc">
        <div className="level-w">
          <div
            className="level-icon"
            style={{
              border:
                node?.status === 1 ? "3px solid #5a821b" : "3px solid #dc3545",
            }}
          >
            {toRoman(node?.user_level || 0)}
          </div>
        </div>

        <div className="text-muted">
          {getLevelTitle(node?.user_level) || getLevelTitle(0)}
        </div>
        <h5>
          {`${node?.EP_ID || "NA"}`} <CopyIcon textToCopy={node?.EP_ID || ""} />
          <br />
          {node?.name || "Unnamed"}
        </h5>

        <div className="buttonGroupTeam">
          {(node?.left_leg || node?.right_leg) && (
            <Button
              onClick={() => onClickViewDownline(node?._id)}
              title="View Downline"
            >
              <FaRegArrowAltCircleDown size={24} />
            </Button>
          )}
        </div>
      </div>

      {Array.isArray(node?.team) && (
        <ul
          className={`tree-str-main ${
            node?.left_leg && node?.right_leg ? "sss" : ""
          }`}
        >
          <TreeNode
            node={
              node.team.find((child) => child._id === node.left_leg?._id) ||
              null
            }
            getStructureList={getStructureList}
            downline={downline}
          />
          <TreeNode
            node={
              node.team.find((child) => child._id === node.right_leg?._id) ||
              null
            }
            getStructureList={getStructureList}
            downline={downline}
          />
        </ul>
      )}
    </li>
  );
};

const Structure = ({
  treeDownline,
  loadingTreeStructure,
  getStructureList,
  loggedInUser,
}) => {
  useEffect(() => {
    if (loggedInUser?._id) {
      getStructureList(treeDownline, loggedInUser._id);
    }
  }, [loggedInUser]);

  if (loadingTreeStructure) {
    return <PreLoader />;
  }

  return (
    <div className="tree tf-tree h-100">
      <ul>
        <TreeNode
          node={treeDownline}
          downline={treeDownline}
          getStructureList={getStructureList}
        />
      </ul>
    </div>
  );
};

const mapStateToProps = (state) => ({
  treeDownline: state.team.treeDownline,
  loadingTreeStructure: state.team.loadingTreeStructure,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getStructureList,
})(Structure);
