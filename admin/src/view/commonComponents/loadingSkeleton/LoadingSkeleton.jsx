import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const LoadingSkeleton = ({
  count,
  circle,
  baseColor,
  width,
  height,
  borderRadius,
}) => {
  return (
    <Skeleton
      count={count}
      circle={circle}
      baseColor={baseColor}
      width={width}
      height={height}
      borderRadius={borderRadius}
    />
  );
};

export default LoadingSkeleton;
