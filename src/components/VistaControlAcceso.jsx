import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import VistaLoginCliente from './VistaLoginCliente'
import VistaPortalClientePrivado from './VistaPortalClientePrivado'
import AppSistema from '../App' // tu sistema principal

function VistaControlAcceso() {
  const [session, setSession] = useState(null)
  const [tipoUsuario, setTipoUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    verificarSesion()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) verificarTipoUsuario(session.user.id)
      else setTipoUsuario(null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const verificarSesion = async () => {
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      setSession(data.session)
      await verificarTipoUsuario(data.session.user.id)
    }

    setCargando(false)
  }

  const verificarTipoUsuario = async (userId) => {
    // 🔹 1. verificar si es cliente
    const { data: clienteData } = await supabase
      .from('portal_clientes')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (clienteData) {
      setTipoUsuario('cliente')
      return
    }

    // 🔹 2. verificar si es admin / operador
    const { data: perfilData } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .single()

    if (perfilData) {
      setTipoUsuario('admin')
      return
    }

    // 🔹 3. si no existe en ninguno
    setTipoUsuario('no_autorizado')
  }

  if (cargando) {
    return <p style={{ padding: '20px' }}>Cargando acceso...</p>
  }

  if (!session) {
    return <VistaLoginCliente onLoginCorrecto={setSession} />
  }

  if (tipoUsuario === 'cliente') {
    return <VistaPortalClientePrivado />
  }

  if (tipoUsuario === 'admin') {
    return <AppSistema />
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Acceso denegado</h2>
      <p>Tu usuario no tiene permisos asignados.</p>
    </div>
  )
}

export default VistaControlAcceso