import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaFacturacion() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
  const hoy = new Date().toISOString().split('T')[0]
  const periodoActual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [formulario, setFormulario] = useState({
    cliente_id: '',
    servicio_id: '',
    periodo: periodoActual,
    fecha_emision: hoy,
    fecha_vencimiento: hoy,
    subtotal: '',
    recargo: '0',
  })

  useEffect(() => {
    obtenerClientes()
    obtenerServicios()
    obtenerFacturas()
  }, [])

  const obtenerClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombres, apellidos, correo')
      .order('nombres', { ascending: true })

    if (error) {
      console.error('Error cargando clientes:', error)
      return
    }

    setClientes(data || [])
  }

  const obtenerServicios = async () => {
    const { data, error } = await supabase
      .from('servicios')
      .select('id, cliente_id, nombre_servicio, precio')
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando servicios:', error)
      return
    }

    setServicios(data || [])
  }

  const obtenerFacturas = async () => {
    const { data, error } = await supabase
      .from('facturas')
      .select(`
        *,
        clientes ( id, nombres, apellidos, correo )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando facturas:', error)
      return
    }

    setFacturas(data || [])
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target
    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const serviciosFiltrados = formulario.cliente_id
    ? servicios.filter((servicio) => String(servicio.cliente_id) === String(formulario.cliente_id))
    : servicios

  const generarNumeroFactura = (clienteId, periodo) => {
    const limpio = String(periodo || '').replace('-', '')
    return `FAC-${limpio}-${clienteId}`
  }

  const generarFactura = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (
      !formulario.cliente_id ||
      !formulario.periodo ||
      !formulario.subtotal ||
      !formulario.fecha_emision ||
      !formulario.fecha_vencimiento
    ) {
      setMensaje('Debes completar cliente, período, subtotal, fecha de emisión y vencimiento')
      return
    }

    const clienteId = Number(formulario.cliente_id)
    const subtotal = Number(formulario.subtotal || 0)
    const recargo = Number(formulario.recargo || 0)
    const total = subtotal + recargo

    if (subtotal <= 0) {
      setMensaje('El subtotal debe ser mayor que cero')
      return
    }

    setCargando(true)

    try {
      const { data: facturaExistente, error: errorExistente } = await supabase
        .from('facturas')
        .select('id, numero_factura')
        .eq('cliente_id', clienteId)
        .eq('periodo', formulario.periodo)
        .maybeSingle()

      if (errorExistente) {
        console.error('Error verificando factura existente:', errorExistente)
        setMensaje('No se pudo validar si ya existe una factura para ese período')
        setCargando(false)
        return
      }

      if (facturaExistente) {
        setMensaje(`Ya existe una factura para este cliente en el período ${formulario.periodo}`)
        setCargando(false)
        return
      }

      const numeroFactura = generarNumeroFactura(clienteId, formulario.periodo)

      const payload = {
        cliente_id: clienteId,
        numero_factura: numeroFactura,
        periodo: formulario.periodo,
        fecha_emision: formulario.fecha_emision,
        fecha_vencimiento: formulario.fecha_vencimiento,
        subtotal: subtotal,
        recargo: recargo,
        total: total,
        saldo_pendiente: total,
        estado: 'Pendiente',
      }

      if (formulario.servicio_id) {
        payload.servicio_id = Number(formulario.servicio_id)
      }

      const { data: facturaInsertada, error: errorInsert } = await supabase
        .from('facturas')
        .insert([payload])
        .select(`
          *,
          clientes ( id, nombres, apellidos, correo )
        `)
        .single()

      if (errorInsert || !facturaInsertada) {
        console.error('Error generando factura:', errorInsert)
        setMensaje('No se pudo generar la factura')
        setCargando(false)
        return
      }

      let mensajeFinal = 'Factura generada correctamente'

      try {
        const clienteSeleccionado = clientes.find((c) => String(c.id) === String(clienteId))

        const datosCorreo = {
          correoCliente: clienteSeleccionado?.correo || '',
          nombreCliente: `${clienteSeleccionado?.nombres || ''} ${clienteSeleccionado?.apellidos || ''}`.trim(),
          numeroFactura: facturaInsertada.numero_factura,
          periodo: facturaInsertada.periodo,
          fechaEmision: facturaInsertada.fecha_emision,
          fechaVencimiento: facturaInsertada.fecha_vencimiento,
          total: facturaInsertada.total,
          saldoPendiente: facturaInsertada.saldo_pendiente,
          estado: facturaInsertada.estado
        }

        if (!datosCorreo.correoCliente) {
          console.warn('El cliente no tiene correo registrado, no se enviará la factura')
          mensajeFinal = 'Factura generada correctamente. El cliente no tiene correo registrado.'
        } else {
          const respuestaCorreo = await fetch(`${BACKEND_URL}/enviar-correo-factura`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosCorreo)
          })

          const resultadoCorreo = await respuestaCorreo.json().catch(() => null)

          console.log('Respuesta backend factura:', resultadoCorreo)

          if (!respuestaCorreo.ok) {
            console.error('Error enviando correo de factura:', resultadoCorreo)
            mensajeFinal = 'Factura generada correctamente, pero no se pudo enviar el correo.'
          }
        }
      } catch (errorCorreo) {
        console.error('Error en envío de factura:', errorCorreo)
        mensajeFinal = 'Factura generada correctamente, pero el correo no pudo enviarse.'
      }

      setMensaje(mensajeFinal)

      setFormulario({
        cliente_id: '',
        servicio_id: '',
        periodo: periodoActual,
        fecha_emision: hoy,
        fecha_vencimiento: hoy,
        subtotal: '',
        recargo: '0',
      })

      await obtenerFacturas()
    } catch (error) {
      console.error('Error general generando factura:', error)
      setMensaje('Ocurrió un error generando la factura')
    } finally {
      setCargando(false)
    }
  }

  const eliminarFactura = async (factura) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar esta factura?')

    if (!confirmar) return

    const { error } = await supabase
      .from('facturas')
      .delete()
      .eq('id', factura.id)

    if (error) {
      console.error('Error eliminando factura:', error)
      setMensaje('No se pudo eliminar la factura')
      return
    }

    setMensaje('Factura eliminada correctamente')
    await obtenerFacturas()
  }

  const facturasFiltradas = facturas.filter((factura) => {
    const texto = busqueda.toLowerCase()
    const nombreCliente = `${factura.clientes?.nombres || ''} ${factura.clientes?.apellidos || ''}`.toLowerCase()

    return (
      nombreCliente.includes(texto) ||
      factura.numero_factura?.toLowerCase().includes(texto) ||
      factura.periodo?.toLowerCase().includes(texto) ||
      factura.estado?.toLowerCase().includes(texto)
    )
  })

  return (
    <div>
      <h2>Módulo de Facturación</h2>

      <div
        style={{
          backgroundColor: '#1e1b4b',
          padding: '25px',
          borderRadius: '14px',
          marginTop: '20px',
          marginBottom: '25px',
          boxShadow: '0 2px 8px rgba(253, 251, 251, 0.15)'
        }}
      >
        <h3>Generar factura</h3>

        <form onSubmit={generarFactura}>
          <div style={gridEstilo}>
            <select
              name="cliente_id"
              value={formulario.cliente_id}
              onChange={manejarCambio}
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
              value={formulario.servicio_id}
              onChange={manejarCambio}
              style={inputEstilo}
            >
              <option value="">Servicio (opcional)</option>
              {serviciosFiltrados.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre_servicio} - ${Number(servicio.precio || 0).toLocaleString()}
                </option>
              ))}
            </select>

            <input
              type="month"
              name="periodo"
              value={formulario.periodo}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              type="date"
              name="fecha_emision"
              value={formulario.fecha_emision}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              type="date"
              name="fecha_vencimiento"
              value={formulario.fecha_vencimiento}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              type="number"
              name="subtotal"
              placeholder="Subtotal"
              value={formulario.subtotal}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              type="number"
              name="recargo"
              placeholder="Recargo"
              value={formulario.recargo}
              onChange={manejarCambio}
              style={inputEstilo}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              marginTop: '15px',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#000000',
              cursor: 'pointer'
            }}
          >
            {cargando ? 'Generando...' : 'Generar factura'}
          </button>
        </form>

        {mensaje && (
          <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
            {mensaje}
          </p>
        )}
      </div>

      <div
        style={{
          backgroundColor: '#000000',
          padding: '25px',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <h3>Listado de facturas</h3>

        <input
          type="text"
          placeholder="Buscar por cliente, número, período o estado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            ...inputEstilo,
            marginBottom: '15px'
          }}
        />

        {facturasFiltradas.length === 0 ? (
          <p>No hay facturas registradas todavía.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thEstilo}>ID</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Factura</th>
                  <th style={thEstilo}>Período</th>
                  <th style={thEstilo}>Emisión</th>
                  <th style={thEstilo}>Vencimiento</th>
                  <th style={thEstilo}>Total</th>
                  <th style={thEstilo}>Saldo</th>
                  <th style={thEstilo}>Estado</th>
                  <th style={thEstilo}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((factura) => (
                  <tr key={factura.id}>
                    <td style={tdEstilo}>{factura.id}</td>
                    <td style={tdEstilo}>
                      {factura.clientes?.nombres || ''} {factura.clientes?.apellidos || ''}
                    </td>
                    <td style={tdEstilo}>{factura.numero_factura}</td>
                    <td style={tdEstilo}>{factura.periodo}</td>
                    <td style={tdEstilo}>{factura.fecha_emision}</td>
                    <td style={tdEstilo}>{factura.fecha_vencimiento}</td>
                    <td style={tdEstilo}>${Number(factura.total || 0).toLocaleString()}</td>
                    <td style={tdEstilo}>${Number(factura.saldo_pendiente || 0).toLocaleString()}</td>
                    <td style={tdEstilo}>{factura.estado}</td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => eliminarFactura(factura)}
                        style={{
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#dc2626',
                          color: '#000000',
                          cursor: 'pointer'
                        }}
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

const gridEstilo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '16px'
}

const inputEstilo = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #000000',
  boxSizing: 'border-box'
}

const thEstilo = {
  textAlign: 'left',
  padding: '10px',
  backgroundColor: '#000000',
  borderBottom: '1px solid #000000'
}

const tdEstilo = {
  padding: '10px',
  borderBottom: '1px solid #000000'
}

export default VistaFacturacion