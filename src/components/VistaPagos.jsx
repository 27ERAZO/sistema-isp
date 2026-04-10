import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import VistaPagoDetalle from './VistaPagoDetalle'

function VistaPagos() {
  const hoy = new Date().toISOString().split('T')[0]
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

  const [pagos, setPagos] = useState([])
  const [clientes, setClientes] = useState([])
  const [facturas, setFacturas] = useState([])

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [archivoComprobante, setArchivoComprobante] = useState(null)
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null)

  const [formulario, setFormulario] = useState({
    cliente_id: '',
    factura_id: '',
    valor: '',
    metodo_pago: 'Efectivo',
    referencia_pago: '',
    banco_origen: '',
    fecha_pago: hoy,
    observaciones: ''
  })

  useEffect(() => {
    obtenerPagos()
    obtenerClientes()
    obtenerFacturas()
  }, [])

  if (pagoSeleccionado) {
    return (
      <VistaPagoDetalle
        pagoData={pagoSeleccionado}
        onVolver={() => setPagoSeleccionado(null)}
      />
    )
  }

  const obtenerPagos = async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        clientes ( id, nombres, apellidos, correo ),
        facturas ( id, numero_factura, periodo, total, saldo_pendiente, estado )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando pagos:', error)
      return
    }

    setPagos(data || [])
  }

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

  const obtenerFacturas = async () => {
    const { data, error } = await supabase
      .from('facturas')
      .select('id, cliente_id, numero_factura, periodo, total, saldo_pendiente, estado')
      .neq('estado', 'Pagada')
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

  const facturasFiltradasPorCliente = formulario.cliente_id
    ? facturas.filter((factura) => String(factura.cliente_id) === String(formulario.cliente_id))
    : facturas

  const subirComprobante = async (archivo, clienteId, facturaId) => {
    if (!archivo) return null

    const extension = archivo.name.split('.').pop()
    const nombreArchivo = `cliente-${clienteId}/factura-${facturaId}/${Date.now()}.${extension}`

    const { data, error: errorSubida } = await supabase.storage
      .from('comprobantes')
      .upload(nombreArchivo, archivo)

    if (errorSubida) {
      console.error('Error subiendo comprobante:', errorSubida)
      throw new Error('No se pudo subir el comprobante')
    }

    const { data: urlData } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(nombreArchivo)

    return {
      ruta: nombreArchivo,
      url: urlData.publicUrl,
      nombre: archivo.name,
      tipo: archivo.type || extension
    }
  }

  const registrarPago = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formulario.cliente_id || !formulario.factura_id || !formulario.valor || !formulario.metodo_pago) {
      setMensaje('Debes seleccionar cliente, factura, valor y método de pago')
      return
    }

    const valorPago = Number(formulario.valor)

    if (isNaN(valorPago) || valorPago <= 0) {
      setMensaje('El valor del pago debe ser mayor que cero')
      return
    }

    setCargando(true)

    const { data: factura, error: errorFactura } = await supabase
      .from('facturas')
      .select('*')
      .eq('id', Number(formulario.factura_id))
      .single()

    if (errorFactura || !factura) {
      console.error('Error consultando factura:', errorFactura)
      setMensaje('No se pudo consultar la factura seleccionada')
      setCargando(false)
      return
    }

    const saldoActual = Number(factura.saldo_pendiente || 0)

    if (valorPago > saldoActual) {
      setMensaje(`El pago no puede ser mayor al saldo pendiente (${saldoActual})`)
      setCargando(false)
      return
    }

    let comprobanteSubido = null

    try {
      comprobanteSubido = await subirComprobante(
        archivoComprobante,
        Number(formulario.cliente_id),
        Number(formulario.factura_id)
      )
    } catch (error) {
      setMensaje(error.message)
      setCargando(false)
      return
    }

    const { data: pagoInsertado, error: errorPago } = await supabase
      .from('pagos')
      .insert([
        {
          cliente_id: Number(formulario.cliente_id),
          factura_id: Number(formulario.factura_id),
          valor: valorPago,
          metodo_pago: formulario.metodo_pago,
          referencia_pago: formulario.referencia_pago || null,
          banco_origen: formulario.banco_origen || null,
          fecha_pago: formulario.fecha_pago,
          comprobante_url: comprobanteSubido?.url || null,
          observaciones: formulario.observaciones || null
        }
      ])
      .select()
      .single()

    if (errorPago || !pagoInsertado) {
      console.error('Error registrando pago:', errorPago)
      setMensaje('Error al registrar el pago')
      setCargando(false)
      return
    }

    if (comprobanteSubido) {
      const { error: errorComprobante } = await supabase
        .from('comprobantes')
        .insert([
          {
            pago_id: pagoInsertado.id,
            nombre_archivo: comprobanteSubido.nombre,
            archivo_url: comprobanteSubido.url,
            tipo_archivo: comprobanteSubido.tipo
          }
        ])

      if (errorComprobante) {
        console.error('Error guardando comprobante en tabla:', errorComprobante)
      }
    }

    const nuevoSaldo = saldoActual - valorPago

    let nuevoEstado = 'Pendiente'

    if (nuevoSaldo === 0) {
      nuevoEstado = 'Pagada'
    } else if (nuevoSaldo < Number(factura.total || 0)) {
      nuevoEstado = 'Parcial'
    }

    const { error: errorActualizarFactura } = await supabase
      .from('facturas')
      .update({
        saldo_pendiente: nuevoSaldo,
        estado: nuevoEstado
      })
      .eq('id', factura.id)

    if (errorActualizarFactura) {
      console.error('Error actualizando factura:', errorActualizarFactura)
      setMensaje('Pago guardado, pero hubo un error actualizando la factura')
      setCargando(false)
      return
    }

    let mensajeFinal = 'Pago registrado correctamente'

    try {
      const clienteSeleccionado = clientes.find(
        (c) => String(c.id) === String(formulario.cliente_id)
      )

      const facturaSeleccionada =
        facturas.find((f) => String(f.id) === String(formulario.factura_id)) || factura

      const datosCorreo = {
        correoCliente: clienteSeleccionado?.correo || '',
        nombreCliente: `${clienteSeleccionado?.nombres || ''} ${clienteSeleccionado?.apellidos || ''}`.trim(),
        numeroFactura: facturaSeleccionada?.numero_factura || '',
        valorPago: valorPago,
        fechaPago: formulario.fecha_pago,
        comprobanteUrl: comprobanteSubido?.url || ''
      }

      if (!datosCorreo.correoCliente) {
        console.warn('El cliente no tiene correo registrado, no se enviará email')
        mensajeFinal = 'Pago registrado correctamente. El cliente no tiene correo registrado.'
      } else {
        const respuestaCorreo = await fetch(`${BACKEND_URL}/enviar-correo-pago`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosCorreo)
        })

        const resultadoCorreo = await respuestaCorreo.json().catch(() => null)

        console.log('Respuesta backend correo:', resultadoCorreo)

        if (!respuestaCorreo.ok) {
          console.error('Error del backend al enviar correo:', resultadoCorreo)
          mensajeFinal = 'Pago registrado correctamente, pero no se pudo enviar el correo.'
        }
      }
    } catch (error) {
      console.error('Error enviando correo:', error)
      mensajeFinal = 'Pago registrado correctamente, pero el correo no pudo enviarse.'
    }

    setMensaje(mensajeFinal)

    setFormulario({
      cliente_id: '',
      factura_id: '',
      valor: '',
      metodo_pago: 'Efectivo',
      referencia_pago: '',
      banco_origen: '',
      fecha_pago: hoy,
      observaciones: ''
    })

    setArchivoComprobante(null)

    await obtenerPagos()
    await obtenerFacturas()
    setCargando(false)
  }

  const eliminarPago = async (pago) => {
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar este pago? Esto también devolverá el saldo a la factura.'
    )

    if (!confirmar) return

    const valorPago = Number(pago.valor || 0)
    const facturaId = pago.factura_id

    const { data: factura, error: errorFactura } = await supabase
      .from('facturas')
      .select('*')
      .eq('id', facturaId)
      .single()

    if (errorFactura || !factura) {
      console.error('Error consultando factura al eliminar pago:', errorFactura)
      setMensaje('No se pudo consultar la factura del pago')
      return
    }

    const nuevoSaldo = Number(factura.saldo_pendiente || 0) + valorPago

    let nuevoEstado = 'Pendiente'

    if (nuevoSaldo === 0) {
      nuevoEstado = 'Pagada'
    } else if (nuevoSaldo < Number(factura.total || 0)) {
      nuevoEstado = 'Parcial'
    } else {
      nuevoEstado = 'Pendiente'
    }

    const { error: errorEliminar } = await supabase
      .from('pagos')
      .delete()
      .eq('id', pago.id)

    if (errorEliminar) {
      console.error('Error eliminando pago:', errorEliminar)
      setMensaje('No se pudo eliminar el pago')
      return
    }

    const { error: errorActualizarFactura } = await supabase
      .from('facturas')
      .update({
        saldo_pendiente: nuevoSaldo,
        estado: nuevoEstado
      })
      .eq('id', facturaId)

    if (errorActualizarFactura) {
      console.error('Error actualizando factura después de eliminar pago:', errorActualizarFactura)
      setMensaje('Se eliminó el pago, pero hubo error actualizando la factura')
      return
    }

    setMensaje('Pago eliminado correctamente')
    await obtenerPagos()
    await obtenerFacturas()
  }

  const pagosFiltrados = pagos.filter((pago) => {
    const texto = busqueda.toLowerCase()

    const nombreCliente =
      `${pago.clientes?.nombres || ''} ${pago.clientes?.apellidos || ''}`.toLowerCase()

    return (
      nombreCliente.includes(texto) ||
      pago.metodo_pago?.toLowerCase().includes(texto) ||
      pago.referencia_pago?.toLowerCase().includes(texto) ||
      pago.facturas?.numero_factura?.toLowerCase().includes(texto)
    )
  })

  return (
    <div>
      <h2>Módulo de Pagos</h2>

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
        <h3>Registrar pago</h3>

        <form onSubmit={registrarPago}>
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
              name="factura_id"
              value={formulario.factura_id}
              onChange={manejarCambio}
              style={inputEstilo}
            >
              <option value="">Selecciona una factura</option>
              {facturasFiltradasPorCliente.map((factura) => (
                <option key={factura.id} value={factura.id}>
                  {factura.numero_factura} - {factura.periodo} - Saldo: ${Number(factura.saldo_pendiente || 0).toLocaleString()}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="valor"
              placeholder="Valor pagado"
              value={formulario.valor}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <select
              name="metodo_pago"
              value={formulario.metodo_pago}
              onChange={manejarCambio}
              style={inputEstilo}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Nequi">Nequi</option>
              <option value="Daviplata">Daviplata</option>
              <option value="Consignación">Consignación</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>

            <input
              name="referencia_pago"
              placeholder="Referencia de pago"
              value={formulario.referencia_pago}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="banco_origen"
              placeholder="Banco / origen"
              value={formulario.banco_origen}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              type="date"
              name="fecha_pago"
              value={formulario.fecha_pago}
              onChange={manejarCambio}
              style={inputEstilo}
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Comprobante de pago
            </label>

            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setArchivoComprobante(e.target.files[0] || null)}
              style={inputEstilo}
            />

            {archivoComprobante && (
              <p style={{ marginTop: '8px' }}>
                Archivo seleccionado: <strong>{archivoComprobante.name}</strong>
              </p>
            )}
          </div>

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={formulario.observaciones}
            onChange={manejarCambio}
            style={{ ...inputEstilo, minHeight: '100px', marginTop: '10px' }}
          />

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
            {cargando ? 'Guardando...' : 'Registrar pago'}
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
        <h3>Listado de pagos</h3>

        <input
          type="text"
          placeholder="Buscar por cliente, método, referencia o factura"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            ...inputEstilo,
            marginBottom: '15px'
          }}
        />

        {pagosFiltrados.length === 0 ? (
          <p>No hay pagos registrados todavía.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thEstilo}>ID</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Factura</th>
                  <th style={thEstilo}>Valor</th>
                  <th style={thEstilo}>Método</th>
                  <th style={thEstilo}>Referencia</th>
                  <th style={thEstilo}>Fecha</th>
                  <th style={thEstilo}>Comprobante</th>
                  <th style={thEstilo}>Ver</th>
                  <th style={thEstilo}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id}>
                    <td style={tdEstilo}>{pago.id}</td>
                    <td style={tdEstilo}>
                      {pago.clientes?.nombres || ''} {pago.clientes?.apellidos || ''}
                    </td>
                    <td style={tdEstilo}>{pago.facturas?.numero_factura || ''}</td>
                    <td style={tdEstilo}>${Number(pago.valor || 0).toLocaleString()}</td>
                    <td style={tdEstilo}>{pago.metodo_pago}</td>
                    <td style={tdEstilo}>{pago.referencia_pago || ''}</td>
                    <td style={tdEstilo}>{pago.fecha_pago}</td>
                    <td style={tdEstilo}>
                      {pago.comprobante_url ? (
                        <a href={pago.comprobante_url} target="_blank" rel="noreferrer">
                          Ver archivo
                        </a>
                      ) : (
                        'Sin archivo'
                      )}
                    </td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => setPagoSeleccionado(pago)}
                        style={{
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#2563eb',
                          color: '#000000',
                          cursor: 'pointer'
                        }}
                      >
                        Ver
                      </button>
                    </td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => eliminarPago(pago)}
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

export default VistaPagos