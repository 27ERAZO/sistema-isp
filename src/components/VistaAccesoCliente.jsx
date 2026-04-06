import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import VistaLoginCliente from './VistaLoginCliente'
import VistaPortalClientePrivado from './VistaPortalClientePrivado'

function VistaAccesoCliente() {
  const [sessionCliente, setSessionCliente] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const obtenerSesion = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionCliente(data.session)
      setCargando(false)
    }

    obtenerSesion()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionCliente(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (cargando) {
    return <p style={{ padding: '20px' }}>Cargando acceso cliente...</p>
  }

  if (!sessionCliente) {
    return <VistaLoginCliente onLoginCorrecto={setSessionCliente} />
  }

  return <VistaPortalClientePrivado />
}

export default VistaAccesoCliente