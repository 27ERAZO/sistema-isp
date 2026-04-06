import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import fondo from '../assets/fondo-login.jpg'

function VistaLoginCliente({ onLoginCorrecto }) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const iniciarSesionCliente = async (e) => {
    e.preventDefault()
    setMensaje('')
    setCargando(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password
    })

    if (error) {
      console.error('Error iniciando sesión cliente:', error)
      setMensaje('Correo o contraseña incorrectos')
      setCargando(false)
      return
    }

    if (data?.session) {
      onLoginCorrecto(data.session)
    }

    setCargando(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
    >
      {/* Capa oscura */}
      <div style={overlayEstilo}></div>

      {/* Líneas animadas */}
      <div className="lineas-animadas"></div>

      {/* Partículas */}
      <div className="particulas-login">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Card */}
      <div style={cardLogin}>
        <p style={miniTitulo}>W-RED TECHNOLOGY</p>
        <h2 style={tituloLogin}>Portal del Cliente</h2>
        <p style={subtituloLogin}>Ingresa con tu correo y contraseña</p>

        <form onSubmit={iniciarSesionCliente}>
          <input
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            style={inputEstilo}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputEstilo}
          />

          <button type="submit" style={botonAzul}>
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {mensaje && (
          <p style={mensajeError}>
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}

const overlayEstilo = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(2, 6, 23, 0.65)',
  zIndex: 1
}

const cardLogin = {
  position: 'relative',
  zIndex: 3,
  width: '100%',
  maxWidth: '420px',
  background: 'rgba(15, 23, 42, 0.60)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(14px)',
  borderRadius: '20px',
  padding: '30px',
  boxShadow: '0 12px 35px rgba(0,0,0,0.35)',
  color: '#fff'
}

const miniTitulo = {
  margin: 0,
  color: '#60a5fa',
  letterSpacing: '2px',
  fontSize: '13px',
  textTransform: 'uppercase'
}

const tituloLogin = {
  margin: '10px 0 8px 0',
  color: '#ffffff',
  fontSize: '30px',
  lineHeight: 1.1
}

const subtituloLogin = {
  margin: '0 0 18px 0',
  color: '#cbd5e1'
}

const inputEstilo = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.10)',
  marginBottom: '12px',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  color: '#ffffff',
  outline: 'none'
}

const botonAzul = {
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 6px 18px rgba(37,99,235,0.35)'
}

const mensajeError = {
  marginTop: '15px',
  color: '#fca5a5',
  fontWeight: 'bold'
}

export default VistaLoginCliente