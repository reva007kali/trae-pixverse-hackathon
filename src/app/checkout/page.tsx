import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getUserSessionId } from "@/lib/user-session";

export default async function CheckoutPage() {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) redirect("/login?next=/checkout");

  return (
    <div className="flex-1 bg-background">
      <TopNav />
      <Container className="py-12">
        <CheckoutView />
      </Container>
    </div>
  );
}
