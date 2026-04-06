function VistaFacturaCliente({ facturaData, onVolver }) {
  if (!facturaData) {
    return <p style={{ color: '#fff', padding: '20px' }}>No hay factura seleccionada.</p>
  }

  const factura = {
    empresa: 'Wireless-RED Technology',
    subtituloEmpresa: '(W-RED Technology)',
    nit: '1004743022-2',
    telefonoEmpresa: '323 253 7659',
    direccionEmpresa: 'TRANSVERSAL 2 #6-59 B/ BELEN',

    numeroFactura: facturaData.numero_factura || 'Sin número',
    cliente: `${facturaData.clientes?.nombres || ''} ${facturaData.clientes?.apellidos || ''}`,
    direccionCliente: facturaData.clientes?.direccion || 'Sin dirección',
    telefonoCliente: facturaData.clientes?.telefono || 'Sin teléfono',

    concepto: 'Servicio de Internet',
    periodo: facturaData.periodo || 'Sin período',
    fechaEmision: facturaData.fecha_emision || 'Sin fecha',
    fechaVencimiento: facturaData.fecha_vencimiento || 'Sin fecha',
    estado: facturaData.estado || 'Pendiente',
    valor: Number(facturaData.total || 0),
    saldo: Number(facturaData.saldo_pendiente || 0)
  }

  return (
    <div style={paginaEstilo}>
      <div style={contenedorEstilo}>
        <div style={headerEstilo}>
          <div>
            <p style={empresaMini}>EMPRESA</p>
            <h1 style={empresaTitulo}>{factura.empresa}</h1>
            <p style={empresaSubtitulo}>{factura.subtituloEmpresa}</p>
            <p style={empresaInfo}>NIT: {factura.nit}</p>
            <p style={empresaInfo}>Tel: {factura.telefonoEmpresa}</p>
            <p style={empresaInfo}>{factura.direccionEmpresa}</p>
          </div>

          <button onClick={onVolver} style={botonVolver}>
            Volver
          </button>
        </div>

        <div style={cardEstilo}>
          <div style={topRow}>
            <div>
              <h2 style={tituloPrincipal}>Factura / Orden de pago</h2>
              <p style={textoClaro}><strong>No. Factura:</strong> {factura.numeroFactura}</p>
              <p style={textoClaro}><strong>Período:</strong> {factura.periodo}</p>
              <p style={textoClaro}><strong>Fecha de emisión:</strong> {factura.fechaEmision}</p>
              <p style={textoClaro}><strong>Fecha de vencimiento:</strong> {factura.fechaVencimiento}</p>
            </div>

            <div>
              <span style={estadoEtiqueta(factura.estado)}>
                Estado: {factura.estado}
              </span>
            </div>
          </div>

          <div style={gridEstilo}>
            <div style={infoCard}>
              <h3 style={subtituloSeccion}>Datos del cliente</h3>
              <p style={textoClaro}><strong>Nombre:</strong> {factura.cliente}</p>
              <p style={textoClaro}><strong>Dirección:</strong> {factura.direccionCliente}</p>
              <p style={textoClaro}><strong>Teléfono:</strong> {factura.telefonoCliente}</p>
            </div>

            <div style={infoCard}>
              <h3 style={subtituloSeccion}>Detalle del pago</h3>
              <p style={textoClaro}><strong>Concepto:</strong> {factura.concepto}</p>
              <p style={textoClaro}><strong>Período:</strong> {factura.periodo}</p>
              <p style={valorGrande}>Total a pagar: ${factura.valor.toLocaleString()}</p>
              <p style={textoClaro}><strong>Saldo pendiente:</strong> ${factura.saldo.toLocaleString()}</p>
            </div>
          </div>

          <div style={pagoCard}>
            <p style={pagoMini}>MÉTODO DE PAGO DISPONIBLE</p>
            <h3 style={tituloPago}>Número Nequi</h3>
            <p style={numeroNequi}>302 761 7040</p>
            <p style={textoPago}>
              Envía el comprobante después de pagar al WhatsApp <strong>323 253 7659</strong>
            </p>
          </div>

          <div style={importanteCard}>
            <h3 style={subtituloSeccion}>Importante</h3>
            <p style={textoClaro}>
              Después de realizar tu pago por Nequi, envía el comprobante a nuestro
              WhatsApp para registrar tu pago y activar el servicio lo más pronto posible.
            </p>
            <p style={textoClaro}>
              <strong>WhatsApp:</strong>{' '}
              <a
                href="https://wa.me/573232537659"
                target="_blank"
                rel="noreferrer"
                style={linkWhatsapp}
              >
                323 253 7659
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function estadoEtiqueta(estado) {
  if (estado === 'Pagada') {
    return {
      padding: '8px 14px',
      borderRadius: '20px',
      backgroundColor: '#052e16',
      color: '#4ade80',
      border: '1px solid #166534',
      fontWeight: 'bold'
    }
  }

  if (estado === 'Pendiente') {
    return {
      padding: '8px 14px',
      borderRadius: '20px',
      backgroundColor: '#3f2d06',
      color: '#fbbf24',
      border: '1px solid #92400e',
      fontWeight: 'bold'
    }
  }

  return {
    padding: '8px 14px',
    borderRadius: '20px',
    backgroundColor: '#1e1b4b',
    color: '#a78bfa',
    border: '1px solid #6d28d9',
    fontWeight: 'bold'
  }
}

const paginaEstilo = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #0f172a, #020617 70%)',
  padding: '30px 20px'
}

const contenedorEstilo = {
  maxWidth: '1100px',
  margin: '0 auto'
}

const headerEstilo = {
  background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(168,85,247,0.14))',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  color: '#fff',
  padding: '28px',
  borderRadius: '22px',
  marginBottom: '24px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '15px',
  flexWrap: 'wrap'
}

const empresaMini = {
  margin: 0,
  color: '#93c5fd',
  letterSpacing: '2px',
  fontSize: '13px'
}

const empresaTitulo = {
  margin: '8px 0 4px 0',
  fontSize: '40px',
  fontWeight: '800',
  color: '#ffffff',
  lineHeight: '1.1'
}

const empresaSubtitulo = {
  margin: '0 0 10px 0',
  color: '#60a5fa',
  fontWeight: 'bold',
  fontSize: '18px'
}

const empresaInfo = {
  margin: '4px 0',
  color: '#cbd5e1'
}

const botonVolver = {
  padding: '12px 18px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 6px 16px rgba(37,99,235,0.35)'
}

const cardEstilo = {
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  padding: '24px',
  borderRadius: '20px',
  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
  color: '#fff'
}

const topRow = {
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '20px',
  marginBottom: '24px'
}

const gridEstilo = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
  marginBottom: '24px'
}

const infoCard = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px'
}

const tituloPrincipal = {
  marginTop: 0,
  marginBottom: '12px',
  color: '#ffffff',
  fontSize: '30px'
}

const subtituloSeccion = {
  marginTop: 0,
  color: '#e2e8f0'
}

const textoClaro = {
  color: '#cbd5e1',
  margin: '8px 0'
}

const valorGrande = {
  margin: '12px 0',
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff'
}

const pagoCard = {
  background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.15))',
  border: '1px solid rgba(96,165,250,0.3)',
  color: '#ffffff',
  borderRadius: '20px',
  boxShadow: '0 0 25px rgba(59,130,246,0.25)',
  padding: '25px',
  textAlign: 'center',
  marginBottom: '24px'
}

const pagoMini = {
  margin: '0 0 8px 0',
  color: '#93c5fd',
  letterSpacing: '2px',
  fontSize: '13px'
}

const tituloPago = {
  margin: '0 0 10px 0',
  fontSize: '26px',
  color: '#ffffff'
}

const numeroNequi = {
  margin: '0 0 10px 0',
  fontSize: '40px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  color: '#ffffff'
}

const textoPago = {
  margin: 0,
  color: '#dbeafe'
}

const importanteCard = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px'
}

const linkWhatsapp = {
  color: '#4ade80',
  fontWeight: 'bold',
  textDecoration: 'none'
}

export default VistaFacturaCliente