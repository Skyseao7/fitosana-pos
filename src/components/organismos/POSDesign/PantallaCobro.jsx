import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { IngresoCobro } from "./IngresoCobro";
import { VisorTicketVenta } from "./VisorTicketVenta";
// --- STORES INCORRECTOS ELIMINADOS ---
// import { useVentasStore } from "../../../store/VentasStore";
// import { useDetalleVentasStore } from "../../../store/DetalleVentasStore";

// --- ¡EL STORE CORRECTO! ---
import { useCartVentasStoreTemporal } from "../../../store/CartVentasStoreTemporal";

import { Switch } from "../../ui/toggles/Switch";
import { useImpresorasStore } from "../../../store/ImpresorasStore";
import { useEditarImpresorasMutation } from "../../../tanstack/ImpresorasStack";

export function PantallaCobro() {
  const [stateVerticket, setStateVerticker] = useState(false);
  // --- ¡CONECTADO AL STORE CORRECTO! ---
  const { resetUiStates } = useCartVentasStoreTemporal(); // Esta es la función para "volver"
  
  const ingresoCobroRef = useRef();
  // const { datadetalleventa } = useDetalleVentasStore(); // <-- Eliminado
  const { statePrintDirecto, setStatePrintDirecto } = useImpresorasStore();
  const { mutate, isPending } = useEditarImpresorasMutation();

  useEffect(() => {
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
        event.preventDefault(); 
      	if (ingresoCobroRef.current) {
          ingresoCobroRef.current.mutateAsync();
  	  	}
  	  }
  	};
  	document.addEventListener("keydown", handleKeyDown);
  	return () => {
  	  document.removeEventListener("keydown", handleKeyDown);
  	};
  }, []);

  return (
  	<Container>
  	  <section className="contentingresocobro">
  		{stateVerticket && (
  		  <VisorTicketVenta
  			setState={() => setStateVerticker(!stateVerticket)}
  		  />
  		)}

  		<article className="contentverticket">
  		  <ContentSwich>
  			imprimir directo
  			<Switch
  			  state={statePrintDirecto}
  			  setState={() => {
  				setStatePrintDirecto();
  				mutate();
  			  }}
  			/>
  		  </ContentSwich>
  		</article>
  		{isPending ? (
  		  <spa>guardando cambios de impresora...</spa>
  		) : (
  		  <IngresoCobro ref={ingresoCobroRef} />
  		)}

        {/* --- ¡BOTÓN "VOLVER" ARREGLADO! --- */}
  		<article
  		  className="contentverticket"
  		  onClick={resetUiStates} // Llama a la función correcta para cerrar
  		>
  		  <Icon className="icono" icon="ep:arrow-left-bold" />
  		  <span>volver</span>
  		</article>
  	  </section>
  	</Container>
  );
}
const Container = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 100;
  background-color: ${({ theme }) => theme.bgtotal};
  .contentingresocobro {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
    height: calc(100% - 10rem);
    .contentverticket {
      align-self: flex-end;
      cursor: pointer;
      display: flex;
      gap: 10px;
      align-items: center;
      span {
        font-weight: 700px;
        font-size: 18px;
      }
      .icono {
        font-size: 30px;
      }
    }
  }
`;
const ContentSwich = styled.section`
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
`;
