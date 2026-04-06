import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabaseClient'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

function SelectorPosicion({ setLatLng }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setLatLng(lat, lng)
    }
  })
  return null
}

function VistaMapa() {
  const [tabActiva, setTabActiva] = useState('clientes')

  const [clientes, setClientes] = useState([])
  const [muflas, setMuflas] = useState([])
  const [naps, setNaps] = useState([])
  const [splitters, setSplitters] = useState([])

  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  const [formMufla, setFormMufla] = useState({
    codigo: '',
    tipo: '',
    capacidad_hilos: '',
    hilos_usados: '',
    hilos_libres: '',
    estado: 'Activa',
    observaciones: '',
    lat: '',
    lng: ''
  })

  const [formNap, setFormNap] = useState({
    codigo: '',
    capacidad_puertos: '',
    puertos_usados: '',
    puertos_libres: '',
    splitter_id: '',
    estado: 'Activa',
    observaciones: '',
    lat: '',
    lng: ''
  })

  const [formSplitter, setFormSplitter] = useState({
    codigo: '',
    tipo: '1:8',
    entrada_hilo: '',
    salidas: '',
    perdida_estimativa: '',
    mufla_id: '',
    nap_id: '',
    estado: 'Activo',
    observaciones: '',
    lat: '',
    lng: ''
  })

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    setCargando(true)
    await Promise.all([
      obtenerClientes(),
      obtenerMuflas(),
      obtenerNaps(),
      obtenerSplitters()
    ])
    setCargando(false)
  }

  const obtenerClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('id', { ascending: false })

    if (!error) setClientes(data || [])
  }

  const obtenerMuflas = async () => {
    const { data, error } = await supabase
      .from('muflas')
      .select('*')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('id', { ascending: false })

    if (!error) setMuflas(data || [])
  }

  const obtenerNaps = async () => {
    const { data, error } = await supabase
      .from('naps')
      .select('*')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('id', { ascending: false })

    if (!error) setNaps(data || [])
  }

  const obtenerSplitters = async () => {
    const { data, error } = await supabase
      .from('splitters')
      .select('*')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('id', { ascending: false })

    if (!error) setSplitters(data || [])
  }

  const manejarCambioMufla = (e) => {
    const { name, value } = e.target
    setFormMufla((prev) => ({ ...prev, [name]: value }))
  }

  const manejarCambioNap = (e) => {
    const { name, value } = e.target
    setFormNap((prev) => ({ ...prev, [name]: value }))
  }

  const manejarCambioSplitter = (e) => {
    const { name, value } = e.target
    setFormSplitter((prev) => ({ ...prev, [name]: value }))
  }

  const setLatLngMufla = (lat, lng) => {
    setFormMufla((prev) => ({
      ...prev,
      lat: String(lat),
      lng: String(lng)
    }))
  }

  const setLatLngNap = (lat, lng) => {
    setFormNap((prev) => ({
      ...prev,
      lat: String(lat),
      lng: String(lng)
    }))
  }

  const setLatLngSplitter = (lat, lng) => {
    setFormSplitter((prev) => ({
      ...prev,
      lat: String(lat),
      lng: String(lng)
    }))
  }

  const guardarMufla = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formMufla.codigo || !formMufla.lat || !formMufla.lng) {
      setMensaje('La mufla necesita código y ubicación')
      return
    }

    const { error } = await supabase
      .from('muflas')
      .insert([
        {
          codigo: formMufla.codigo,
          tipo: formMufla.tipo || null,
          capacidad_hilos: formMufla.capacidad_hilos ? Number(formMufla.capacidad_hilos) : 0,
          hilos_usados: formMufla.hilos_usados ? Number(formMufla.hilos_usados) : 0,
          hilos_libres: formMufla.hilos_libres ? Number(formMufla.hilos_libres) : 0,
          estado: formMufla.estado,
          observaciones: formMufla.observaciones || null,
          lat: Number(formMufla.lat),
          lng: Number(formMufla.lng)
        }
      ])

    if (error) {
      console.error(error)
      setMensaje('Error al guardar la mufla')
      return
    }

    setMensaje('Mufla guardada correctamente')
    setFormMufla({
      codigo: '',
      tipo: '',
      capacidad_hilos: '',
      hilos_usados: '',
      hilos_libres: '',
      estado: 'Activa',
      observaciones: '',
      lat: '',
      lng: ''
    })
    await obtenerMuflas()
  }

  const guardarNap = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formNap.codigo || !formNap.lat || !formNap.lng) {
      setMensaje('La NAP necesita código y ubicación')
      return
    }

    const { error } = await supabase
      .from('naps')
      .insert([
        {
          codigo: formNap.codigo,
          capacidad_puertos: formNap.capacidad_puertos ? Number(formNap.capacidad_puertos) : 0,
          puertos_usados: formNap.puertos_usados ? Number(formNap.puertos_usados) : 0,
          puertos_libres: formNap.puertos_libres ? Number(formNap.puertos_libres) : 0,
          splitter_id: formNap.splitter_id ? Number(formNap.splitter_id) : null,
          estado: formNap.estado,
          observaciones: formNap.observaciones || null,
          lat: Number(formNap.lat),
          lng: Number(formNap.lng)
        }
      ])

    if (error) {
      console.error(error)
      setMensaje('Error al guardar la NAP')
      return
    }

    setMensaje('NAP guardada correctamente')
    setFormNap({
      codigo: '',
      capacidad_puertos: '',
      puertos_usados: '',
      puertos_libres: '',
      splitter_id: '',
      estado: 'Activa',
      observaciones: '',
      lat: '',
      lng: ''
    })
    await obtenerNaps()
  }

  const guardarSplitter = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formSplitter.codigo || !formSplitter.lat || !formSplitter.lng) {
      setMensaje('El splitter necesita código y ubicación')
      return
    }

    const { error } = await supabase
      .from('splitters')
      .insert([
        {
          codigo: formSplitter.codigo,
          tipo: formSplitter.tipo,
          entrada_hilo: formSplitter.entrada_hilo || null,
          salidas: formSplitter.salidas ? Number(formSplitter.salidas) : 0,
          perdida_estimativa: formSplitter.perdida_estimativa ? Number(formSplitter.perdida_estimativa) : null,
          mufla_id: formSplitter.mufla_id ? Number(formSplitter.mufla_id) : null,
          nap_id: formSplitter.nap_id ? Number(formSplitter.nap_id) : null,
          estado: formSplitter.estado,
          observaciones: formSplitter.observaciones || null,
          lat: Number(formSplitter.lat),
          lng: Number(formSplitter.lng)
        }
      ])

    if (error) {
      console.error(error)
      setMensaje('Error al guardar el splitter')
      return
    }

    setMensaje('Splitter guardado correctamente')
    setFormSplitter({
      codigo: '',
      tipo: '1:8',
      entrada_hilo: '',
      salidas: '',
      perdida_estimativa: '',
      mufla_id: '',
      nap_id: '',
      estado: 'Activo',
      observaciones: '',
      lat: '',
      lng: ''
    })
    await obtenerSplitters()
  }

  const centroMapa =
    clientes[0]
      ? [clientes[0].lat, clientes[0].lng]
      : [1.4376, -76.1460]

  if (cargando) {
    return <p>Cargando mapa avanzado...</p>
  }

  return (
    <div>
      <h2>Módulo de Mapa Avanzado</h2>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginTop: '20px',
          marginBottom: '20px'
        }}
      >
        <button onClick={() => setTabActiva('clientes')} style={tabActiva === 'clientes' ? botonActivo : botonNormal}>Clientes</button>
        <button onClick={() => setTabActiva('muflas')} style={tabActiva === 'muflas' ? botonActivo : botonNormal}>Muflas</button>
        <button onClick={() => setTabActiva('naps')} style={tabActiva === 'naps' ? botonActivo : botonNormal}>NAPs</button>
        <button onClick={() => setTabActiva('splitters')} style={tabActiva === 'splitters' ? botonActivo : botonNormal}>Splitters</button>
      </div>

      {mensaje && (
        <div
          style={{
            backgroundColor: '#ecfccb',
            border: '1px solid #84cc16',
            color: '#365314',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '15px'
          }}
        >
          {mensaje}
        </div>
      )}

      {tabActiva === 'muflas' && (
        <div style={cardEstilo}>
          <h3>Registrar Mufla</h3>

          <form onSubmit={guardarMufla}>
            <div style={gridEstilo}>
              <input name="codigo" placeholder="Código" value={formMufla.codigo} onChange={manejarCambioMufla} style={inputEstilo} />
              <input name="tipo" placeholder="Tipo" value={formMufla.tipo} onChange={manejarCambioMufla} style={inputEstilo} />
              <input name="capacidad_hilos" placeholder="Capacidad de hilos" value={formMufla.capacidad_hilos} onChange={manejarCambioMufla} style={inputEstilo} />
              <input name="hilos_usados" placeholder="Hilos usados" value={formMufla.hilos_usados} onChange={manejarCambioMufla} style={inputEstilo} />
              <input name="hilos_libres" placeholder="Hilos libres" value={formMufla.hilos_libres} onChange={manejarCambioMufla} style={inputEstilo} />
              <select name="estado" value={formMufla.estado} onChange={manejarCambioMufla} style={inputEstilo}>
                <option value="Activa">Activa</option>
                <option value="Inactiva">Inactiva</option>
              </select>
            </div>

            <textarea
              name="observaciones"
              placeholder="Observaciones"
              value={formMufla.observaciones}
              onChange={manejarCambioMufla}
              style={{ ...inputEstilo, minHeight: '80px', marginTop: '10px' }}
            />

            <p><strong>Lat:</strong> {formMufla.lat || 'No seleccionada'} | <strong>Lng:</strong> {formMufla.lng || 'No seleccionada'}</p>

            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
              <MapContainer center={centroMapa} zoom={13} style={{ height: '300px', width: '100%', borderRadius: '12px' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                <SelectorPosicion setLatLng={setLatLngMufla} />
                {formMufla.lat && formMufla.lng && (
                  <Marker position={[Number(formMufla.lat), Number(formMufla.lng)]}>
                    <Popup>Mufla seleccionada</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <button type="submit" style={botonGuardar}>Guardar Mufla</button>
          </form>
        </div>
      )}

      {tabActiva === 'naps' && (
        <div style={cardEstilo}>
          <h3>Registrar NAP</h3>

          <form onSubmit={guardarNap}>
            <div style={gridEstilo}>
              <input name="codigo" placeholder="Código" value={formNap.codigo} onChange={manejarCambioNap} style={inputEstilo} />
              <input name="capacidad_puertos" placeholder="Capacidad de puertos" value={formNap.capacidad_puertos} onChange={manejarCambioNap} style={inputEstilo} />
              <input name="puertos_usados" placeholder="Puertos usados" value={formNap.puertos_usados} onChange={manejarCambioNap} style={inputEstilo} />
              <input name="puertos_libres" placeholder="Puertos libres" value={formNap.puertos_libres} onChange={manejarCambioNap} style={inputEstilo} />

              <select name="splitter_id" value={formNap.splitter_id} onChange={manejarCambioNap} style={inputEstilo}>
                <option value="">Selecciona un splitter</option>
                {splitters.map((splitter) => (
                  <option key={splitter.id} value={splitter.id}>
                    {splitter.codigo} - {splitter.tipo}
                  </option>
                ))}
              </select>

              <select name="estado" value={formNap.estado} onChange={manejarCambioNap} style={inputEstilo}>
                <option value="Activa">Activa</option>
                <option value="Inactiva">Inactiva</option>
              </select>
            </div>

            <textarea
              name="observaciones"
              placeholder="Observaciones"
              value={formNap.observaciones}
              onChange={manejarCambioNap}
              style={{ ...inputEstilo, minHeight: '80px', marginTop: '10px' }}
            />

            <p><strong>Lat:</strong> {formNap.lat || 'No seleccionada'} | <strong>Lng:</strong> {formNap.lng || 'No seleccionada'}</p>

            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
              <MapContainer center={centroMapa} zoom={13} style={{ height: '300px', width: '100%', borderRadius: '12px' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                <SelectorPosicion setLatLng={setLatLngNap} />
                {formNap.lat && formNap.lng && (
                  <Marker position={[Number(formNap.lat), Number(formNap.lng)]}>
                    <Popup>NAP seleccionada</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <button type="submit" style={botonGuardar}>Guardar NAP</button>
          </form>
        </div>
      )}

      {tabActiva === 'splitters' && (
        <div style={cardEstilo}>
          <h3>Registrar Splitter</h3>

          <form onSubmit={guardarSplitter}>
            <div style={gridEstilo}>
              <input name="codigo" placeholder="Código" value={formSplitter.codigo} onChange={manejarCambioSplitter} style={inputEstilo} />

              <select name="tipo" value={formSplitter.tipo} onChange={manejarCambioSplitter} style={inputEstilo}>
                <option value="1:2">1:2</option>
                <option value="1:4">1:4</option>
                <option value="1:8">1:8</option>
                <option value="1:16">1:16</option>
                <option value="1:32">1:32</option>
                <option value="1:64">1:64</option>
              </select>

              <input name="entrada_hilo" placeholder="Entrada hilo" value={formSplitter.entrada_hilo} onChange={manejarCambioSplitter} style={inputEstilo} />
              <input name="salidas" placeholder="Salidas" value={formSplitter.salidas} onChange={manejarCambioSplitter} style={inputEstilo} />
              <input name="perdida_estimativa" placeholder="Pérdida estimada" value={formSplitter.perdida_estimativa} onChange={manejarCambioSplitter} style={inputEstilo} />

              <select name="mufla_id" value={formSplitter.mufla_id} onChange={manejarCambioSplitter} style={inputEstilo}>
                <option value="">Selecciona una mufla</option>
                {muflas.map((mufla) => (
                  <option key={mufla.id} value={mufla.id}>
                    {mufla.codigo}
                  </option>
                ))}
              </select>

              <select name="nap_id" value={formSplitter.nap_id} onChange={manejarCambioSplitter} style={inputEstilo}>
                <option value="">Selecciona una NAP</option>
                {naps.map((nap) => (
                  <option key={nap.id} value={nap.id}>
                    {nap.codigo}
                  </option>
                ))}
              </select>

              <select name="estado" value={formSplitter.estado} onChange={manejarCambioSplitter} style={inputEstilo}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            <textarea
              name="observaciones"
              placeholder="Observaciones"
              value={formSplitter.observaciones}
              onChange={manejarCambioSplitter}
              style={{ ...inputEstilo, minHeight: '80px', marginTop: '10px' }}
            />

            <p><strong>Lat:</strong> {formSplitter.lat || 'No seleccionada'} | <strong>Lng:</strong> {formSplitter.lng || 'No seleccionada'}</p>

            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
              <MapContainer center={centroMapa} zoom={13} style={{ height: '300px', width: '100%', borderRadius: '12px' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                <SelectorPosicion setLatLng={setLatLngSplitter} />
                {formSplitter.lat && formSplitter.lng && (
                  <Marker position={[Number(formSplitter.lat), Number(formSplitter.lng)]}>
                    <Popup>Splitter seleccionado</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <button type="submit" style={botonGuardar}>Guardar Splitter</button>
          </form>
        </div>
      )}

      <div style={cardEstilo}>
        <h3>Mapa General de Red</h3>

        <MapContainer center={centroMapa} zoom={13} style={{ height: '600px', width: '100%', borderRadius: '12px' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {clientes.map((cliente) => (
            <Marker key={`cliente-${cliente.id}`} position={[cliente.lat, cliente.lng]}>
              <Popup>
                <strong>Cliente:</strong><br />
                {cliente.nombres} {cliente.apellidos || ''}<br />
                {cliente.telefono}<br />
                {cliente.direccion}
              </Popup>
            </Marker>
          ))}

          {muflas.map((mufla) => (
            <Marker key={`mufla-${mufla.id}`} position={[mufla.lat, mufla.lng]}>
              <Popup>
                <strong>Mufla:</strong><br />
                Código: {mufla.codigo}<br />
                Tipo: {mufla.tipo || 'N/A'}<br />
                Hilos: {mufla.capacidad_hilos || 0}
              </Popup>
            </Marker>
          ))}

          {naps.map((nap) => (
            <Marker key={`nap-${nap.id}`} position={[nap.lat, nap.lng]}>
              <Popup>
                <strong>NAP:</strong><br />
                Código: {nap.codigo}<br />
                Puertos: {nap.capacidad_puertos || 0}<br />
                Estado: {nap.estado}
              </Popup>
            </Marker>
          ))}

          {splitters.map((splitter) => (
            <Marker key={`splitter-${splitter.id}`} position={[splitter.lat, splitter.lng]}>
              <Popup>
                <strong>Splitter:</strong><br />
                Código: {splitter.codigo}<br />
                Tipo: {splitter.tipo}<br />
                Estado: {splitter.estado}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

const cardEstilo = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '14px',
  marginTop: '20px',
  marginBottom: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}

const gridEstilo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px'
}

const inputEstilo = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  boxSizing: 'border-box'
}

const botonNormal = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#e5e7eb',
  color: '#111827',
  cursor: 'pointer'
}

const botonActivo = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#2563eb',
  color: '#fff',
  cursor: 'pointer'
}

const botonGuardar = {
  padding: '12px 20px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#16a34a',
  color: '#fff',
  cursor: 'pointer'
}

export default VistaMapa