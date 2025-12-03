import React from "react";
import { Box } from "../Box/Box";

interface SpinnerProps {
  className?: string;
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className, color }) => {
  return (
    <Box className={className} role="status" aria-label="Loading">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect className="spinner-rect delay-0" x="1" y="1" rx="1" width="10" height="10" fill={color ?? 'var(--color-cyan-400)'} />
        <rect className="spinner-rect delay-1" x="1" y="1" rx="1" width="10" height="10" fill={color ?? 'var(--color-cyan-500)'} />
        <rect className="spinner-rect delay-2" x="1" y="1" rx="1" width="10" height="10" fill={color ?? 'var(--color-cyan-600)'} />
      </svg>
    </Box>
  );
};

export default Spinner;
