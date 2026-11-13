import Link from "next/link";
import { SaltaSvg } from "@/components/SaltaSvg";

const LAYERS = [
  { n: "1", t: "Territorio vivo", d: "GIS, observación terrestre, localidades, infraestructura, agua, biodiversidad, proyectos y aportes de los actores." },
  { n: "2", t: "Inteligencia territorial", d: "Indicadores ODS, brechas, alertas tempranas, datos faltantes y consultas fundamentadas en fuentes." },
  { n: "3", t: "Motor de decisiones", d: "Simulación y comparación de alternativas de inversión con supuestos explícitos." },
  { n: "4", t: "Gestión integrada y calidad", d: "Objetivos, compromisos, riesgos, evidencias y acciones correctivas con referencias ISO." },
  { n: "5", t: "Confianza y verificación", d: "Huellas SHA-256 ancladas en Avalanche y atestación por terceros. Los documentos quedan fuera de la cadena." },
];

const MODULES: { n: string; t: string; href: string; estado: "MVP" | "Base" }[] = [
  { n: "01", t: "Observatorio 360", href: "/observatorio", estado: "MVP" },
  { n: "02", t: "Inteligencia Territorial", href: "/diagnostico#consultas", estado: "Base" },
  { n: "03", t: "Índice IET 360", href: "/diagnostico#iet", estado: "Base" },
  { n: "04", t: "Simulador de Escenarios", href: "/simulador", estado: "MVP" },
  { n: "05", t: "Gestión SGI", href: "/gestion", estado: "Base" },
  { n: "06", t: "Participación Territorial", href: "/participacion", estado: "Base" },
  { n: "07", t: "Pasaporte de Impacto", href: "/pasaporte", estado: "MVP" },
  { n: "08", t: "Centro de Decisiones", href: "/decisiones", estado: "Base" },
];

const FLOW = ["Registro", "Gestión", "Evidencia", "Hash SHA-256", "Avalanche Fuji", "Verificación"];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.25fr_1fr] md:py-20">
          <div>
            <p className="inline-block rounded-full border border-eco-500/50 bg-eco-500/10 px-3 py-1 text-xs font-semibold text-eco-100">
              Argentina Space Hackathon 2026 · Track Blockchain · Avalanche × Oracle
            </p>
            <h1 className="mt-5 text-4xl leading-tight font-extrabold md:text-5xl">
              Inteligencia territorial para decidir mejor y <span className="text-eco-500">verificar resultados</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-sky-100/90">
              Territorio 360 conecta territorio, indicadores, inversiones, actores, compromisos y evidencias en un mismo sistema, para que gobiernos,
              empresas y comunidades anticipen riesgos, comparen inversiones y verifiquen lo que se cumple.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/observatorio" className="btn btn-eco">
                Explorar el Observatorio
              </Link>
              <Link href="/pasaporte" className="btn border border-white/30 text-white hover:bg-white/10">
                Ver Pasaporte de Impacto →
              </Link>
            </div>
            <p className="mt-6 text-xs text-sky-200/70">Territorio piloto: Provincia de Salta · Primer ámbito: minería, litio y desarrollo territorial sostenible.</p>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 rounded-3xl bg-eco-500/10 blur-3xl" />
            <div className="relative mx-auto h-[380px] w-[340px]">
              <SaltaSvg />
            </div>
            <p className="relative mt-2 text-center text-[11px] text-sky-200/70">
              Departamentos de Salta (IDESA). Resaltado: Los Andes, sede del caso demostrativo hipotético.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-xs font-bold tracking-widest text-rose-700 uppercase">Problema</p>
            <p className="mt-2 text-slate-700">
              La información territorial está dispersa entre gobiernos, empresas, organismos y comunidades. Datos, compromisos y evidencias no
              siempre están conectados ni pueden verificarse.
            </p>
          </div>
          <div className="card p-6">
            <p className="text-xs font-bold tracking-widest text-navy-700 uppercase">Solución</p>
            <p className="mt-2 text-slate-700">
              Un sistema que integra inteligencia geoespacial, IA, gestión de calidad y blockchain para transformar información en decisiones
              territoriales verificables.
            </p>
          </div>
          <div className="card p-6">
            <p className="text-xs font-bold tracking-widest text-eco-700 uppercase">Innovación</p>
            <p className="mt-2 text-slate-700">
              No es otro mapa ni otro dashboard: es un grafo de evidencias y decisiones con gobernanza multiactor. Ningún actor valida su propio
              impacto.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-navy-900">Cinco capas conectadas</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {LAYERS.map((l) => (
              <div key={l.n} className="rounded-xl border border-slate-200 bg-canvas p-4">
                <p className="font-mono text-xs text-eco-700">CAPA {l.n}</p>
                <p className="mt-1 font-semibold text-navy-900">{l.t}</p>
                <p className="mt-2 text-sm text-slate-600">{l.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-bold text-navy-900">Ocho módulos</h2>
          <p className="text-xs text-slate-500">
            <b>MVP</b>: ciclo demostrable completo · <b>Base</b>: estructura y primera versión funcional
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <Link key={m.n} href={m.href} className="card group flex items-center justify-between p-4 hover:border-eco-500">
              <div>
                <p className="font-mono text-xs text-slate-400">MÓDULO {m.n}</p>
                <p className="font-semibold text-navy-900 group-hover:text-eco-700">{m.t}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${m.estado === "MVP" ? "bg-eco-100 text-eco-700" : "bg-navy-100 text-navy-700"}`}
              >
                {m.estado}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-navy-900 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold">Caso demostrativo · Puna salteña</h2>
          <p className="mt-2 max-w-3xl text-sky-100/80">
            Una inversión <b>hipotética</b> busca mejorar el acceso al agua y fortalecer proveedores locales en un territorio de influencia minera
            (ODS 6, 8, 9 y 10). Actores, cifras y documentos del caso son sintéticos; localidades y límites son datos oficiales.
          </p>
          <ol className="mt-8 grid gap-3 md:grid-cols-6">
            {FLOW.map((f, i) => (
              <li key={f} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="font-mono text-xs text-eco-500">0{i + 1}</p>
                <p className="mt-1 font-semibold">{f}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/15 p-5">
              <p className="text-sm font-bold text-[#f80000]">ORACLE</p>
              <p className="mt-1 text-sky-100/90">
                Infraestructura cloud, almacenamiento de evidencias (OCI Object Storage), datos espaciales e IA generativa para convertir información
                territorial en conocimiento.
              </p>
            </div>
            <div className="rounded-xl border border-white/15 p-5">
              <p className="text-sm font-bold text-[#e84142]">AVALANCHE</p>
              <p className="mt-1 text-sky-100/90">
                Registro y verificación descentralizada de huellas de evidencias y eventos de atestación en la C-Chain (Fuji testnet).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-xl font-medium text-navy-900 italic">
          “Los territorios no necesitan más información dispersa. Necesitan inteligencia para comprender lo que sucede, anticipar lo que puede
          ocurrir y decidir mejor cómo construir su futuro.”
        </p>
      </section>
    </div>
  );
}
