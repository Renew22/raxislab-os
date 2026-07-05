// Server wrapper: fuerza render dinámico para que Vercel genere una lambda
// de esta ruta anidada (evita "Unable to find lambda for route").
export const dynamic = "force-dynamic";

import AnalisisClient from "./AnalisisClient";

export default function Page() {
  return <AnalisisClient />;
}
