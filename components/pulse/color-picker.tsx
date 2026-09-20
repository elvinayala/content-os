"use client";

import { useState } from "react";

import { COLORES, cssColor } from "@/lib/pulse/colores";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

// Grilla de los 20 colores. Controlado (value/onChange) o con `name` para formularios.
export function ColorPicker({
  name,
  value,
  defaultValue = "grey",
  onChange,
  className,
}: {
  name?: string;
  value?: ColorPulse;
  defaultValue?: ColorPulse;
  onChange?: (c: ColorPulse) => void;
  className?: string;
}) {
  const [interno, setInterno] = useState<ColorPulse>(defaultValue);
  const actual = value ?? interno;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {name ? <input type="hidden" name={name} value={actual} /> : null}
      {COLORES.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          aria-label={c}
          onClick={() => {
            setInterno(c);
            onChange?.(c);
          }}
          className={cn(
            "size-6 rounded-full transition-transform hover:scale-110",
            actual === c && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
          style={{ background: cssColor(c) }}
        />
      ))}
    </div>
  );
}
