const clientes = [
  { nombre: "Identity Peluqueros", precio: "550€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { nombre: "Desancho Estilistas", precio: "550€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { nombre: "Last Mile Distribution", precio: "TBD", estado: "EN CURSO", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { nombre: "Malvarrosa CF", precio: "300€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { nombre: "Matías Benegas Tattoo", precio: "300€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
];

export default function ClientesPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Clientes</h1>

      <div className="grid grid-cols-3 gap-4">
        {clientes.map(({ nombre, precio, estado, color, bg }) => (
          <div
            key={nombre}
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{ background: "#111120", border: "1px solid #1a1a2e" }}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium leading-snug" style={{ color: "#e2e8f0" }}>{nombre}</h3>
              <span
                className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color, background: bg, border: `1px solid ${color}33` }}
              >
                {estado}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>{precio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
