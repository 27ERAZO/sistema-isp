import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaDashboard() {
  const [estadisticas, setEstadisticas] = useState({
    clientesActivos: 0,
    serviciosActivos: 0,
    facturasPendientes: 0,
    facturasPagadas: 0,
    pagosDelMes: 0,
    ticketsAbiertos: 0,
    ticketsResueltos: 0
  })

  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDashboard()
  }, [])

  const cargarDashboard = async () => {
    setCargando(true)

    try {
      const { count: clientesActivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Activo')

      const { count: serviciosActivos } = await supabase
        .from('servicios')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Activo')

      const { count: facturasPendientes } = await supabase
        .from('facturas')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['Pendiente', 'Parcial'])

      const { count: facturasPagadas } = await supabase
        .from('facturas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pagada')

      const hoy = new Date()
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const inicioMesISO = inicioMes.toISOString()

      const { data: pagosMesData } = await supabase
        .from('pagos')
        .select('valor')
        .gte('created_at', inicioMesISO)

      const pagosDelMes = (pagosMesData || []).reduce((total, pago) => {
        return total + Number(pago.valor || 0)
      }, 0)

      const { count: ticketsAbiertos } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['Pendiente', 'En proceso', 'Visitado'])

      const { count: ticketsResueltos } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Resuelto')

      setEstadisticas({
        clientesActivos: clientesActivos || 0,
        serviciosActivos: serviciosActivos || 0,
        facturasPendientes: facturasPendientes || 0,
        facturasPagadas: facturasPagadas || 0,
        pagosDelMes: pagosDelMes || 0,
        ticketsAbiertos: ticketsAbiertos || 0,
        ticketsResueltos: ticketsResueltos || 0
      })
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    }

    setCargando(false)
  }

  if (cargando) {
    return (
      <div style={{ padding: '20px', color: '#fff' }}>
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      {/* ENCABEZADO */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
          color: '#fff',
          padding: '30px',
          borderRadius: '20px',
          marginBottom: '25px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '34px',
            fontWeight: '800',
            color: '#ffffff'
          }}
        >
          Dashboard General
        </h2>

        <p
          style={{
            margin: '10px 0 0 0',
            fontSize: '16px',
            color: '#dbeafe'
          }}
        >
          Resumen general del estado de tu sistema ISP
        </p>
      </div>

      {/* TARJETAS PRINCIPALES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}
      >
        <TarjetaGrande
          titulo="Pagos del mes"
          valor={`$${estadisticas.pagosDelMes.toLocaleString()}`}
          subtitulo="Dinero recaudado en el mes actual"
          fondo="linear-gradient(135deg, #16a34a, #14532d)"
          icono="💰"
        />

        <TarjetaGrande
          titulo="Facturas pendientes"
          valor={estadisticas.facturasPendientes}
          subtitulo="Facturas aún por cobrar"
          fondo="linear-gradient(135deg, #f97316, #7c2d12)"
          icono="📄"
        />
      </div>

      {/* TARJETAS SECUNDARIAS */}
      <div style={gridEstilo}>
        <TarjetaBonita
          titulo="Clientes activos"
          valor={estadisticas.clientesActivos}
          color="#0f172a"
          borde="#3b82f6"
          icono="👥"
        />

        <TarjetaBonita
          titulo="Servicios activos"
          valor={estadisticas.serviciosActivos}
          color="#0f172a"
          borde="#22c55e"
          icono="📡"
        />

        <TarjetaBonita
          titulo="Facturas pagadas"
          valor={estadisticas.facturasPagadas}
          color="#0f172a"
          borde="#a855f7"
          icono="✅"
        />

        <TarjetaBonita
          titulo="Tickets abiertos"
          valor={estadisticas.ticketsAbiertos}
          color="#0f172a"
          borde="#ef4444"
          icono="🛠️"
        />

        <TarjetaBonita
          titulo="Tickets resueltos"
          valor={estadisticas.ticketsResueltos}
          color="#0f172a"
          borde="#f59e0b"
          icono="✔️"
        />
      </div>
    </div>
  )
}

function TarjetaGrande({ titulo, valor, subtitulo, fondo, icono }) {
  return (
    <div
      style={{
        background: fondo,
        color: '#fff',
        padding: '28px',
        borderRadius: '18px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ fontSize: '30px', marginBottom: '10px' }}>{icono}</div>

      <div>
        <h3 style={{ margin: 0, fontSize: '20px', color: '#e2e8f0' }}>
          {titulo}
        </h3>

        <p
          style={{
            margin: '10px 0',
            fontSize: '38px',
            fontWeight: 'bold',
            color: '#ffffff'
          }}
        >
          {valor}
        </p>

        <p style={{ margin: 0, color: '#cbd5e1' }}>
          {subtitulo}
        </p>
      </div>
    </div>
  )
}

function TarjetaBonita({ titulo, valor, color, borde, icono }) {
  return (
    <div
      style={{
        backgroundColor: color,
        borderLeft: `6px solid ${borde}`,
        padding: '22px',
        borderRadius: '18px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.20)',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icono}</div>

      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          color: '#ffffff'
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}
      >
        {valor}
      </p>
    </div>
  )
}

const gridEstilo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '20px',
  marginTop: '20px'
}

export default VistaDashboard