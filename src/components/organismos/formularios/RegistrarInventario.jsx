import React, { useState, useMemo, useEffect } from 'react';
import styled from "styled-components";
import { v } from "../../../styles/variables";
import {
  InputText,
  Btn1,
  SelectList,
  useStockStore, 
  useMovStockStore,
  useUsuariosStore,
  useCierreCajaStore,
  // --- useEmpresaStore eliminado, ya no se necesita ---
} from "../../../index";
import { useForm } from "react-hook-form";
import { BtnClose } from "../../ui/buttons/BtnClose";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormattedDate } from "../../../hooks/useFormattedDate";
import { useMostrarTodosLosAlmacenesConSucursalQuery } from "../../../tanstack/AlmacenesStack";


export function RegistrarInventario({ 
  tipo, 
  onClose, 
  producto, 
  stockDesglosado, 
  onSuccess 
}) { 
const fechaLocal = useFormattedDate();
  const { datausuarios } = useUsuariosStore();
  const { insertarStock, editarStock } = useStockStore();
  const { insertarMovStock } = useMovStockStore();
  const { dataCierreCaja } = useCierreCajaStore();
  const { register, handleSubmit, reset } = useForm();
  const [selectedStockLine, setSelectedStockLine] = useState(null);
  const { data: todosLosAlmacenes, isLoading: isLoadingAlmacenes } = 
    useMostrarTodosLosAlmacenesConSucursalQuery();

  // --- ¡NUEVO! Lógica de fusión (useMemo actualizado) ---
  const opcionesDesglose = useMemo(() => {
    if (!todosLosAlmacenes) return [];

    // Mapeamos sobre TODOS los almacenes, no solo sobre el stockDesglosado
    return todosLosAlmacenes.map(almacen => {
      // Buscamos si este almacén tiene stock del producto
      const stockExistente = stockDesglosado?.find(
        stock => stock.id_almacen === almacen.id
      );

      if (stockExistente) {
        // Sí tiene stock: usamos la data existente
        return {
          ...stockExistente, // Contiene id_stock, stock_actual, etc.
          displayLabel: `${stockExistente.nombre_sucursal} / ${stockExistente.nombre_almacen} (Stock: ${stockExistente.stock_actual})`,
          id_sucursal: almacen.id_sucursal // Aseguramos tener id_sucursal
        };
      } else {
        // No tiene stock: creamos un objeto "virtual"
        return {
          id_stock: null, // ¡Importante! No hay id_stock
          id_almacen: almacen.id,
          id_sucursal: almacen.id_sucursal,
          nombre_sucursal: almacen.sucursal_nombre, // Asumiendo que el hook trae estos datos
          nombre_almacen: almacen.nombre,
          stock_actual: 0,
          displayLabel: `${almacen.sucursal_nombre} / ${almacen.nombre} (Stock: 0)`
        };
      }
    });
  }, [todosLosAlmacenes, stockDesglosado]);

  //la selección por default ---
  useEffect(() => {
    // 1. Verificamos que tengamos la lista de opciones Y la data de la caja
    if (opcionesDesglose.length > 0 && dataCierreCaja?.caja?.id_sucursal) {
      
      // 2. Obtenemos el ID de la sucursal de la caja abierta
      const idSucursalActual = dataCierreCaja.caja.id_sucursal;
      
      // 3. Buscamos el primer almacén que pertenezca a esa sucursal
      const defaultOption = opcionesDesglose.find(
        op => op.id_sucursal === idSucursalActual
      );
      
      // 4. Si lo encontramos, lo seteamos como default
      if (defaultOption) {
        setSelectedStockLine(defaultOption);
      }
    }
    // 5. La dependencia ahora es la data de la caja, no la sucursal del filtro
  }, [opcionesDesglose, dataCierreCaja]);


  // --- ¡NUEVO! Mutación actualizada (lógica if/else) ---
  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      if (!selectedStockLine) throw new Error("Por favor, seleccione una ubicación.");
      const cantidadNum = parseFloat(data.cantidad);
      if (cantidadNum <= 0) throw new Error("La cantidad debe ser mayor a 0.");

      // Validar salida
      if (tipo === "salida") {
        if (selectedStockLine.stock_actual < cantidadNum) {
          throw new Error(`Stock insuficiente. Solo hay ${selectedStockLine.stock_actual}.`);
        }
        if (!selectedStockLine.id_stock) {
           throw new Error(`No se puede hacer una salida de una ubicación sin stock.`);
        }
      }

      if (selectedStockLine.id_stock) {
        // --- 1. YA EXISTE STOCK: Editamos (UPDATE) ---
        const pStock = {
          _id: selectedStockLine.id_stock,
          cantidad: cantidadNum,
        };
        await editarStock(pStock, tipo); 
      } else {
        // --- 2. NO EXISTE STOCK: Insertamos (INSERT) ---
        const pStock = {
          id_almacen: selectedStockLine.id_almacen,
          id_producto: producto.id_producto,
          stock: cantidadNum,
          stock_minimo: 0,
          ubicacion: ""
        };
        await insertarStock(pStock); 
      }

      // El movimiento de historial se registra en ambos casos
      const pMovimientoStock = {
        id_almacen: selectedStockLine.id_almacen,
        id_producto: producto.id_producto,
        tipo_movimiento: tipo, 
        cantidad: cantidadNum,
        fecha: fechaLocal,
        detalle: `Ajuste manual de ${tipo}`,
        origen: `Inventario (Usuario: ${datausuarios.nombres})`,
      };
      await insertarMovStock(pMovimientoStock);
    },
    onSuccess: () => {
      toast.success("Movimiento registrado con éxito.");
      reset();
      onSuccess(); // Llama a la función del padre para refrescar y cerrar
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  // El loading principal ahora es de los almacenes
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
          {/* ... (headers sin cambios) ... */}
           <div className="headers">
            <section>
              <h1>{tipo === "ingreso" ? "Registrar Ingreso" : "Registrar Salida"}</h1>
            </section>
            <section>
              <BtnClose funcion={onClose} />
            </section>
          </div>
          
          <section className="containerListas">
            <span>Producto: <strong>{producto.nombre_producto}</strong></span>
            
            <ContainerSelector>
              <label>Ubicación:</label>
              <SelectList
                data={opcionesDesglose} // ¡Usa la nueva lista fusionada!
                itemSelect={selectedStockLine}
                onSelect={setSelectedStockLine}
                displayField="displayLabel" // Usa el label que creamos
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
                  <label className="form__label">Cantidad</label>
                </InputText>
              </article>
              <Btn1
                disabled={!selectedStockLine} 
                icono={<v.iconoguardar />}
                titulo="Guardar"
                bgcolor="#1d8850"
              />
            </section>
          </form>
        </div>
      )}
    </Container>
  );
}
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
    .contentSucursal {
      display: flex;
      gap: 10px;
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
      span {
        font-size: 20px;
        cursor: pointer;
      }
    }
    .formulario {
      .form-subcontainer {
        gap: 40px;
        display: flex;
        flex-direction: column;
        .colorContainer {
          .colorPickerContent {
            padding-top: 15px;
            min-height: 50px;
          }
        }
      }
    }
  }
`;
const ContainerSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  position: relative;
`;
