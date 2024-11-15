import "./Loader.scss";
import { LoaderProps } from "./types";

export function Loader({ fullScreen = true }: LoaderProps) {
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
