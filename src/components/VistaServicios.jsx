import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaServicios() {
  const [servicios, setServicios] = useState([])
  const [clientes, setClientes] = useState([])
  const [planes, setPlanes] = useState([])
  const [zonas, setZonas] = useState([])
  const [routers, setRouters] = useState([])

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [servicioEditandoId, setServicioEditandoId] = useState(null)

  const [formulario, setFormulario] = useState({
    cliente_id: '',
    plan_id: '',
    router_id: '',
    zona_id: '',
    tipo_servicio: 'Fibra',
    ip_asignada: '',
    mac: '',
    usuario_pppoe: '',
    password_pppoe: '',
    estado: 'Activo',
    fecha_instalacion: '',
    observaciones: ''
  })

  useEffect(() => {
    obtenerServicios()
    obtenerClientes()
    obtenerPlanes()
    obtenerZonas()
    obtenerRouters()
  }, [])

  const obtenerServicios = async () => {
    const { data, error } = await supabase
      .from('servicios')
      .select(`
        *,
        clientes ( id, nombres, apellidos ),
        planes ( id, nombre ),
        zonas ( id, nombre ),
        routers ( id, nombre )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando servicios:', error)
      return
    }

    setServicios(data || [])
  }

  const obtenerClientes = async () => {
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

  const obtenerPlanes = async () => {
    const { data, error } = await supabase
      .from('planes')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error cargando planes:', error)
      return
    }

    setPlanes(data || [])
  }

  const obtenerZonas = async () => {
    const { data, error } = await supabase
      .from('zonas')
      .select('id, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error cargando zonas:', error)
      return
    }

    setZonas(data || [])
  }

  const obtenerRouters = async () => {
    const { data, error } = await supabase
      .from('routers')
      .select('id, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error cargando routers:', error)
      return
    }

    setRouters(data || [])
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
      plan_id: '',
      router_id: '',
      zona_id: '',
      tipo_servicio: 'Fibra',
      ip_asignada: '',
      mac: '',
      usuario_pppoe: '',
      password_pppoe: '',
      estado: 'Activo',
      fecha_instalacion: '',
      observaciones: ''
    })

    setServicioEditandoId(null)
  }

  const guardarServicio = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formulario.cliente_id || !formulario.plan_id || !formulario.estado) {
      setMensaje('Debes seleccionar cliente, plan y estado')
      return
    }

    setCargando(true)

    const datosEnviar = {
      cliente_id: Number(formulario.cliente_id),
      plan_id: Number(formulario.plan_id),
      router_id: formulario.router_id ? Number(formulario.router_id) : null,
      zona_id: formulario.zona_id ? Number(formulario.zona_id) : null,
      tipo_servicio: formulario.tipo_servicio,
      ip_asignada: formulario.ip_asignada || null,
      mac: formulario.mac || null,
      usuario_pppoe: formulario.usuario_pppoe || null,
      password_pppoe: formulario.password_pppoe || null,
      estado: formulario.estado,
      fecha_instalacion: formulario.fecha_instalacion || null,
      observaciones: formulario.observaciones || null
    }

    let error = null

    if (servicioEditandoId) {
      const resultado = await supabase
        .from('servicios')
        .update(datosEnviar)
        .eq('id', servicioEditandoId)

      error = resultado.error
    } else {
      const resultado = await supabase
        .from('servicios')
        .insert([datosEnviar])

      error = resultado.error
    }

    if (error) {
      console.error('Error guardando servicio:', error)
      setMensaje('Error al guardar el servicio')
      setCargando(false)
      return
    }

    setMensaje(servicioEditandoId ? 'Servicio actualizado correctamente' : 'Servicio guardado correctamente')
    limpiarFormulario()
    await obtenerServicios()
    setCargando(false)
  }

  const editarServicio = (servicio) => {
    setFormulario({
      cliente_id: servicio.cliente_id ? String(servicio.cliente_id) : '',
      plan_id: servicio.plan_id ? String(servicio.plan_id) : '',
      router_id: servicio.router_id ? String(servicio.router_id) : '',
      zona_id: servicio.zona_id ? String(servicio.zona_id) : '',
      tipo_servicio: servicio.tipo_servicio || 'Fibra',
      ip_asignada: servicio.ip_asignada || '',
      mac: servicio.mac || '',
      usuario_pppoe: servicio.usuario_pppoe || '',
      password_pppoe: servicio.password_pppoe || '',
      estado: servicio.estado || 'Activo',
      fecha_instalacion: servicio.fecha_instalacion || '',
      observaciones: servicio.observaciones || ''
    })

    setServicioEditandoId(servicio.id)
    setMensaje(`Editando servicio #${servicio.id}`)
  }

  const eliminarServicio = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este servicio?')

    if (!confirmar) return

    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando servicio:', error)
      setMensaje('Error al eliminar el servicio')
      return
    }

    if (servicioEditandoId === id) {
      limpiarFormulario()
    }

    setMensaje('Servicio eliminado correctamente')
    await obtenerServicios()
  }

  const serviciosFiltrados = servicios.filter((servicio) => {
    const texto = busqueda.toLowerCase()

    const nombreCliente =
      `${servicio.clientes?.nombres || ''} ${servicio.clientes?.apellidos || ''}`.toLowerCase()

    return (
      nombreCliente.includes(texto) ||
      servicio.ip_asignada?.toLowerCase().includes(texto) ||
      servicio.mac?.toLowerCase().includes(texto) ||
      servicio.usuario_pppoe?.toLowerCase().includes(texto) ||
      servicio.estado?.toLowerCase().includes(texto)
    )
  })

  return (
    <div>
      <h2>Módulo de Servicios</h2>

      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '20px',
          marginBottom: '20px'
        }}
      >
        <h3>{servicioEditandoId ? 'Editar servicio' : 'Registrar servicio'}</h3>

        <form onSubmit={guardarServicio}>
          <div style={gridEstilo}>
            <select name="cliente_id" value={formulario.cliente_id} onChange={manejarCambio} style={inputEstilo}>
              <option value="">Selecciona un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombres} {cliente.apellidos || ''}
                </option>
              ))}
            </select>

            <select name="plan_id" value={formulario.plan_id} onChange={manejarCambio} style={inputEstilo}>
              <option value="">Selecciona un plan</option>
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre}
                </option>
              ))}
            </select>

            <select name="zona_id" value={formulario.zona_id} onChange={manejarCambio} style={inputEstilo}>
              <option value="">Selecciona una zona</option>
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre}
                </option>
              ))}
            </select>

            <select name="router_id" value={formulario.router_id} onChange={manejarCambio} style={inputEstilo}>
              <option value="">Selecciona un router</option>
              {routers.map((router) => (
                <option key={router.id} value={router.id}>
                  {router.nombre}
                </option>
              ))}
            </select>

            <select name="tipo_servicio" value={formulario.tipo_servicio} onChange={manejarCambio} style={inputEstilo}>
              <option value="Fibra">Fibra</option>
              <option value="Inalambrico">Inalámbrico</option>
              <option value="Corporativo">Corporativo</option>
              <option value="Dedicado">Dedicado</option>
            </select>

            <input
              name="ip_asignada"
              placeholder="IP asignada"
              value={formulario.ip_asignada}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="mac"
              placeholder="MAC"
              value={formulario.mac}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="usuario_pppoe"
              placeholder="Usuario PPPoE"
              value={formulario.usuario_pppoe}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="password_pppoe"
              placeholder="Contraseña PPPoE"
              value={formulario.password_pppoe}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <select name="estado" value={formulario.estado} onChange={manejarCambio} style={inputEstilo}>
              <option value="Activo">Activo</option>
              <option value="Suspendido">Suspendido</option>
              <option value="Retirado">Retirado</option>
            </select>

            <input
              type="date"
              name="fecha_instalacion"
              value={formulario.fecha_instalacion}
              onChange={manejarCambio}
              style={inputEstilo}
            />
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
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {cargando ? 'Guardando...' : servicioEditandoId ? 'Actualizar servicio' : 'Guardar servicio'}
          </button>

          {servicioEditandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              style={{
                marginTop: '10px',
                marginLeft: '10px',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#6b7280',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Cancelar edición
            </button>
          )}
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
          padding: '20px',
          borderRadius: '10px'
        }}
      >
        <h3>Listado de servicios</h3>

        <input
          type="text"
          placeholder="Buscar por cliente, IP, MAC, PPPoE o estado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            ...inputEstilo,
            marginBottom: '15px'
          }}
        />

        {serviciosFiltrados.length === 0 ? (
          <p>No hay servicios registrados todavía.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thEstilo}>ID</th>
                  <th style={thEstilo}>Cliente</th>
                  <th style={thEstilo}>Plan</th>
                  <th style={thEstilo}>Zona</th>
                  <th style={thEstilo}>Router</th>
                  <th style={thEstilo}>Tipo</th>
                  <th style={thEstilo}>IP</th>
                  <th style={thEstilo}>Estado</th>
                  <th style={thEstilo}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.map((servicio) => (
                  <tr key={servicio.id}>
                    <td style={tdEstilo}>{servicio.id}</td>
                    <td style={tdEstilo}>
                      {servicio.clientes?.nombres || ''} {servicio.clientes?.apellidos || ''}
                    </td>
                    <td style={tdEstilo}>{servicio.planes?.nombre || ''}</td>
                    <td style={tdEstilo}>{servicio.zonas?.nombre || ''}</td>
                    <td style={tdEstilo}>{servicio.routers?.nombre || ''}</td>
                    <td style={tdEstilo}>{servicio.tipo_servicio}</td>
                    <td style={tdEstilo}>{servicio.ip_asignada || ''}</td>
                    <td style={tdEstilo}>{servicio.estado}</td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => editarServicio(servicio)}
                        style={{
                          marginRight: '8px',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#f59e0b',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarServicio(servicio.id)}
                        style={{
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#dc2626',
                          color: '#fff',
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '10px'
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
  backgroundColor: '#0000008d',
  borderBottom: '1px solid #000000'
}

const tdEstilo = {
  padding: '10px',
  borderBottom: '1px solid #000000'
}

export default VistaServicios