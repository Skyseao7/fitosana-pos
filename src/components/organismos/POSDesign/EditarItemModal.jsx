import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCartVentasStoreTemporal } from '../../../store/CartVentasStoreTemporal';
import { useAlmacenesStore } from '../../../store/AlmacenesStore';
import { FormatearNumeroDinero } from '../../../utils/Conversiones';
import { useEmpresaStore } from '../../../store/EmpresaStore';
import { Btn1 } from "../../../index";

export function EditarItemModal({ item, onClose }) {
  const { updateItem } = useCartVentasStoreTemporal();
  const { dataAlmacenesXsucursal } = useAlmacenesStore(); 
  const { dataempresa } = useEmpresaStore();

  // Estados locales para todos los campos del modal
  const [nombre, setNombre] = useState(item.nombre_modificado ?? item.nombre);
  const [precio, setPrecio] = useState(
    item.precio_modificado !== null ? item.precio_modificado : item._precio_venta
  );
  const [cantidad, setCantidad] = useState(item._cantidad);
  const [descuento, setDescuento] = useState(item.descuento);
  const [esPorcentaje, setEsPorcentaje] = useState(item.descuento_es_porcentaje);
  const [almacenId, setAlmacenId] = useState(item._id_almacen);
  const [detalle, setDetalle] = useState(item.detalle);

  const [totalCalculado, setTotalCalculado] = useState(0);

  // Recalcular el total CADA VEZ que algo cambia
  useEffect(() => {
    const precioBase = parseFloat(precio) || 0;
    const cant = parseFloat(cantidad) || 0;
    const desc = parseFloat(descuento) || 0;
    
    const subtotal = precioBase * cant;
    const descuentoCalculado = esPorcentaje ? subtotal * (desc / 100) : desc;
    setTotalCalculado(subtotal - descuentoCalculado);
  }, [precio, cantidad, descuento, esPorcentaje]);

const handleGuardar = () => {
    // --- ¡CORRECCIÓN #2! ---
    // Convertimos el ID del almacén (string) a número antes de comparar
    const idAlmacenNum = parseInt(almacenId); 
    const almacenSeleccionado = dataAlmacenesXsucursal.find(a => a.id === idAlmacenNum);
    
  	updateItem(item.id, {
  	  nombre_modificado: nombre === item.nombre ? null : nombre,
  	  precio_modificado: parseFloat(precio) === parseFloat(item._precio_venta) ? null : parseFloat(precio),
  	  _cantidad: parseFloat(cantidad),
  	  descuento: parseFloat(descuento) || 0,
  	  descuento_es_porcentaje: esPorcentaje,
  	  _id_almacen: idAlmacenNum, // Usamos el ID como número
  	  nombre_almacen: almacenSeleccionado?.nombre || item.nombre_almacen,
  	  detalle: detalle,
  	});
  	onClose();
  };

  return (
    <Overlay>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Title>Editar Producto</Title>
        
        <Form>
          <FormGroup>
            <StyledLabel>Nombre</StyledLabel>
            <StyledInput value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </FormGroup>
          <Row>
            <Col>
              <FormGroup>
                <StyledLabel>Precio Unitario</StyledLabel>
                <StyledInput type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />
              </FormGroup> 
            </Col>
            <Col>
              <FormGroup>
                <StyledLabel>Cantidad</StyledLabel>
                <StyledInput type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col>
              <FormGroup>
                <StyledLabel>Descuento</StyledLabel>
                <StyledInput type="number" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
              </FormGroup>
            </Col>
            <ColCheck>
              <input type="checkbox" id="porcentaje" checked={esPorcentaje} onChange={(e) => setEsPorcentaje(e.target.checked)} />
              <StyledLabel htmlFor="porcentaje">Porcentaje (%)</StyledLabel>
            </ColCheck>
          </Row>

          <FormGroup>
            <StyledLabel>Importe Total</StyledLabel>
            <InputTotal value={FormatearNumeroDinero(totalCalculado, dataempresa?.currency, dataempresa?.iso)} readOnly />
          </FormGroup>

          <FormGroup>
            <StyledLabel>Almacén</StyledLabel>
            <StyledSelect value={almacenId} onChange={(e) => setAlmacenId(e.target.value)}>
              {dataAlmacenesXsucursal?.map(almacen => (
                <option key={almacen.id} value={almacen.id}>
                  {almacen.nombre}
                </option>
              ))}
            </StyledSelect>
          </FormGroup>

          <FormGroup>
            <StyledLabel>Detalle Adicional</StyledLabel>
            <StyledTextarea value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          </FormGroup>
        </Form>
        
        <Footer>
          <Btn1 titulo="Cancelar" funcion={onClose} bgcolor="#aab7a9ff" />
          <Btn1 titulo="Aceptar" funcion={handleGuardar} bgcolor="#1d8850"/>
        </Footer>
      </ModalContent>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.bgtotal};
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  color: ${({ theme }) => theme.text};
  border-radius: 10px;
  padding: 10px 15px 10px 12px;

  width: 500px;
  max-width: 70%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin: 15px 0 15px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StyledLabel = styled.label`
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.text}90;
`;

// Estilos comunes para inputs, selects y textareas
const commonInputStyles = `
  width: 85%;
  padding: 10px 10px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  background-color: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  
  &::placeholder {
    color: ${({ theme }) => theme.text}80;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}30;
  }
`;

const StyledInput = styled.input`
  ${commonInputStyles}
`;

const StyledSelect = styled.select`
  ${commonInputStyles}
`;

const StyledTextarea = styled.textarea`
  ${commonInputStyles}
  min-height: 40px;
  resize: vertical;
`;

const InputTotal = styled(StyledInput)`
  background-color: ${({ theme }) => theme.bgtotal};
  font-weight: bold;
  font-size: 16px;
  color: #000000ff;};
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;

const Col = styled.div`
  flex: 1;
`;

const ColCheck = styled.div`
  display: flex;
  align-items: center;
  gap: 0px;
  padding-top: 20px; // Alinear con el input
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  label {
    font-size: 14px;
    cursor: pointer;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.bordercolorDash};
`;