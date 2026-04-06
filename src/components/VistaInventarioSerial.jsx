import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaInventarioSerial() {
  const [equipos, setEquipos] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])

  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [equipoEditandoId, setEquipoEditandoId] = useState(null)

  const [formulario, setFormulario] = useState({
    producto_id: '',
    serial: '',
    mac: '',
    estado: 'Disponible',
    cliente_id: '',
    fecha_entrega: '',
    fecha_retiro: '',
    observaciones: ''
  })

  useEffect(() => {
    cargarEquipos()
    cargarProductos()
    cargarClientes()
  }, [])

  const cargarEquipos = async () => {
    const { data, error } = await supabase
      .from('equipos_serializados')
      .select(`
        *,
        productos ( id, nombre, categoria, marca, modelo ),
        clientes ( id, nombres, apellidos )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando equipos serializados:', error)
      return
    }

    setEquipos(data || [])
  }

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, categoria, marca, modelo')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error cargando productos:', error)
      return
    }

    setProductos(data || [])
  }

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

  const manejarCambio = (e) => {
    const { name, value } = e.target

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const limpiarFormulario = () => {
    setFormulario({
      producto_id: '',
      serial: '',
      mac: '',
      estado: 'Disponible',
      cliente_id: '',
      fecha_entrega: '',
      fecha_retiro: '',
      observaciones: ''
    })

    setEquipoEditandoId(null)
  }

  const guardarEquipo = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formulario.producto_id || !formulario.serial || !formulario.estado) {
      setMensaje('Debes seleccionar producto, serial y estado')
      return
    }

    const datosEnviar = {
      producto_id: Number(formulario.producto_id),
      serial: formulario.serial,
      mac: formulario.mac || null,
      estado: formulario.estado,
      cliente_id: formulario.cliente_id ? Number(formulario.cliente_id) : null,
      fecha_entrega: formulario.fecha_entrega || null,
      fecha_retiro: formulario.fecha_retiro || null,
      observaciones: formulario.observaciones || null
    }

    let error = null

    if (equipoEditandoId) {
      const resultado = await supabase
        .from('equipos_serializados')
        .update(datosEnviar)
        .eq('id', equipoEditandoId)

      error = resultado.error
    } else {
      const resultado = await supabase
        .from('equipos_serializados')
        .insert([datosEnviar])

      error = resultado.error
    }

    if (error) {
      console.error('Error guardando equipo serializado:', error)
      setMensaje('Error al guardar el equipo')
      return
    }

    setMensaje(
      equipoEditandoId
        ? 'Equipo actualizado correctamente'
        : 'Equipo guardado correctamente'
    )

    limpiarFormulario()
    await cargarEquipos()
  }

  const editarEquipo = (equipo) => {
    setFormulario({
      producto_id: equipo.producto_id ? String(equipo.producto_id) : '',
      serial: equipo.serial || '',
      mac: equipo.mac || '',
      estado: equipo.estado || 'Disponible',
      cliente_id: equipo.cliente_id ? String(equipo.cliente_id) : '',
      fecha_entrega: equipo.fecha_entrega || '',
      fecha_retiro: equipo.fecha_retiro || '',
      observaciones: equipo.observaciones || ''
    })

    setEquipoEditandoId(equipo.id)
    setMensaje(`Editando equipo #${equipo.id}`)
  }

  const eliminarEquipo = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este equipo?')

    if (!confirmar) return

    const { error } = await supabase
      .from('equipos_serializados')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando equipo:', error)
      setMensaje('Error al eliminar el equipo')
      return
    }

    if (equipoEditandoId === id) {
      limpiarFormulario()
    }

    setMensaje('Equipo eliminado correctamente')
    await cargarEquipos()
  }

  const equiposFiltrados = equipos.filter((equipo) => {
    const texto = busqueda.toLowerCase()

    const nombreProducto = `${equipo.productos?.nombre || ''}`.toLowerCase()
    const nombreCliente = `${equipo.clientes?.nombres || ''} ${equipo.clientes?.apellidos || ''}`.toLowerCase()

    return (
      nombreProducto.includes(texto) ||
      nombreCliente.includes(texto) ||
      equipo.serial?.toLowerCase().includes(texto) ||
      equipo.mac?.toLowerCase().includes(texto) ||
      equipo.estado?.toLowerCase().includes(texto)
    )
  })

  const totalEquipos = equipos.length
  const disponibles = equipos.filter((e) => e.estado === 'Disponible').length
  const instalados = equipos.filter((e) => e.estado === 'Instalado').length
  const danados = equipos.filter((e) => e.estado === 'Dañado').length

  return (
    <div style={contenedorPrincipal}>
      <div style={encabezadoPrincipal}>
        <h2 style={{ margin: 0, fontSize: '30px', color: '#ffffff' }}>Inventario Serializado</h2>
        <p style={{ margin: '10px 0 0 0', color: '#dbeafe' }}>
          Control individual de ONUs, routers y equipos ISP por serial
        </p>
      </div>

      {mensaje && (
        <div style={mensajeEstilo}>
          {mensaje}
        </div>
      )}

      <div style={resumenGrid}>
        <TarjetaResumen titulo="Total equipos" valor={totalEquipos} fondo="linear-gradient(135deg, #2563eb, #1d4ed8)" />
        <TarjetaResumen titulo="Disponibles" valor={disponibles} fondo="linear-gradient(135deg, #16a34a, #15803d)" />
        <TarjetaResumen titulo="Instalados" valor={instalados} fondo="linear-gradient(135deg, #f59e0b, #d97706)" />
        <TarjetaResumen titulo="Dañados" valor={danados} fondo="linear-gradient(135deg, #dc2626, #b91c1c)" />
      </div>

      <div style={cardOscura}>
        <h3 style={tituloSeccion}>
          {equipoEditandoId ? 'Editar equipo serializado' : 'Registrar equipo serializado'}
        </h3>

        <form onSubmit={guardarEquipo}>
          <div style={gridEstilo}>
            <select
              name="producto_id"
              value={formulario.producto_id}
              onChange={manejarCambio}
              style={inputEstiloOscuro}
            >
              <option value="">Selecciona un producto</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} {producto.marca ? `- ${producto.marca}` : ''}
                </option>
              ))}
            </select>

            <input
              name="serial"
              placeholder="Serial"
              value={formulario.serial}
              onChange={manejarCambio}
              style={inputEstiloOscuro}
            />

            <input
              name="mac"
              placeholder="MAC"
              value={formulario.mac}
              onChange={manejarCambio}
              style={inputEstiloOscuro}
            />

            <select
              name="estado"
              value={formulario.estado}
              onChange={manejarCambio}
              style={inputEstiloOscuro}
            >
              <option value="Disponible">Disponible</option>
              <option value="Instalado">Instalado</option>
              <option value="Retirado">Retirado</option>
              <option value="Dañado">Dañado</option>
              <option value="En reparación">En reparación</option>
            </select>

            <select
              name="cliente_id"
              value={formulario.cliente_id}
              onChange={manejarCambio}
              style={inputEstiloOscuro}
            >
              <option value="">Cliente asignado (opcional)</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombres} {cliente.apellidos || ''}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="fecha_entrega"
              value={formulario.fecha_entrega}
              onChange={manejarCambio}
              style={inputEstiloOscuro}
            />

            <input
              type="date"
              name="fecha_retiro"
              value={formulario.fecha_retiro}
              onChange={manejarCambio}
              style={inputEstiloOscuro}
            />
          </div>

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={formulario.observaciones}
            onChange={manejarCambio}
            style={{ ...inputEstiloOscuro, minHeight: '100px', marginTop: '10px', resize: 'vertical' }}
          />

          <button type="submit" style={botonAzulGrande}>
            {equipoEditandoId ? 'Actualizar equipo' : 'Guardar equipo'}
          </button>

          {equipoEditandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              style={botonGris}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </div>

      <div style={cardClara}>
        <h3 style={{ ...tituloSeccion, color: '#0f172a' }}>Listado de equipos serializados</h3>

        <input
          type="text"
          placeholder="Buscar por producto, cliente, serial, MAC o estado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...inputEstiloClaro, marginBottom: '15px' }}
        />

        {equiposFiltrados.length === 0 ? (
          <p style={{ color: '#334155' }}>No hay equipos serializados registrados todavía.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>ID</th>
                  <th style={thEstilo}>Producto</th>
                  <th style={thEstilo}>Serial</th>
                  <th style={thEstilo}>MAC</th>
                  <th style={thEstilo}>Estado</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Entrega</th>
                  <th style={thEstilo}>Retiro</th>
                  <th style={thEstilo}>Editar</th>
                  <th style={thEstilo}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.map((equipo) => (
                  <tr key={equipo.id} style={filaTabla}>
                    <td style={tdEstilo}>{equipo.id}</td>
                    <td style={tdEstilo}>{equipo.productos?.nombre || ''}</td>
                    <td style={tdEstilo}>{equipo.serial}</td>
                    <td style={tdEstilo}>{equipo.mac || ''}</td>
                    <td style={tdEstilo}>
                      <span style={estadoEtiqueta(equipo.estado)}>
                        {equipo.estado}
                      </span>
                    </td>
                    <td style={tdEstilo}>
                      {equipo.clientes?.nombres || ''} {equipo.clientes?.apellidos || ''}
                    </td>
                    <td style={tdEstilo}>{equipo.fecha_entrega || ''}</td>
                    <td style={tdEstilo}>{equipo.fecha_retiro || ''}</td>
                    <td style={tdEstilo}>
                      <button onClick={() => editarEquipo(equipo)} style={botonAmarillo}>
                        Editar
                      </button>
                    </td>
                    <td style={tdEstilo}>
                      <button onClick={() => eliminarEquipo(equipo.id)} style={botonRojo}>
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
      <h4 style={{ margin: '0 0 8px 0', color: '#e0f2fe', fontSize: '15px' }}>{titulo}</h4>
      <p style={{ margin: 0, fontSize: '30px', fontWeight: 'bold', color: '#ffffff' }}>{valor}</p>
    </div>
  )
}

function estadoEtiqueta(estado) {
  if (estado === 'Disponible') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#dcfce7',
      color: '#166534',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (estado === 'Instalado') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (estado === 'Dañado') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (estado === 'Retirado') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#e5e7eb',
      color: '#374151',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (estado === 'En reparación') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  return {
    padding: '6px 10px',
    borderRadius: '20px',
    backgroundColor: '#e5e7eb',
    color: '#111827',
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

const mensajeEstilo = {
  backgroundColor: '#dcfce7',
  border: '1px solid #22c55e',
  color: '#166534',
  padding: '12px',
  borderRadius: '10px',
  marginBottom: '15px',
  fontWeight: '600'
}

const resumenGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
  marginBottom: '20px'
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

const tituloSeccion = {
  marginTop: 0,
  marginBottom: '16px',
  color: '#ffffff',
  fontSize: '22px'
}

const gridEstilo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px'
}

const inputEstiloOscuro = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '10px',
  border: '1px solid #334155',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  boxSizing: 'border-box',
  outline: 'none'
}

const inputEstiloClaro = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  color: '#0f172a',
  boxSizing: 'border-box',
  outline: 'none'
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

const filaTabla = {
  transition: 'background 0.2s ease'
}

const botonAzulGrande = {
  marginTop: '15px',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

const botonGris = {
  marginTop: '10px',
  marginLeft: '10px',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#6b7280',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

const botonAmarillo = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

const botonRojo = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600'
}

export default VistaInventarioSerial