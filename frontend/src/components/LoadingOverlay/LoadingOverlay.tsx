import React from "react";
import { Box, Spinner } from "../base";

const LoadingOverlay: React.FC = () => {
  return (
    <Box className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/5 backdrop-blur-sm">
      <Spinner />
    </Box>
  );
};

export default LoadingOverlay;
