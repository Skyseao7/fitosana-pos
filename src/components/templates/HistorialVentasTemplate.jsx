import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { 
  DashboardHeader, 
  MostrarHistorialVentas,
  useDashboardStore, // ¡Reutilizamos tu store del dashboard!
  useUsuariosStore,
  DetalleVentaModal
} from '../../index';
import { Device } from '../../styles/breakpoints';

export function HistorialVentasTemplate() {
  const { datausuarios } = useUsuariosStore();
  const id_empresa = datausuarios?.id_empresa;
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState(null);
  // ¡Usamos las fechas del store que el DashboardHeader ya controla!
  const { fechaInicio, fechaFin } = useDashboardStore();

  const { data: historial, isLoading } = useQuery({
    queryKey: ['historialVentas', id_empresa, fechaInicio, fechaFin],
    queryFn: () => MostrarHistorialVentas({ 
      id_empresa: id_empresa,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin
    }),
    enabled: !!id_empresa && !!fechaInicio && !!fechaFin,
  });
  // Funciones para manejar el modal
  const handleVerDetalle = (id_venta) => {
    // --- ¡PRUEBA 1! ---
    // ¿Aparece esto en la consola cuando haces clic?
    console.log('¡Clic en boleta! ID:', id_venta);
    setSelectedVentaId(id_venta);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedVentaId(null);
  };

  // Función para formatear la fecha
  const formatFecha = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase().replace('.', '');
  };

  return (
    <Container>
      <DashboardHeader title="Historial de ventas" />
      <ListaVentasContainer>
        {isLoading && <p>Cargando historial...</p>}
        {historial?.map((venta) => (
          <VentaCard 
          key={venta.id} 
          onClick={() => handleVerDetalle(venta.id)}>
            <InfoContainer>
              <TipoComprobante>
                {/* Asumo que tienes estos datos, ajústalo si es necesario */}
                Boleta de Venta Electrónica » {venta.nro_comprobante}
              </TipoComprobante>
              <Cliente>
                {venta.id_cliente?.nombres || 'Cliente Genérico'}
              </Cliente>
              <Fecha>
                {formatFecha(venta.fecha)}
              </Fecha>
            </InfoContainer>
            <MontoContainer>
              S/ {venta.monto_total.toFixed(2)}
            </MontoContainer>
          </VentaCard>
        ))}
        {historial?.length === 0 && <p>No se encontraron ventas en este rango.</p>}
      </ListaVentasContainer>
      {modalOpen && (
        <DetalleVentaModal 
          id_venta={selectedVentaId} 
          onClose={handleCloseModal} 
        />
      )}
    </Container>
  );
}

// --- ESTILOS (STYLED-COMPONENTS) ---

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ListaVentasContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

// Estilo basado en tu imagen 1
const VentaCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: ${({ theme }) => theme.body};
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  }
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TipoComprobante = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const Cliente = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  opacity: 0.8;
`;

const Fecha = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text};
  opacity: 0.6;
`;

const MontoContainer = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #28a745; // Un color verde para el monto
`;