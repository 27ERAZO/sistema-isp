import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import VistaFacturaCliente from './VistaFacturaCliente'

function VistaPortalClientePrivado() {
  const [clienteInfo, setClienteInfo] = useState(null)
  const [servicios, setServicios] = useState([])
  const [facturas, setFacturas] = useState([])
  const [pagos, setPagos] = useState([])
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarPortalPrivado()
  }, [])

  const cargarPortalPrivado = async () => {
    setCargando(true)

    const { data: authData } = await supabase.auth.getUser()
    const authUserId = authData?.user?.id

    if (!authUserId) {
      setCargando(false)
      return
    }

    const { data: portalData, error: errorPortal } = await supabase
      .from('portal_clientes')
      .select('cliente_id')
      .eq('auth_user_id', authUserId)
      .single()

    if (errorPortal || !portalData) {
      console.error('Error obteniendo relación portal-cliente:', errorPortal)
      setCargando(false)
      return
    }

    const clienteId = portalData.cliente_id

    const { data: clienteData } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single()

    const { data: serviciosData } = await supabase
      .from('servicios')
      .select(`
        *,
        planes ( id, nombre, precio )
      `)
      .eq('cliente_id', clienteId)
      .order('id', { ascending: false })

    const { data: facturasData } = await supabase
      .from('facturas')
      .select(`
        *,
        clientes ( id, nombres, apellidos, direccion, telefono )
      `)
      .eq('cliente_id', clienteId)
      .order('id', { ascending: false })

    const { data: pagosData } = await supabase
      .from('pagos')
      .select(`
        *,
        facturas ( id, numero_factura )
      `)
      .eq('cliente_id', clienteId)
      .order('id', { ascending: false })

    setClienteInfo(clienteData || null)
    setServicios(serviciosData || [])
    setFacturas(facturasData || [])
    setPagos(pagosData || [])
    setCargando(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (facturaSeleccionada) {
    return (
      <VistaFacturaCliente
        facturaData={facturaSeleccionada}
        onVolver={() => setFacturaSeleccionada(null)}
      />
    )
  }

  if (cargando) {
    return (
      <div style={paginaEstilo}>
        <div style={{ color: '#fff', fontSize: '20px' }}>
          Cargando portal del cliente...
        </div>
      </div>
    )
  }

  if (!clienteInfo) {
    return (
      <div style={paginaEstilo}>
        <div style={{ color: '#fff', fontSize: '20px' }}>
          No se encontró información del cliente.
        </div>
      </div>
    )
  }

  return (
    <div style={paginaEstilo}>
      <div style={contenedorEstilo}>
        {/* HEADER */}
        <div style={heroEstilo}>
          <div>
            <p style={heroMiniTitulo}>W-RED TECHNOLOGY</p>
            <h1 style={heroTitulo}>Portal Inteligente del Cliente</h1>
            <p style={heroTexto}>
              Bienvenido {clienteInfo.nombres} {clienteInfo.apellidos || ''}
            </p>
          </div>

          <button onClick={cerrarSesion} style={botonCerrar}>
            Cerrar sesión
          </button>
        </div>

        {/* RESUMEN RÁPIDO */}
        <div style={resumenGrid}>
          <ResumenCard titulo="Estado" valor={clienteInfo.estado || 'N/A'} brillo="#22c55e" />
          <ResumenCard titulo="Facturas" valor={facturas.length} brillo="#60a5fa" />
          <ResumenCard titulo="Pagos" valor={pagos.length} brillo="#a78bfa" />
          <ResumenCard titulo="Servicios" valor={servicios.length} brillo="#f59e0b" />
        </div>

        {/* DATOS DEL CLIENTE */}
        <Seccion titulo="Mis datos">
          <div style={gridEstilo}>
            <InfoBox titulo="Nombre" valor={`${clienteInfo.nombres || ''} ${clienteInfo.apellidos || ''}`} />
            <InfoBox titulo="Teléfono" valor={clienteInfo.telefono || 'N/A'} />
            <InfoBox titulo="Dirección" valor={clienteInfo.direccion || 'N/A'} />
            <InfoBox titulo="Estado" valor={clienteInfo.estado || 'N/A'} />
          </div>
        </Seccion>

        {/* SERVICIOS */}
        <Seccion titulo="Mi servicio">
          {servicios.length === 0 ? (
            <TextoVacio texto="No tienes servicios registrados." />
          ) : (
            <div style={gridEstilo}>
              {servicios.map((servicio) => (
                <div key={servicio.id} style={miniCard}>
                  <p><strong>Plan:</strong> {servicio.planes?.nombre || 'N/A'}</p>
                  <p><strong>Tipo:</strong> {servicio.tipo_servicio || 'N/A'}</p>
                  <p><strong>IP:</strong> {servicio.ip_asignada || 'N/A'}</p>
                  <p><strong>Estado:</strong> {servicio.estado || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </Seccion>

        {/* FACTURAS */}
        <Seccion titulo="Mis facturas">
          {facturas.length === 0 ? (
            <TextoVacio texto="No tienes facturas registradas." />
          ) : (
            <div style={tablaWrap}>
              <table style={tablaEstilo}>
                <thead>
                  <tr>
                    <th style={thEstilo}>Factura</th>
                    <th style={thEstilo}>Periodo</th>
                    <th style={thEstilo}>Total</th>
                    <th style={thEstilo}>Saldo</th>
                    <th style={thEstilo}>Estado</th>
                    <th style={thEstilo}>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((factura) => (
                    <tr key={factura.id}>
                      <td style={tdEstilo}>{factura.numero_factura}</td>
                      <td style={tdEstilo}>{factura.periodo}</td>
                      <td style={tdEstilo}>${Number(factura.total || 0).toLocaleString()}</td>
                      <td style={tdEstilo}>${Number(factura.saldo_pendiente || 0).toLocaleString()}</td>
                      <td style={tdEstilo}>
                        <span style={estadoFactura(factura.estado)}>
                          {factura.estado}
                        </span>
                      </td>
                      <td style={tdEstilo}>
                        <button
                          onClick={() => setFacturaSeleccionada(factura)}
                          style={botonFactura}
                        >
                          Ver factura
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>

        {/* PAGOS */}
        <Seccion titulo="Mis pagos">
          {pagos.length === 0 ? (
            <TextoVacio texto="No tienes pagos registrados." />
          ) : (
            <div style={tablaWrap}>
              <table style={tablaEstilo}>
                <thead>
                  <tr>
                    <th style={thEstilo}>Factura</th>
                    <th style={thEstilo}>Valor</th>
                    <th style={thEstilo}>Método</th>
                    <th style={thEstilo}>Referencia</th>
                    <th style={thEstilo}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td style={tdEstilo}>{pago.facturas?.numero_factura || ''}</td>
                      <td style={tdEstilo}>${Number(pago.valor || 0).toLocaleString()}</td>
                      <td style={tdEstilo}>{pago.metodo_pago}</td>
                      <td style={tdEstilo}>{pago.referencia_pago || ''}</td>
                      <td style={tdEstilo}>{pago.fecha_pago}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>

        {/* PAGO */}
        <div style={pagoCard}>
          <p style={pagoMini}>MÉTODO DE PAGO DISPONIBLE</p>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Nequi</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '40px', fontWeight: 'bold', letterSpacing: '2px' }}>
            302 761 7040
          </p>
          <p style={{ margin: 0, opacity: 0.85 }}>
            Envía tu comprobante al WhatsApp <strong>323 253 7659</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <div style={cardEstilo}>
      <h3 style={tituloSeccion}>{titulo}</h3>
      {children}
    </div>
  )
}

function InfoBox({ titulo, valor }) {
  return (
    <div style={infoBox}>
      <p style={infoTitulo}>{titulo}</p>
      <p style={infoValor}>{valor}</p>
    </div>
  )
}

function ResumenCard({ titulo, valor, brillo }) {
  return (
    <div
      style={{
        ...resumenCard,
        boxShadow: `0 0 0 1px ${brillo}55, 0 0 25px ${brillo}22`
      }}
    >
      <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '14px' }}>
        {titulo}
      </p>
      <p style={{ margin: 0, fontSize: '30px', fontWeight: 'bold', color: '#fff' }}>
        {valor}
      </p>
    </div>
  )
}

function TextoVacio({ texto }) {
  return (
    <p style={{ color: '#cbd5e1', margin: 0 }}>
      {texto}
    </p>
  )
}

function estadoFactura(estado) {
  if (estado === 'Pagada') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#052e16',
      color: '#4ade80',
      fontWeight: 'bold',
      fontSize: '13px',
      border: '1px solid #166534'
    }
  }

  if (estado === 'Pendiente') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#3f2d06',
      color: '#fbbf24',
      fontWeight: 'bold',
      fontSize: '13px',
      border: '1px solid #92400e'
    }
  }

  return {
    padding: '6px 10px',
    borderRadius: '20px',
    backgroundColor: '#1e1b4b',
    color: '#a78bfa',
    fontWeight: 'bold',
    fontSize: '13px',
    border: '1px solid #6d28d9'
  }
}

const paginaEstilo = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #0f172a, #020617 60%)',
  padding: '30px 20px'
}

const contenedorEstilo = {
  maxWidth: '1200px',
  margin: '0 auto'
}

const heroEstilo = {
  background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(168,85,247,0.14))',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  color: '#fff',
  padding: '28px',
  borderRadius: '22px',
  marginBottom: '24px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '15px',
  flexWrap: 'wrap'
}

const heroMiniTitulo = {
  margin: 0,
  color: '#93c5fd',
  letterSpacing: '2px',
  fontSize: '13px'
}

const heroTitulo = {
  margin: '8px 0',
  fontSize: '34px',
  lineHeight: 1.1
}

const heroTexto = {
  margin: 0,
  color: '#cbd5e1',
  fontSize: '16px'
}

const resumenGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
  marginBottom: '24px'
}

const resumenCard = {
  background: 'rgba(15, 23, 42, 0.75)',
  borderRadius: '18px',
  padding: '20px',
  backdropFilter: 'blur(10px)'
}

const cardEstilo = {
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  padding: '24px',
  borderRadius: '20px',
  marginBottom: '22px',
  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
  color: '#fff'
}

const tituloSeccion = {
  marginTop: 0,
  marginBottom: '18px',
  fontSize: '24px',
  color: '#e2e8f0'
}

const gridEstilo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px'
}

const miniCard = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '18px',
  color: '#e2e8f0'
}

const infoBox = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '16px'
}

const infoTitulo = {
  margin: '0 0 8px 0',
  color: '#94a3b8',
  fontSize: '14px'
}

const infoValor = {
  margin: 0,
  fontWeight: 'bold',
  color: '#f8fafc'
}

const tablaWrap = {
  overflowX: 'auto',
  borderRadius: '16px'
}

const tablaEstilo = {
  width: '100%',
  borderCollapse: 'collapse',
  color: '#e2e8f0',
  background: 'rgba(255,255,255,0.02)',
  borderRadius: '16px',
  overflow: 'hidden'
}

const thEstilo = {
  textAlign: 'left',
  padding: '12px',
  backgroundColor: 'rgba(148, 163, 184, 0.12)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.73)',
  color: '#cbd5e1'
}

const tdEstilo = {
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)'
}

const botonFactura = {
  padding: '9px 14px',
  border: 'none',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 6px 16px rgba(37,99,235,0.35)'
}

const botonCerrar = {
  padding: '12px 18px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 6px 16px rgba(220,38,38,0.35)'
}

const pagoCard = {
  background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(6,182,212,0.12))',
  border: '1px solid rgba(96,165,250,0.25)',
  borderRadius: '24px',
  padding: '28px',
  textAlign: 'center',
  color: '#fff',
  boxShadow: '0 0 25px rgba(59,130,246,0.18)'
}

const pagoMini = {
  margin: '0 0 10px 0',
  color: '#93c5fd',
  letterSpacing: '2px',
  fontSize: '13px'
}

export default VistaPortalClientePrivado