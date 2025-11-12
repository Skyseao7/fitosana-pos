import React, { useState, useMemo, useEffect } from 'react';
import styled from "styled-components";
import { 
  RegistrarInventario,
  TablaInventarios,
  Btn1,
  TransferenciaStockModal,
  Title,
  Buscador, 
  useEmpresaStore, 
  useMostrarStockActualQuery,
  Select, // Importamos el componente Select
  useCategoriasStore // Importamos el store de categorías/marcas
} from "../index"; 
import { Icon } from '@iconify/react';
import { useGlobalStore } from "../store/GlobalStore";
import { v } from "../styles/variables"; 

export function Inventario() {
  const { setStateClose, stateClose } = useGlobalStore();
  const [tipoMovimiento, setTipoMovimiento] = useState("ingreso");
  const [modalTransfer, setModalTransfer] = useState(false);
  
  // --- LÓGICA DE DATOS Y FILTRADO (COPIADA DE PRODUCTOS) ---
  const [textoBusqueda, setTextoBusqueda] = useState(""); 
  const [filtroMarca, setFiltroMarca] = useState(null);
  const { dataempresa } = useEmpresaStore();
  const { datacategorias } = useCategoriasStore(); // Para el filtro
  const { data: dataStockOriginal, isLoading, isError, error, isFetching } = 
    useMostrarStockActualQuery(dataempresa?.id);

  // Funciones de modales (sin cambios)
  const openModal = (tipo) => {
    setTipoMovimiento(tipo); 
    setStateClose(true);     
  };
  const openModalTransfer = () => {
    setModalTransfer(true);
  };

  // --- FILTRADO CLIENT-SIDE (COPIADO DE PRODUCTOS) ---
  // Esto arreglará tu bug de "buscador no funciona"
  const dataStockFiltrada = useMemo(() => {
    let stock = dataStockOriginal ?? []; 
    
    // 1. Filtro por Marca
    if (filtroMarca?.id) {
      stock = stock.filter(item => item.productos?.id_categoria === filtroMarca.id);
    }
    
    // 2. Filtro por Texto de Búsqueda
    if (textoBusqueda) {
      const lowerTexto = textoBusqueda.toLowerCase();
      stock = stock.filter(item => 
        item.productos?.nombre.toLowerCase().includes(lowerTexto) ||
        item.almacen?.nombre.toLowerCase().includes(lowerTexto) || 
        item.almacen?.sucursales?.nombre.toLowerCase().includes(lowerTexto)
      );
    }
    return stock;
  }, [dataStockOriginal, textoBusqueda, filtroMarca]);
 
  return (
  	<Container>
      {/* --- MODALES --- */}
      {stateClose && (
        <RegistrarInventario 
          tipo={tipoMovimiento} 
          onClose={() => setStateClose(false)} 
        />
      )}
      {modalTransfer && (
        <TransferenciaStockModal 
          onClose={() => setModalTransfer(false)} 
        />
      )}

      {/* --- CABECERA (area1) --- */}
  	  <section className="area1">
  		<Title>Inventario</Title>
        {isFetching && <span style={{fontSize: '0.8em', opacity: 0.7}}>🔄</span>}
  	  </section>

      {/* --- ACCIONES (area2) --- */}
      <section className="area2">
        <Buscador
          placeholder="Buscar producto, almacén o sucursal..."
          setBuscador={setTextoBusqueda}
        />
        {/* ¡Filtro de Marca igual que en Productos! */}
        <SelectMarcaContainer>
          <Select
            options={datacategorias || []}
            value={filtroMarca}
            onChange={(selectedOption) => setFiltroMarca(selectedOption)}
            getOptionLabel={(option) => option.nombre}
            getOptionValue={(option) => option.id}
            placeholder="Filtrar por Marca..."
            isClearable
            isSearchable
          />
        </SelectMarcaContainer>
        
        {/* ¡Botones agrupados! */}
        <ContenedorBotones> 
          <Btn1 
            titulo="Ingreso" 
            icono={<v.iconoagregar />} 
            bgcolor="#198754" 
            color="#fff"
            funcion={() => openModal("ingreso")}
            height="50px" 
          />
          <Btn1 
            titulo="Salida" 
            icono={<Icon icon="fa6-solid:minus" />} 
            bgcolor="#dc3545" 
            color="#fff"
            funcion={() => openModal("salida")}
            height="50px"
          />
          <Btn1 
            titulo="Transferencia" 
            icono={<Icon icon="fa6-solid:right-left" />} 
            bgcolor="#0d6efd" 
            color="#fff"
            funcion={openModalTransfer}
            height="50px"
          />
        </ContenedorBotones>
      </section>

      {/* --- TABLA (main) --- */}
  	  <section className="main">
        {isLoading && <span>Cargando stock...</span>}
        {isError && <span>Error: {error.message}</span>}
        {!isLoading && !isError && (
          <TablaInventarios 
            data={dataStockFiltrada} 
            datacategorias={datacategorias || []}
          />
        )}
  	  </section>
  	</Container>
  );
}

// --- ¡ESTILOS COMBINADOS! ---
const Container = styled.div`
  height: calc(100vh - 80px);
  margin-top:5px;
  margin-bottom:20px;
  padding: 15px;
  display: grid;
  grid-template:
    "area1" 60px
    "area2" 60px
    "main" 1fr;
  gap: 15px; 
  
  .area1 {
    grid-area: area1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 15px;
  }
  .area2 {
    grid-area: area2;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 30px; // Gap entre elementos
    
    & > :first-child { 
      flex-grow: 1;
      max-width: 500px; 
    }
  }
    
  .main {
    grid-area: main;
    overflow-y: auto; 
    overflow-x: hidden;

    /* --- ESTILOS DE TABLA PEGADOS AQUÍ --- */
    .responsive-table {
      width: 100%;
      margin-bottom: 1.5em;
      border-spacing: 0;
      @media (min-width: ${v.bpbart}) {
        font-size: 0.9em;
      }
      @media (min-width: ${v.bpmarge}) {
        font-size: 1em;
      }
      thead {
        position: absolute;
        padding: 0;
        border: 0;
        height: 1px;
        width: 1px;
        overflow: hidden;

        @media (min-width: ${v.bpbart}) {
          position: relative;
          height: auto;
          width: auto;
          overflow: auto;
        }
        th {
          border-bottom: 2px solid ${({ theme }) => theme.color2};
          font-weight: 700;
          text-align: center;
          color: ${({ theme }) => theme.text};
          &:first-of-type {
            text-align: center;
          }
        }
      }
      tbody,
      tr,
      th,
      td {
        display: block;
        padding: 0;
        text-align: left;
        white-space: normal;
      }
      tr {
        @media (min-width: ${v.bpbart}) {
          display: table-row;
        }
      }

      th,
      td {
        padding: 0.5em;
        vertical-align: middle;
        @media (min-width: ${v.bplisa}) {
          padding: 0.75em 0.5em;
        }
        @media (min-width: ${v.bpbart}) {
          display: table-cell;
          padding: 0.5em;
        }
        @media (min-width: ${v.bpmarge}) {
          padding: 0.75em 0.5em;
        }
        @media (min-width: ${v.bphomer}) {
          padding: 0.75em;
        }
      }
      tbody {
        @media (min-width: ${v.bpbart}) {
          display: table-row-group;
        }
        tr {
          margin-bottom: 1em;
          &:nth-of-type(even) {
            background-color: rgba(161, 161, 161, 0.1);
          }
          @media (min-width: ${v.bpbart}) {
            display: table-row;
            border-width: 1px;
          }
          &:last-of-type {
            margin-bottom: 0;
          }
          &:nth-of-type(even) {
            @media (min-width: ${v.bpbart}) {
            }
          }
        }
        th[scope="row"] {
          @media (min-width: ${v.bplisa}) {
            border-bottom: 1px solid rgba(161, 161, 161, 0.32);
          }
          @media (min-width: ${v.bpbart}) {
            background-color: transparent;
            text-align: center;
            color: ${({ theme }) => theme.text};
          }
        }
        .ContentCell {
          text-align: right;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 50px;
          border-bottom: 1px solid rgba(161, 161, 161, 0.32);
          @media (min-width: ${v.bpbart}) {
            justify-content: center;
            border-bottom: none;
          }
        }
        td {
          text-align: right;
          @media (min-width: ${v.bpbart}) {
            /* border-bottom: 1px solid rgba(161, 161, 161, 0.32); */
            text-align: center;
          }
        }
        td[data-title]:before {
          content: attr(data-title);
          float: left;
          font-size: 0.8em;
          @media (min-width: ${v.bplisa}) {
            font-size: 0.9em;
          }
          @media (min-width: ${v.bpbart}) {
            content: none;
          }
        }
      }
    }
    /* --- FIN DE ESTILOS DE TABLA --- */
  }
`;

// Contenedor para el Select de Marca
const SelectMarcaContainer = styled.div`
  min-width: 250px; 
`;

// Contenedor para los 3 botones
const ContenedorBotones = styled.div`
  display: flex;
  gap: 10px; // Gap entre los botones
`;