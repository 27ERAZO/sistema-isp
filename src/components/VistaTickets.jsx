import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaTickets() {
  const [tickets, setTickets] = useState([])
  const [clientes, setClientes] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [ticketEditandoId, setTicketEditandoId] = useState(null)
  const [cargando, setCargando] = useState(false)

  const [formulario, setFormulario] = useState({
    cliente_id: '',
    titulo: '',
    descripcion: '',
    estado: 'Pendiente'
  })

  useEffect(() => {
    cargarTickets()
    cargarClientes()
  }, [])

  const cargarTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        clientes ( id, nombres, apellidos )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando tickets:', error)
      return
    }

    setTickets(data || [])
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
      cliente_id: '',
      titulo: '',
      descripcion: '',
      estado: 'Pendiente'
    })

    setTicketEditandoId(null)
  }

  const guardarTicket = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formulario.cliente_id || !formulario.titulo) {
      setMensaje('Debes seleccionar cliente y escribir el título')
      return
    }

    setCargando(true)

    const datosTicket = {
      cliente_id: Number(formulario.cliente_id),
      asunto: formulario.titulo,
      descripcion: formulario.descripcion || null,
      estado: formulario.estado || 'Pendiente'
    }

    let error = null

    if (ticketEditandoId) {
      const resultado = await supabase
        .from('tickets')
        .update(datosTicket)
        .eq('id', ticketEditandoId)

      error = resultado.error
    } else {
      const resultado = await supabase
        .from('tickets')
        .insert([datosTicket])

      error = resultado.error
    }

    if (error) {
      console.error('Error guardando ticket:', error)
      setMensaje('Error al guardar ticket')
      setCargando(false)
      return
    }

    setMensaje(ticketEditandoId ? 'Ticket actualizado correctamente' : 'Ticket creado correctamente')
    limpiarFormulario()
    await cargarTickets()
    setCargando(false)
  }

  const editarTicket = (ticket) => {
    setFormulario({
      cliente_id: ticket.cliente_id ? String(ticket.cliente_id) : '',
      titulo: ticket.titulo || '',
      descripcion: ticket.descripcion || '',
      estado: ticket.estado || 'Pendiente'
    })

    setTicketEditandoId(ticket.id)
    setMensaje(`Editando ticket #${ticket.id}`)
  }

  const eliminarTicket = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este ticket?')
    if (!confirmar) return

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando ticket:', error)
      setMensaje('Error al eliminar ticket')
      return
    }

    if (ticketEditandoId === id) {
      limpiarFormulario()
    }

    setMensaje('Ticket eliminado correctamente')
    await cargarTickets()
  }

  const ticketsFiltrados = tickets.filter((ticket) => {
    const texto = busqueda.toLowerCase()

    const nombreCliente =
      `${ticket.clientes?.nombres || ''} ${ticket.clientes?.apellidos || ''}`.toLowerCase()

    return (
      nombreCliente.includes(texto) ||
      ticket.titulo?.toLowerCase().includes(texto) ||
      ticket.descripcion?.toLowerCase().includes(texto) ||
      ticket.estado?.toLowerCase().includes(texto)
    )
  })

  return (
    <div>
      {/* HEADER */}
      <div style={heroEstilo}>
        <h2 style={{ margin: 0, fontSize: '30px', color: '#fff' }}>
          🎫 Módulo de Tickets
        </h2>
        <p style={{ margin: '10px 0 0 0', color: '#cbd5e1' }}>
          Gestión de soporte técnico
        </p>
      </div>

      {mensaje && <div style={mensajeEstilo}>{mensaje}</div>}

      {/* FORMULARIO */}
      <div style={cardEstilo}>
        <h3 style={tituloSeccion}>
          {ticketEditandoId ? 'Editar ticket' : 'Crear ticket'}
        </h3>

        <form onSubmit={guardarTicket}>
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

            <input
              name="titulo"
              placeholder="Título del problema"
              value={formulario.titulo}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <select
              name="estado"
              value={formulario.estado}
              onChange={manejarCambio}
              style={inputEstilo}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Visitado">Visitado</option>
              <option value="Resuelto">Resuelto</option>
            </select>
          </div>

          <textarea
            name="descripcion"
            placeholder="Descripción del ticket"
            value={formulario.descripcion}
            onChange={manejarCambio}
            style={{ ...inputEstilo, minHeight: '110px', marginTop: '12px' }}
          />

          <button type="submit" style={botonAzul} disabled={cargando}>
            {cargando
              ? 'Guardando...'
              : ticketEditandoId
              ? 'Actualizar ticket'
              : 'Crear ticket'}
          </button>

          {ticketEditandoId && (
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

      {/* LISTADO */}
      <div style={cardEstilo}>
        <h3 style={tituloSeccion}>Listado de tickets</h3>

        <input
          type="text"
          placeholder="Buscar por cliente, título, descripción o estado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...inputEstilo, marginBottom: '15px' }}
        />

        {ticketsFiltrados.length === 0 ? (
          <p style={{ color: '#cbd5e1' }}>No hay tickets registrados.</p>
        ) : (
          <div style={tablaWrap}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Título</th>
                  <th style={thEstilo}>Descripción</th>
                  <th style={thEstilo}>Estado</th>
                  <th style={thEstilo}>Editar</th>
                  <th style={thEstilo}>Eliminar</th>
                </tr>
              </thead>

              <tbody>
                {ticketsFiltrados.map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={tdEstilo}>
                      {ticket.clientes?.nombres || ''} {ticket.clientes?.apellidos || ''}
                    </td>

                    <td style={tdEstilo}>{ticket.titulo}</td>

                    <td style={tdEstilo}>{ticket.descripcion || ''}</td>

                    <td style={tdEstilo}>
                      <span style={estadoEstilo(ticket.estado)}>
                        {ticket.estado}
                      </span>
                    </td>

                    <td style={tdEstilo}>
                      <button
                        onClick={() => editarTicket(ticket)}
                        style={botonEditar}
                      >
                        Editar
                      </button>
                    </td>

                    <td style={tdEstilo}>
                      <button
                        onClick={() => eliminarTicket(ticket.id)}
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

function estadoEstilo(estado) {
  if (estado === 'Pendiente') {
    return {
      background: '#3f2d06',
      color: '#fbbf24',
      padding: '6px 10px',
      borderRadius: '12px',
      border: '1px solid #92400e',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (estado === 'En proceso') {
    return {
      background: '#1e1b4b',
      color: '#a78bfa',
      padding: '6px 10px',
      borderRadius: '12px',
      border: '1px solid #6d28d9',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  if (estado === 'Visitado') {
    return {
      background: '#082f49',
      color: '#38bdf8',
      padding: '6px 10px',
      borderRadius: '12px',
      border: '1px solid #0369a1',
      fontWeight: 'bold',
      fontSize: '13px'
    }
  }

  return {
    background: '#052e16',
    color: '#4ade80',
    padding: '6px 10px',
    borderRadius: '12px',
    border: '1px solid #166534',
    fontWeight: 'bold',
    fontSize: '13px'
  }
}

const heroEstilo = {
  background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
  padding: '24px',
  borderRadius: '20px',
  color: '#fff',
  marginBottom: '20px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)'
}

const cardEstilo = {
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  borderRadius: '20px',
  padding: '24px',
  marginBottom: '20px',
  color: '#fff',
  boxShadow: '0 8px 25px rgba(0,0,0,0.25)'
}

const mensajeEstilo = {
  backgroundColor: '#052e16',
  color: '#4ade80',
  padding: '12px 16px',
  borderRadius: '12px',
  marginBottom: '18px',
  fontWeight: 'bold',
  border: '1px solid #166534'
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
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#000000',
  boxSizing: 'border-box',
  outline: 'none'
}

const botonAzul = {
  marginTop: '14px',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 6px 18px rgba(37,99,235,0.35)'
}

const botonGris = {
  marginTop: '14px',
  marginLeft: '10px',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '12px',
  backgroundColor: '#6b7280',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold'
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
  padding: '12px',
  textAlign: 'left',
  background: 'rgba(255,255,255,0.05)',
  color: '#ffffff',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
}

const tdEstilo = {
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
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

export default VistaTickets