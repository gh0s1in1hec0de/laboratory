"use client";

import { useEffect } from "react";
import "./Loader.scss";
import { LoaderProps } from "./types";

export function Loader({ fullScreen = true }: LoaderProps) {
  useEffect(() => {
    if (fullScreen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullScreen]);
  
  return fullScreen ? (
    <div className="overlay">
      <div className="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>  
  ) : (
    <div className="lds-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
