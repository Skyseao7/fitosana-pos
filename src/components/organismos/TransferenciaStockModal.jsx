import React, { useState, useMemo } from 'react';
import styled from "styled-components";
import { v } from "../../styles/variables";
import { Icon } from '@iconify/react'; 
import {
  InputText,
  Btn1,
  SelectList,
  useStockStore,
  useMovStockStore,
  useUsuariosStore,
} from "../../index";
import { useForm } from "react-hook-form";
import { BtnClose } from "../ui/buttons/BtnClose";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormattedDate } from "../../hooks/useFormattedDate";
import { useMostrarTodosLosAlmacenesConSucursalQuery } from "../../tanstack/AlmacenesStack";

// --- PROPS ---
// Recibimos las mismas props que RegistrarInventario
export function TransferenciaStockModal({
  onClose,
  producto,
  stockDesglosado,
  onSuccess
}) {
  const fechaLocal = useFormattedDate();
  const { datausuarios } = useUsuariosStore();
  const { insertarStock, editarStock } = useStockStore();
  const { insertarMovStock } = useMovStockStore();
  const { register, handleSubmit, reset } = useForm();

  // --- DOS ESTADOS DE SELECCIÓN ---
  const [selectedStockOrigen, setSelectedStockOrigen] = useState(null);
  const [selectedStockDestino, setSelectedStockDestino] = useState(null);

  // --- QUERY PARA EL DESTINO ---
  const { data: todosLosAlmacenes, isLoading: isLoadingAlmacenes } =
    useMostrarTodosLosAlmacenesConSucursalQuery();

  // --- LISTA 1: OPCIONES DE ORIGEN (Solo donde hay stock) ---
  const opcionesOrigen = useMemo(() => {
    if (!stockDesglosado) return [];
    // Filtramos para que solo salgan items con stock > 0
    return stockDesglosado
      .filter(item => item.stock_actual > 0)
      .map(item => ({
        ...item,
        displayLabel: `${item.nombre_sucursal} / ${item.nombre_almacen} (Stock: ${item.stock_actual})`
      }));
  }, [stockDesglosado]);

  // --- LISTA 2: OPCIONES DE DESTINO (Todos los almacenes) ---
  const opcionesDestino = useMemo(() => {
    if (!todosLosAlmacenes) return [];
    // Lógica copiada de RegistrarInventario para fusionar listas
    return todosLosAlmacenes.map(almacen => {
      const stockExistente = stockDesglosado?.find(
        stock => stock.id_almacen === almacen.id
      );
      if (stockExistente) {
        return {
          ...stockExistente,
          displayLabel: `${stockExistente.nombre_sucursal} / ${stockExistente.nombre_almacen} (Stock: ${stockExistente.stock_actual})`,
        };
      } else {
        return {
          id_stock: null,
          id_almacen: almacen.id,
          id_sucursal: almacen.id_sucursal,
          nombre_sucursal: almacen.sucursal_nombre,
          nombre_almacen: almacen.nombre,
          stock_actual: 0,
          displayLabel: `${almacen.sucursal_nombre} / ${almacen.nombre} (Stock: 0)`
        };
      }
    });
  }, [todosLosAlmacenes, stockDesglosado]);


  // --- MUTACIÓN DE TRANSFERENCIA ---
  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      // 1. Validaciones
      if (!selectedStockOrigen || !selectedStockDestino) {
        throw new Error("Debe seleccionar un origen y un destino.");
      }
      if (selectedStockOrigen.id_almacen === selectedStockDestino.id_almacen) {
        throw new Error("El origen y el destino no pueden ser el mismo.");
      }
      const cantidadNum = parseFloat(data.cantidad);
      if (cantidadNum <= 0) {
        throw new Error("La cantidad debe ser mayor a 0.");
      }
      if (selectedStockOrigen.stock_actual < cantidadNum) {
        throw new Error(`Stock insuficiente en origen. Solo hay ${selectedStockOrigen.stock_actual}.`);
      }

      // --- 2. PREPARAR OPERACIONES ---

      // A. Salida del Origen
      const pStockSalida = {
        _id: selectedStockOrigen.id_stock,
        cantidad: cantidadNum,
      };

      // B. Ingreso al Destino (Insertar o Editar)
      let pStockIngreso;
      const tipoIngreso = selectedStockDestino.id_stock ? "editar" : "insertar";

      if (tipoIngreso === "editar") {
        pStockIngreso = {
          _id: selectedStockDestino.id_stock,
          cantidad: cantidadNum,
        };
      } else {
        // (Copiado de RegistrarInventario, coincide con tu tabla 'stock')
        pStockIngreso = {
          id_almacen: selectedStockDestino.id_almacen,
          id_producto: producto.id_producto,
          stock: cantidadNum,
          stock_minimo: 0,
          ubicacion: ""
        };
      }

      // C. Movimiento de Historial
      const pMovimientoStock = {
        id_almacen: selectedStockOrigen.id_almacen, // Origen
        id_producto: producto.id_producto,
        tipo_movimiento: "transferencia", // Tipo especial
        cantidad: cantidadNum,
        fecha: fechaLocal,
        detalle: `Transferido a ${selectedStockDestino.nombre_sucursal} / ${selectedStockDestino.nombre_almacen}`,
        origen: `Inventario (Usuario: ${datausuarios.nombres})`,
        // (Opcional) Quizás quieras añadir un 'id_almacen_destino' aquí si tu tabla lo soporta
      };

      // --- 3. EJECUTAR TRANSACCIÓN ---
      // (Idealmente esto sería una transacción de DB, pero lo hacemos secuencial)
      
      // Paso 1: Sacar de Origen
      await editarStock(pStockSalida, "salida"); 
      
      // Paso 2: Meter en Destino
      if (tipoIngreso === "editar") {
        await editarStock(pStockIngreso, "ingreso");
      } else {
        await insertarStock(pStockIngreso);
      }
      
      // Paso 3: Registrar historial
      await insertarMovStock(pMovimientoStock);
    },
    onSuccess: () => {
      toast.success("Transferencia registrada con éxito.");
      reset();
      onSuccess(); // Llama a la función del padre para refrescar y cerrar
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  if (isLoadingAlmacenes) {
    return (
      <Container>
        <div className="sub-contenedor"><span>Cargando almacenes...</span></div>
      </Container>
    );
  }

  return (
    <Container>
      {isPending ? (
        <span>guardando...🔼</span>
      ) : (
        <div className="sub-contenedor">
          <div className="headers">
            <section>
              <h1>Transferir Stock</h1>
            </section>
            <section>
              <BtnClose funcion={onClose} />
            </section>
          </div>

          <section className="containerListas">
            <span>Producto: <strong>{producto.nombre_producto}</strong></span>
            
            {/* --- SELECTOR DE ORIGEN --- */}
            <ContainerSelector>
              <label>Desde (Origen):</label>
              <SelectList
                data={opcionesOrigen} 
                itemSelect={selectedStockOrigen}
                onSelect={setSelectedStockOrigen}
                displayField="displayLabel"
                placeholder="Seleccione un origen..."
              />
            </ContainerSelector>

            {/* --- SELECTOR DE DESTINO --- */}
            <ContainerSelector>
              <label>Hacia (Destino):</label>
              <SelectList
                data={opcionesDestino} 
                itemSelect={selectedStockDestino}
                onSelect={setSelectedStockDestino}
                displayField="displayLabel"
                placeholder="Seleccione un destino..."
              />
            </ContainerSelector>
            
          </section>
            
          <form className="formulario" onSubmit={handleSubmit(mutate)}>
            <section className="form-subcontainer">
              <article>
                <InputText icono={<v.iconoflechaderecha />}>
                  <input
                    className="form__field"
                    type="number"
                    step="0.01" 
                    {...register("cantidad", { required: true })}
                    placeholder=" "
                  />
                  <label className="form__label">Cantidad a transferir</label>
                </InputText>
              </article>
              <Btn1
                disabled={!selectedStockOrigen || !selectedStockDestino} 
                icono={<Icon icon="fa6-solid:right-left" />}
                titulo="Confirmar Transferencia"
                bgcolor="#0d6efd" // Azul
              />
            </section>
          </form>
        </div>
      )}
    </Container>
  );
}

// --- (Estilos copiados de RegistrarInventario) ---
const Container = styled.div`
  transition: 0.5s;
  top: 0;
  left: 0;
  position: fixed;
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  .sub-contenedor {
    position: relative;
    width: 500px;
    max-width: 85%;
    border-radius: 20px;
    background: ${({ theme }) => theme.body};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 20px 36px;
    z-index: 100;
    max-height: 80vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .containerListas {
      gap: 20px;
      display: flex;
      flex-direction: column;
    }
    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h1 {
        font-size: 30px;
        font-weight: 700;
        text-transform: uppercase;
      }
    }
    .formulario {
      .form-subcontainer {
        gap: 40px;
        display: flex;
        flex-direction: column;
      }
    }
  }
`;
const ContainerSelector = styled.div`
  display: flex;
  flex-direction: column; /* Para que el label esté arriba */
  gap: 8px;
  position: relative;
  
  label {
    font-size: 0.9em;
    opacity: 0.8;
  }
`;