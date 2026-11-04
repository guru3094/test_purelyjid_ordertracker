import { getArtistRequestByToken } from "@/lib/services/artistOrderRequestService";
import { hasProductPrice } from "@/lib/artist/product-review";
import AcceptButton from "./accept-button";

function formatDeliveryDate(value?: string | null) {
  if (!value) return "To be confirmed";
  const m=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}/${m[2]}/${m[1]}`:value;
}

export default async function ArtistRespondPage({params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  const order=await getArtistRequestByToken(token);

  if(!order || hasProductPrice(order.product_name)) {
    return <main className="artist-response-page"><section className="artist-response-card">
      <img src="/purelyjid-logo.png" alt="PurelyJid" className="artist-response-logo"/>
      <h1>Link unavailable</h1>
      <p>This Artist acceptance link is invalid, expired, or has already been used.</p>
    </section></main>;
  }

  return <main className="artist-response-page"><section className="artist-response-card">
    <img src="/purelyjid-logo.png" alt="PurelyJid" className="artist-response-logo"/>
    <p className="artist-response-kicker">Resin Artist Order Request</p>
    <h1>Would you like to accept this order?</h1>
    <div className="artist-response-summary">
      <p><strong>Order ID:</strong> {order.order_id}</p>
      <p><strong>Product:</strong> {order.product_name}</p>
      <p><strong>Estimated Delivery:</strong> {formatDeliveryDate(order.estimated_delivery_date)}</p>
    </div>
    <p className="artist-response-note">{order.artist_sheet_updated
      ? "This order is already in the Resin Artist Order Sheet. Confirming again will notify staff without adding a duplicate row."
      : "Your Artist cost and complete production details will be recorded in the Resin Artist Order Sheet after you accept."}</p>
    <AcceptButton token={token}/>
  </section></main>;
}
