import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaReportes() {
  const hoy = new Date().toISOString().split('T')[0]
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [facturas, setFacturas] = useState([])
  const [pagos, setPagos] = useState([])
  const [tickets, setTickets] = useState([])

  const [filtros, setFiltros] = useState({
    fecha_inicio: inicioMes,
    fecha_fin: hoy
  })

  useEffect(() => {
    cargarReportes()
  }, [])

  const cargarReportes = async () => {
    setCargando(true)
    setMensaje('')

    try {
      const [
        clientesRes,
        serviciosRes,
        facturasRes,
        pagosRes,
        ticketsRes
      ] = await Promise.all([
        supabase
          .from('clientes')
          .select('id, nombres, apellidos, estado'),

        supabase
          .from('servicios')
          .select('id, cliente_id, estado'),

        supabase
          .from('facturas')
          .select('id, cliente_id, numero_factura, periodo, total, saldo_pendiente, estado, created_at')
          .order('id', { ascending: false }),

        supabase
          .from('pagos')
          .select('id, cliente_id, factura_id, valor, metodo_pago, referencia_pago, fecha_pago, created_at')
          .order('id', { ascending: false }),

        supabase
          .from('tickets')
          .select('id, cliente_id, asunto, estado, created_at')
          .order('id', { ascending: false })
      ])

      if (clientesRes.error) throw clientesRes.error
      if (serviciosRes.error) throw serviciosRes.error
      if (facturasRes.error) throw facturasRes.error
      if (pagosRes.error) throw pagosRes.error
      if (ticketsRes.error) throw ticketsRes.error

      setClientes(clientesRes.data || [])
      setServicios(serviciosRes.data || [])
      setFacturas(facturasRes.data || [])
      setPagos(pagosRes.data || [])
      setTickets(ticketsRes.data || [])
    } catch (error) {
      console.error('Error cargando reportes:', error)
      setMensaje(`Error cargando la información de reportes: ${error.message || 'revisa tablas o columnas'}`)
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioFiltro = (e) => {
    const { name, value } = e.target
    setFiltros((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const obtenerNombreCliente = (clienteId) => {
    const cliente = clientes.find((c) => Number(c.id) === Number(clienteId))
    if (!cliente) return 'Sin cliente'
    return `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
  }

  const obtenerFacturaPorId = (facturaId) => {
    return facturas.find((f) => Number(f.id) === Number(facturaId))
  }

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((pago) => {
      if (!pago.fecha_pago) return false
      return (
        pago.fecha_pago >= filtros.fecha_inicio &&
        pago.fecha_pago <= filtros.fecha_fin
      )
    })
  }, [pagos, filtros.fecha_inicio, filtros.fecha_fin])

  const facturasPendientes = useMemo(() => {
    return facturas.filter((factura) => {
      const saldo = Number(factura.saldo_pendiente || 0)
      return saldo > 0
    })
  }, [facturas])

  const totalClientes = clientes.length
  const clientesActivos = clientes.filter((c) => (c.estado || '').toLowerCase() === 'activo').length
  const clientesSuspendidos = clientes.filter((c) => (c.estado || '').toLowerCase() === 'suspendido').length
  const clientesRetirados = clientes.filter((c) => (c.estado || '').toLowerCase() === 'retirado').length

  const serviciosActivos = servicios.filter((s) => (s.estado || '').toLowerCase() === 'activo').length
  const serviciosSuspendidos = servicios.filter((s) => (s.estado || '').toLowerCase() === 'suspendido').length

  const facturasPendientesCount = facturas.filter((f) => (f.estado || '').toLowerCase() === 'pendiente').length
  const facturasParcialesCount = facturas.filter((f) => (f.estado || '').toLowerCase() === 'parcial').length
  const facturasPagadasCount = facturas.filter((f) => (f.estado || '').toLowerCase() === 'pagada').length

  const totalFacturado = facturas.reduce((acc, factura) => {
    return acc + Number(factura.total || 0)
  }, 0)

  const totalRecaudado = pagosFiltrados.reduce((acc, pago) => {
    return acc + Number(pago.valor || 0)
  }, 0)

  const saldoPendienteTotal = facturas.reduce((acc, factura) => {
    return acc + Number(factura.saldo_pendiente || 0)
  }, 0)

  const ticketsAbiertos = tickets.filter((t) => {
    const estado = (t.estado || '').toLowerCase()
    return estado === 'abierto' || estado === 'pendiente' || estado === 'en proceso'
  }).length

  const ticketsCerrados = tickets.filter((t) => {
    const estado = (t.estado || '').toLowerCase()
    return estado === 'cerrado' || estado === 'resuelto'
  }).length

  const topDeudores = useMemo(() => {
    const agrupado = {}

    facturasPendientes.forEach((factura) => {
      const clienteId = factura.cliente_id || 'sin_cliente'
      const nombre = obtenerNombreCliente(factura.cliente_id)

      if (!agrupado[clienteId]) {
        agrupado[clienteId] = {
          cliente_id: clienteId,
          nombre,
          saldo: 0,
          facturas: 0
        }
      }

      agrupado[clienteId].saldo += Number(factura.saldo_pendiente || 0)
      agrupado[clienteId].facturas += 1
    })

    return Object.values(agrupado)
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 10)
  }, [facturasPendientes, clientes])

  const pagosPorMetodo = useMemo(() => {
    const agrupado = {}

    pagosFiltrados.forEach((pago) => {
      const metodo = pago.metodo_pago || 'Sin método'
      if (!agrupado[metodo]) agrupado[metodo] = 0
      agrupado[metodo] += Number(pago.valor || 0)
    })

    return Object.entries(agrupado)
      .map(([metodo, valor]) => ({ metodo, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [pagosFiltrados])

  const exportarCSVFacturasPendientes = () => {
    const encabezados = [
      'ID',
      'Cliente',
      'Factura',
      'Periodo',
      'Total',
      'Saldo Pendiente',
      'Estado'
    ]

    const filas = facturasPendientes.map((factura) => [
      factura.id,
      obtenerNombreCliente(factura.cliente_id),
      factura.numero_factura || '',
      factura.periodo || '',
      Number(factura.total || 0),
      Number(factura.saldo_pendiente || 0),
      factura.estado || ''
    ])

    descargarCSV('reporte_facturas_pendientes.csv', encabezados, filas)
  }

  const exportarCSVPagos = () => {
    const encabezados = [
      'ID',
      'Cliente',
      'Factura',
      'Fecha',
      'Valor',
      'Metodo',
      'Referencia'
    ]

    const filas = pagosFiltrados.map((pago) => [
      pago.id,
      obtenerNombreCliente(pago.cliente_id),
      obtenerFacturaPorId(pago.factura_id)?.numero_factura || '',
      pago.fecha_pago || '',
      Number(pago.valor || 0),
      pago.metodo_pago || '',
      pago.referencia_pago || ''
    ])

    descargarCSV('reporte_pagos.csv', encabezados, filas)
  }

  const imprimirReporte = () => {
    window.print()
  }

  return (
    <div style={contenedorPrincipal}>
      <div style={encabezadoPrincipal}>
        <h2 style={{ margin: 0, fontSize: '30px', color: '#ffffff' }}>Módulo de Reportes</h2>
        <p style={{ margin: '10px 0 0 0', color: '#dbeafe' }}>
          Resumen general de clientes, servicios, facturación, pagos y tickets
        </p>
      </div>

      {mensaje && (
        <div style={mensajeError}>
          {mensaje}
        </div>
      )}

      <div style={cardOscura}>
        <h3 style={tituloBlanco}>Filtros del reporte</h3>

        <div style={gridFiltros}>
          <div>
            <label style={labelClaro}>Fecha inicio</label>
            <input
              type="date"
              name="fecha_inicio"
              value={filtros.fecha_inicio}
              onChange={manejarCambioFiltro}
              style={inputOscuro}
            />
          </div>

          <div>
            <label style={labelClaro}>Fecha fin</label>
            <input
              type="date"
              name="fecha_fin"
              value={filtros.fecha_fin}
              onChange={manejarCambioFiltro}
              style={inputOscuro}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={cargarReportes} style={botonAzul}>
            {cargando ? 'Cargando...' : 'Actualizar reporte'}
          </button>

          <button onClick={imprimirReporte} style={botonVerde}>
            Imprimir
          </button>

          <button onClick={exportarCSVFacturasPendientes} style={botonAmarillo}>
            Exportar facturas pendientes
          </button>

          <button onClick={exportarCSVPagos} style={botonMorado}>
            Exportar pagos del rango
          </button>
        </div>
      </div>

      <div style={resumenGrid}>
        <TarjetaResumen titulo="Clientes totales" valor={totalClientes} fondo="linear-gradient(135deg, #2563eb, #1d4ed8)" />
        <TarjetaResumen titulo="Clientes activos" valor={clientesActivos} fondo="linear-gradient(135deg, #16a34a, #15803d)" />
        <TarjetaResumen titulo="Servicios activos" valor={serviciosActivos} fondo="linear-gradient(135deg, #0ea5e9, #0284c7)" />
        <TarjetaResumen titulo="Facturas pendientes" valor={facturasPendientesCount} fondo="linear-gradient(135deg, #f59e0b, #d97706)" />
        <TarjetaResumen titulo="Facturas parciales" valor={facturasParcialesCount} fondo="linear-gradient(135deg, #fb923c, #ea580c)" />
        <TarjetaResumen titulo="Facturas pagadas" valor={facturasPagadasCount} fondo="linear-gradient(135deg, #22c55e, #16a34a)" />
        <TarjetaResumen titulo="Tickets abiertos" valor={ticketsAbiertos} fondo="linear-gradient(135deg, #ef4444, #dc2626)" />
        <TarjetaResumen titulo="Tickets cerrados" valor={ticketsCerrados} fondo="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
      </div>

      <div style={resumenGrid}>
        <TarjetaResumenMoneda titulo="Total facturado" valor={totalFacturado} fondo="linear-gradient(135deg, #0f172a, #1e293b)" />
        <TarjetaResumenMoneda titulo="Total recaudado" valor={totalRecaudado} fondo="linear-gradient(135deg, #065f46, #047857)" />
        <TarjetaResumenMoneda titulo="Saldo pendiente" valor={saldoPendienteTotal} fondo="linear-gradient(135deg, #7f1d1d, #b91c1c)" />
      </div>

      <div style={gridDosColumnas}>
        <div style={cardClara}>
          <h3 style={tituloOscuro}>Estado de clientes y servicios</h3>

          <div style={listaResumen}>
            <FilaDato titulo="Clientes suspendidos" valor={clientesSuspendidos} />
            <FilaDato titulo="Clientes retirados" valor={clientesRetirados} />
            <FilaDato titulo="Servicios suspendidos" valor={serviciosSuspendidos} />
          </div>
        </div>

        <div style={cardClara}>
          <h3 style={tituloOscuro}>Pagos por método ({filtros.fecha_inicio} a {filtros.fecha_fin})</h3>

          {pagosPorMetodo.length === 0 ? (
            <p style={textoOscuro}>No hay pagos en ese rango.</p>
          ) : (
            <div style={listaResumen}>
              {pagosPorMetodo.map((item, index) => (
                <FilaDato
                  key={index}
                  titulo={item.metodo}
                  valor={`$${Number(item.valor || 0).toLocaleString()}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={cardClara}>
        <h3 style={tituloOscuro}>Top clientes con mayor saldo pendiente</h3>

        {topDeudores.length === 0 ? (
          <p style={textoOscuro}>No hay clientes con saldo pendiente.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Facturas pendientes</th>
                  <th style={thEstilo}>Saldo total</th>
                </tr>
              </thead>
              <tbody>
                {topDeudores.map((item, index) => (
                  <tr key={index}>
                    <td style={tdEstilo}>{item.nombre}</td>
                    <td style={tdEstilo}>{item.facturas}</td>
                    <td style={tdEstilo}>${Number(item.saldo || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardClara}>
        <h3 style={tituloOscuro}>Facturas pendientes o parciales</h3>

        {facturasPendientes.length === 0 ? (
          <p style={textoOscuro}>No hay facturas pendientes.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>ID</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Factura</th>
                  <th style={thEstilo}>Periodo</th>
                  <th style={thEstilo}>Total</th>
                  <th style={thEstilo}>Saldo pendiente</th>
                  <th style={thEstilo}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {facturasPendientes.map((factura) => (
                  <tr key={factura.id}>
                    <td style={tdEstilo}>{factura.id}</td>
                    <td style={tdEstilo}>{obtenerNombreCliente(factura.cliente_id)}</td>
                    <td style={tdEstilo}>{factura.numero_factura || ''}</td>
                    <td style={tdEstilo}>{factura.periodo || ''}</td>
                    <td style={tdEstilo}>${Number(factura.total || 0).toLocaleString()}</td>
                    <td style={tdEstilo}>${Number(factura.saldo_pendiente || 0).toLocaleString()}</td>
                    <td style={tdEstilo}>
                      <span style={estiloEstadoFactura(factura.estado)}>
                        {factura.estado || 'Sin estado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardClara}>
        <h3 style={tituloOscuro}>Pagos del rango seleccionado</h3>

        {pagosFiltrados.length === 0 ? (
          <p style={textoOscuro}>No hay pagos en el rango seleccionado.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>ID</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Factura</th>
                  <th style={thEstilo}>Fecha</th>
                  <th style={thEstilo}>Valor</th>
                  <th style={thEstilo}>Método</th>
                  <th style={thEstilo}>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id}>
                    <td style={tdEstilo}>{pago.id}</td>
                    <td style={tdEstilo}>{obtenerNombreCliente(pago.cliente_id)}</td>
                    <td style={tdEstilo}>{obtenerFacturaPorId(pago.factura_id)?.numero_factura || ''}</td>
                    <td style={tdEstilo}>{pago.fecha_pago || ''}</td>
                    <td style={tdEstilo}>${Number(pago.valor || 0).toLocaleString()}</td>
                    <td style={tdEstilo}>{pago.metodo_pago || ''}</td>
                    <td style={tdEstilo}>{pago.referencia_pago || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardClara}>
        <h3 style={tituloOscuro}>Tickets recientes</h3>

        {tickets.length === 0 ? (
          <p style={textoOscuro}>No hay tickets registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>ID</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Asunto</th>
                  <th style={thEstilo}>Estado</th>
                  <th style={thEstilo}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 20).map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={tdEstilo}>{ticket.id}</td>
                    <td style={tdEstilo}>{obtenerNombreCliente(ticket.cliente_id)}</td>
                    <td style={tdEstilo}>{ticket.asunto || ''}</td>
                    <td style={tdEstilo}>
                      <span style={estiloEstadoTicket(ticket.estado)}>
                        {ticket.estado || 'Sin estado'}
                      </span>
                    </td>
                    <td style={tdEstilo}>{formatearFecha(ticket.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function TarjetaResumen({ titulo, valor, fondo }) {
  return (
    <div
      style={{
        background: fondo,
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
        color: '#ffffff'
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', color: '#dbeafe', fontSize: '15px' }}>{titulo}</h4>
      <p style={{ margin: 0, fontSize: '30px', fontWeight: 'bold', color: '#ffffff' }}>{valor}</p>
    </div>
  )
}

function TarjetaResumenMoneda({ titulo, valor, fondo }) {
  return (
    <div
      style={{
        background: fondo,
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
        color: '#ffffff'
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', color: '#dbeafe', fontSize: '15px' }}>{titulo}</h4>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>
        ${Number(valor || 0).toLocaleString()}
      </p>
    </div>
  )
}

function FilaDato({ titulo, valor }) {
  return (
    <div style={filaDato}>
      <span style={{ color: '#334155', fontWeight: '600' }}>{titulo}</span>
      <span style={{ color: '#0f172a', fontWeight: '700' }}>{valor}</span>
    </div>
  )
}

function descargarCSV(nombreArchivo, encabezados, filas) {
  const contenido = [
    encabezados.join(','),
    ...filas.map((fila) =>
      fila
        .map((valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
  ].join('\n')

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.setAttribute('download', nombreArchivo)
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString()
}

function estiloEstadoFactura(estado) {
  const e = (estado || '').toLowerCase()

  if (e === 'pagada') {
    return {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '6px 10px',
      borderRadius: '20px',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (e === 'parcial') {
    return {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '6px 10px',
      borderRadius: '20px',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  return {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '6px 10px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px'
  }
}

function estiloEstadoTicket(estado) {
  const e = (estado || '').toLowerCase()

  if (e === 'cerrado' || e === 'resuelto') {
    return {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '6px 10px',
      borderRadius: '20px',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (e === 'abierto' || e === 'pendiente' || e === 'en proceso') {
    return {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '6px 10px',
      borderRadius: '20px',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  return {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    padding: '6px 10px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px'
  }
}

const contenedorPrincipal = {
  color: '#e5e7eb'
}

const encabezadoPrincipal = {
  background: 'linear-gradient(135deg, #0f172a, #1d4ed8, #111827)',
  padding: '25px',
  borderRadius: '18px',
  marginTop: '20px',
  marginBottom: '25px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
}

const mensajeError = {
  backgroundColor: '#fee2e2',
  border: '1px solid #ef4444',
  color: '#991b1b',
  padding: '12px',
  borderRadius: '10px',
  marginBottom: '15px',
  fontWeight: '600'
}

const cardOscura = {
  background: 'linear-gradient(135deg, #111827, #1e293b)',
  padding: '25px',
  borderRadius: '16px',
  marginTop: '20px',
  marginBottom: '20px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
}

const cardClara = {
  backgroundColor: '#ffffff',
  padding: '25px',
  borderRadius: '16px',
  marginTop: '20px',
  marginBottom: '20px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
}

const tituloBlanco = {
  marginTop: 0,
  marginBottom: '16px',
  color: '#ffffff',
  fontSize: '22px'
}

const tituloOscuro = {
  marginTop: 0,
  marginBottom: '16px',
  color: '#0f172a',
  fontSize: '22px'
}

const textoOscuro = {
  color: '#334155'
}

const labelClaro = {
  display: 'block',
  marginBottom: '8px',
  color: '#cbd5e1',
  fontWeight: '600'
}

const inputOscuro = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '10px',
  border: '1px solid #334155',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  boxSizing: 'border-box',
  outline: 'none'
}

const botonAzul = {
  padding: '11px 18px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

const botonVerde = {
  padding: '11px 18px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

const botonAmarillo = {
  padding: '11px 18px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

const botonMorado = {
  padding: '11px 18px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

const resumenGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
  marginBottom: '20px'
}

const gridDosColumnas = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px'
}

const gridFiltros = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px'
}

const listaResumen = {
  display: 'grid',
  gap: '12px'
}

const filaDato = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '12px 14px',
  borderRadius: '12px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0'
}

const tablaEstilo = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#ffffff'
}

const thEstilo = {
  textAlign: 'left',
  padding: '12px',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  borderBottom: '1px solid #1e293b',
  fontSize: '14px'
}

const tdEstilo = {
  padding: '12px',
  borderBottom: '1px solid #e2e8f0',
  color: '#0f172a',
  fontSize: '14px',
  backgroundColor: '#ffffff'
}

export default VistaReportes