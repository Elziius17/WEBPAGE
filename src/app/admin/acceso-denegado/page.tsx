import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function Denied() {
  return (
    <EmptyState icon={ShieldAlert} title="Acceso restringido" description="Tu rol no tiene permisos para ver esta sección. Si crees que es un error, contacta al administrador." action={<ButtonLink href="/admin" variant="secondary">Volver al panel</ButtonLink>} />
  );
}
