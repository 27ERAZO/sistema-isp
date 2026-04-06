function VistaDetalleTicket({ ticketData, onVolver }) {
  if (!ticketData) {
    return <p>No hay ticket seleccionado.</p>
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            backgroundColor: '#111827',
            color: '#fff',
            padding: '20px 25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0 }}>Detalle del Ticket</h2>

          <button
            onClick={onVolver}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Volver
          </button>
        </div>

        <div style={{ padding: '25px' }}>
          <p><strong>ID:</strong> {ticketData.id}</p>
          <p>
            <strong>Cliente:</strong>{' '}
            {ticketData.clientes?.nombres || ''} {ticketData.clientes?.apellidos || ''}
          </p>
          <p><strong>Servicio ID:</strong> {ticketData.servicio_id || 'N/A'}</p>
          <p><strong>Categoría:</strong> {ticketData.categoria || 'N/A'}</p>
          <p><strong>Prioridad:</strong> {ticketData.prioridad || 'N/A'}</p>
          <p><strong>Asunto:</strong> {ticketData.asunto}</p>
          <p><strong>Descripción:</strong> {ticketData.descripcion || 'Sin descripción'}</p>
          <p><strong>Estado:</strong> {ticketData.estado}</p>
          <p><strong>Fecha apertura:</strong> {ticketData.fecha_apertura}</p>
          <p><strong>Fecha cierre:</strong> {ticketData.fecha_cierre || 'Aún no cerrada'}</p>
          <p><strong>Solución:</strong> {ticketData.solucion || 'Sin solución registrada'}</p>
        </div>
      </div>
    </div>
  )
}

export default VistaDetalleTicket