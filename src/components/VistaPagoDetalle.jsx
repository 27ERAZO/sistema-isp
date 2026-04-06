function VistaPagoDetalle({ pagoData, onVolver }) {
  if (!pagoData) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '30px',
          color: '#0f172a',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}
      >
        <h2 style={{ marginTop: 0, color: '#0f172a' }}>Detalle del Pago</h2>
        <p style={{ color: '#334155' }}>No hay información del pago para mostrar.</p>

        <button
          onClick={onVolver}
          style={{
            marginTop: '15px',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Volver
        </button>
      </div>
    )
  }

  const clienteNombre = `${pagoData.clientes?.nombres || ''} ${pagoData.clientes?.apellidos || ''}`.trim()

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        marginTop: '10px'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(90deg, #60a5fa, #2563eb)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '22px'
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: '700'
            }}
          >
            Detalle del Pago
          </h2>
          <p
            style={{
              margin: '6px 0 0 0',
              color: '#dbeafe',
              fontSize: '14px'
            }}
          >
            Información completa del pago registrado
          </p>
        </div>

        <button
          onClick={onVolver}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Volver
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}
      >
        <div style={cardDato}>
          <div style={tituloDato}>ID del pago</div>
          <div style={valorDato}>{pagoData.id || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Cliente</div>
          <div style={valorDato}>{clienteNombre || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Correo del cliente</div>
          <div style={valorDato}>{pagoData.clientes?.correo || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Número de factura</div>
          <div style={valorDato}>{pagoData.facturas?.numero_factura || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Periodo</div>
          <div style={valorDato}>{pagoData.facturas?.periodo || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Valor pagado</div>
          <div style={valorDato}>${Number(pagoData.valor || 0).toLocaleString()}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Método de pago</div>
          <div style={valorDato}>{pagoData.metodo_pago || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Referencia de pago</div>
          <div style={valorDato}>{pagoData.referencia_pago || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Banco / origen</div>
          <div style={valorDato}>{pagoData.banco_origen || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Fecha de pago</div>
          <div style={valorDato}>{pagoData.fecha_pago || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Estado factura</div>
          <div style={valorDato}>{pagoData.facturas?.estado || 'Sin dato'}</div>
        </div>

        <div style={cardDato}>
          <div style={tituloDato}>Saldo pendiente</div>
          <div style={valorDato}>
            ${Number(pagoData.facturas?.saldo_pendiente || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div
        style={{
          ...cardDato,
          marginTop: '18px'
        }}
      >
        <div style={tituloDato}>Observaciones</div>
        <div style={valorDato}>{pagoData.observaciones || 'Sin observaciones'}</div>
      </div>

      <div
        style={{
          ...cardDato,
          marginTop: '18px'
        }}
      >
        <div style={tituloDato}>Comprobante</div>

        {pagoData.comprobante_url ? (
          <a
            href={pagoData.comprobante_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Ver comprobante
          </a>
        ) : (
          <div style={valorDato}>Sin archivo</div>
        )}
      </div>
    </div>
  )
}

const cardDato = {
  backgroundColor: '#f8fafc',
  borderRadius: '14px',
  padding: '16px',
  border: '1px solid #e2e8f0'
}

const tituloDato = {
  fontSize: '13px',
  color: '#475569',
  fontWeight: '700',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

const valorDato = {
  fontSize: '16px',
  color: '#0f172a',
  fontWeight: '600',
  wordBreak: 'break-word'
}

export default VistaPagoDetalle