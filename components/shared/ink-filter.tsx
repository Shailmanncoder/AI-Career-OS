export function InkFilter() {
  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter
          id="inkDistortion"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves="3" seed="7" result="large" />
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="3" seed="19" result="medium" />
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="41" result="fine" />

          <feComposite in="large" in2="medium" operator="arithmetic" k1="0" k2="0.62" k3="0.30" k4="0" result="coarse" />
          <feComposite in="coarse" in2="fine" operator="arithmetic" k1="0" k2="1" k3="0.14" k4="0" result="combined" />

          <feDisplacementMap
            in="SourceGraphic"
            in2="combined"
            scale="300"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rough"
          >
            <animate
              className="ink-anim"
              attributeName="scale"
              begin="indefinite"
              dur="950ms"
              values="90; 250; 320; 300"
              keyTimes="0; 0.35; 0.75; 1"
              fill="freeze"
            />
          </feDisplacementMap>

          <feGaussianBlur in="rough" stdDeviation="2.2" result="bleed" />
          <feColorMatrix
            in="bleed"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 24 -9"
          />
        </filter>
      </defs>
    </svg>
  );
}
