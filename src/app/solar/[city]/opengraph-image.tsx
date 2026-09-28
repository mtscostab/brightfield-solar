import { ImageResponse } from "next/og";
import { getAllCities, getCityBySlug } from "@/content/cities";
import { formatInteger, formatOneDecimal } from "@/lib/format";

export const alt = "Brightfield Solar city page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllCities().map((c) => ({ city: c.slug }));
}

/** Link-preview card, generated at build time — no design tool, no remote image. */
export default async function OpenGraphImage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  const name = city ? `${city.city}, ${city.state}` : "your city";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0f3b2e",
          color: "#ffffff",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "radial-gradient(circle, #ffe3a3 0%, #f6b44b 45%, #ef6a43 70%, rgba(239,106,67,0) 71%)",
          }}
        />
        <div style={{ display: "flex", fontSize: 30, color: "#d9ec7a", letterSpacing: 2 }}>BRIGHTFIELD SOLAR</div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05 }}>{`Solar panels in ${name}`}</div>
          <div style={{ display: "flex", fontSize: 36, marginTop: 24, color: "#b6c9be" }}>
            See your panel count, cost and payback — with the math shown.
          </div>
        </div>
        {city ? (
          <div style={{ display: "flex", fontSize: 28, color: "#d9ec7a" }}>
            {`${formatInteger(city.installsCompleted)} local installs · rated ${formatOneDecimal(city.avgRating)}/5 · ${city.phone}`}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
      </div>
    ),
    size,
  );
}
