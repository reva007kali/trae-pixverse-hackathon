import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { CartView } from "@/components/cart/CartView";
import { getUserSessionId } from "@/lib/user-session";

export default async function CartPage() {
  const sessionId = getUserSessionId(await cookies());
  if (!sessionId) redirect("/login?next=/cart");

  return (
    <div className="flex-1 bg-background">
      <TopNav />
      <Container className="py-12">
        <CartView />
      </Container>
    </div>
  );
}
