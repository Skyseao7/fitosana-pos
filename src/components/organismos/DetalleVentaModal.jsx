import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { MostrarDetalleVentaPorId } from '../../index'; // Asumo que se exporta desde el index

export function DetalleVentaModal({ id_venta, onClose }) {
  const { data: detalles, isLoading, isError } = useQuery({
    queryKey: ['detalleVenta', id_venta],
    queryFn: () => MostrarDetalleVentaPorId({ id_venta: id_venta }),
    enabled: !!id_venta, // Solo se ejecuta si id_venta no es nulo
  });

  // Calculamos el total solo cuando los 'detalles' están disponibles
  const totalVenta = React.useMemo(() => {
    if (!detalles) return 0;
    return detalles.reduce((acc, item) => acc + item.total, 0);
  }, [detalles]);

  return (
    // Overlay semitransparente. Al hacer clic, se cierra (onClose)
    <Overlay onClick={onClose}>
      {/* Contenido del modal. Usamos stopPropagation para que no se cierre al hacer clic DENTRO */}
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>Detalle de la Venta</Title>
        {isLoading && <p>Cargando detalles...</p>}
        {isError && <p>Error al cargar detalles.</p>}
        
        <ItemList>
          <ItemHeader>
            <HeaderDesc>Descripción</HeaderDesc>
            <HeaderQty>Cant.</HeaderQty>
            <HeaderPrice>P. Unit.</HeaderPrice>
            <HeaderTotal>Total</HeaderTotal>
          </ItemHeader>
          {detalles?.map((item) => (
            <ItemRow key={item.id}>
              <ItemDesc>{item.descripcion}</ItemDesc>
              <ItemQty>{item.cantidad}</ItemQty>
              <ItemPrice>S/ {item.precio_venta.toFixed(2)}</ItemPrice>
              <ItemTotal>S/ {item.total.toFixed(2)}</ItemTotal>
            </ItemRow>
          ))}
        </ItemList>

        <ResumenModal>
            Total Venta: S/ {totalVenta.toFixed(2)}
        </ResumenModal>
      </ModalContent>
    </Overlay>
  );
}

// --- Estilos para el Modal ---
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.body};
  border-radius: 10px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 28px;
  color: ${({ theme }) => theme.text};
  opacity: 0.7;
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 20px 0;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
`;

// Estilos para la cabecera de la lista (Descripción, Cant, etc.)
const ItemHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  font-weight: bold;
  font-size: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid ${({ theme }) => theme.bordercolorDash};
  margin-bottom: 8px;
  gap: 10px;
`;

// Estilos para cada fila de producto
const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  font-size: 16px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.bordercolorDash}80;
  gap: 10px;
`;

const HeaderDesc = styled.span``;
const ItemDesc = styled.span`
  font-weight: 500;
  word-break: break-word; // Si el nombre es muy largo
`;

const HeaderQty = styled.span` text-align: right; `;
const ItemQty = styled.span` text-align: right; `;

const HeaderPrice = styled.span` text-align: right; `;
const ItemPrice = styled.span` text-align: right; `;

const HeaderTotal = styled.span` text-align: right; `;
const ItemTotal = styled.span` 
  text-align: right;
  font-weight: bold;
`;

const ResumenModal = styled.div`
  text-align: right;
  font-size: 18px;
  font-weight: bold;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 2px solid ${({ theme }) => theme.bordercolorDash};
`;