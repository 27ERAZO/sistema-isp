import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaOLT() {
  const [olts, setOlts] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [oltEditandoId, setOltEditandoId] = useState(null)

  const [formulario, setFormulario] = useState({
    nombre: '',
    marca: 'V-SOL',
    modelo: '',
    ip: '',
    puerto: 80,
    usuario: '',
    contrasena: '',
    zona: '',
    estado: 'Activo',
    descripcion: ''
  })

  useEffect(() => {
    cargarOlts()
  }, [])

  const cargarOlts = async () => {
    const { data, error } = await supabase
      .from('olts')
      .select('*')
      .order('id', { ascending: false })

    if (error) return
    setOlts(data || [])
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target
    setFormulario({ ...formulario, [name]: value })
  }

  const guardarOLT = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formulario.nombre) {
      setMensaje('El nombre es obligatorio')
      return
    }

    let error = null

    if (oltEditandoId) {
      const res = await supabase
        .from('olts')
        .update(formulario)
        .eq('id', oltEditandoId)

      error = res.error
    } else {
      const res = await supabase
        .from('olts')
        .insert([formulario])

      error = res.error
    }

    if (error) {
      setMensaje('Error al guardar OLT')
      return
    }

    setMensaje('OLT guardada correctamente')
    limpiarFormulario()
    cargarOlts()
  }

  const editarOLT = (olt) => {
    setFormulario(olt)
    setOltEditandoId(olt.id)
  }

  const eliminarOLT = async (id) => {
    await supabase.from('olts').delete().eq('id', id)
    cargarOlts()
  }

  const limpiarFormulario = () => {
    setFormulario({
      nombre: '',
      marca: 'V-SOL',
      modelo: '',
      ip: '',
      puerto: 80,
      usuario: '',
      contrasena: '',
      zona: '',
      estado: 'Activo',
      descripcion: ''
    })
    setOltEditandoId(null)
  }

  const filtradas = olts.filter(o =>
    o.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.ip?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <h2>OLT GPON</h2>

      <div style={card}>
        <h3>{oltEditandoId ? 'Editar OLT' : 'Registrar OLT'}</h3>

        <form onSubmit={guardarOLT}>
          <div style={grid}>
            <input name="nombre" placeholder="Nombre" value={formulario.nombre} onChange={manejarCambio} style={input}/>
            <input name="marca" placeholder="Marca" value={formulario.marca} onChange={manejarCambio} style={input}/>
            <input name="modelo" placeholder="Modelo" value={formulario.modelo} onChange={manejarCambio} style={input}/>
            <input name="ip" placeholder="IP" value={formulario.ip} onChange={manejarCambio} style={input}/>
            <input name="puerto" type="number" value={formulario.puerto} onChange={manejarCambio} style={input}/>
            <input name="usuario" placeholder="Usuario" value={formulario.usuario} onChange={manejarCambio} style={input}/>
            <input name="contrasena" placeholder="Contraseña" value={formulario.contrasena} onChange={manejarCambio} style={input}/>
            <input name="zona" placeholder="Zona" value={formulario.zona} onChange={manejarCambio} style={input}/>

            <select name="estado" value={formulario.estado} onChange={manejarCambio} style={input}>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>

          <textarea name="descripcion" placeholder="Descripción" value={formulario.descripcion} onChange={manejarCambio} style={{...input, marginTop:10}}/>

          <button style={btn}>
            {oltEditandoId ? 'Actualizar' : 'Guardar'}
          </button>
        </form>

        {mensaje && <p>{mensaje}</p>}
      </div>

      <div style={card}>
        <h3>Listado de OLT</h3>

        <input
          placeholder="Buscar"
          value={busqueda}
          onChange={(e)=>setBusqueda(e.target.value)}
          style={input}
        />

        {filtradas.map(olt => (
          <div key={olt.id} style={item}>
            <b>{olt.nombre}</b> - {olt.ip}

            <div>
              <button onClick={()=>editarOLT(olt)} style={btnEdit}>Editar</button>
              <button onClick={()=>eliminarOLT(olt.id)} style={btnDelete}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const card = {
  background:'#0f172a',
  padding:'20px',
  borderRadius:'15px',
  marginBottom:'20px',
  color:'#fff'
}

const grid = {
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',
  gap:'10px'
}

const input = {
  padding:'10px',
  borderRadius:'8px',
  background:'#020617',
  color:'#fff',
  border:'1px solid #1e293b'
}

const btn = {
  marginTop:'10px',
  padding:'10px',
  background:'#2563eb',
  color:'#fff',
  border:'none',
  borderRadius:'8px'
}

const item = {
  background:'#020617',
  padding:'10px',
  marginTop:'10px',
  borderRadius:'8px',
  display:'flex',
  justifyContent:'space-between'
}

const btnEdit = { background:'#f59e0b', color:'#fff', border:'none', padding:'5px' }
const btnDelete = { background:'#dc2626', color:'#fff', border:'none', padding:'5px' }

export default VistaOLT