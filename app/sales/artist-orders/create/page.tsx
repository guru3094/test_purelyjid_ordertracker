import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import ArtistOrderForm from "./artist-order-form";

export default async function CreateArtistOrderPage() {
  if (!(await isStaffAuthenticated())) redirect("/staff-login");
  return <ArtistOrderForm />;
}
