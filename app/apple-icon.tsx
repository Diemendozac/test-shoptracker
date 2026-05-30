import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: 40,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            fill="#1c2140"
            d="M250 25 L322 178 L475 250 L322 322 L250 475 L178 322 L25 250 L178 178Z M312 250 A62 62 0 1 0 188 250 A62 62 0 1 0 312 250Z M276 250 A26 26 0 1 0 224 250 A26 26 0 1 0 276 250Z"
          />
        </svg>
      </div>
    ),
    { ...size },
  )
}
