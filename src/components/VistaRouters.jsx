import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaRouters() {
  const [routers, setRouters] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [routerEditandoId, setRouterEditandoId] = useState(null)
  const [cargando, setCargando] = useState(false)

  const [formulario, setFormulario] = useState({
    nombre: '',
    marca: 'MikroTik',
    modelo: '',
    ip: '',
    puerto_api: 8728,
    usuario: '',
    contrasena: '',
    zona: '',
    estado: 'Activo',
    observaciones: ''
  })

  useEffect(() => {
    cargarRouters()
  }, [])

  const cargarRouters = async () => {
    const { data, error } = await supabase
      .from('routers')
      .select('*')
      .order('id', { ascending: false })

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
      nombre: '',
      marca: 'MikroTik',
      modelo: '',
      ip: '',
      puerto_api: 8728,
      usuario: '',
      contrasena: '',
      zona: '',
      estado: 'Activo',
      observaciones: ''
    })

    setRouterEditandoId(null)
  }

  const guardarRouter = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formulario.nombre || !formulario.ip) {
      setMensaje('Debes completar nombre e IP')
      return
    }

    setCargando(true)

    const datosRouter = {
      nombre: formulario.nombre,
      marca: formulario.marca || null,
      modelo: formulario.modelo || null,
      ip: formulario.ip,
      puerto_api: Number(formulario.puerto_api || 8728),
      usuario: formulario.usuario || null,
      contrasena: formulario.contrasena || null,
      zona: formulario.zona || null,
      estado: formulario.estado || 'Activo',
      observaciones: formulario.observaciones || null
    }

    console.log('Datos que se enviarán a routers:', datosRouter)

    let error = null

    if (routerEditandoId) {
      const resultado = await supabase
        .from('routers')
        .update(datosRouter)
        .eq('id', routerEditandoId)

      error = resultado.error
    } else {
      const resultado = await supabase
        .from('routers')
        .insert([datosRouter])

      error = resultado.error
    }

    if (error) {
      console.error('Error guardando router:', error)
      setMensaje(`Error al guardar router: ${error.message}`)
      setCargando(false)
      return
    }

    setMensaje(
      routerEditandoId
        ? 'Router actualizado correctamente'
        : 'Router guardado correctamente'
    )

    limpiarFormulario()
    await cargarRouters()
    setCargando(false)
  }

  const editarRouter = (router) => {
    setFormulario({
      nombre: router.nombre || '',
      marca: router.marca || 'MikroTik',
      modelo: router.modelo || '',
      ip: router.ip || '',
      puerto_api: router.puerto_api || 8728,
      usuario: router.usuario || '',
      contrasena: router.contrasena || '',
      zona: router.zona || '',
      estado: router.estado || 'Activo',
      observaciones: router.observaciones || ''
    })

    setRouterEditandoId(router.id)
    setMensaje(`Editando router #${router.id}`)
  }

  const eliminarRouter = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este router?')
    if (!confirmar) return

    const { error } = await supabase
      .from('routers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando router:', error)
      setMensaje(`Error al eliminar router: ${error.message}`)
      return
    }

    if (routerEditandoId === id) {
      limpiarFormulario()
    }

    setMensaje('Router eliminado correctamente')
    await cargarRouters()
  }

  const routersFiltrados = routers.filter((router) => {
    const texto = busqueda.toLowerCase()

    return (
      router.nombre?.toLowerCase().includes(texto) ||
      router.marca?.toLowerCase().includes(texto) ||
      router.modelo?.toLowerCase().includes(texto) ||
      router.ip?.toLowerCase().includes(texto) ||
      router.zona?.toLowerCase().includes(texto) ||
      router.estado?.toLowerCase().includes(texto)
    )
  })

  return (
    <div>
      <div style={heroEstilo}>
        <h2 style={{ margin: 0, fontSize: '30px', color: '#fff' }}>
          📡 Configuración de Router
        </h2>
        <p style={{ margin: '10px 0 0 0', color: '#cbd5e1' }}>
          Registro y preparación para enlazar MikroTik después
        </p>
      </div>

      {mensaje && <div style={mensajeEstilo}>{mensaje}</div>}

      <div style={cardEstilo}>
        <h3 style={tituloSeccion}>
          {routerEditandoId ? 'Editar router' : 'Registrar router'}
        </h3>

        <form onSubmit={guardarRouter}>
          <div style={gridEstilo}>
            <input
              name="nombre"
              placeholder="Nombre del router"
              value={formulario.nombre}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="marca"
              placeholder="Marca"
              value={formulario.marca}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="modelo"
              placeholder="Modelo"
              value={formulario.modelo}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="ip"
              placeholder="IP"
              value={formulario.ip}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              type="number"
              name="puerto_api"
              placeholder="Puerto API"
              value={formulario.puerto_api}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="usuario"
              placeholder="Usuario"
              value={formulario.usuario}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="contrasena"
              placeholder="Contraseña"
              value={formulario.contrasena}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="zona"
              placeholder="Zona"
              value={formulario.zona}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <select
              name="estado"
              value={formulario.estado}
              onChange={manejarCambio}
              style={inputEstilo}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
          </div>

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={formulario.observaciones}
            onChange={manejarCambio}
            style={{ ...inputEstilo, minHeight: '110px', marginTop: '12px' }}
          />

          <button type="submit" style={botonAzul} disabled={cargando}>
            {cargando
              ? 'Guardando...'
              : routerEditandoId
              ? 'Actualizar router'
              : 'Guardar router'}
          </button>

          {routerEditandoId && (
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

      <div style={cardEstilo}>
        <h3 style={tituloSeccion}>Listado de routers</h3>

        <input
          type="text"
          placeholder="Buscar por nombre, marca, modelo, IP, zona o estado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...inputEstilo, marginBottom: '15px' }}
        />

        {routersFiltrados.length === 0 ? (
          <p style={{ color: '#cbd5e1' }}>No hay routers registrados.</p>
        ) : (
          <div style={tablaWrap}>
            <table style={tablaEstilo}>
              <thead>
                <tr>
                  <th style={thEstilo}>Nombre</th>
                  <th style={thEstilo}>Marca</th>
                  <th style={thEstilo}>Modelo</th>
                  <th style={thEstilo}>IP</th>
                  <th style={thEstilo}>Puerto</th>
                  <th style={thEstilo}>Zona</th>
                  <th style={thEstilo}>Estado</th>
                  <th style={thEstilo}>Editar</th>
                  <th style={thEstilo}>Eliminar</th>
                </tr>
              </thead>

              <tbody>
                {routersFiltrados.map((router) => (
                  <tr key={router.id}>
                    <td style={tdEstilo}>{router.nombre}</td>
                    <td style={tdEstilo}>{router.marca || ''}</td>
                    <td style={tdEstilo}>{router.modelo || ''}</td>
                    <td style={tdEstilo}>{router.ip}</td>
                    <td style={tdEstilo}>{router.puerto_api}</td>
                    <td style={tdEstilo}>{router.zona || ''}</td>
                    <td style={tdEstilo}>
                      <span style={estadoRouter(router.estado)}>
                        {router.estado}
                      </span>
                    </td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => editarRouter(router)}
                        style={botonEditar}
                      >
                        Editar
                      </button>
                    </td>
                    <td style={tdEstilo}>
                      <button
                        onClick={() => eliminarRouter(router.id)}
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

function estadoRouter(estado) {
  if (estado === 'Activo') {
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

  if (estado === 'Mantenimiento') {
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
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(15, 23, 42, 0.95)',
  color: '#ffffff',
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
  color: '#e2e8f0',
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  borderRadius: '14px',
  overflow: 'hidden'
}

const thEstilo = {
  padding: '12px',
  textAlign: 'left',
  background: 'rgba(255,255,255,0.05)',
  color: '#cbd5e1',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
}

const tdEstilo = {
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  backgroundColor: 'transparent',
  color: '#f8fafc'
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

export default VistaRouters