import styled from "styled-components";
import { blur_in } from "../../../styles/keyframes";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import {
  Btn1,
  Lottieanimacion,
  useEmpresaStore,
} from "../../../index";
import animacionvacio from "../../../assets/vacioanimacion.json";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { Device } from "../../../styles/breakpoints";

import { useCartVentasStoreTemporal } from "../../../store/CartVentasStoreTemporal";

export function AreaDetalleventaPos({ onEditItem }) {
  const { dataempresa } = useEmpresaStore();

  // --- ¡CONECTADO AL CARRITO LOCAL! ---
  const { 
    items, 
    addcantidadItem, 
    restarcantidadItem, 
    removeItem,
    getItemTotal 
  } = useCartVentasStoreTemporal();

  return (
    // ¡VOLVEMOS A USAR UN FRAGMENT (<>)!
    <> 
  	<AreaDetalleventa className={items?.length > 0 ? "" : "animacion"}>
  	{items?.length > 0 ? (
  	  items?.map((item, index) => {
        const totalItem = getItemTotal(item); 
  	  	return (
  		  <Itemventa 
            key={item.id} 
            onClick={() => onEditItem(item)} // <-- ¡Llama a la función del padre!
          >
  			<article className="contentdescripcion">
              {/* Muestra el nombre modificado si existe */}
  			  <span className="descripcion">{item.nombre_modificado ?? item.nombre}</span>
              <span className="almacen">(Almacén: {item.nombre_almacen})</span>
  			  <span className="importe">
  				<strong>Precio: </strong>
  				
  				{FormatearNumeroDinero(
                  // Muestra el precio modificado si existe
  				  item.precio_modificado ?? item._precio_venta, 
  				  dataempresa?.currency,
  				  dataempresa?.iso
  				)}
  			  </span>
              {/* ... (Tu 'ContentTotalResponsive' se queda igual, pero usa las props corregidas) ... */}
  			</article>

  			<article className="contentbtn">
  			  <Btn1
  				funcion={(e) => { e.stopPropagation(); addcantidadItem(item); }} // Detener la propagación
  				width="20px"
  				height="35px"
  				icono={<Icon icon="mdi:add-bold" />}
  			  ></Btn1>
              
              <span className="cantidad">{item._cantidad}</span>
              {/* (Quitamos el icono de lápiz, ahora se edita con clic) */}

  			  <Btn1
  				funcion={(e) => { e.stopPropagation(); restarcantidadItem(item); }} // Detener la propagación
  				width="20px"
  				height="35px"
  				icono={<Icon icon="subway:subtraction-1" />}
  			  ></Btn1>
  			</article>
  			<article className="contentTotaldetalleventa">
  			  <span className="cantidad">
  				<strong>
  				  {FormatearNumeroDinero(
  					totalItem, // <-- USAMOS EL TOTAL CALCULADO
  					dataempresa?.currency,
  					dataempresa?.iso
  				  )}
  				</strong>
  			  </span>
  			  <span className="delete" onClick={(e) => { e.stopPropagation(); removeItem(item); }}> 
  				<Icon icon="weui:delete-filled" width="24" height="24" />
  			  </span>
  			</article>
  		  </Itemventa>
  		);
  	  })
  	) : (
  	  <Lottieanimacion animacion={animacionvacio} alto="200" ancho="200" />
  	)}
  </AreaDetalleventa>

    {/* ¡EL MODAL YA NO SE RENDERIZA AQUÍ! */}
  </> 
  );
}
const AreaDetalleventa = styled.section`
  display: flex;
  width: 100%;
  margin-top: 10px;
  flex-direction: column;
  gap: 10px;
  max-height:calc(100vh - 500px);
  overflow-y: auto; /* Activa el scroll solo en Y */
  overflow-x: hidden; /* Oculta el scroll en X */
      
  &::-webkit-scrollbar {
  width: 12px;
  background: rgba(24, 24, 24, 0.2);
}

&::-webkit-scrollbar-thumb {
  background: rgba(148, 148, 148, 0.9);
  border-radius: 10px;
  filter: blur(10px);
}

  &.animacion {
    height: 100%;
    justify-content: center;
  }
  @media ${Device.laptop} {
    max-height:initial;
  }
`;
const Itemventa = styled.section`
  display: flex;
  justify-content: space-between;
  width: 100%;
  border-bottom: 1px dashed ${({ theme }) => theme.color2};
  animation: ${blur_in} 0.2s linear both;
  flex-direction: column;
  gap: 10px;
  .contentdescripcion {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    .descripcion {
      font-weight: 700;
      font-size: 20px;
    }
    .importe {
      font-size: 15px;
      display: none;
      @media ${Device.laptop} {
        display: block;
      }
    }
      cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.bgAlpha}; // (Opcional: efecto hover)
  }
  }
  .contentbtn {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 10px;
    align-items: center;
    justify-content: center;
    .cantidad {
      font-size: 1.8rem;
      font-weight: 700;
    }
    .edit-icon {
      cursor: pointer;
      font-size: 18px;
    }
  }
  .contentTotaldetalleventa {
    display: none;
    @media ${Device.laptop} {
      display: flex;
      flex-direction: row;
      justify-content: center;
      text-align: end;
      align-items: center;
      margin-bottom: 10px;
      width: 100%;
      .delete {
        cursor: pointer;
        width: 20px;
        align-self: center;
      }
    }
  }
  @media ${Device.tablet} {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    .contentdescripcion {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      .descripcion {
        font-weight: 700;
        font-size: 20px;
      }
      .importe {
        font-size: 15px;
      }
    }
    .contentbtn {
      display: flex;
      width: 100%;
      height: 100%;
      gap: 10px;
      align-items: center;
      justify-content: center;
      .cantidad {
        font-size: 1.8rem;
        font-weight: 700;
      }
      .edit-icon {
        cursor: pointer;
        font-size: 18px;
      }
    }
  }
`;
