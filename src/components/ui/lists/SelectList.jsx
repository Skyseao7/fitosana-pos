import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import styled from "styled-components";

export const SelectList = ({
  data,
  placeholder = "Selecciona una opción", // Añadimos un placeholder por defecto
  onSelect,
  displayField = "nombre",
  itemSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // --- BUG CORREGIDO ---
  // Se eliminó el estado interno 'selected'. El componente ahora es controlado
  // por el padre a través de 'itemSelect'.

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (item) => {
    // Ya no seteamos un estado local
    onSelect(item); // Solo informamos al padre
    setIsOpen(false);
  };

  return (
    <DropdownContainer>
      <DropdownHeader onClick={toggleDropdown}>
        {/* Mostramos el valor del padre o el placeholder */}
        {itemSelect?.[displayField] || placeholder}
        
        {/* FIX #1: Transient Prop $isOpen */}
        <Arrow $isOpen={isOpen}>
          <Icon icon="iconamoon:arrow-up-2-bold" width="24" height="24" />
        </Arrow>
      </DropdownHeader>
      
      {isOpen && (
        <DropdownList>
          {data?.map((item, index) => {
            // Comparamos 'item' directamente con la prop 'itemSelect'
            const isItemSelected = item === itemSelect; 
            
            return (
              <DropdownItem
                key={index}
                onClick={() => handleSelect(item)}
                // FIX #1: Transient Prop $isSelected
                $isSelected={isItemSelected} 
              >
                {isItemSelected && <CheckMark>✔</CheckMark>}
                {item?.[displayField]}
              </DropdownItem>
            );
          })}
        </DropdownList>
      )}
    </DropdownContainer>
  );
};

// Estilos usando Styled Components
const DropdownContainer = styled.div`
  position: relative;
  width: ${(props) => props.width};
`;

const DropdownHeader = styled.div`
 background-color: ${({ theme }) => theme.body};
  color: ${({ theme }) => theme.text};
  padding: 8px 15px;
  border: 1px solid #333;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap:10px;
`;

const Arrow = styled.span`
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.3s ease;
`;

const DropdownList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: ${({ theme }) => theme.body};
  border: 1px solid #333;
  border-radius: 5px;
  margin-top: 5px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 1000;

  // Evita que se adapte al tamaño del header
  min-width: 200px; /* Ancho mínimo */
  width: max-content; /* Ancho según el contenido */
  max-width: 300px; /* Ancho máximo */
`;

const DropdownItem = styled.div`
  padding: 10px 15px;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background-color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.bg : "transparent"};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.bg};
  }
`;

const CheckMark = styled.span`
  color:${({ theme }) => theme.text};
  font-size: 14px;
`;
