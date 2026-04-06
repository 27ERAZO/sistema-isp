import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import VistaFacturaCliente from './VistaFacturaCliente'

function VistaFacturacion() {
  const hoy = new Date().toISOString().split('T')[0]
  const periodoActual = new Date().toISOString().slice(0, 7)

  const [facturas, setFacturas] = useState([])
  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [facturaEditandoId, setFacturaEditandoId] = useState(null)
  const [cargando, setCargando] = useState(false)

  const [formAutomatico, setFormAutomatico] = useState({
    periodo: periodoActual,
    fecha_emision: hoy,
    fecha_vencimiento: hoy,
    recargo: 0
  })

  const [formManual, setFormManual] = useState({
    cliente_id: '',
    servicio_id: '',
    periodo: periodoActual,
    fecha_emision: hoy,
    fecha_vencimiento: hoy,
    subtotal: '',
    recargo: 0,
    estado: 'Pendiente'
  })

  useEffect(() => {
    cargarFacturas()
    cargarClientes()
    cargarServicios()
  }, [])

  const cargarFacturas = async () => {
    const { data, error } = await supabase
      .from('facturas')
      .select(`
        *,
        clientes ( id, nombres, apellidos, correo, direccion, telefono )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando facturas:', error)
      return
    }

    setFacturas(data || [])
  }

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombres, apellidos, correo, direccion, telefono, estado')
      .order('nombres', { ascending: true })

    if (error) {
      console.error('Error cargando clientes:', error)
      return
    }

    setClientes(data || [])
  }

  const cargarServicios = async () => {
    const { data, error } = await supabase
      .from('servicios')
      .select(`
        *,
        planes ( id, nombre, precio )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando servicios:', error)
      return
    }

    setServicios(data || [])
  }

  const manejarCambioAutomatico = (e) => {
    const { name, value } = e.target
    setFormAutomatico((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const manejarCambioManual = (e) => {
    const { name, value } = e.target

    setFormManual((prev) => ({
      ...prev,
      [name]: value
    }))

    if (name === 'servicio_id') {
      const servicio = servicios.find((s) => Number(s.id) === Number(value))

      if (servicio) {
        setFormManual((prev) => ({
          ...prev,
          servicio_id: value,
          subtotal: String(servicio.planes?.precio || 0),
          cliente_id: String(servicio.cliente_id || prev.cliente_id)
        }))
      }
    }
  }

  const limpiarFormularioManual = () => {
    setFormManual({
      cliente_id: '',
      servicio_id: '',
      periodo: periodoActual,
      fecha_emision: hoy,
      fecha_vencimiento: hoy,
      subtotal: '',
      recargo: 0,
      estado: 'Pendiente'
    })

    setFacturaEditandoId(null)
  }

  const enviarCorreoFactura = async ({
    correoCliente,
    nombreCliente,
    numeroFactura,
    periodo,
    fechaEmision,
    fechaVencimiento,
    total,
    saldoPendiente,
    estado
  }) => {
    try {
      if (!correoCliente) return

      await fetch('http://localhost:3001/enviar-correo-factura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correoCliente,
          nombreCliente,
          numeroFactura,
          periodo,
          fechaEmision,
          fechaVencimiento,
          total,
          saldoPendiente,
          estado
        })
      })
    } catch (errorCorreo) {
      console.error('Error enviando correo de factura:', errorCorreo)
    }
  }

  const generarFacturasAutomaticas = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formAutomatico.periodo || !formAutomatico.fecha_emision || !formAutomatico.fecha_vencimiento) {
      setMensaje('Debes completar período, fecha de emisión y fecha de vencimiento')
      return
    }

    setCargando(true)

    const clientesActivos = clientes.filter((cliente) => cliente.estado === 'Activo')

    if (clientesActivos.length === 0) {
      setMensaje('No hay clientes activos para facturar')
      setCargando(false)
      return
    }

    let creadas = 0

    for (const cliente of clientesActivos) {
      const servicioCliente = servicios.find(
        (servicio) =>
          Number(servicio.cliente_id) === Number(cliente.id) &&
          servicio.estado === 'Activo'
      )

      if (!servicioCliente) continue

      const precioPlan = Number(servicioCliente.planes?.precio || 0)
      const recargo = Number(formAutomatico.recargo || 0)
      const totalFactura = precioPlan + recargo

      const existeFactura = facturas.find(
        (factura) =>
          Number(factura.cliente_id) === Number(cliente.id) &&
          factura.periodo === formAutomatico.periodo
      )

      if (existeFactura) continue

      const numeroFactura = `FAC-${formAutomatico.periodo.replace('-', '')}-${cliente.id}-${Date.now()}`

      const { data: facturaInsertada, error } = await supabase
        .from('facturas')
        .insert([
          {
            cliente_id: cliente.id,
            numero_factura: numeroFactura,
            periodo: formAutomatico.periodo,
            fecha_emision: formAutomatico.fecha_emision,
            fecha_vencimiento: formAutomatico.fecha_vencimiento,
            subtotal: precioPlan,
            recargo,
            total: totalFactura,
            saldo_pendiente: totalFactura,
            estado: 'Pendiente'
          }
        ])
        .select(`
          *,
          clientes ( id, nombres, apellidos, correo, direccion, telefono )
        `)
        .single()

      if (!error && facturaInsertada) {
        creadas++

        await enviarCorreoFactura({
          correoCliente: cliente.correo,
          nombreCliente: `${cliente.nombres || ''} ${cliente.apellidos || ''}`,
          numeroFactura: facturaInsertada.numero_factura,
          periodo: facturaInsertada.periodo,
          fechaEmision: facturaInsertada.fecha_emision,
          fechaVencimiento: facturaInsertada.fecha_vencimiento,
          total: facturaInsertada.total,
          saldoPendiente: facturaInsertada.saldo_pendiente,
          estado: facturaInsertada.estado
        })
      } else {
        console.error('Error creando factura automática:', error)
      }
    }

    setMensaje(`Facturas automáticas generadas: ${creadas}`)
    await cargarFacturas()
    setCargando(false)
  }

  const guardarFacturaManual = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formManual.cliente_id || !formManual.periodo || !formManual.fecha_emision || !formManual.fecha_vencimiento) {
      setMensaje('Debes seleccionar cliente y completar todos los datos de la factura manual')
      return
    }

    setCargando(true)

    const subtotal = Number(formManual.subtotal || 0)
    const recargo = Number(formManual.recargo || 0)
    const totalFactura = subtotal + recargo
    const estadoFinal = formManual.estado || 'Pendiente'
    const saldoPendiente = estadoFinal === 'Pagada' ? 0 : totalFactura

    if (!facturaEditandoId) {
      const existeFactura = facturas.find(
        (factura) =>
          Number(factura.cliente_id) === Number(formManual.cliente_id) &&
          factura.periodo === formManual.periodo
      )

      if (existeFactura) {
        setMensaje('Ese cliente ya tiene factura para ese período')
        setCargando(false)
        return
      }
    }

    const datosFactura = {
      cliente_id: Number(formManual.cliente_id),
      periodo: formManual.periodo,
      fecha_emision: formManual.fecha_emision,
      fecha_vencimiento: formManual.fecha_vencimiento,
      subtotal,
      recargo,
      total: totalFactura,
      saldo_pendiente: saldoPendiente,
      estado: estadoFinal
    }

    let error = null
    let facturaGuardada = null

    if (facturaEditandoId) {
      const resultado = await supabase
        .from('facturas')
        .update(datosFactura)
        .eq('id', facturaEditandoId)
        .select(`
          *,
          clientes ( id, nombres, apellidos, correo, direccion, telefono )
        `)
        .single()

      error = resultado.error
      facturaGuardada = resultado.data
    } else {
      const numeroFactura = `FAC-${formManual.periodo.replace('-', '')}-${formManual.cliente_id}-${Date.now()}`

      const resultado = await supabase
        .from('facturas')
        .insert([
          {
            ...datosFactura,
            numero_factura: numeroFactura
          }
        ])
        .select(`
          *,
          clientes ( id, nombres, apellidos, correo, direccion, telefono )
        `)
        .single()

      error = resultado.error
      facturaGuardada = resultado.data
    }

    if (error) {
      console.error('Error guardando factura manual:', error)
      setMensaje('Error al guardar factura')
      setCargando(false)
      return
    }

    if (!facturaEditandoId && facturaGuardada) {
      const clienteSeleccionado = clientes.find(
        (c) => Number(c.id) === Number(formManual.cliente_id)
      )

      await enviarCorreoFactura({
        correoCliente: clienteSeleccionado?.correo,
        nombreCliente: `${clienteSeleccionado?.nombres || ''} ${clienteSeleccionado?.apellidos || ''}`,
        numeroFactura: facturaGuardada.numero_factura,
        periodo: facturaGuardada.periodo,
        fechaEmision: facturaGuardada.fecha_emision,
        fechaVencimiento: facturaGuardada.fecha_vencimiento,
        total: facturaGuardada.total,
        saldoPendiente: facturaGuardada.saldo_pendiente,
        estado: facturaGuardada.estado
      })
    }

    setMensaje(
      facturaEditandoId
        ? 'Factura actualizada correctamente'
        : 'Factura manual creada correctamente'
    )

    limpiarFormularioManual()
    await cargarFacturas()
    setCargando(false)
  }

  const editarFactura = (factura) => {
    setFormManual({
      cliente_id: factura.cliente_id ? String(factura.cliente_id) : '',
      servicio_id: '',
      periodo: factura.periodo || '',
      fecha_emision: factura.fecha_emision || hoy,
      fecha_vencimiento: factura.fecha_vencimiento || hoy,
      subtotal: String(factura.subtotal || 0),
      recargo: String(factura.recargo || 0),
      estado: factura.estado || 'Pendiente'
    })

    setFacturaEditandoId(factura.id)
    setMensaje(`Editando factura ${factura.numero_factura}`)
  }

  const eliminarFactura = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar esta factura?')
    if (!confirmar) return

    const { error } = await supabase
      .from('facturas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando factura:', error)
      setMensaje('Error al eliminar factura')
      return
    }

    if (facturaEditandoId === id) {
      limpiarFormularioManual()
    }

    setMensaje('Factura eliminada correctamente')
    await cargarFacturas()
  }

  const facturasFiltradas = facturas.filter((factura) => {
    const texto = busqueda.toLowerCase()

    const nombreCliente =
      `${factura.clientes?.nombres || ''} ${factura.clientes?.apellidos || ''}`.toLowerCase()

    return (
      nombreCliente.includes(texto) ||
      factura.periodo?.toLowerCase().includes(texto) ||
      factura.estado?.toLowerCase().includes(texto) ||
      factura.numero_factura?.toLowerCase().includes(texto)
    )
  })

  if (facturaSeleccionada) {
    return (
      <VistaFacturaCliente
        facturaData={facturaSeleccionada}
        onVolver={() => setFacturaSeleccionada(null)}
      />
    )
  }

  return (
    <div>
      <div style={heroEstilo}>
        <h2 style={{ margin: 0, fontSize: '30px', color: '#fff' }}>Módulo de Facturación</h2>
        <p style={{ margin: '10px 0 0 0', color: '#cbd5e1' }}>
          Facturación automática y manual por cliente
        </p>
      </div>

      {mensaje && <div style={mensajeEstilo}>{mensaje}</div>}

      <div style={gridDosColumnas}>
        <div style={cardEstilo}>
          <h3 style={tituloSeccion}>Generación automática</h3>

          <form onSubmit={generarFacturasAutomaticas}>
            <div style={gridEstilo}>
              <input
                name="periodo"
                placeholder="Periodo (YYYY-MM)"
                value={formAutomatico.periodo}
                onChange={manejarCambioAutomatico}
                style={inputEstilo}
              />

              <input
                type="date"
                name="fecha_emision"
                value={formAutomatico.fecha_emision}
                onChange={manejarCambioAutomatico}
                style={inputEstilo}
              />

              <input
                type="date"
                name="fecha_vencimiento"
                value={formAutomatico.fecha_vencimiento}
                onChange={manejarCambioAutomatico}
                style={inputEstilo}
              />

              <input
                type="number"
                name="recargo"
                placeholder="Recargo"
                value={formAutomatico.recargo}
                onChange={manejarCambioAutomatico}
                style={inputEstilo}
              />
            </div>

            <button type="submit" style={botonGenerar} disabled={cargando}>
              {cargando ? 'Generando...' : 'Generar facturas automáticas'}
            </button>
          </form>
        </div>

        <div style={cardEstilo}>
          <h3 style={tituloSeccion}>
            {facturaEditandoId ? 'Editar factura manual' : 'Factura manual por cliente'}
          </h3>

          <form onSubmit={guardarFacturaManual}>
            <div style={gridEstilo}>
              <select
                name="cliente_id"
                value={formManual.cliente_id}
                onChange={manejarCambioManual}
                style={inputEstilo}
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombres} {cliente.apellidos || ''}
                  </option>
                ))}
              </select>

              <select
                name="servicio_id"
                value={formManual.servicio_id}
                onChange={manejarCambioManual}
                style={inputEstilo}
              >
                <option value="">Selecciona un servicio (opcional)</option>
                {servicios
                  .filter((servicio) =>
                    formManual.cliente_id
                      ? Number(servicio.cliente_id) === Number(formManual.cliente_id)
                      : true
                  )
                  .map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      Servicio #{servicio.id} - {servicio.planes?.nombre || 'Sin plan'}
                    </option>
                  ))}
              </select>

              <input
                name="periodo"
                placeholder="Periodo (YYYY-MM)"
                value={formManual.periodo}
                onChange={manejarCambioManual}
                style={inputEstilo}
              />

              <input
                type="date"
                name="fecha_emision"
                value={formManual.fecha_emision}
                onChange={manejarCambioManual}
                style={inputEstilo}
              />

              <input
                type="date"
                name="fecha_vencimiento"
                value={formManual.fecha_vencimiento}
                onChange={manejarCambioManual}
                style={inputEstilo}
              />

              <input
                type="number"
                name="subtotal"
                placeholder="Subtotal"
                value={formManual.subtotal}
                onChange={manejarCambioManual}
                style={inputEstilo}
              />

              <input
                type="number"
                name="recargo"
                placeholder="Recargo"
                value={formManual.recargo}
                onChange={manejarCambioManual}
                style={inputEstilo}
              />

              <select
                name="estado"
                value={formManual.estado}
                onChange={manejarCambioManual}
                style={inputEstilo}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Parcial">Parcial</option>
                <option value="Pagada">Pagada</option>
              </select>
            </div>

            <button type="submit" style={botonGenerar} disabled={cargando}>
              {cargando
                ? 'Guardando...'
                : facturaEditandoId
                ? 'Actualizar factura'
                : 'Crear factura manual'}
            </button>

            {facturaEditandoId && (
              <button
                type="button"
                onClick={limpiarFormularioManual}
                style={botonCancelar}
              >
                Cancelar edición
              </button>
            )}
          </form>
        </div>
      </div>

      <div style={cardEstilo}>
        <h3 style={tituloSeccion}>Listado de facturas</h3>

        <input
          type="text"
          placeholder="Buscar por cliente, periodo, estado o número de factura"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...inputEstilo, marginBottom: '15px' }}
        />

        {facturasFiltradas.length === 0 ? (
          <p style={{ color: '#000000' }}>No hay facturas registradas todavía.</p>
        ) : (
          <div style={tablaWrap}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>Factura</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Periodo</th>
                  <th style={thEstilo}>Emisión</th>
                  <th style={thEstilo}>Vencimiento</th>
                  <th style={thEstilo}>Total</th>
                  <th style={thEstilo}>Saldo</th>
                  <th style={thEstilo}>Estado</th>
                  <th style={thEstilo}>Ver</th>
                  <th style={thEstilo}>Editar</th>
                  <th style={thEstilo}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((factura) => (
                  <tr key={factura.id}>
                    <td style={tdEstilo}>{factura.numero_factura}</td>
                    <td style={tdEstilo}>
                      {factura.clientes?.nombres || ''} {factura.clientes?.apellidos || ''}
                    </td>
                    <td style={tdEstilo}>{factura.periodo}</td>
                    <td style={tdEstilo}>{factura.fecha_emision}</td>
                    <td style={tdEstilo}>{factura.fecha_vencimiento}</td>
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
                        style={botonVer}
                      >
                        Ver
                      </button>
                    </td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => editarFactura(factura)}
                        style={botonEditar}
                      >
                        Editar
                      </button>
                    </td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => eliminarFactura(factura.id)}
                        style={botonEliminar}
                      >
                        Eliminar
                      </button>
                    </td>
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

function estadoFactura(estado) {
  if (estado === 'Pagada') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#052e16',
      color: '#4ade80',
      border: '1px solid #166534',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (estado === 'Pendiente') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#3f2d06',
      color: '#fbbf24',
      border: '1px solid #92400e',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  return {
    padding: '6px 10px',
    borderRadius: '20px',
    backgroundColor: '#1e1b4b',
    color: '#a78bfa',
    border: '1px solid #6d28d9',
    fontWeight: 'bold',
    fontSize: '13px'
  }
}

const heroEstilo = {
  background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
  color: '#fff',
  padding: '28px',
  borderRadius: '20px',
  marginBottom: '22px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)'
}

const mensajeEstilo = {
  backgroundColor: '#052e16',
  border: '1px solid #166534',
  color: '#4ade80',
  padding: '12px 16px',
  borderRadius: '12px',
  marginBottom: '18px',
  fontWeight: 'bold'
}

const gridDosColumnas = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
  gap: '20px',
  marginBottom: '22px'
}

const cardEstilo = {
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
  color: '#fff'
}

const tituloSeccion = {
  marginTop: 0,
  color: '#ffffff',
  fontSize: '24px'
}

const gridEstilo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px'
}

const inputEstilo = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid rgba(0, 0, 0, 0.17)',
  backgroundColor: 'rgba(255, 250, 250, 0.25)',
  color: '#050505bb',
  outline: 'none',
  boxSizing: 'border-box'
}

const botonGenerar = {
  marginTop: '18px',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 6px 18px rgba(37,99,235,0.35)'
}

const botonCancelar = {
  marginTop: '18px',
  marginLeft: '10px',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '12px',
  backgroundColor: '#6b7280',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer'
}

const tablaWrap = {
  overflowX: 'auto'
}

const tablaEstilo = {
  width: '100%',
  borderCollapse: 'collapse',
  color: '#e2e8f0'
}

const thEstilo = {
  textAlign: 'left',
  padding: '12px',
  backgroundColor: 'rgba(148, 163, 184, 0.12)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1'
}

const tdEstilo = {
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)'
}

const botonVer = {
  padding: '9px 14px',
  border: 'none',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 6px 16px rgba(37,99,235,0.35)'
}

const botonEditar = {
  padding: '9px 14px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#f59e0b',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold'
}

const botonEliminar = {
  padding: '9px 14px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#dc2626',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold'
}

export default VistaFacturacion