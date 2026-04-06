import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

const CENTRO_SAN_FRANCISCO_PTYO = [1.1767, -76.8784]

function SelectorUbicacion({ onSeleccionar }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onSeleccionar(lat, lng)
    }
  })

  return null
}

function VistaClientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [clienteEditandoId, setClienteEditandoId] = useState(null)

  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    direccion: '',
    barrio: '',
    ciudad: 'San Francisco',
    departamento: 'Putumayo',
    estado: 'Activo',
    lat: '',
    lng: ''
  })

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false })

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

  const seleccionarUbicacionMapa = (lat, lng) => {
    setFormulario((prev) => ({
      ...prev,
      lat: String(lat),
      lng: String(lng)
    }))
  }

  const limpiarFormulario = () => {
    setFormulario({
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      direccion: '',
      barrio: '',
      ciudad: 'San Francisco',
      departamento: 'Putumayo',
      estado: 'Activo',
      lat: '',
      lng: ''
    })

    setClienteEditandoId(null)
  }

  const guardarCliente = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formulario.nombres || !formulario.telefono) {
      setMensaje('Nombre y teléfono son obligatorios')
      return
    }

    const datosEnviar = {
      nombres: formulario.nombres,
      apellidos: formulario.apellidos || null,
      telefono: formulario.telefono,
      correo: formulario.correo || null,
      direccion: formulario.direccion || null,
      barrio: formulario.barrio || null,
      ciudad: formulario.ciudad || 'San Francisco',
      departamento: formulario.departamento || 'Putumayo',
      estado: formulario.estado,
      lat: formulario.lat ? Number(formulario.lat) : null,
      lng: formulario.lng ? Number(formulario.lng) : null
    }

    let error = null

    if (clienteEditandoId) {
      const resultado = await supabase
        .from('clientes')
        .update(datosEnviar)
        .eq('id', clienteEditandoId)

      error = resultado.error
    } else {
      const resultado = await supabase
        .from('clientes')
        .insert([datosEnviar])

      error = resultado.error
    }

    if (error) {
      console.error('Error guardando cliente:', error)
      setMensaje('Error al guardar cliente')
      return
    }

    setMensaje(clienteEditandoId ? 'Cliente actualizado correctamente' : 'Cliente guardado correctamente')
    limpiarFormulario()
    await cargarClientes()
  }

  const editarCliente = (cliente) => {
    setFormulario({
      nombres: cliente.nombres || '',
      apellidos: cliente.apellidos || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      barrio: cliente.barrio || '',
      ciudad: cliente.ciudad || 'San Francisco',
      departamento: cliente.departamento || 'Putumayo',
      estado: cliente.estado || 'Activo',
      lat: cliente.lat ? String(cliente.lat) : '',
      lng: cliente.lng ? String(cliente.lng) : ''
    })

    setClienteEditandoId(cliente.id)
    setMensaje(`Editando cliente #${cliente.id}`)
  }

  const eliminarCliente = async (id) => {
    const confirmar = window.confirm('¿Eliminar cliente?')

    if (!confirmar) return

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando cliente:', error)
      setMensaje('Error al eliminar cliente')
      return
    }

    if (clienteEditandoId === id) {
      limpiarFormulario()
    }

    setMensaje('Cliente eliminado correctamente')
    await cargarClientes()
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase()

    return (
      cliente.nombres?.toLowerCase().includes(texto) ||
      cliente.apellidos?.toLowerCase().includes(texto) ||
      cliente.telefono?.toLowerCase().includes(texto) ||
      cliente.correo?.toLowerCase().includes(texto) ||
      cliente.direccion?.toLowerCase().includes(texto) ||
      cliente.barrio?.toLowerCase().includes(texto)
    )
  })

  return (
    <div>
      <div style={heroEstilo}>
        <h2 style={{ margin: 0 }}>Clientes</h2>
        <p style={{ margin: '10px 0 0 0', color: '#cbd5e1' }}>
          Gestión de clientes con ubicación en mapa
        </p>
      </div>

      <div style={cardEstilo}>
        <h3 style={tituloSeccion}>
          {clienteEditandoId ? 'Editar cliente' : 'Registrar cliente'}
        </h3>

        <form onSubmit={guardarCliente}>
          <div style={gridEstilo}>
            <input
              name="nombres"
              placeholder="Nombres"
              value={formulario.nombres}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="apellidos"
              placeholder="Apellidos"
              value={formulario.apellidos}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="telefono"
              placeholder="Teléfono"
              value={formulario.telefono}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="correo"
              placeholder="Correo electrónico"
              value={formulario.correo}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="direccion"
              placeholder="Dirección"
              value={formulario.direccion}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="barrio"
              placeholder="Barrio"
              value={formulario.barrio}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="ciudad"
              placeholder="Ciudad"
              value={formulario.ciudad}
              onChange={manejarCambio}
              style={inputEstilo}
            />

            <input
              name="departamento"
              placeholder="Departamento"
              value={formulario.departamento}
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
              <option value="Suspendido">Suspendido</option>
              <option value="Retirado">Retirado</option>
            </select>
          </div>

          <div style={{ marginTop: '18px' }}>
            <h4 style={{ color: '#ffffff', marginBottom: '10px' }}>
              Ubicación del cliente en mapa
            </h4>

            <p style={{ color: '#cbd5e1', marginTop: 0 }}>
              Haz clic en el mapa para seleccionar la ubicación exacta. El mapa abre centrado en San Francisco, Putumayo.
            </p>

            <div style={{ marginBottom: '12px', color: '#cbd5e1' }}>
              <strong>Latitud:</strong> {formulario.lat || 'No seleccionada'}{' '}
              | <strong>Longitud:</strong> {formulario.lng || 'No seleccionada'}
            </div>

            <MapContainer
              center={
                formulario.lat && formulario.lng
                  ? [Number(formulario.lat), Number(formulario.lng)]
                  : CENTRO_SAN_FRANCISCO_PTYO
              }
              zoom={14}
              style={{
                height: '350px',
                width: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              />

              <SelectorUbicacion onSeleccionar={seleccionarUbicacionMapa} />

              {formulario.lat && formulario.lng && (
                <Marker position={[Number(formulario.lat), Number(formulario.lng)]}>
                  <Popup>Ubicación seleccionada del cliente</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          <button type="submit" style={botonGuardar}>
            {clienteEditandoId ? 'Actualizar cliente' : 'Guardar cliente'}
          </button>

          {clienteEditandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              style={botonCancelar}
            >
              Cancelar edición
            </button>
          )}
        </form>

        {mensaje && (
          <p style={{ marginTop: '15px', color: '#4ade80' }}>
            {mensaje}
          </p>
        )}
      </div>

      <div style={cardEstilo}>
        <h3 style={tituloSeccion}>Listado de clientes</h3>

        <input
          type="text"
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...inputEstilo, marginBottom: '15px' }}
        />

        <div style={tablaWrap}>
          <table style={tablaEstilo}>
            <thead>
              <tr>
                <th style={thEstilo}>Nombre</th>
                <th style={thEstilo}>Teléfono</th>
                <th style={thEstilo}>Correo</th>
                <th style={thEstilo}>Dirección</th>
                <th style={thEstilo}>Barrio</th>
                <th style={thEstilo}>Estado</th>
                <th style={thEstilo}>Ubicación</th>
                <th style={thEstilo}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td style={tdEstilo}>
                    {cliente.nombres} {cliente.apellidos || ''}
                  </td>

                  <td style={tdEstilo}>{cliente.telefono}</td>
                  <td style={tdEstilo}>{cliente.correo || '-'}</td>
                  <td style={tdEstilo}>{cliente.direccion || ''}</td>
                  <td style={tdEstilo}>{cliente.barrio || ''}</td>

                  <td style={tdEstilo}>
                    <span style={estadoEtiqueta(cliente.estado)}>
                      {cliente.estado}
                    </span>
                  </td>

                  <td style={tdEstilo}>
                    {cliente.lat && cliente.lng ? 'Sí' : 'No'}
                  </td>

                  <td style={tdEstilo}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => editarCliente(cliente)}
                        style={botonEditar}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarCliente(cliente.id)}
                        style={botonEliminar}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function estadoEtiqueta(estado) {
  if (estado === 'Activo') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#052e16',
      color: '#4ade80',
      border: '1px solid #166534'
    }
  }

  if (estado === 'Suspendido') {
    return {
      padding: '6px 10px',
      borderRadius: '20px',
      backgroundColor: '#3f2d06',
      color: '#fbbf24',
      border: '1px solid #92400e'
    }
  }

  return {
    padding: '6px 10px',
    borderRadius: '20px',
    backgroundColor: '#1e1b4b',
    color: '#a78bfa',
    border: '1px solid #6d28d9'
  }
}

const heroEstilo = {
  background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
  color: '#fff',
  padding: '28px',
  borderRadius: '20px',
  marginBottom: '22px'
}

const cardEstilo = {
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  borderRadius: '20px',
  padding: '24px',
  marginBottom: '22px',
  color: '#fff'
}

const tituloSeccion = {
  marginTop: 0,
  color: '#ffffff'
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
  backgroundColor: 'rgba(255,255,255,0.05)',
  color: '#ffffff',
  boxSizing: 'border-box',
  outline: 'none'
}

const botonGuardar = {
  marginTop: '18px',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer'
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

const botonEditar = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#f59e0b',
  color: '#fff',
  cursor: 'pointer'
}

const botonEliminar = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#dc2626',
  color: '#fff',
  cursor: 'pointer'
}

const tablaWrap = {
  overflowX: 'auto'
}

const tablaEstilo = {
  width: '100%',
  borderCollapse: 'collapse'
}

const thEstilo = {
  textAlign: 'left',
  padding: '12px',
  backgroundColor: 'rgba(148, 163, 184, 0.12)',
  color: '#cbd5e1'
}

const tdEstilo = {
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)'
}

export default VistaClientes