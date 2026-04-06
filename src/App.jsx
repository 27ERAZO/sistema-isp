import { useEffect, useState } from 'react'
import Login from './Login'
import { supabase } from './lib/supabaseClient'
import VistaClientes from './components/VistaClientes'
import VistaServicios from './components/VistaServicios'
import VistaFacturacion from './components/VistaFacturacion'
import VistaPagos from './components/VistaPagos'
import VistaTickets from './components/VistaTickets'
import VistaDashboard from './components/VistaDashboard'
import VistaMapa from './components/VistaMapa'
import VistaInventario from './components/VistaInventario'
import VistaInventarioSerial from './components/VistaInventarioSerial'
import VistaReportes from './components/VistaReportes'
import VistaPortalCliente from './components/VistaPortalCliente'
import VistaAccesoCliente from './components/VistaAccesoCliente'
import VistaRouters from './components/VistaRouters'
import VistaOLT from './components/VistaOLT'


function App() {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [vistaActiva, setVistaActiva] = useState('dashboard')


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)

      if (session?.user?.id) {
        cargarPerfil(session.user.id)
      }
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (session?.user?.id) {
        cargarPerfil(session.user.id)
      } else {
        setPerfil(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const cargarPerfil = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error cargando perfil:', error)
      return
    }

    setPerfil(data)
  }

  if (!session) {
    return <Login />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* MENÚ LATERAL */}
      <aside
        style={{
          width: '250px',
          backgroundColor: '#e0e0e1b7',
          color: '#ffffff',
          padding: '20px'
        }}
      >
        <h2 style={{ marginBottom: '20px' }}>Sistema ISP</h2>

        <button onClick={() => setVistaActiva('dashboard')} style={estiloBotonMenu}>
          Dashboard
        </button>
        <button onClick={() => setVistaActiva('portalCliente')} style={estiloBotonMenu}>
          Portal Cliente
        </button>
        <button onClick={() => setVistaActiva('clientes')} style={estiloBotonMenu}>
          Clientes
        </button>
        <button onClick={() => setVistaActiva('servicios')} style={estiloBotonMenu}>
          Servicios
        </button>
        <button onClick={() => setVistaActiva('facturacion')} style={estiloBotonMenu}>
          Facturación
        </button>
        <button onClick={() => setVistaActiva('pagos')} style={estiloBotonMenu}>
          Pagos
        </button>
        <button onClick={() => setVistaActiva('tickets')} style={estiloBotonMenu}>
          Tickets
        </button>
        <button onClick={() => setVistaActiva('mapa')} style={estiloBotonMenu}>
          Mapa
        </button>
        <button onClick={() => setVistaActiva('olt')} style={estiloBotonMenu}>
          OLT
        </button>
        <button onClick={() => setVistaActiva('routers')} style={estiloBotonMenu}>
          Routers
        </button>
        <button onClick={() => setVistaActiva('inventario')} style={estiloBotonMenu}>
          Inventario
        </button>
        <button onClick={() => setVistaActiva('inventarioSerial')} style={estiloBotonMenu}>
          Inventario Serial
        </button>
        <button onClick={() => setVistaActiva('reportes')} style={estiloBotonMenu}>
          Reportes
        </button>
        <button onClick={() => setVistaActiva('configuracion')} style={estiloBotonMenu}>
          Configuración
        </button>
        <button onClick={() => setVistaActiva('accesoCliente')} style={estiloBotonMenu}>
          Acceso Cliente
        </button>
      </aside>

      {/* CONTENIDO */}
      <main style={{ flex: 1, backgroundColor: '#e9eaed7b', padding: '25px' }}>
        <header
          style={{
            backgroundColor: '#fff',
            padding: '15px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h1
           style={{
                   margin: '8px 0 6px 0',
                   fontSize: '40px',
                   fontWeight: '800',
                   color: '#000000',
                   lineHeight: '1.1',
                   letterSpacing: '1px'
                  }}
        >
           <span style={{ display: 'block' }}>Wireless-RED TECHNOLOGY</span>
           <span style={{ display: 'block', fontSize: '18px', color: '#93c5fd' }}>
              (W-RED TECHNOLOGY)
        </span>
      </h1>

          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0 }}><strong>{session.user.email}</strong></p>
            <p style={{ margin: '5px 0' }}>Rol: {perfil?.rol || 'Sin rol'}</p>
            <button onClick={() => supabase.auth.signOut()}>
              Cerrar sesión
            </button>
          </div>
        </header>

        {vistaActiva === 'dashboard' && <VistaDashboard />}
        {vistaActiva === 'clientes' && <VistaClientes />}
        {vistaActiva === 'servicios' && <VistaServicios />}
        {vistaActiva === 'facturacion' && <VistaFacturacion />}
        {vistaActiva === 'pagos' && <VistaPagos />}
        {vistaActiva === 'tickets' && <VistaTickets />}
        {vistaActiva === 'mapa' && <VistaMapa />}
        {vistaActiva === 'olt' && <VistaOLT />}
        {vistaActiva === 'routers' && <VistaRouters />}
        {vistaActiva === 'inventario' && <VistaInventario />}
        {vistaActiva === 'inventarioSerial' && <VistaInventarioSerial />}
        {vistaActiva === 'reportes' && <VistaReportes />}
        {vistaActiva === 'configuracion' && <VistaConfiguracion />}
        {vistaActiva === 'portalCliente' && <VistaPortalCliente />}
        {vistaActiva === 'accesoCliente' && <VistaAccesoCliente />}
      </main>
    </div>
  )
}

const estiloBotonMenu = {
  display: 'block',
  width: '100%',
  marginBottom: '10px',
  padding: '12px',
  backgroundColor: '#000000ba',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  textAlign: 'left',
  cursor: 'pointer'
}

function Caja({ titulo, valor }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '15px',
        boxShadow: '0 2px 8px rgb(81, 255, 0)'
      }}
    >
      <h3 style={{ margin: 0, marginBottom: '0px' }}>{titulo}</h3>
      <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{valor}</p>
    </div>
  )
}

function VistaConfiguracion() {
  return <h2>Módulo de Configuración</h2>
}

export default App