import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import styled from "styled-components";
import { v } from "../../../styles/variables"; // Asegúrate que todos los iconos usados aquí existan en 'v'
import {
  InputText,
  Btn1,
  useProductosStore,
  ContainerSelector, // Usado dentro de ContainerStock y secciones
  useSucursalesStore,
  useCategoriasStore, // Asumiendo que esto es Marca
  Btngenerarcodigo,
  useAlmacenesStore,
} from "../../../index";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Device } from "../../../styles/breakpoints";
import { useEffect, useState, useMemo, useCallback } from "react";
// Swal no se usa directamente en este fragmento
import { SelectList } from "../../ui/lists/SelectList";
import { useStockStore } from "../../../store/StockStore";
import { toast } from "sonner";
import { BtnClose } from "../../ui/buttons/BtnClose";

// --- PLACEHOLDER PARA ICONO DETALLES ---
// Si no tienes v.iconodetalles definido en variables.jsx, descomenta y usa uno genérico
// import { BsTextParagraph } from "react-icons/bs";
// const IconoDetallesPlaceholder = () => <BsTextParagraph />;
// --- FIN PLACEHOLDER ---

export function RegistrarProductos({
  onClose,
  dataSelect,
  accion,
  setIsExploding,
  state,
}) {
  if (!state) return null;

  // Define valores por defecto usando optional chaining y defaults
  const defaultSeVendePor = dataSelect?.sevende_por || "General";
  const defaultNombre = dataSelect?.nombre || '';
  const defaultPVenta = dataSelect?.precio_venta || 0;
  const defaultPCompra = dataSelect?.precio_compra || 0;
  const defaultCodBarras = dataSelect?.codigo_barras || '';
  const defaultCodInterno = dataSelect?.codigo_interno || '';
  const defaultStock = dataSelect?.stock || 0;
  const defaultStockMin = dataSelect?.stock_minimo || 0;
  const defaultDetalles = dataSelect?.ubicaciones || '';

  const unidadesDeVenta = useMemo(() => [ 
    { id: "General", nombre: "General" },
    { id: "Bebida", nombre: "Bebida" }, { id: "Caja", nombre: "Caja" },
    { id: "Capsulas", nombre: "Capsulas" }, { id: "Gel", nombre: "Gel" },
    { id: "Pack", nombre: "Pack" }, { id: "Polvo", nombre: "Polvo" },
    { id: "Pote", nombre: "Pote" }, { id: "Sobre", nombre: "Sobre" },
  ], []);

  // Estados locales
  const [sevendepor, setSevendepor] = useState(defaultSeVendePor);
  const [sevendePorItemSelect, setSevendePorItemSelect] = useState(
     unidadesDeVenta.find(u => u.id === defaultSeVendePor) || unidadesDeVenta[0]
  );
  const [randomCodeinterno, setRandomCodeinterno] = useState(defaultCodInterno);
  const [randomCodebarras, setRandomCodebarras] = useState(defaultCodBarras);
  const [stateInventarios] = useState(true);
  const [isCreatingMarca, setIsCreatingMarca] = useState(false);

  // Stores y Hooks
  const { insertarProductos, editarProductos, generarCodigo, codigogenerado } = useProductosStore(); 
  const { insertarStock, mostrarStockXAlmacenYProducto, actualizarDetallesStock } = useStockStore();
  const { dataempresa } = useEmpresaStore();
  const { mostrarAlmacenesXSucursal, almacenSelectItem, setAlmacenSelectItem } = useAlmacenesStore();
  const { dataSucursales, selectSucursal, sucursalesItemSelect } = useSucursalesStore();
  const { datacategorias, selectCategoria, categoriaItemSelect, insertarCategorias } = useCategoriasStore();

  // 👇 OBTÉN queryClient 👇
  const queryClient = useQueryClient();

  // React Hook Form
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm({
     defaultValues: { /* ... tus defaultValues ... */
        nombre: defaultNombre,
        precio_venta: defaultPVenta,
        precio_compra: defaultPCompra,
        stock: defaultStock,
        stock_minimo: defaultStockMin,
        detalles: defaultDetalles,
     }
  });

  // --- React Query Hooks ---
  const { data: dataStockEspecifico, refetch: refetchStockEspecifico } = useQuery({ /* ... tu query de stock ... */
     queryKey: ["mostrar stock especifico", { id_producto: dataSelect?.id, id_almacen: almacenSelectItem?.id }],
    queryFn: () => mostrarStockXAlmacenYProducto({ id_almacen: almacenSelectItem?.id, id_producto: dataSelect?.id }),
    enabled: !!dataSelect?.id && !!almacenSelectItem?.id && accion === 'Editar',
  });
  const { data: dataAlmacenes, isLoading: isLoadingAlmacenes } = useQuery({ /* ... tu query de almacenes ... */
    queryKey: ["mostrar almacenes x sucursal", { id_sucursal: sucursalesItemSelect?.id }],
    queryFn: () => mostrarAlmacenesXSucursal({ id_sucursal: sucursalesItemSelect?.id }),
    enabled: !!sucursalesItemSelect?.id,
  });

  // --- Effects ---
  useEffect(() => { /* ... tu useEffect para setear valores en edición ... */
      if (accion === "Editar" && dataSelect) {
      setValue("nombre", dataSelect.nombre || '');
      setValue("precio_venta", dataSelect.precio_venta || 0);
      setValue("precio_compra", dataSelect.precio_compra || 0);
      setValue("detalles", dataSelect.ubicaciones || '');

      setRandomCodebarras(dataSelect.codigo_barras || '');
      setRandomCodeinterno(dataSelect.codigo_interno || '');

      const catInitial = datacategorias?.find(c => c.id === dataSelect.id_categoria);
      if (catInitial) selectCategoria(catInitial);

      const sevendeInitial = unidadesDeVenta.find(u => u.nombre === dataSelect.sevende_por);
      handleSeVendePorSelect(sevendeInitial || unidadesDeVenta[0]);


    } else if (accion === "Nuevo") {
        generarCodigoInterno();
        setRandomCodebarras('');
        selectCategoria(null);
        handleSeVendePorSelect(unidadesDeVenta[0]);
        setValue("nombre", '');
        setValue("precio_venta", 0);
        setValue("precio_compra", 0);
        setValue("stock", 0);
        setValue("stock_minimo", 0);
        setValue("detalles", '');

    }
  }, [accion, dataSelect, setValue, datacategorias, unidadesDeVenta, selectCategoria]);

  useEffect(() => { /* ... tu useEffect para setear stock/ubicación desde dataStockEspecifico ... */
       if (accion === 'Editar' && dataStockEspecifico) {
        setValue("stock", dataStockEspecifico.stock || 0);
        setValue("stock_minimo", dataStockEspecifico.stock_minimo || 0);
        setValue("detalles", dataStockEspecifico.ubicacion || '');
     }
  }, [dataStockEspecifico, accion, setValue]);

  // --- Handlers ---
  const handleSeVendePorSelect = useCallback((item) => { // useCallback
    setSevendePorItemSelect(item);
    setSevendepor(item?.nombre || unidadesDeVenta[0].nombre);
  }, [unidadesDeVenta]);

  const generarCodigoBarras = useCallback(() => { // useCallback
    generarCodigo();
    setRandomCodebarras(codigogenerado);
  }, [generarCodigo, codigogenerado]);

  const generarCodigoInterno = useCallback(() => { // useCallback
    generarCodigo();
    setRandomCodeinterno(codigogenerado);
  }, [generarCodigo, codigogenerado]);

  const handleChangeinterno = useCallback((event) => setRandomCodeinterno(event.target.value), []);
  const handleChangebarras = useCallback((event) => setRandomCodebarras(event.target.value), []);

  const cerrarFormulario = useCallback(() => { // useCallback
    onClose();
  }, [onClose, setIsExploding]);
  // 👇 4. AÑADE EL MANEJADOR PARA CREAR LA MARCA
  const handleCreateMarca = async (inputValue) => {
    if (isCreatingMarca || !inputValue || !dataempresa?.id) return;

    const currentFormValues = getValues();

    setIsCreatingMarca(true);
    const nombreMarca = inputValue.toUpperCase(); // Guarda en mayúsculas

    // Revisa si ya existe (buena práctica)
    const exists = datacategorias.find(cat => cat.nombre.toUpperCase() === nombreMarca);
    if (exists) {
        toast.info(`La marca "${nombreMarca}" ya existe.`);
        selectCategoria(exists); // Simplemente la selecciona
        setIsCreatingMarca(false);
        setValue("nombre", currentFormValues.nombre);
        setValue("precio_venta", currentFormValues.precio_venta);
        setValue("precio_compra", currentFormValues.precio_compra);
        setValue("stock", currentFormValues.stock);
        setValue("stock_minimo", currentFormValues.stock_minimo);
        setValue("detalles", currentFormValues.detalles);
        return;
    }

    // Prepara el objeto 'p' que espera tu función SQL 'insertarcategorias'
    const p = {
      _nombre: nombreMarca,
      _color: "#CCCCCC", // Asigna un color por defecto
      _icono: "-",       // Asigna un icono por defecto
      _id_empresa: dataempresa.id
    };

    try {
      // Llama a la función de tu store. 
      // Tu store espera (p, file), así que pasamos 'null' para el archivo.
      await insertarCategorias(p, null); 
      
      // Después del await, el store ya refrescó 'datacategorias'
      // Busca la nueva opción en la lista actualizada
      const newOption = useCategoriasStore.getState().datacategorias.find(cat => cat.nombre === nombreMarca);
      
      if (newOption) {
        selectCategoria(newOption); // Selecciona la marca recién creada
        toast.success(`Marca "${nombreMarca}" creada.`);
      } else {
         toast.warning("Marca creada, pero no se pudo seleccionar automáticamente.");
      }
    } catch (error) {
      console.error("Error al crear la marca:", error);
      toast.error(`No se pudo crear la marca: ${error.message}`);
    } finally {
      setIsCreatingMarca(false);
      setValue("nombre", currentFormValues.nombre);
      setValue("precio_venta", currentFormValues.precio_venta);
      setValue("precio_compra", currentFormValues.precio_compra);
      setValue("stock", currentFormValues.stock);
      setValue("stock_minimo", currentFormValues.stock_minimo);
      setValue("detalles", currentFormValues.detalles);
    }
  };
  // 👆 FIN DEL NUEVO MANEJADOR
  // --- Mutation ---
  const { mutate: guardarProducto, isPending } = useMutation({ /* ... tu useMutation ... */
      mutationFn: async (formData) => {
      // VALIDATIONS (Mantén tus validaciones)
      if (!formData.nombre) throw new Error("El Nombre es obligatorio.");
      if (!categoriaItemSelect?.id && accion === 'Nuevo') throw new Error("Seleccione una Marca.");
      if (!categoriaItemSelect?.id && accion === 'Editar' && !dataSelect?.id_categoria) throw new Error("Seleccione una Marca.");
      if (stateInventarios && !almacenSelectItem?.id && accion === 'Nuevo') throw new Error("Seleccione un Almacén.");
      if (stateInventarios && !almacenSelectItem?.id && accion === 'Editar' && !dataStockEspecifico) throw new Error("Seleccione un Almacén para añadir stock inicial.");

      // Preparación de datos (incluyendo nombre en mayúsculas y códigos)
      const nombreEnMayusculas = formData.nombre.toUpperCase();
      const codigoBarrasFinal = randomCodebarras || (accion === 'Editar' ? dataSelect.codigo_barras : '') || codigogenerado || '';
      const codigoInternoFinal = randomCodeinterno || (accion === 'Editar' ? dataSelect.codigo_interno : '') || codigogenerado || '';

      // 👇 DEFINE baseProductoData AQUÍ (antes del if/else) 👇
      const baseProductoData = {
        _nombre: nombreEnMayusculas,
        _precio_venta: parseFloat(formData.precio_venta || 0),
        _precio_compra: parseFloat(formData.precio_compra || 0),
        // Usa el ID de la categoría seleccionada, o la original si no se cambió en editar
        _id_categoria: categoriaItemSelect?.id || dataSelect?.id_categoria,
        _codigo_barras: codigoBarrasFinal,
        _codigo_interno: codigoInternoFinal,
        _id_empresa: dataempresa.id,
        _sevende_por: sevendepor,
        _maneja_inventarios: true, // Siempre true
      };
      // 👆 FIN DE LA DEFINICIÓN 👆

      let productoId = dataSelect?.id;

      if (accion === "Editar") {
        const productoDataEditar = {
          ...baseProductoData, // Usa la variable definida arriba
          _id: dataSelect.id // Añade el ID para la función editar
        };
        console.log("Editando producto con:", productoDataEditar); // Log para verificar
        await editarProductos(productoDataEditar); // Llama a editar con los 10 argumentos correctos
        const stockExistente = dataStockEspecifico;
        if (!stockExistente && stateInventarios && almacenSelectItem?.id) {
             const stockData = {
                id_almacen: almacenSelectItem.id, id_producto: dataSelect.id,
                stock: parseFloat(formData.stock || 0),
                ubicacion: formData.detalles || '-',
            };
            await insertarStock(stockData);
        } else if (stockExistente){
             console.log("Stock ya existe (Editar). Actualizando detalles...");
            if (actualizarDetallesStock) {
                try {
                    await actualizarDetallesStock({
                        id: stockExistente.id, // ID del registro en la tabla 'stock'
                        ubicacion: formData.detalles || '-', // Solo el detalle, stock_minimo no cambia
                    });
                    console.log("Detalles actualizados en stock ID:", stockExistente.id);
                } catch (error) {
                    console.error("Error al llamar a actualizarDetallesStock:", error);
                    // Importante: re-lanzar el error para que onError de useMutation lo capture
                    throw error; 
                }
            } else {
                console.error("Función actualizarDetallesStock no encontrada en useStockStore.");
                throw new Error("No se pudo actualizar la ubicación del stock (función no encontrada).");
            }
        }
      } else { // NUEVO
        // Objeto para insertar (CON _maneja_multiprecios)
        const productoDataInsertar = {
           ...baseProductoData, // Usa la variable definida arriba
           _maneja_multiprecios: false
        };
         // 👆 FIN OBJETO INSERTAR 👆

        console.log("Insertando producto con:", productoDataInsertar); // Log para verificar
        productoId = await insertarProductos(productoDataInsertar); // Llama a insertar

        if (productoId && stateInventarios && almacenSelectItem?.id) {
          const stockData = {
            id_almacen: almacenSelectItem.id, id_producto: productoId,
            stock: parseFloat(formData.stock || 0),
            stock_minimo: parseFloat(formData.stock_minimo || 0),
            ubicacion: formData.detalles || '-',
          };
          await insertarStock(stockData);
        }
      }
      return productoId;
    },
    onSuccess: (/* ... */) => { /* ... tu onSuccess ... */
        toast.success("Producto guardado correctamente");
      setIsExploding(true);
      queryClient.invalidateQueries({ queryKey: ['mostrarproductos', dataempresa?.id] });
      cerrarFormulario();
    },
    onError: (error) => { /* ... tu onError ... */
       toast.error(`Error al guardar: ${error.message}`);
      console.error(error);
    },
  });

  // 👇 El handleSubmit de RHF llama a esta función 👇
  const handleGuardarSubmit = (data) => {
     guardarProducto(data); // Llama a la mutación con los datos validados por RHF
  };


  return (
    <Container $state={state}>
      <div className="sub-contenedor">
        <div className="headers">
        <section>
          <h1>
            {accion === "Editar" ? "EDITAR PRODUCTO" : "REGISTRAR NUEVO PRODUCTO"}
          </h1>
        </section>
        <section>
          <BtnClose funcion={cerrarFormulario} /> {/* <-- Asegúrate de que esté aquí */}
        </section>
      </div>

        <Form className="formulario" onSubmit={handleSubmit(handleGuardarSubmit)}>
          {/* --- COLUMNA IZQUIERDA --- */}
          <section className="seccion1">
            <article> {/* Nombre */}
               <InputText icono={<v.icononombre />}>
                <input
                  className="form__field" type="text" placeholder="Nombre del producto" autoComplete="off"
                  {...register("nombre", { required: "El nombre es obligatorio" })}
                />
                <label className="form__label">Nombre</label>
              </InputText>
              {errors.nombre && <p className="error-message">{errors.nombre.message}</p>}
            </article>

             {/* Fila para Precios */}
            <div className="row-inputs">
              <article> {/* Precio Venta */}
                 <InputText icono={<v.iconoprecioventa />}>
                   <input
                     className="form__field" type="number" step="0.01" placeholder=" "
                     {...register("precio_venta", { valueAsNumber: true, min: { value: 0, message: "Precio >= 0"} })}
                   />
                   <label className="form__label">Precio Venta</label>
                 </InputText>
                  {errors.precio_venta && <p className="error-message">{errors.precio_venta.message}</p>}
              </article>
              <article> {/* Precio Compra */}
                 <InputText icono={<v.iconopreciocompra />}>
                   <input
                     className="form__field" type="number" step="0.01" placeholder=" "
                     {...register("precio_compra", { valueAsNumber: true, min: { value: 0, message: "Costo >= 0"} })}
                   />
                   <label className="form__label">Costo Unit. (C/U)</label>
                 </InputText>
                   {errors.precio_compra && <p className="error-message">{errors.precio_compra.message}</p>}
              </article>
            </div>

            {/* 👇 MOVIDO AQUÍ: Stock Inicial 👇 */}
            <article>
                 <InputText icono={<v.iconostock />}>
                   <input
                     disabled={accion === 'Editar' && !!dataStockEspecifico} // Usa dataStockEspecifico
                     className="form__field" type="number" step="0.01" placeholder=" "
                     {...register("stock", { valueAsNumber: true, min: 0 })}
                   />
                   <label className="form__label">Stock Inicial</label>
                 </InputText>
                  {errors.stock && <p className="error-message">{errors.stock.message}</p>}
            </article>
            {/* 👆 FIN Stock Inicial */}

            {/* 👇 MOVIDO AQUÍ: Detalles 👇 */}
            <article>
                 <InputText icono={v.iconodetalles ? <v.iconodetalles /> : null}>
                   <input
                     className="form__field" type="text" placeholder=" " autoComplete="off"
                     {...register("detalles")}
                   />
                   <label className="form__label">Detalles</label>
                 </InputText>
            </article>
            {/* 👆 FIN Detalles/Ubicación */}

          </section>

          {/* --- COLUMNA DERECHA --- */}
          <section className="seccion2">

            {/* Wrapper para Tipo y Marca en fila */}
            <div className="row-inputs">
                <ContainerSelector>
                  <label>Tipo:</label>
                  <Select
                    options={unidadesDeVenta}
                    value={sevendePorItemSelect}
                    onChange={handleSeVendePorSelect} // La función de manejo ya está preparada
                    getOptionLabel={(option) => option.nombre}
                    getOptionValue={(option) => option.id}
                    placeholder="Buscar..."
                    isSearchable
                    // Opcional: añade estilos para que coincida con el resto de tu UI
                    // styles={customSelectStyles}
                  />
                </ContainerSelector>

                <ContainerSelector> {/* Marca */}
                  <label>Marca:</label>
                  <CreatableSelect
                    options={datacategorias || []} 
                    value={categoriaItemSelect}
                    onChange={selectCategoria} // Se usa al seleccionar uno existente
                    onCreateOption={handleCreateMarca} // Se usa al crear uno nuevo
                    getOptionLabel={(option) => option.nombre}
                    getOptionValue={(option) => option.id}
                    placeholder="Marca..."
                    isSearchable
                    isDisabled={isPending || isCreatingMarca} // Deshabilita si está guardando
                    isLoading={isCreatingMarca} // Muestra spinner si está creando marca
                  />
                </ContainerSelector>
            </div>

            {/* 👇 MOVIDO AQUÍ: Sucursal 👇 */}
            <ContainerSelector>
                 <label>Sucursal:</label>
                 <SelectList
                   data={dataSucursales} itemSelect={sucursalesItemSelect}
                   onSelect={selectSucursal} displayField="nombre"
                   placeholder="Seleccione sucursal..."
                 />
            </ContainerSelector>
            {/* 👆 FIN Sucursal */}

            {/* 👇 MOVIDO AQUÍ: Almacén 👇 */}
            <ContainerSelector>
                 <label>Almacén:</label>
                 <SelectList
                   data={dataAlmacenes} itemSelect={almacenSelectItem}
                   onSelect={setAlmacenSelectItem} displayField="nombre"
                   placeholder="Seleccione almacén..."
                   disabled={isLoadingAlmacenes || !sucursalesItemSelect}
                 />
            </ContainerSelector>
            {/* 👆 FIN Almacén */}

             {/* Código de Barras */}
             <article className="contentPadregenerar">
                 <InputText icono={<v.iconocodigobarras />}>
                <input
                  className="form__field" value={randomCodebarras} onChange={handleChangebarras}
                  type="text" placeholder="Código de Barras" autoComplete="off"
                />
                <label className="form__label">Código de Barras</label>
              </InputText>
              <ContainerBtngenerar>
                <Btngenerarcodigo titulo="Generar" funcion={generarCodigoBarras} />
              </ContainerBtngenerar>
            </article>

            {/* Código Interno */}
            <article className="contentPadregenerar">
                <InputText icono={<v.iconocodigointerno />}>
                <input
                  className="form__field" value={randomCodeinterno} onChange={handleChangeinterno}
                  type="text" placeholder="Código Interno" autoComplete="off"
                />
                <label className="form__label">Código Interno</label>
              </InputText>
              <ContainerBtngenerar>
                <Btngenerarcodigo titulo="Generar" funcion={generarCodigoInterno} />
              </ContainerBtngenerar>
            </article>

             {/* Mensaje de advertencia para editar stock (opcional, si aún lo necesitas) */}
             {accion === 'Editar' && dataStockEspecifico && (
               <ContainerMensajeStock>
                 <span> ❗ Use Inventario para ajustar el stock.</span>
               </ContainerMensajeStock>
             )}

          </section>

           {/* Botón Guardar al final */}
          <div className="footer-buttons">
            <Btn1
              type="submit"
              icono={<v.iconoguardar />} // El icono ya lo pasas
              titulo="Guardar"
              bgcolor="#1d8850" // <-- Cambia el color aquí
              disabled={isPending}
              color={"white"}
            />
          </div>
        </Form>
      </div>
    </Container>
  );
}

// --- ESTILOS (Asegúrate que sean los últimos que te pasé) ---
const Container = styled.div`
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  opacity: ${({ $state }) => ($state ? "1" : "0")};
  visibility: ${({ $state }) => ($state ? "visible" : "hidden")};
  position: fixed;
  inset: 0;
  background-color: rgba(10, 9, 9, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);

  .sub-contenedor {
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: ${v.boxshadowGray};
    padding: 25px; // Reduced padding slightly
    border-radius: ${v.borderRadius};
    width: 90%;
    max-width: 950px; // Increased width
    z-index: 101;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: relative; // Needed if positioning button absolutely *relative to this*

    &::-webkit-scrollbar { width: 8px; }
    &::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => theme.colorScroll};
      border-radius: 10px;
    }

    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px; // Reduced margin slightly
      // border-bottom: 1px solid ${({ theme }) => theme.color2}; // Optional: Remove border if desired
      padding-bottom: 10px; // Reduced padding
      // position: relative; // Usually not needed if button is inside flex

      h1 {
        font-size: 1.5rem; // Slightly smaller title
        color: ${({ theme }) => theme.text};
        font-weight: 600;
        margin: 0; // Remove default margin if any
      }

      // Target the section containing the button OR the button directly
      section:last-child {
         // Option A: Keep button flow with flex (usually best)
         // No extra styles needed if BtnClose is just placed inside

         // Option B: Absolute positioning (use if flex doesn't work)
         /*
         position: absolute;
         top: 15px; // Adjust distance from top
         right: 15px; // Adjust distance from right
         */
      }

      button, svg { // Style for BtnClose icon/button
          font-size: 1.6rem; // Adjust size
          cursor: pointer;
          color: ${({ theme }) => theme.text};
          background: none;
          border: none;
          padding: 5px; // Add some clickable area
           &:hover { opacity: 0.7; }
      }
    }
  }
`;

// Ajusta el Form styled-component
const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr; // Por defecto una columna
  gap: 25px;

  @media ${Device.tablet} {
    grid-template-columns: 1fr 1fr; // Dos columnas en tablet+
    gap: 35px; // Aumenta un poco el gap entre columnas si quieres
  }

  section { // Estilos para seccion1 y seccion2
    display: flex;
    flex-direction: column;
    gap: 20px; // Espacio entre elementos de la columna
  }

  // Estilos para agrupar label + input/select
  article, .ContainerSelector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label:not(.form__label) { // Labels que NO son flotantes
    font-weight: 500;
    color: ${({ theme }) => theme.text};
    font-size: 0.9rem;
    margin-bottom: 2px;
  }

  // Contenedor para input + botón generar
  .contentPadregenerar {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  // Contenedor para elementos en fila (Precio/Costo Y Tipo/Marca)
  .row-inputs {
    display: grid;
    // Por defecto una columna (móvil), dos en tablet+
    grid-template-columns: 1fr;
    gap: 20px; // Espacio vertical en móvil

    @media ${Device.tablet} {
      grid-template-columns: 1fr 1fr; // Dos columnas iguales en tablet+
      gap: 25px; // Espacio horizontal en tablet+
    }
  }

  .error-message {
      color: ${v.rojo};
      font-size: 0.8rem;
      margin-top: 4px;
  }

  .footer-buttons {
    grid-column: 1 / -1; // Ocupa todo el ancho
    display: flex;
    justify-content: center;
    margin-top: 25px;
  }
`;

// ContainerStock, ContainerBtngenerar, ContainerMensajeStock
// y ContainerSelector (si lo defines aquí) permanecen igual que antes.
// Asegúrate de que ContainerSelector se importe o defina UNA SOLA VEZ.

const ContainerBtngenerar = styled.div`
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  button {
    padding: 6px 10px;
    font-size: 0.8em;
  }
`;

const ContainerMensajeStock = styled.div`
  text-align: center;
  color: #f57c00;
  background-color: rgba(255, 152, 0, 0.1);
  border-radius: ${v.borderRadius};
  padding: 10px;
  margin: 5px 0;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid rgba(255, 152, 0, 0.3);
`;