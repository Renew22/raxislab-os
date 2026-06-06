export default function StokersPage() {
  const acciones = [
    "Definir modelo de negocio y estructura de comisiones",
    "Investigar proveedores premium en España y Europa",
    "Diseñar MVP de la plataforma",
    "Validar propuesta con comunidad barbacoa España",
    "Crear landing page para lista de espera",
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Stokers Market</h1>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          EN DESARROLLO
        </span>
      </div>

      <div className="rounded-xl p-8 space-y-8" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
        <div>
          <h2 className="text-base font-semibold mb-3" style={{ color: "#e2e8f0" }}>¿Qué es Stokers Market?</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            Marketplace especializado en productos de barbacoa, ahumadores y accesorios premium para
            aficionados a la brasa. Una plataforma curada donde los mejores proveedores y la mejor
            comunidad se encuentran — enfocada en el mercado hispanohablante.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>Próximas acciones</h2>
          <div className="flex flex-col gap-3">
            {acciones.map((accion) => (
              <div
                key={accion}
                className="flex items-center gap-4 p-4 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a2e" }}
              >
                <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
                <span className="flex-1 text-sm" style={{ color: "#94a3b8" }}>{accion}</span>
                <span className="text-xs" style={{ color: "#334155" }}>Pendiente</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2" style={{ borderTop: "1px solid #1a1a2e" }}>
          <p className="text-xs" style={{ color: "#334155" }}>Raxislab OS — Proyecto en construcción</p>
        </div>
      </div>
    </div>
  );
}
