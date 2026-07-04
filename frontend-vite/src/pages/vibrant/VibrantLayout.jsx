import React from "react";
import VibrantSidebar from "./VibrantSidebar";
import "../../styles/vibrant-theme.css";
import "../../styles/vibrant-layout.css";

const VibrantLayout = ({ children }) => {
  return (
    <div className="v-layout">
      <VibrantSidebar />
      <div className="v-main">{children}</div>
    </div>
  );
};

export default VibrantLayout;
