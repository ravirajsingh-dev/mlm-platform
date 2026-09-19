// CopyIcon.js
import React from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { MdOutlineCopyAll } from "react-icons/md";

const CopyIcon = ({ textToCopy, iconSize = 20, className = "", onCopy }) => {
  return (
    <CopyToClipboard text={textToCopy} onCopy={onCopy}>
      <span className={className} style={{ cursor: "pointer" }}>
        <MdOutlineCopyAll className="tile-copy-icon" size={iconSize} />
      </span>
    </CopyToClipboard>
  );
};

export default CopyIcon;
