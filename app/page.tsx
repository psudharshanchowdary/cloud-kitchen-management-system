import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function IndexPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
