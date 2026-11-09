import PublicLayout from "../(public)/layout";

export const dynamic = "force-dynamic";

export default function AccountLayout(props: LayoutProps<"/">) {
  return <PublicLayout {...props} />;
}
