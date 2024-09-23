import "./Loader.scss";

export function Loader(){
  return (
    <div className="overlay">
      <div className="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
