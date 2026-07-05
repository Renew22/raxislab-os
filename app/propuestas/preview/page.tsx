// Server wrapper: fuerza render dinámico para que Vercel genere una lambda
// de esta ruta (la versión client con useSearchParams se prerenderizaba como
// estática y el build de Vercel fallaba con "Unable to find lambda for route").
export const dynamic = "force-dynamic";

import PreviewClient from "./PreviewClient";

export default function Page() {
  return <PreviewClient />;
}
