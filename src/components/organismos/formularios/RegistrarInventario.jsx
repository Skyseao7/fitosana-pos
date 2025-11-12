import styled from "styled-components";
import { v } from "../../../styles/variables";
import {
  InputText,
  Btn1,
  useSucursalesStore,
  useProductosStore,
  useAlmacenesStore,
} from "../../../index";
import { useForm } from "react-hook-form";
import { BtnClose } from "../../ui/buttons/BtnClose";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormattedDate } from "../../../hooks/useFormattedDate";
import { useStockStore } from "../../../store/StockStore";
import { useBuscarProductosQuery } from "../../../tanstack/ProductosStack";
import { useMostrarAlmacenesXSucursalInventarioQuery } from "../../../tanstack/AlmacenesStack";
// ¡Hook corregido!
import { useMostrarStockXAlmacenYProductoQuery } from "../../../tanstack/StockStack";
import { MessageComponent } from "../../ui/messages/MessageComponent";
import { useEffect } from "react";
import { BuscadorList } from "../../ui/lists/BuscadorList";
import { SelectList } from "../../ui/lists/SelectList";
import { useMovStockStore } from "../../../store/MovStockStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { useMostrarSucursalesQuery } from "../../../tanstack/SucursalesStack";

export function RegistrarInventario({ tipo, onClose }) { 
  const fechaLocal = useFormattedDate();
  const queryClient = useQueryClient();
  const { datausuarios } = useUsuariosStore();
  const { insertarMovStock } = useMovStockStore();
  const { editarStock } = useStockStore();
  const {
  	selectProductos,
  	setBuscador,
  	productosItemSelect,
  	dataProductos,
  	resetProductosItemSelect,
  } = useProductosStore();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
  	if (productosItemSelect) reset({ cantidad: "" });
  }, [productosItemSelect, reset]);

  useBuscarProductosQuery();
  const { selectSucursal, sucursalesItemSelect } = useSucursalesStore();
  const { data: dataSucursales, isLoading: isLoadingSucursal } = useMostrarSucursalesQuery();
  const { data: dataAlmacenes, isLoading: isLoadingAlmacenes } = useMostrarAlmacenesXSucursalInventarioQuery();
  const { setAlmacenSelectItem, almacenSelectItem } = useAlmacenesStore();
  
  // --- ¡ARREGLO #1: PASAR PARÁMETROS! ---
  // Ahora el hook recibe los IDs del estado local.
  const { data: dataStock, isLoading: isLoadingStock } = 
    useMostrarStockXAlmacenYProductoQuery(
      almacenSelectItem?.id, 
      productosItemSelect?.id
    );

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      // 1. Validaciones
      if (!productosItemSelect?.id || !almacenSelectItem?.id) {
  	  	throw new Error("Por favor, seleccione un producto y un almacén.");
  	  }
      const cantidadNum = parseFloat(data.cantidad);
      if (cantidadNum <= 0) {
        throw new Error("La cantidad debe ser mayor a 0.");
      }
      
      // 2. Validar stock en "Salida"
      // 'dataStock' ahora SÍ es el stock correcto gracias al hook corregido
      if (tipo === "salida" && (!dataStock || dataStock.stock < cantidadNum)) {
        throw new Error(`Stock insuficiente. Solo hay ${dataStock?.stock || 0} unidades.`);
      }

      // 3. Preparar pStock
      const pStock = {
        // dataStock.id ahora es confiable
  		_id: dataStock.id, 
  		cantidad: cantidadNum,
  	  };

      // 4. Preparar pMovimientoStock
      const pMovimientoStock = {
  		id_almacen: almacenSelectItem?.id,
  		id_producto: productosItemSelect?.id,
  		tipo_movimiento: tipo, 
  		cantidad: cantidadNum,
  		fecha: fechaLocal,
  		detalle: `Ajuste manual de ${tipo}`,
  		origen: `Inventario (Usuario: ${datausuarios.nombres})`,
  	  };

      // 5. Ejecutar (primero el stock, luego el historial)
      await editarStock(pStock, tipo);
      await insertarMovStock(pMovimientoStock);
    },
    onSuccess: () => {
      toast.success("Movimiento registrado con éxito.");
      queryClient.invalidateQueries(["mostrar stock actual"]); 
      queryClient.invalidateQueries(["mostrar stock xalmacenyproducto", almacenSelectItem?.id, productosItemSelect?.id]); // Invalidar el stock específico
      resetProductosItemSelect();
      onClose(); 
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const isLoading = isLoadingSucursal || isLoadingAlmacenes;
  if (isLoading) return <span>cargando...</span>;
  return (
  	<Container>
  	  {isPending ? (
  		<span>guardando...🔼</span>
  	  ) : (
  		<div className="sub-contenedor">
  		  {/* ¡RadioCheck Eliminado! */}
  		  <div className="headers">
  			<section>
  			  <h1>
  				{tipo === "ingreso" ? "Registrar Ingreso" : "Registrar Salida"}
  			  </h1>
  			</section>
  			<section>
  			  <BtnClose
  				funcion={() => {
  				  resetProductosItemSelect();
  				  onClose(); // Usa el prop 'onClose'
  				}}
  			  />
  			</section>
  		  </div>
  		  <section className="containerListas">
            {/* ... (Buscador y Selects se quedan igual) ... */}
            <BuscadorList
          	  data={dataProductos}
          	  onSelect={selectProductos}
      	  	  setBuscador={setBuscador}
  	  		/>
  	  		<span>
  	  		  Producto:{" "}
  	  		  <strong>
  	  			{productosItemSelect?.nombre ? productosItemSelect?.nombre : "-"}
  	  		  </strong>
  	  		</span>
  	  		<span>
  	  		  Stock Actual:{" "}
  	  		  <strong>{isLoadingStock ? 'Cargando...' : (dataStock?.stock ? dataStock?.stock : "-")} </strong>
  	  		</span>
  	  		<ContainerSelector>
  	  		  <label>Sucursal:</label>
  	  		  <SelectList
  		  		data={dataSucursales}
  	  	  		itemSelect={sucursalesItemSelect}
  	  	  		onSelect={selectSucursal}
  	  	  		displayField="nombre"
  	  	  	  />
  	  		</ContainerSelector>
  	  		<ContainerSelector>
  	  		  <label>Almacen:</label>
  	  		  <SelectList
  	  	  		data={dataAlmacenes}
  	  	  		itemSelect={almacenSelectItem}
  	  	  		onSelect={setAlmacenSelectItem}
  	  	  		displayField="nombre"
  	  	  	  />
  	  		</ContainerSelector>
  		  </section>
  		  {productosItemSelect?.maneja_inventarios ? (
            // ¡onSubmit ahora solo llama a mutate!
  			<form className="formulario" onSubmit={handleSubmit(mutate)}>
  			  <section className="form-subcontainer">
  				<article>
  				  <InputText icono={<v.iconoflechaderecha />}>
  					<input
  					  className="form__field"
  					  type="number"
                      step="0.01" // Para permitir decimales
  					  {...register("cantidad", { required: true })}
  					/>
  					<label className="form__label">Cantidad</label>
  				  </InputText>
  				</article>
                {/* Ya no necesitamos los precios, este modal es 
                  solo para mover stock, no para actualizar costos.
                */}
  				<Btn1
  				  disabled={!productosItemSelect?.nombre || !almacenSelectItem}
  				  icono={<v.iconoguardar />}
  				  titulo="Guardar"
  				  bgcolor="#F9D70B"
  				/>
  			  </section>
  			</form>
  		  ) : (
  			<MessageComponent
  			  text={
  				productosItemSelect?.nombre
  				  ? "Este producto no maneja inventarios."
  				  : "Busque un producto"
  			  }
  			/>
  		  )}
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
        gap: 20px;
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
