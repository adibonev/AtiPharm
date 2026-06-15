"use client";

import { useEffect, useState } from "react";

/** Screen-only print bar (hidden on print). Mirrors the toolbar in the
 *  static template: print button + 3 mm bleed toggle. */
export function BrochureToolbar() {
  const [bleed, setBleed] = useState(false);

  useEffect(() => {
    document.body.classList.add("has-toolbar");
    return () => document.body.classList.remove("has-toolbar");
  }, []);

  function onToggle(e: React.ChangeEvent<HTMLInputElement>) {
    setBleed(e.target.checked);
    document.body.classList.toggle("bleed", e.target.checked);
  }

  return (
    <div className="toolbar screen-only">
      <div className="brand">
        Аптека <span>Атифарм</span> · брошура
      </div>
      <label>
        <input type="checkbox" checked={bleed} onChange={onToggle} /> 3&nbsp;мм bleed
        (за печатница)
      </label>
      <button onClick={() => window.print()}>🖨 Печат / Запази PDF</button>
    </div>
  );
}
