import * as I from "../icons";

export default function PCard({ p, onClick, selected }) {
  return (
    <div
      className="card pc"
      onClick={onClick}
      style={
        selected
          ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }
          : {}
      }
    >
      <div className="pc-top">
        <div className="pc-icon">{p.img}</div>
        <div className="pc-price">
          {p.price}
          <small> zł/h</small>
        </div>
      </div>
      <div className="pc-name">{p.name}</div>
      <div className="pc-addr">{p.address}</div>
      <div className="pc-meta">
        <span className={`pc-av ${p.available < 10 ? "low" : "ok"}`}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "currentColor",
              display: "inline-block",
            }}
          />
          {p.available}/{p.spots}
        </span>
        {p.rating && (
          <span className="pc-rat">
            <I.Star /> {p.rating}
          </span>
        )}
      </div>
    </div>
  );
}
