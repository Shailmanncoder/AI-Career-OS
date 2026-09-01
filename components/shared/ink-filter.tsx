import { BLOB_COUNT } from "@/lib/theme/ink";

export function InkFilter() {
  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter
          id="inkDistortion"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves="3" seed="7" result="large" />
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="3" seed="19" result="medium" />
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="41" result="fine" />

          <feComposite in="large" in2="medium" operator="arithmetic" k1="0" k2="0.62" k3="0.30" k4="0" result="coarse" />
          <feComposite in="coarse" in2="fine" operator="arithmetic" k1="0" k2="1" k3="0.14" k4="0" result="combined" />

          <feDisplacementMap
            id="inkDisplace"
            in="SourceGraphic"
            in2="combined"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rough"
          />

          <feGaussianBlur in="rough" stdDeviation="1.8" result="bleed" />
          <feColorMatrix
            in="bleed"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 24 -9"
          />
        </filter>

        <mask id="inkMask" maskUnits="userSpaceOnUse" x="0" y="0" width="4000" height="4000">
          <g filter="url(#inkDistortion)" fill="#ffffff">
            <circle id="inkMain" cx="0" cy="0" r="0" />
            {Array.from({ length: BLOB_COUNT }, (_, index) => (
              <circle key={index} className="ink-blob" cx="0" cy="0" r="0" />
            ))}
          </g>
        </mask>
      </defs>
    </svg>
  );
}
