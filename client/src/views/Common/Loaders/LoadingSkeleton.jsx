// import React from "react";
// import Skeleton from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";

// const LoadingSkeleton = ({
//   count = 1,
//   circle = false,
//   baseColor = "#5a821b",
//   width = "100%",
//   height = "12px",
//   borderRadius = "50px",
// }) => {
//   return (
//     <Skeleton
//       count={count}
//       circle={circle}
//       baseColor={baseColor}
//       width={width}
//       height={height}
//       borderRadius={borderRadius}
//       style={{
//         display: "block",
//         margin: "0 auto",
//       }}
//     />
//   );
// };

// export default LoadingSkeleton;

import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const LoadingSkeleton = ({
  count = 1,
  circle = false,
  baseColor = "#ffe082",
  width = "100%",
  height = "12px",
  borderRadius = "50px",
}) => {
  return (
    <span aria-live="polite" aria-busy="true" style={{ width: "100%" }}>
      <Skeleton
        count={count}
        circle={circle}
        baseColor={baseColor}
        width={width}
        height={height}
        borderRadius={borderRadius}
        inline={true}
        style={{
          display: "block",
          margin: "0 auto",
          width,
          height,
          borderRadius,
        }}
      />
    </span>
  );
};

export default LoadingSkeleton;
