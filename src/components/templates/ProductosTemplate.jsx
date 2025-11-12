import React, { useEffect, useState, useMemo } from 'react';
import styled from "styled-components";
import {
  Btn1,
  Buscador,
  RegistrarProductos,
  TablaProductos,
  Title,
  useProductosStore,
  useEmpresaStore,
  useMostrarProductosQuery, // Hook de React Query
  useCategoriasStore,
  Select
} from "../../index";
import { v } from "../../styles/variables";
import ConfettiExplosion from "react-confetti-explosion";
import { Toaster } from "sonner";

export function ProductosTemplate() {

  const [openRegistro, SetopenRegistro] = useState(false);
  const { generarCodigo } = useProductosStore();
  const { dataempresa } = useEmpresaStore();
  const [accion, setAccion] = useState("");
  const [dataSelect, setdataSelect] = useState([]);
  const [isExploding, setIsExploding] = useState(false);

  // Datos de Productos (React Query)
  const { data: dataProductosOriginal, isLoading, isError, error, refetch, isFetching } =
    useMostrarProductosQuery(dataempresa?.id);

  // Datos y estado para filtro de Marca
  const { datacategorias, selectCategoria, categoriaItemSelect } = useCategoriasStore(); // Obtén las categorías/marcas
  const [filtroMarca, setFiltroMarca] = useState(null); // Estado para la marca seleccionada

  // Estado para el buscador general
  const [textoBusquedaGeneral, setTextoBusquedaGeneral] = useState("");

  useEffect(() => {
    // Llama a refetch solo si tenemos id_empresa.
    if (dataempresa?.id) {
       refetch();
    } 
  }, [dataempresa?.id, refetch]);

  // FILTRADO CLIENT-SIDE: Filtra los productos basados en la búsqueda general y la marca
  const dataProductosFiltrados = useMemo(() => {
    let productos = dataProductosOriginal ?? []; // Empieza con todos los productos

    // Filtra por Marca seleccionada
    if (filtroMarca?.id) {
        productos = productos.filter(p => p.id_categoria === filtroMarca.id);
    }

    // Filtra por texto de búsqueda general (nombre, código)
    if (textoBusquedaGeneral) {
        const lowerTexto = textoBusquedaGeneral.toLowerCase();
        productos = productos.filter(p =>
            p.nombre?.toLowerCase().includes(lowerTexto) ||
            p.codigo_barras?.toLowerCase().includes(lowerTexto) ||
            p.codigo_interno?.toLowerCase().includes(lowerTexto)
        );
    }

    return productos;
  }, [dataProductosOriginal, filtroMarca, textoBusquedaGeneral]);

  function nuevoRegistro() {
    // ... (tu función)
    SetopenRegistro(!openRegistro);
    setAccion("Nuevo");
    setdataSelect([]);
    setIsExploding(false);
    generarCodigo();
  }

  console.log("Texto Búsqueda:", textoBusquedaGeneral);

  if (isLoading && !dataProductosOriginal) { return <span>Cargando productos...</span>; }
  if (isError) { return <span>Error al cargar productos: {error?.message || 'Error desconocido'}</span>; }

  // --- Lógica de Renderizado Condicional ---

  // 1. Estado de Carga Inicial (o si falta dataempresa)
  // Muestra "Cargando..." si está en 'pending' O si falta el id de empresa (query deshabilitada)
  if (status === 'pending' || !dataempresa?.id) {
    return <span>{ !dataempresa?.id ? 'Esperando datos de empresa...' : 'Cargando productos...' }</span>;
  }

  // 2. Estado de Error
  if (status === 'error') {
    return <span>Error al cargar productos: {error?.message || 'Error desconocido'}</span>;
  }
  
  // 3. Estado Éxito (status === 'success')
  // En este punto, sabemos que la carga terminó (o viene del caché) y no hubo error.
  // dataProductos debería ser un array (incluso vacío si no hay productos).
  return (
    <Container>
      <Toaster />
      {openRegistro && (
        <RegistrarProductos
          setIsExploding={setIsExploding}
          onClose={() => SetopenRegistro(!openRegistro)}
          dataSelect={dataSelect}
          accion={accion}
          state={openRegistro}
        />
      )}

      <section className="area1">
        <Title>Productos</Title>
        {/* Muestra un loader pequeño si está haciendo refetch en background */}
        {isFetching && <span style={{fontSize: '0.8em', opacity: 0.7}}>🔄</span>} 
        
      </section>
      <section className="area2">
        <Buscador
          placeholder="Buscar por nombre o código..."
          setBuscador={setTextoBusquedaGeneral} // Pasa el setter del estado local
        />

        <SelectMarcaContainer>
         <Select // Usa tu componente Select buscable
            options={datacategorias || []} // Asegura que sea un array
            value={filtroMarca} // El estado local para el filtro
            onChange={(selectedOption) => setFiltroMarca(selectedOption)} // Actualiza el estado del filtro
            getOptionLabel={(option) => option.nombre}
            getOptionValue={(option) => option.id}
            placeholder="Filtro por Marca..."
            isClearable // Permite borrar la selección
            isSearchable
            // styles={customSelectStyles} // Estilos opcionales
          />
        </SelectMarcaContainer>
        <Btn1
          funcion={nuevoRegistro}
          bgcolor="#1d8850"
          color="#fff"
          titulo="NUEVO"
          icono={<v.iconoagregar />}
          height={"50px"}
        />
      </section>

      <section className="main">
        {isExploding && <ConfettiExplosion />}
        <TablaProductos
          setdataSelect={setdataSelect}
          setAccion={setAccion}
          SetopenRegistro={SetopenRegistro}
          data={dataProductosFiltrados} // <-- PASA LOS DATOS FILTRADOS
        />
      </section>
    </Container>
  );
}
const Container = styled.div`
  height: calc(100vh - 80px);
  
  margin-top:5px;
  margin-bottom:20px;
  padding: 15px;
  display: grid;
  grid-template:
    "area1" 60px
    "area2" 30px  // Espacio para los buscadores
    "main" auto;
    gap: 15px; // Espacio entre áreas
  .area1 {
    grid-area: area1;
    /* background-color: rgba(103, 93, 241, 0.14); */
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 15px;
  }
  .area2 {
    grid-area: area2;
    /* background-color: rgba(7, 237, 45, 0.14); */
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 30px; // Espacio entre buscadores
    
    & > :first-child { // Selecciona al primer hijo (el Buscador)
      flex-grow: 1; // Permite que crezca y ocupe el espacio extra
      max-width: 500px; // Ponle un límite de ancho (ajusta este valor)
    }
  }
  }
  .area2 > button { // Selecciona el Btn1 (que es un <button>) dentro de .area2
    /* margin-left: 440px; // Añade un margen izquierdo extra solo al botón */
  }
  .main {
    grid-area: main;
    /* background-color: rgba(237, 7, 221, 0.14); */
  }
`;
const SelectMarcaContainer = styled.div`
  min-width: 250px; // O el ancho que prefieras
`;