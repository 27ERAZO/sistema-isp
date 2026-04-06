import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import VistaFacturaCliente from './VistaFacturaCliente'
import '../styles/portalCliente.css'

function VistaPortalCliente() {
  const [clientes, setClientes] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [clienteInfo, setClienteInfo] = useState(null)
  const [servicios, setServicios] = useState([])
  const [facturas, setFacturas] = useState([])
  const [pagos, setPagos] = useState([])
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombres, apellidos')
      .order('nombres', { ascending: true })

    if (error) {
      console.error('Error cargando clientes:', error)
      return
    }

    setClientes(data || [])
  }

  const cargarPortalCliente = async (clienteId) => {
    if (!clienteId) return

    setCargando(true)

    const { data: clienteData, error: errorCliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', Number(clienteId))
      .single()

    if (errorCliente) {
      console.error('Error cargando cliente:', errorCliente)
      setCargando(false)
      return
    }

    const { data: serviciosData } = await supabase
      .from('servicios')
      .select(`
        *,
        planes ( id, nombre, precio )
      `)
      .eq('cliente_id', Number(clienteId))
      .order('id', { ascending: false })

    const { data: facturasData } = await supabase
      .from('facturas')
      .select(`
        *,
        clientes ( id, nombres, apellidos, direccion, telefono )
      `)
      .eq('cliente_id', Number(clienteId))
      .order('id', { ascending: false })

    const { data: pagosData } = await supabase
      .from('pagos')
      .select(`
        *,
        facturas ( id, numero_factura )
      `)
      .eq('cliente_id', Number(clienteId))
      .order('id', { ascending: false })

    setClienteInfo(clienteData || null)
    setServicios(serviciosData || [])
    setFacturas(facturasData || [])
    setPagos(pagosData || [])
    setCargando(false)
  }

  const manejarSeleccionCliente = (e) => {
    const id = e.target.value
    setClienteSeleccionado(id)
    setFacturaSeleccionada(null)

    if (id) {
      cargarPortalCliente(id)
    } else {
      setClienteInfo(null)
      setServicios([])
      setFacturas([])
      setPagos([])
    }
  }

  if (facturaSeleccionada) {
    return (
      <VistaFacturaCliente
        facturaData={facturaSeleccionada}
        onVolver={() => setFacturaSeleccionada(null)}
      />
    )
  }

  return (
    <div className="portal-cliente-bg">
      <div className="portal-contenido">
        {/* HEADER */}
        <div className="card-portal portal-header">
          <div>
            <p className="portal-mini">W-RED TECHNOLOGY</p>
            <h1 className="portal-bienvenida">Portal Cliente</h1>
            <p className="portal-subtitulo">
              Consulta servicio, facturas y pagos por cliente
            </p>
          </div>
        </div>

        {/* SELECTOR */}
        <div className="card-portal">
          <h3 className="titulo-portal">Seleccionar cliente</h3>

           <select
             style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: '#020617',
          color: '#ffffff',
          border: '1px solid #334155',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none'
        }}

            value={clienteSeleccionado}
            onChange={manejarSeleccionCliente}
            className="input-portal"
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombres} {cliente.apellidos || ''}
              </option>
            ))}
          </select>
        </div>

        {cargando && (
          <div className="card-portal">
            <h3 className="titulo-portal">Cargando información del cliente...</h3>
          </div>
        )}

        {clienteInfo && !cargando && (
          <>
            {/* RESUMEN */}
            <div className="portal-resumen-grid">
              <div className="card-resumen azul">
                <p>Estado cliente</p>
                <h3>{clienteInfo.estado || 'N/A'}</h3>
              </div>

              <div className="card-resumen morado">
                <p>Facturas</p>
                <h3>{facturas.length}</h3>
              </div>

              <div className="card-resumen verde">
                <p>Pagos</p>
                <h3>{pagos.length}</h3>
              </div>

              <div className="card-resumen naranja">
                <p>Servicios</p>
                <h3>{servicios.length}</h3>
              </div>
            </div>

            {/* DATOS DEL CLIENTE */}
            <div className="card-portal">
              <h3 className="titulo-portal">Datos del cliente</h3>

              <div className="portal-grid">
                <div className="info-box">
                  <span>Nombre</span>
                  <strong>{clienteInfo.nombres || ''} {clienteInfo.apellidos || ''}</strong>
                </div>

                <div className="info-box">
                  <span>Teléfono</span>
                  <strong>{clienteInfo.telefono || 'N/A'}</strong>
                </div>

                <div className="info-box">
                  <span>Dirección</span>
                  <strong>{clienteInfo.direccion || 'N/A'}</strong>
                </div>

                <div className="info-box">
                  <span>Barrio</span>
                  <strong>{clienteInfo.barrio || 'N/A'}</strong>
                </div>

                <div className="info-box">
                  <span>Ciudad</span>
                  <strong>{clienteInfo.ciudad || 'N/A'}</strong>
                </div>

                <div className="info-box">
                  <span>Estado</span>
                  <strong>{clienteInfo.estado || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {/* SERVICIO */}
            <div className="card-portal">
              <h3 className="titulo-portal">Estado del servicio</h3>

              {servicios.length === 0 ? (
                <p className="texto-vacio">Este cliente no tiene servicios registrados.</p>
              ) : (
                <div className="portal-grid">
                  {servicios.map((servicio) => (
                    <div key={servicio.id} className="mini-card-portal">
                      <p><strong>Servicio ID:</strong> {servicio.id}</p>
                      <p><strong>Plan:</strong> {servicio.planes?.nombre || 'N/A'}</p>
                      <p><strong>Tipo:</strong> {servicio.tipo_servicio || 'N/A'}</p>
                      <p><strong>IP:</strong> {servicio.ip_asignada || 'N/A'}</p>
                      <p><strong>Estado:</strong> {servicio.estado || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FACTURAS */}
            <div className="card-portal">
              <h3 className="titulo-portal">Facturas</h3>

              {facturas.length === 0 ? (
                <p className="texto-vacio">No hay facturas para este cliente.</p>
              ) : (
                <div className="tabla-wrap">
                  <table className="tabla-portal">
                    <thead>
                      <tr>
                        <th>Factura</th>
                        <th>Periodo</th>
                        <th>Emisión</th>
                        <th>Vencimiento</th>
                        <th>Total</th>
                        <th>Saldo</th>
                        <th>Estado</th>
                        <th>Ver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map((factura) => (
                        <tr key={factura.id}>
                          <td>{factura.numero_factura}</td>
                          <td>{factura.periodo}</td>
                          <td>{factura.fecha_emision}</td>
                          <td>{factura.fecha_vencimiento}</td>
                          <td>${Number(factura.total || 0).toLocaleString()}</td>
                          <td>${Number(factura.saldo_pendiente || 0).toLocaleString()}</td>
                          <td>
                            <span className={`estado-chip ${obtenerClaseEstado(factura.estado)}`}>
                              {factura.estado}
                            </span>
                          </td>
                          <td>
                            <button
                              className="boton-portal"
                              onClick={() => setFacturaSeleccionada(factura)}
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
            </div>

            {/* PAGOS */}
            <div className="card-portal">
              <h3 className="titulo-portal">Pagos registrados</h3>

              {pagos.length === 0 ? (
                <p className="texto-vacio">No hay pagos registrados para este cliente.</p>
              ) : (
                <div className="tabla-wrap">
                  <table className="tabla-portal">
                    <thead>
                      <tr>
                        <th>Factura</th>
                        <th>Valor</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => (
                        <tr key={pago.id}>
                          <td>{pago.facturas?.numero_factura || ''}</td>
                          <td>${Number(pago.valor || 0).toLocaleString()}</td>
                          <td>{pago.metodo_pago}</td>
                          <td>{pago.referencia_pago || ''}</td>
                          <td>{pago.fecha_pago}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MEDIO DE PAGO */}
            <div className="card-portal">
              <h3 className="titulo-portal">Medio de pago disponible</h3>

              <div className="bloque-pago">
                <p className="bloque-pago-mini">MÉTODO DE PAGO DISPONIBLE</p>
                <h2>Nequi</h2>
                <h1>302 761 7040</h1>
                <p>Envía tu comprobante al WhatsApp <strong>323 253 7659</strong></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function obtenerClaseEstado(estado) {
  if (estado === 'Pagada') return 'pagada'
  if (estado === 'Pendiente') return 'pendiente'
  return 'parcial'
}

export default VistaPortalCliente