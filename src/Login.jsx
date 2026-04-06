import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')

  const iniciarSesion = async (e) => {
    e.preventDefault()

    setMensaje('')

    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password,
    })

    if (error) {
      setMensaje(error.message)
    } else {
      setMensaje('Inicio de sesión correcto')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Iniciar sesión</h2>

      <form onSubmit={iniciarSesion}>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
        />

        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          Entrar
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </div>
  )
}

export default Login